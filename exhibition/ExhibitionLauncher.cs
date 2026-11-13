using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class ExhibitionLauncher
{
    [STAThread]
    private static int Main()
    {
#if STOP_EXHIBITION
        const string action = "stop";
        const string title = "전시 종료";
#else
        const string action = "start";
        const string title = "전시 시작";
#endif
        try
        {
#if STANDALONE
            using (var singleInstance = new Mutex(false, @"Local\StarkeeperExhibitionLauncher"))
            {
                if (!singleInstance.WaitOne(0)) return 0;
                try
                {
                    RunStandalone(action);
                }
                finally
                {
                    singleInstance.ReleaseMutex();
                }
            }
#else
            string directory = AppDomain.CurrentDomain.BaseDirectory;
            RunScript(directory, action);
#endif
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static void RunStandalone(string action)
    {
        string directory = Path.Combine(Path.GetTempPath(), "Starkeeper-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try
        {
            using (Stream payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("ExhibitionPayload"))
            using (var archive = new ZipArchive(payload, ZipArchiveMode.Read, false, Encoding.UTF8))
                archive.ExtractToDirectory(directory);
            RunScript(directory, action);
        }
        finally
        {
            try { Directory.Delete(directory, true); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }

    private static void RunScript(string directory, string action)
    {
        string script = Path.Combine(directory, "exhibition.ps1");
        if (!File.Exists(script))
            throw new FileNotFoundException("전시 운영 폴더에서 실행해 주세요.");

        string powerShell = Path.Combine(Environment.SystemDirectory,
            @"WindowsPowerShell\v1.0\powershell.exe");
        var start = new ProcessStartInfo(powerShell,
            "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"" + script + "\" " + action);
        start.WorkingDirectory = directory;
        start.UseShellExecute = false;
        start.CreateNoWindow = true;
        start.RedirectStandardError = true;
        using (Process process = Process.Start(start))
        {
            string error = process.StandardError.ReadToEnd().Trim();
            process.WaitForExit();
            if (process.ExitCode != 0)
                throw new InvalidOperationException(error.Length == 0 ? "전시 실행 파일에서 오류가 발생했습니다." : error);
        }
    }
}
