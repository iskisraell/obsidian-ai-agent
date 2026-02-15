@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Tauri Production Build (via Junction Point)
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
        echo         Try running as admin: mklink /J "%JUNCTION_PATH%" "%ORIGINAL_PATH%"
        pause
        exit /b 1
    )
    echo [OK] Junction created
)

:: Change to junction path (space-free path required by windres)
cd /d "%JUNCTION_PATH%"
echo [INFO] Working from: %CD%
echo.

:: Initialize environment (Rust, MinGW, Bun)
call .\scripts\init-env.bat

:: Clean build cache if requested
if "%1"=="--clean" (
    echo [INFO] Cleaning build cache...
    cd src-tauri
    cargo clean
    cd ..
    echo [OK] Build cache cleaned
    echo.
)

:: Run Tauri production build
echo.
echo [INFO] Starting Tauri production build...
echo [INFO] This will take several minutes on first run...
echo.
bun run tauri:build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Troubleshooting:
    echo   1. Run: .\scripts\verify-env-manual.bat
    echo   2. Try: .\scripts\build-junction.bat --clean
    echo   3. Install cargo-tauri: cargo install tauri-cli --locked
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Build completed successfully!
echo ============================================
echo.
echo Output:
echo   src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis\  (NSIS installer)
echo.
pause
