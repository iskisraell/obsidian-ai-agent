@echo off
setlocal

set PROJECT_ROOT=%~dp0..
cd /d "%PROJECT_ROOT%"

for /f "delims=" %%I in ('C:\Users\israel.toledo\.bun\bin\bun.exe scripts\print-cwd-realpath.mjs') do set PROJECT_REAL=%%I

if not exist "%PROJECT_REAL%\index.html" (
  echo [ERROR] Could not resolve project root for web build.
  exit /b 1
)

cd /d "%PROJECT_REAL%"
echo [INFO] Building web assets from: %CD%
C:\Users\israel.toledo\.bun\bin\bun.exe node_modules\vite\bin\vite.js build --configLoader runner
