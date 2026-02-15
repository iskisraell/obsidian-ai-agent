@echo off
echo ============================================
echo  Tauri Build Environment Verification
echo ============================================
echo.

set ISSUES=0
set WARNINGS=0

echo [1/7] Checking Rust installation...
rustc --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Rust not found in PATH
    echo           Install from: https://rustup.rs/
    set /a ISSUES+=1
) else (
    for /f "tokens=*" %%a in ('rustc --version') do echo   [OK] Rust: %%a
)

echo.
echo [2/7] Checking Cargo...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Cargo not found
    set /a ISSUES+=1
) else (
    for /f "tokens=*" %%a in ('cargo --version') do echo   [OK] Cargo: %%a
)

echo.
echo [3/7] Checking C++ compiler...
set HAS_COMPILER=0

:: Check for MinGW gcc
if exist "%USERPROFILE%\mingw64\mingw64\bin\gcc.exe" (
    echo   [OK] MinGW found at: %USERPROFILE%\mingw64\mingw64\bin\gcc.exe
    set HAS_COMPILER=1
) else (
    :: Check if gcc is in PATH
    gcc --version >nul 2>&1
    if not errorlevel 1 (
        echo   [OK] MinGW found in PATH
        set HAS_COMPILER=1
    ) else (
        :: Check for MSVC
        cl /? >nul 2>&1
        if not errorlevel 1 (
            echo   [OK] MSVC (cl.exe) found
            set HAS_COMPILER=1
        )
    )
)

if %HAS_COMPILER%==0 (
    echo   [ERROR] No C++ compiler found!
    echo.
    echo   Option 1 - Visual Studio Build Tools (RECOMMENDED):
    echo     Download: https://aka.ms/vs/17/release/vs_BuildTools.exe
    echo     Select: 'Desktop development with C++'
    echo.
    echo   Option 2 - MinGW (NO ADMIN REQUIRED):
    echo     Run: .\scripts\setup-mingw-manual.bat
    set /a ISSUES+=1
)

echo.
echo [4/7] Checking Rust targets...
set HAS_MSVC_TARGET=0
set HAS_GNU_TARGET=0

:: Check for MSVC target
rustup target list --installed 2>nul | findstr "x86_64-pc-windows-msvc" >nul
if not errorlevel 1 (
    echo   [OK] MSVC target available
    set HAS_MSVC_TARGET=1
)

:: Check for GNU target
rustup target list --installed 2>nul | findstr "x86_64-pc-windows-gnu" >nul
if not errorlevel 1 (
    echo   [OK] GNU target available
    set HAS_GNU_TARGET=1
)

if %HAS_MSVC_TARGET%==0 if %HAS_GNU_TARGET%==0 (
    echo   [ERROR] No Windows target installed
    echo           Run: rustup target add x86_64-pc-windows-gnu
    set /a ISSUES+=1
)

echo.
echo [5/7] Checking JavaScript runtime...
bun --version >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%a in ('bun --version') do echo   [OK] Bun: %%a
) else (
    node --version >nul 2>&1
    if not errorlevel 1 (
        for /f "tokens=*" %%a in ('node --version') do echo   [OK] Node.js: %%a
    ) else (
        echo   [ERROR] No JavaScript runtime found
        echo           Install Bun: https://bun.sh/
        set /a ISSUES+=1
    )
)

echo.
echo [6/7] Checking WebView2 Runtime...
:: Check registry for WebView2
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /ve >nul 2>&1
if not errorlevel 1 (
    echo   [OK] WebView2 Runtime installed
) else (
    echo   [WARNING] WebView2 Runtime not detected
    echo             Download: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
    set /a WARNINGS+=1
)

echo.
echo [7/7] Checking Cargo configuration...
if exist "%~dp0..\src-tauri\.cargo\config.toml" (
    echo   [OK] Cargo config found
) else (
    echo   [WARNING] Cargo config not found
    echo             Run: .\scripts\setup-mingw-manual.bat
    set /a WARNINGS+=1
)

echo.
echo ============================================
echo  Verification Summary
echo ============================================

if %ISSUES%==0 if %WARNINGS%==0 (
    echo [OK] All checks passed! Build environment is ready.
    echo.
    echo You can now build the Tauri app:
    echo   bun run tauri:dev    (Development build)
    echo   bun run tauri:build  (Production build)
    exit /b 0
) else (
    if %ISSUES% gtr 0 (
        echo [ERROR] Found %ISSUES% critical issue(s)
    )
    if %WARNINGS% gtr 0 (
        echo [WARNING] Found %WARNINGS% warning(s)
    )
    echo.
    echo Please fix the issues above before building.
    exit /b 1
)

echo.
pause
