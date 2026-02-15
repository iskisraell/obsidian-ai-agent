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
echo  Tauri Dev (Auto Junction)
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

echo [INFO] Starting Tauri dev...
set DEV_OK=0
bun run tauri:dev
if not errorlevel 1 (
  set DEV_OK=1
) else (
  echo [WARNING] bun run tauri:dev failed. Trying cargo tauri dev...
  cargo tauri -V >nul 2>&1
  if not errorlevel 1 (
    cargo tauri dev
    if not errorlevel 1 set DEV_OK=1
  )
)

if "!DEV_OK!"=="0" (
  echo [ERROR] Dev startup failed.
  exit /b 1
)

exit /b 0
