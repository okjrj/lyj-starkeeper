param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('start', 'stop')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$profilePath = Join-Path $env:LOCALAPPDATA 'StarkeeperExhibition\ChromeProfile'
$address = 'http://localhost:8765/'
$exitToken = [guid]::NewGuid().ToString('N')

function Stop-Exhibition {
    $argument = [regex]::Escape('--user-data-dir=' + $profilePath)
    $quotedPath = [regex]::Escape($profilePath)
    $pattern = '(?:^|\s)(?:"' + $argument + '"|--user-data-dir="' + $quotedPath + '"|' + $argument + ')(?=\s|$)'

    Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" |
        Where-Object { $_.CommandLine -match $pattern -and $_.CommandLine -notmatch '\s--type=' } |
        ForEach-Object {
            $browser = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
            if ($browser -and -not $browser.HasExited) {
                if (-not $browser.CloseMainWindow() -or -not $browser.WaitForExit(2500)) {
                    Stop-Process -Id $browser.Id -ErrorAction SilentlyContinue
                }
            }
        }
}

function Find-Chrome {
    $appPaths = @(
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'
    )
    foreach ($key in $appPaths) {
        $entry = Get-Item -LiteralPath $key -ErrorAction SilentlyContinue
        if ($entry) {
            $path = $entry.GetValue('')
            if ($path -and (Test-Path -LiteralPath $path -PathType Leaf)) { return $path }
        }
    }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)) {
        if ($base) {
            $path = Join-Path $base 'Google\Chrome\Application\chrome.exe'
            if (Test-Path -LiteralPath $path -PathType Leaf) { return $path }
        }
    }
    throw 'Google Chrome is required. Install Chrome and try again.'
}

function Send-Content($context, [string]$root, [hashtable]$mimeTypes) {
    $response = $context.Response
    try {
        $relativePath = [uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
        if (!$relativePath) { $relativePath = 'starkeeper.html' }
        $path = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relativePath))
        $extension = [IO.Path]::GetExtension($path)
        if (!$path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or
            !$mimeTypes.ContainsKey($extension) -or ![IO.File]::Exists($path)) {
            $response.StatusCode = 404
            return
        }
        $response.ContentType = $mimeTypes[$extension]
        if ($relativePath -eq 'starkeeper.html') {
            $html = [IO.File]::ReadAllText($path)
            $shortcut = @"
<script>
window.addEventListener('keydown', (event) => {
  if (event.code !== 'KeyE' || event.repeat || event.isComposing ||
      event.ctrlKey || event.altKey || event.metaKey) return;
  event.preventDefault();
  const film = document.querySelector('.ending-film');
  if (film && !film.hidden) {
    film.pause();
    film.removeAttribute('src');
    film.load();
  }
  fetch('/exhibition-exit/$exitToken', { method: 'POST' }).catch(() => {});
}, { capture: true });
</script>
"@
            $bytes = [Text.Encoding]::UTF8.GetBytes($html.Replace('</head>', "$shortcut`n</head>"))
            $response.ContentLength64 = $bytes.Length
            if ($context.Request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
            return
        }
        $file = [IO.File]::OpenRead($path)
        try {
            $range = $context.Request.Headers['Range']
            if ($extension -eq '.mp4') { $response.AddHeader('Accept-Ranges', 'bytes') }
            if ($extension -eq '.mp4' -and $range -match '^bytes=(\d+)-(\d*)$') {
                $start = [long]$Matches[1]
                $end = if ($Matches[2]) { [Math]::Min([long]$Matches[2], $file.Length - 1) } else { $file.Length - 1 }
                if ($start -gt $end) {
                    $response.StatusCode = 416
                    $response.AddHeader('Content-Range', "bytes */$($file.Length)")
                    return
                }
                $response.StatusCode = 206
                $response.AddHeader('Content-Range', "bytes ${start}-${end}/$($file.Length)")
                $remaining = $end - $start + 1
                $response.ContentLength64 = $remaining
                if ($context.Request.HttpMethod -ne 'HEAD') {
                    $file.Position = $start
                    $buffer = New-Object byte[] 65536
                    while ($remaining -gt 0) {
                        $read = $file.Read($buffer, 0, [int][Math]::Min($remaining, $buffer.Length))
                        if ($read -eq 0) { break }
                        $response.OutputStream.Write($buffer, 0, $read)
                        $remaining -= $read
                    }
                }
            } else {
                $response.ContentLength64 = $file.Length
                if ($context.Request.HttpMethod -ne 'HEAD') { $file.CopyTo($response.OutputStream) }
            }
        } finally {
            $file.Dispose()
        }
    } catch [System.Net.HttpListenerException] {
        # Chrome may cancel a request when the window closes.
    } finally {
        $response.Close()
    }
}

function Start-Exhibition {
    $root = (Join-Path $PSScriptRoot 'content') + [IO.Path]::DirectorySeparatorChar
    if (![IO.File]::Exists((Join-Path $root 'starkeeper.html'))) {
        throw 'The content folder is missing. Extract or copy the complete exhibition folder.'
    }
    $chrome = Find-Chrome
    $mimeTypes = @{
        '.html' = 'text/html; charset=utf-8'
        '.css' = 'text/css; charset=utf-8'
        '.js' = 'text/javascript; charset=utf-8'
        '.png' = 'image/png'
        '.webp' = 'image/webp'
        '.svg' = 'image/svg+xml'
        '.wav' = 'audio/wav'
        '.mp4' = 'video/mp4'
    }
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($address)
    try {
        $listener.Start()
        $browser = Start-Process -FilePath $chrome -PassThru -ArgumentList @(
            ('"--user-data-dir={0}"' -f $profilePath)
            '--no-first-run'
            '--no-default-browser-check'
            '--disable-background-mode'
            '--autoplay-policy=no-user-gesture-required'
            ('--app={0}starkeeper.html' -f $address)
            '--start-maximized'
        )
        $request = $listener.GetContextAsync()
        while (!$browser.HasExited) {
            if ($request.Wait(250)) {
                $context = $request.Result
                if ($context.Request.HttpMethod -eq 'POST' -and
                    $context.Request.Url.AbsolutePath -ceq "/exhibition-exit/$exitToken") {
                    $context.Response.StatusCode = 204
                    $context.Response.Close()
                    Stop-Exhibition
                    break
                }
                Send-Content $context $root $mimeTypes
                $request = $listener.GetContextAsync()
            }
        }
    } finally {
        $listener.Close()
    }
}

try {
    if ($Action -eq 'start') { Start-Exhibition } else { Stop-Exhibition }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
