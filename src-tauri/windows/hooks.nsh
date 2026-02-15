; Sinq NSIS Installer Hooks
; Fix for WebView2Loader.dll bundling issue on windows-gnu target
; This hook copies the DLL from resources/ to the install root directory

!macro NSIS_HOOK_PREINSTALL
  ; No pre-install actions needed
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Copy WebView2Loader.dll from resources to install root
  ; This is required because windows-gnu bundler places the DLL in resources/
  ; but Windows needs it alongside the executable for DLL loading at startup
  ${If} ${FileExists} "$INSTDIR\resources\WebView2Loader.dll"
    DetailPrint "Copying WebView2Loader.dll to install directory..."
    CopyFiles /SILENT "$INSTDIR\resources\WebView2Loader.dll" "$INSTDIR\WebView2Loader.dll"
    ${If} ${FileExists} "$INSTDIR\WebView2Loader.dll"
      DetailPrint "WebView2Loader.dll copied successfully"
    ${Else}
      MessageBox MB_ICONEXCLAMATION "Warning: Failed to copy WebView2Loader.dll. The application may not start correctly."
    ${EndIf}
  ${Else}
    DetailPrint "WebView2Loader.dll not found in resources - skipping copy"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; No pre-uninstall actions needed
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Clean up WebView2Loader.dll from install root during uninstall
  Delete "$INSTDIR\WebView2Loader.dll"
!macroend
