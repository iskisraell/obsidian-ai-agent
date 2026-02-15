@echo off
setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0..
for %%I in ("%PROJECT_ROOT%") do set PROJECT_NAME=%%~nxI
set JUNCTION_PATH=C:\Dev\%PROJECT_NAME%

set CLEAN=0
set DRY_RUN=0

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--clean" set CLEAN=1
if /i "%~1"=="--dry-run" set DRY_RUN=1
shift
goto parse_args

:args_done
echo ============================================
echo  Tauri Build (Auto Junction)
echo ============================================
echo [INFO] Project root: %PROJECT_ROOT%
echo [INFO] Project name: %PROJECT_NAME%
echo [INFO] Junction: %JUNCTION_PATH%
echo.

if "%DRY_RUN%"=="1" (
  echo [OK] Dry run complete.
  exit /b 0
)

if not exist "%JUNCTION_PATH%" (
  echo [INFO] Creating junction point...
  mklink /J "%JUNCTION_PATH%" "%PROJECT_ROOT%"
  if errorlevel 1 (
    echo [ERROR] Failed to create junction.
    exit /b 1
  )
)

cd /d "%JUNCTION_PATH%"
call .\scripts\init-env.bat

if "%CLEAN%"=="1" (
  echo [INFO] Cleaning cargo cache...
  cd src-tauri
  cargo clean
  cd ..
)

echo [INFO] Starting Tauri build...
bun run tauri:build
if errorlevel 1 (
  echo [ERROR] Build failed.
  echo         Ensure cargo-tauri is installed: cargo install tauri-cli --locked
  exit /b 1
)

echo [OK] Build finished.
echo [INFO] Output: src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis\
if exist "src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis\*.exe" (
  echo [OK] Installer generated:
  dir /b "src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis\*.exe"
) else (
  echo [WARNING] Build completed but installer .exe was not found in bundle\nsis.
)
exit /b 0
