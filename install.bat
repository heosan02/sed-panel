@echo off
setlocal EnableDelayedExpansion
title SED Panel CEP v3.2 - Installer

color 0B

echo.
echo  =====================================================
echo        SED Panel CEP v3.2  -  Auto Installer
echo
echo    Multi-Layer Read Markers  ^|  Thumbnail Multi-Layer  ^|  Merge Cut Layers
echo        (c) 2026 Heosan
echo  =====================================================
echo.

:: ── Check manifest ──────────────────────────────────────
if not exist "%~dp0com.heosan.sedpanel\CSXS\manifest.xml" (
    echo.
    echo  [ERROR] File manifest.xml tidak ditemukan.
    echo  Pastikan install.bat dijalankan dari folder yang
    echo  sama dengan folder com.heosan.sedpanel\
    echo.
    pause
    exit /b 1
)

:: ── Set APPDATA ─────────────────────────────────────────
set "ROAMING=%APPDATA%"
if not defined ROAMING set "ROAMING=C:\Users\%USERNAME%\AppData\Roaming"

echo  Folder  : %ROAMING%\Adobe\CEP\extensions
echo.

:: =========================================================
:: [0/3] CSInterface.js
:: =========================================================
echo  [0/3] CSInterface.js...
echo.

set "CSIJS=%~dp0com.heosan.sedpanel\js\CSInterface.js"
set "CSI_URL=https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_12.x/CSInterface.js"
set "NEED_DL=0"
set "DL_OK=0"

findstr /c:"placeholder" "%CSIJS%" >nul 2>&1 && set "NEED_DL=1"
if "%NEED_DL%"=="0" (
    for %%F in ("%CSIJS%") do if %%~zF LSS 1000 set "NEED_DL=1"
)

if "%NEED_DL%"=="1" (
    where powershell >nul 2>&1
    if not errorlevel 1 (
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
            "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;(New-Object Net.WebClient).DownloadFile('%CSI_URL%','%CSIJS%')" >nul 2>&1
        for %%F in ("%CSIJS%") do if %%~zF GTR 5000 set "DL_OK=1"
    )
    if "!DL_OK!"=="0" (
        where curl >nul 2>&1
        if not errorlevel 1 (
            curl -L --silent --max-time 30 -o "%CSIJS%" "%CSI_URL%" >nul 2>&1
            for %%F in ("%CSIJS%") do if %%~zF GTR 5000 set "DL_OK=1"
        )
    )
    if "!DL_OK!"=="1" (
        for %%F in ("%CSIJS%") do echo   [OK] %%~zF bytes
    ) else (
        echo   [WARN] Download CSInterface.js gagal.
        choice /c YN /n /m "  Lanjut tanpa CSInterface.js? (Y/N): "
        if errorlevel 2 exit /b 1
    )
) else (
    echo   [OK] sudah ada
)
echo.

:: =========================================================
:: [1/3] CEP Debug Mode
:: =========================================================
echo  [1/3] CEP Debug Mode...
echo.

set "REG_OK=0"
for %%v in (4 5 6 7 8 9 10 11 12 13) do (
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    if not errorlevel 1 set "REG_OK=1"
)

if "%REG_OK%"=="1" (
    echo   [OK] CSXS 4-13 / AE CS6 - 2026
) else (
    echo   [WARN] Gagal. Jalankan sebagai Administrator.
)
echo.

:: =========================================================
:: [2/3] After Effects
:: =========================================================
echo  [2/3] After Effects...
echo.

tasklist 2>nul | find /i "AfterFX.exe" >nul 2>&1
if not errorlevel 1 (
    choice /c YN /n /m "  AE sedang berjalan. Tutup? (Y/N): "
    if not errorlevel 2 (
        taskkill /im AfterFX.exe /f >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo   [OK] AE ditutup
    ) else (
        echo   [SKIP] Restart AE manual nanti
    )
) else (
    echo   [OK] AE tidak berjalan
)
echo.:: =========================================================
:: [3/3] Install Extension
:: =========================================================
echo  [3/3] Install Extension...
echo.

