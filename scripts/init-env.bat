@echo off
echo ============================================
echo  Initialize Build Environment
echo ============================================
echo.
echo This script sets up the environment for the CURRENT
echo Command Prompt session only. Run this before building.
echo.

:: Add Rust to PATH (current session only)
set CARGO_PATH=%USERPROFILE%\.cargo\bin
if exist "%CARGO_PATH%\rustup.exe" (
    set PATH=%CARGO_PATH%;%PATH%
    echo [OK] Rust/Cargo added to current session PATH
) else (
    echo [ERROR] Rust not found at: %CARGO_PATH%
    echo         Please install Rust from: https://rustup.rs/
    exit /b 1
)

:: Switch to GNU toolchain (required for MinGW)
echo.
echo [INFO] Switching Rust toolchain to GNU...
rustup default stable-x86_64-pc-windows-gnu >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not switch toolchain automatically
    echo           Run manually: rustup default stable-x86_64-pc-windows-gnu
) else (
    echo [OK] Switched to GNU toolchain
)

:: Add MinGW to PATH (current session only)
set MINGW_PATH=%USERPROFILE%\mingw64\mingw64\bin
if exist "%MINGW_PATH%\gcc.exe" (
    set PATH=%MINGW_PATH%;%PATH%
    echo [OK] MinGW added to current session PATH
) else (
    echo [WARNING] MinGW not found at: %MINGW_PATH%
    echo           Run: .\scripts\setup-mingw-manual.bat
)

:: Add Bun to PATH if it exists
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set PATH=%USERPROFILE%\.bun\bin;%PATH%
    echo [OK] Bun added to current session PATH
)

echo.
echo ============================================
echo  Environment initialized!
echo ============================================
echo.
echo You can now run build commands in this window:
echo   rustup target add x86_64-pc-windows-gnu
echo   bun run tauri:dev
echo.
echo NOTE: This only applies to the CURRENT window.
echo To make permanent: Log out and log back in.
echo.
