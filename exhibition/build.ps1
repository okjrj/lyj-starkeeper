$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$output = Join-Path $PSScriptRoot 'dist'
$build = Join-Path $output ([guid]::NewGuid().ToString('N'))
$content = Join-Path $build 'content'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
Add-Type -AssemblyName System.IO.Compression.FileSystem

New-Item -ItemType Directory -Force -Path $content,(Join-Path $content 'image') | Out-Null
try {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'exhibition.ps1') -Destination $build
    foreach ($name in 'starkeeper.html','scene.js','styles.css','assets') {
        Copy-Item -LiteralPath (Join-Path $repo $name) -Destination $content -Recurse
    }
    $images = Join-Path $repo 'image'
    foreach ($name in 'room-panorama.png','title_full.png','window-empty.png') {
        Copy-Item -LiteralPath (Join-Path $images $name) -Destination (Join-Path $content 'image')
    }
    $movie = Get-ChildItem -LiteralPath $images -Filter '*.mp4' -File
    if (@($movie).Count -ne 1) { throw 'Expected the original opening MP4 in image/.' }
    Copy-Item -LiteralPath $movie.FullName -Destination (Join-Path $content 'image')
    $payload = Join-Path $output 'payload.tmp'
    [IO.Compression.ZipFile]::CreateFromDirectory($build, $payload, [IO.Compression.CompressionLevel]::Fastest, $false)

    Push-Location $PSScriptRoot
    try {
        & $compiler /nologo /target:winexe /platform:anycpu /codepage:65001 /reference:System.Windows.Forms.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /define:STANDALONE /resource:dist/payload.tmp,ExhibitionPayload /out:dist/Starkeeper.exe ExhibitionLauncher.cs
        if ($LASTEXITCODE -ne 0) { throw 'Could not build the exhibition launcher.' }
    } finally { Pop-Location }
    Write-Output (Join-Path $output 'Starkeeper.exe')
} finally {
    if ($payload -and (Test-Path -LiteralPath $payload)) { Remove-Item -LiteralPath $payload }
    [IO.Directory]::Delete($build, $true)
}