set "CEP_DIR=%ROAMING%\Adobe\CEP\extensions"
set "DEST=%CEP_DIR%\com.heosan.sedpanel"
set "SRC=%~dp0com.heosan.sedpanel"

if not exist "%ROAMING%\Adobe"     mkdir "%ROAMING%\Adobe"     >nul 2>&1
if not exist "%ROAMING%\Adobe\CEP" mkdir "%ROAMING%\Adobe\CEP" >nul 2>&1
if not exist "%CEP_DIR%"           mkdir "%CEP_DIR%"           >nul 2>&1

if exist "%DEST%" (
    rmdir /s /q "%DEST%" >nul 2>&1
    timeout /t 1 /nobreak >nul
)

mkdir "%DEST%"      >nul 2>&1
mkdir "%DEST%\CSXS" >nul 2>&1
mkdir "%DEST%\css"  >nul 2>&1
mkdir "%DEST%\js"   >nul 2>&1
mkdir "%DEST%\jsx"  >nul 2>&1copy /y "%SRC%\index.html"          "%DEST%\index.html"         >nul 2>&1
copy /y "%SRC%\CSXS\manifest.xml"   "%DEST%\CSXS\manifest.xml"  >nul 2>&1
copy /y "%SRC%\css\style.css"       "%DEST%\css\style.css"      >nul 2>&1
copy /y "%SRC%\js\CSInterface.js"   "%DEST%\js\CSInterface.js"  >nul 2>&1
copy /y "%SRC%\js\main.js"          "%DEST%\js\main.js"         >nul 2>&1
copy /y "%SRC%\jsx\host.jsx"        "%DEST%\jsx\host.jsx"       >nul 2>&1echo.
echo  --- Verifikasi ---

set "ALL_OK=1"
if exist "%DEST%\index.html"        (echo   [OK] index.html)        else (echo   [!!] index.html       & set "ALL_OK=0")
if exist "%DEST%\CSXS\manifest.xml" (echo   [OK] manifest.xml)      else (echo   [!!] manifest.xml     & set "ALL_OK=0")
if exist "%DEST%\css\style.css"     (echo   [OK] style.css)         else (echo   [!!] style.css        & set "ALL_OK=0")
if exist "%DEST%\js\main.js"        (echo   [OK] main.js)           else (echo   [!!] main.js          & set "ALL_OK=0")
if exist "%DEST%\jsx\host.jsx"      (echo   [OK] host.jsx)          else (echo   [!!] host.jsx         & set "ALL_OK=0")
for %%F in ("%DEST%\js\CSInterface.js") do (
    if %%~zF GTR 5000 (echo   [OK] CSInterface.js) else (echo   [WARN] CSInterface.js kecil)
)echo.

if "%ALL_OK%"=="0" (
    echo  [ERROR] Ada file tidak tersalin. Jalankan sebagai Administrator.
    pause
    exit /b 1
)

:: =========================================================
echo.
echo  =====================================================
echo    INSTALASI SELESAI!  SED Panel CEP v3.2
echo  =====================================================
echo.
echo  Lokasi : %DEST%
echo  Buka   : AE ^> Window ^> Extensions ^> SED Panel
echo.
echo  PENTING: Restart After Effects!
echo.

choice /c YN /n /m "  Buka AE sekarang? (Y/N): "
if errorlevel 2 goto :END

set "AE_EXE="
for %%y in (2026 2025 2024 2023 2022 2021 2020 2019) do (
    if not defined AE_EXE (
        if exist "C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe" (
            set "AE_EXE=C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe"
        )
    )
)

if defined AE_EXE (
    start "" "%AE_EXE%"
) else (
    echo  AfterFX.exe tidak ditemukan
)

:END
echo.
pause
exit /b 0
