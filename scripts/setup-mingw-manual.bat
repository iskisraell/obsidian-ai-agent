@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  MinGW Setup for Tauri (No Admin Required)
echo ============================================
echo.

set MINGW_DIR=%USERPROFILE%\mingw64
set DOWNLOAD_URL=https://github.com/niXman/mingw-builds-binaries/releases/download/14.2.0-rt_v12-rev0/x86_64-14.2.0-release-posix-seh-ucrt-rt_v12-rev0.7z

:: Check if already installed
if exist "%MINGW_DIR%\mingw64\bin\gcc.exe" (
    echo [INFO] MinGW already installed at: %MINGW_DIR%
    echo.
    goto CONFIGURE
)

echo [1/6] Cleaning up previous installation...
if exist "%MINGW_DIR%" (
    rmdir /S /Q "%MINGW_DIR%" 2>nul
    if errorlevel 1 (
        echo [WARNING] Could not remove old directory completely
    )
)
mkdir "%MINGW_DIR%" 2>nul
if errorlevel 1 (
    echo [ERROR] Could not create directory: %MINGW_DIR%
    pause
    exit /b 1
)
echo [OK] Directory ready

echo.
echo [2/6] Downloading MinGW-w64...
echo        This may take 5-10 minutes depending on your connection...
echo        URL: %DOWNLOAD_URL%
echo.

:: Download using PowerShell (with -NoProfile to avoid your broken profile)
powershell -NoProfile -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%MINGW_DIR%\mingw.7z' -UseBasicParsing" 2>nul

if not exist "%MINGW_DIR%\mingw.7z" (
    echo [ERROR] Download failed. Trying alternative method...
    
    :: Try curl as fallback
    curl -L -o "%MINGW_DIR%\mingw.7z" "%DOWNLOAD_URL%" --silent --show-error 2>nul
    
    if not exist "%MINGW_DIR%\mingw.7z" (
        echo [ERROR] Download failed with both PowerShell and curl
        echo.
        echo Please manually download from:
        echo %DOWNLOAD_URL%
        echo.
        echo Save it as: %MINGW_DIR%\mingw.7z
        echo Then run this script again.
        pause
        exit /b 1
    )
)

echo [OK] Download completed

echo.
echo [3/6] Downloading 7zip extractor...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://www.7-zip.org/a/7zr.exe' -OutFile '%MINGW_DIR%\7zr.exe' -UseBasicParsing" 2>nul

if not exist "%MINGW_DIR%\7zr.exe" (
    echo [ERROR] Could not download 7zip
    pause
    exit /b 1
)
echo [OK] 7zip downloaded

echo.
echo [4/6] Extracting MinGW archive...
echo        This will take 5-10 minutes. Please wait...
echo.

cd /d "%MINGW_DIR%"
7zr.exe x mingw.7z -y -bsp1 >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Extraction failed
    pause
    exit /b 1
)

echo [OK] Extraction completed

echo.
echo [5/6] Cleaning up temporary files...
del /F /Q "%MINGW_DIR%\mingw.7z" 2>nul
del /F /Q "%MINGW_DIR%\7zr.exe" 2>nul
echo [OK] Cleanup completed

:CONFIGURE
echo.
echo [6/6] Configuring environment...

:: Add to PATH
set MINGW_BIN=%MINGW_DIR%\mingw64\bin
set CURRENT_PATH=%PATH%

if "!CURRENT_PATH:%MINGW_BIN%=!"=="%CURRENT_PATH%" (
    :: PATH doesn't contain MinGW, add it
    setx PATH "%MINGW_BIN%;%PATH%" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Could not update PATH automatically
        echo          Please manually add this to your PATH:
        echo          %MINGW_BIN%
    ) else (
        echo [OK] Added to user PATH
    )
) else (
    echo [OK] Already in PATH
)

:: Verify gcc exists
if not exist "%MINGW_DIR%\mingw64\bin\gcc.exe" (
    echo [ERROR] gcc.exe not found after installation
    pause
    exit /b 1
)
echo [OK] GCC found: %MINGW_DIR%\mingw64\bin\gcc.exe

:: Create Cargo config directory
if not exist "%~dp0..\src-tauri\.cargo" (
    mkdir "%~dp0..\src-tauri\.cargo" 2>nul
)

:: Create Cargo config
echo [target.x86_64-pc-windows-gnu] > "%~dp0..\src-tauri\.cargo\config.toml"
echo linker = "%MINGW_DIR:\=/%/mingw64/bin/gcc.exe" >> "%~dp0..\src-tauri\.cargo\config.toml"
echo. >> "%~dp0..\src-tauri\.cargo\config.toml"
echo [build] >> "%~dp0..\src-tauri\.cargo\config.toml"
echo target = "x86_64-pc-windows-gnu" >> "%~dp0..\src-tauri\.cargo\config.toml"
echo. >> "%~dp0..\src-tauri\.cargo\config.toml"
echo [env] >> "%~dp0..\src-tauri\.cargo\config.toml"
echo CC = "%MINGW_DIR:\=/%/mingw64/bin/gcc.exe" >> "%~dp0..\src-tauri\.cargo\config.toml"
echo CXX = "%MINGW_DIR:\=/%/mingw64/bin/g++.exe" >> "%~dp0..\src-tauri\.cargo\config.toml"
echo AR = "%MINGW_DIR:\=/%/mingw64/bin/ar.exe" >> "%~dp0..\src-tauri\.cargo\config.toml"

echo [OK] Cargo configuration created

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo MinGW has been successfully installed!
echo Location: %MINGW_DIR%
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo OPTION 1 - Quick Start (Recommended):
echo   1. Run: .\scripts\init-env.bat  (in this window)
echo   2. Run: rustup target add x86_64-pc-windows-gnu
echo   3. Run: bun run tauri:dev
echo.
echo OPTION 2 - New Window (if commands not found):
echo   1. CLOSE this terminal window
echo   2. OPEN a NEW Command Prompt
echo   3. Run: .\scripts\init-env.bat
echo   4. Run: rustup target add x86_64-pc-windows-gnu
echo   5. Run: bun run tauri:dev
echo.
echo OPTION 3 - If 'rustup' or 'bun' not found:
echo   Run: .\scripts\fix-path.bat
echo   Then restart your terminal
echo.
echo NOTE: Some Tauri plugins may have limited
echo       functionality with MinGW vs MSVC.
echo       For full compatibility, install VS Build Tools.
echo.
pause
