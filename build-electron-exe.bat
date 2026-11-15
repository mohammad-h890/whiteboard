@echo off
chcp 65001 >nul
title DaneshBoard Studio - Electron EXE & Installer Builder
echo ============================================================================
echo   دانش‌بورد استودیو (DaneshBoard Studio) - ساخت فایل اجرایی EXE و فایل نصبی Setup
echo   Build Both Portable .EXE and Windows NSIS Installer (.EXE) via Electron
echo ============================================================================
echo.

REM 1. Check Node.js and NPM availability
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js یافت نشد! لطفا ابتدا Node.js LTS را از nodejs.org نصب کنید.
    pause
    exit /b 1
)

echo [1/4] در حال نصب وابستگی‌های پروژه و پکیج‌های Electron و Electron-Builder...
call npm install
call npm install --save-dev electron electron-builder
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] خطا در نصب پکیج‌های Electron.
    pause
    exit /b 1
)

echo.
echo [2/4] در حال کامپایل و باندل کردن نسخه نهایی وب (Vite Production Build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] خطا در ساخت باندل Vite.
    pause
    exit /b 1
)

echo.
echo [3/4] در حال ساخت هم‌زمان فایل نصبی (NSIS Setup Installer) و نسخه پرتابل (Portable EXE)...
call npx electron-builder --win nsis portable --x64 --config electron-builder.json
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] خطا در بسته‌بندی Electron-Builder.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo [4/4] عملیات با موفقیت کامل انجام شد!
echo   1. فایل نصبی ویندوز (Setup Installer): dist-electron\DaneshBoard-Studio-Setup.exe
echo   2. فایل اجرایی بدون نیاز به نصب (Portable EXE): dist-electron\DaneshBoard-Studio-Portable.exe
echo ============================================================================
if exist "dist-electron" explorer "dist-electron"
pause
