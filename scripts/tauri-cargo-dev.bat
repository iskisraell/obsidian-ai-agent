@echo off
setlocal

call "%~dp0init-env.bat"
cargo tauri dev %*
