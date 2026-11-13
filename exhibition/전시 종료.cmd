@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0exhibition.ps1" stop
if errorlevel 1 pause
