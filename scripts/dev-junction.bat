@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Tauri Dev Build (via Junction Point)
echo ============================================
echo.

set JUNCTION_PATH=C:\Dev\obsidian-ai-agent
set ORIGINAL_PATH=%~dp0..

:: Check if junction exists
if not exist "%JUNCTION_PATH%" (
    echo [INFO] Creating junction point...
    mklink /J "%JUNCTION_PATH%" "%ORIGINAL_PATH%"
    if errorlevel 1 (
        echo [ERROR] Failed to create junction
        echo         Try running: mklink /J "%JUNCTION_PATH%" "%ORIGINAL_PATH%"
        pause
        exit /b 1
    )
    echo [OK] Junction created
)

:: Change to junction path
cd /d "%JUNCTION_PATH%"
echo [INFO] Working from: %CD%
echo.

:: Initialize environment
call .\scripts\init-env.bat

:: Clean build cache if requested
if "%1"=="--clean" (
    echo [INFO] Cleaning build cache...
    cd src-tauri
    cargo clean
    cd ..
)

:: Run Tauri dev
echo.
echo [INFO] Starting Tauri development server...
echo [INFO] This will take several minutes on first run...
echo.
set DEV_OK=0

bun run tauri:dev
if not errorlevel 1 (
    set DEV_OK=1
) else (
    echo.
    echo [WARNING] bun run tauri:dev failed in this environment.
    echo [INFO] Trying fallback: cargo tauri dev
    echo.
    cargo tauri -V >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] cargo-tauri is not installed.
        echo         Install with: cargo install tauri-cli --locked
    ) else (
        cargo tauri dev
        if not errorlevel 1 (
            set DEV_OK=1
        )
    )
)

if "!DEV_OK!"=="0" (
    echo.
    echo [ERROR] Dev startup failed!
    pause
    exit /b 1
)
