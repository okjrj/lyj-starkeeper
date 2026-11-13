@echo off
if exist "%~dp0content\starkeeper.html" (
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0exhibition.ps1" start
    if errorlevel 1 pause
    exit /b
)
if not exist "%~dp0dist\Starkeeper.exe" (
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)
start "" "%~dp0dist\Starkeeper.exe"
