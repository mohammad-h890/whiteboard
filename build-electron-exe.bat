@echo off
setlocal EnableExtensions

REM Keep the CMD window open even when double-clicked from Windows Explorer
if /I "%~1" NEQ "__KEEP_OPEN__" (
    cmd /k ""%~f0" __KEEP_OPEN__"
    exit /b
)

REM Always switch working directory to the folder where this .bat file resides
cd /d "%~dp0"

title DaneshBoard Studio - Electron EXE and Setup Installer Builder

echo ============================================================================
echo   DaneshBoard Studio - Electron Desktop Builder (Portable EXE + Setup EXE)
echo   Working Directory: %CD%
echo ============================================================================
echo.

REM 0. Verify that this .bat file is inside the project root next to package.json
if not exist "package.json" goto :missing_package_json

REM 1. Check Node.js and NPM availability
where node >nul 2>nul
if errorlevel 1 goto :missing_node

REM 2. Auto-generate electron/main.cjs if not present
if not exist "electron" mkdir "electron"
if not exist "electron\main.cjs" (
    echo [INFO] Creating default electron\main.cjs ...
    (
        echo const { app, BrowserWindow } = require^('electron'^);
        echo const path = require^('path'^);
        echo function createWindow^(^) {
        echo   const win = new BrowserWindow^({ width: 1440, height: 900, autoHideMenuBar: true }^);
        echo   win.loadFile^(path.join^(__dirname, '../dist/index.html'^)^);
        echo }
        echo app.whenReady^(^).then^(createWindow^);
        echo app.on^('window-all-closed', ^(^) =^> { if ^(process.platform !== 'darwin'^) app.quit^(^); }^);
    ) > "electron\main.cjs"
)

REM 3. Ensure electron-builder.json has complete metadata (main, version, author, description)
echo [INFO] Preparing electron-builder.json configuration ...
(
    echo {
    echo   "appId": "ir.daneshboard.studio",
    echo   "productName": "DaneshBoard Studio",
    echo   "directories": { "output": "dist-electron" },
    echo   "files": ["dist/**/*", "electron/**/*", "package.json"],
    echo   "extraMetadata": {
    echo     "main": "electron/main.cjs",
    echo     "version": "1.0.0",
    echo     "description": "DaneshBoard Studio - Smart Educational Whiteboard and Studio",
    echo     "author": "DaneshBoard Studio"
    echo   },
    echo   "win": { "target": ["nsis", "portable"] },
    echo   "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true, "artifactName": "DaneshBoard-Studio-Setup.exe" },
    echo   "portable": { "artifactName": "DaneshBoard-Studio-Portable.exe" }
    echo }
) > "electron-builder.json"

echo [1/4] Installing project dependencies (with --legacy-peer-deps)...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo [WARN] Retrying npm install with --force ...
    call npm install --force
    if errorlevel 1 goto :err_npm_install
)

echo.
echo [1.5/4] Installing Electron and electron-builder (with --legacy-peer-deps)...
call npm install --save-dev electron electron-builder --legacy-peer-deps
if errorlevel 1 (
    echo [WARN] Retrying Electron install with --force ...
    call npm install --save-dev electron electron-builder --force
    if errorlevel 1 goto :err_electron_install
)

echo.
echo [2/4] Building production web bundle (vite build --base=./)...
call npx vite build --base=./
if errorlevel 1 (
    call npm run build
    if errorlevel 1 goto :err_vite_build
)

echo.
echo [3/4] Packaging Windows NSIS Setup Installer and Portable EXE...
call npx electron-builder --win nsis portable --x64 --config electron-builder.json
if errorlevel 1 goto :err_builder

echo.
echo ============================================================================
echo [4/4] SUCCESS! Both Windows EXE files have been built:
echo   1. Setup Installer : dist-electron\DaneshBoard-Studio-Setup.exe
echo   2. Portable EXE    : dist-electron\DaneshBoard-Studio-Portable.exe
echo ============================================================================
if exist "dist-electron" explorer "dist-electron"
echo.
pause
exit /b 0

:missing_package_json
echo [ERROR] File "package.json" was NOT found in:
echo         %CD%
echo.
echo Why did this happen?
echo   You ran build-electron-exe.bat outside the project folder (for example inside Downloads).
echo.
echo How to fix:
echo   1. Download/extract the full project source folder (ZIP) from AI Studio.
echo   2. Copy this "build-electron-exe.bat" file into the project root folder (next to package.json).
echo   3. Double-click "build-electron-exe.bat" again.
echo.
pause
exit /b 1

:missing_node
echo [ERROR] Node.js was NOT found on your system!
echo Please install Node.js LTS from https://nodejs.org and run this script again.
echo.
pause
exit /b 1

:err_npm_install
echo [ERROR] "npm install" failed. Check your internet connection or npm logs above.
echo.
pause
exit /b 1

:err_electron_install
echo [ERROR] Failed to install "electron" and "electron-builder".
echo.
pause
exit /b 1

:err_vite_build
echo [ERROR] "npm run build" failed. See the compiler output above.
echo.
pause
exit /b 1

:err_builder
echo [ERROR] "electron-builder" failed to package the EXE files.
echo.
pause
exit /b 1
