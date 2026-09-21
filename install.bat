@echo off
setlocal EnableDelayedExpansion
title SED Panel CEP v3.2 - Installer

echo.
echo  =====================================================
echo   SED Panel CEP  v3.2  ^|  Auto Installer
echo   Multi-Layer Read Markers  ^|  Thumbnail Multi-Layer  ^|  Merge Cut Layers
echo   (c) 2026 Heosan
echo  =====================================================
echo.

:: -- CEK FOLDER --------------------------------------------
if not exist "%~dp0com.heosan.sedpanel\CSXS\manifest.xml" (
    echo  [ERROR] manifest.xml tidak ditemukan.
    echo  Jalankan install.bat dari folder yang sama dengan
    echo  folder com.heosan.sedpanel\
    echo.
    pause
    exit /b 1
)

:: -- Deteksi APPDATA ----------------------------------------
set "ROAMING=%APPDATA%"
if "!ROAMING!" == "" set "ROAMING=C:\Users\%USERNAME%\AppData\Roaming"
echo  Roaming path: !ROAMING!
echo.

:: -- [0/3] CSInterface.js --------------------------------
echo  [0/3] Memeriksa CSInterface.js...
echo.

set "CSIJS=%~dp0com.heosan.sedpanel\js\CSInterface.js"
set "CSI_URL=https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_12.x/CSInterface.js"
set "NEED_DOWNLOAD=0"

findstr /c:"placeholder" "!CSIJS!" >nul 2>&1
if !errorlevel! == 0 set "NEED_DOWNLOAD=1"
if "!NEED_DOWNLOAD!" == "0" (
    for %%F in ("!CSIJS!") do if %%~zF LSS 1000 set "NEED_DOWNLOAD=1"
)

if "!NEED_DOWNLOAD!" == "1" (
    set "DL_OK=0"
    where powershell >nul 2>&1
    if !errorlevel! == 0 (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%CSI_URL%', '%CSIJS%')" 2>nul
        if !errorlevel! == 0 (
            for %%F in ("!CSIJS!") do if %%~zF GTR 5000 set "DL_OK=1"
        )
    )
    if "!DL_OK!" == "0" (
        where curl >nul 2>&1
        if !errorlevel! == 0 (
            curl -L --silent --max-time 30 -o "!CSIJS!" "!CSI_URL!" 2>nul
            if !errorlevel! == 0 (
                for %%F in ("!CSIJS!") do if %%~zF GTR 5000 set "DL_OK=1"
            )
        )
    )
    if "!DL_OK!" == "1" (
        for %%F in ("!CSIJS!") do echo  [OK] CSInterface.js didownload ^(%%~zF bytes^).
    ) else (
        echo  [GAGAL] Tidak bisa download otomatis.
        echo  Download manual: %CSI_URL%
        echo  Timpa: com.heosan.sedpanel\js\CSInterface.js
        echo.
        set /p "CONT=Lanjut tanpa CSInterface.js? (y/N): "
        if /i "!CONT!" neq "y" (
            echo  Dibatalkan.
            pause
            exit /b 1
        )
    )
) else (
    echo  [OK] CSInterface.js sudah valid, skip download.
)
echo.

:: -- [1/3] CEP Debug Mode --------------------------------
echo  [1/3] Mengaktifkan CEP Debug Mode...
echo.

set "REG_OK=0"
for %%v in (9 10 11 12 13) do (
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    if !errorlevel! == 0 set "REG_OK=1"
)

if "!REG_OK!" == "1" (
    echo  [OK] Debug mode aktif untuk CSXS 9-13.
) else (
    echo  [WARN] Gagal tulis registry. Jalankan sebagai Administrator.
)
echo.

:: -- [2/3] After Effects ---------------------------------
echo  [2/3] Memeriksa proses After Effects...
echo.

tasklist /fi "imagename eq AfterFX.exe" 2>nul | find /i "AfterFX.exe" >nul
if !errorlevel! == 0 (
    echo  After Effects sedang berjalan.
    set /p "CLOSEAE=Tutup AE sekarang? (y/N): "
    if /i "!CLOSEAE!" == "y" (
        taskkill /im AfterFX.exe /f >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo  [OK] After Effects ditutup.
    ) else (
        echo  [SKIP] Restart AE manual setelah install selesai.
    )
) else (
    echo  [OK] After Effects tidak berjalan.
)
echo.

:: -- [3/3] Install Extension -------------------------
echo  [3/3] Menginstal extension...
echo.

set "CEP_DIR=!ROAMING!\Adobe\CEP\extensions"
set "DEST=!CEP_DIR!\com.heosan.sedpanel"
set "SRC=%~dp0com.heosan.sedpanel"

if not exist "!ROAMING!\Adobe"     mkdir "!ROAMING!\Adobe"     >nul 2>&1
if not exist "!ROAMING!\Adobe\CEP" mkdir "!ROAMING!\Adobe\CEP" >nul 2>&1
if not exist "!CEP_DIR!"           mkdir "!CEP_DIR!"           >nul 2>&1

if exist "!DEST!" (
    rmdir /s /q "!DEST!" >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: -- Copy seluruh folder --------------------------------------
xcopy /e /i /y "!SRC!" "!DEST!\" >nul 2>&1
echo.

:: -- Verifikasi ------------------------------------------------
set "ALL_OK=1"

if exist "!DEST!\index.html"        (echo   [OK] index.html)        else (echo   [ERROR] index.html HILANG       & set "ALL_OK=0")
if exist "!DEST!\CSXS\manifest.xml" (echo   [OK] CSXS\manifest.xml) else (echo   [ERROR] manifest.xml HILANG     & set "ALL_OK=0")
if exist "!DEST!\css\style.css"     (echo   [OK] css\style.css)     else (echo   [ERROR] style.css HILANG        & set "ALL_OK=0")
if exist "!DEST!\js\main.js"        (echo   [OK] js\main.js)        else (echo   [ERROR] main.js HILANG          & set "ALL_OK=0")
if exist "!DEST!\jsx\host.jsx"      (echo   [OK] jsx\host.jsx)      else (echo   [ERROR] host.jsx HILANG         & set "ALL_OK=0")
if exist "!DEST!\js\CSInterface.js" (
    for %%F in ("!DEST!\js\CSInterface.js") do (
        if %%~zF GTR 5000 (echo   [OK] js\CSInterface.js) else (echo   [WARN] CSInterface.js terlalu kecil)
    )
) else (
    echo   [ERROR] CSInterface.js HILANG
    set "ALL_OK=0"
)
echo.

if "!ALL_OK!" == "0" (
    echo  [ERROR] Ada file yang hilang. Klik kanan ^> Run as Administrator.
    echo.
    pause
    exit /b 1
)

:: -- SELESAI ----------------------------------------------------
echo  =====================================================
echo   INSTALASI SELESAI!  SED Panel CEP v3.2
echo  =====================================================
echo.
echo  Terinstall di: !DEST!
echo.
echo  Cara buka: After Effects ^> Window ^> Extensions ^> SED Panel
echo.
echo  PENTING: Restart AE sepenuhnya setelah install ini.
echo.

set /p "OPENAE=Buka After Effects sekarang? (y/N): "
if /i "!OPENAE!" neq "y" goto :END

set "AE_EXE="
for %%y in (2026 2025 2024 2023 2022 2021 2020 2019) do (
    if not defined AE_EXE (
        if exist "C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe" (
            set "AE_EXE=C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe"
        )
    )
)

if defined AE_EXE (
    echo  Membuka After Effects...
    start "" "!AE_EXE!"
) else (
    echo  AfterFX.exe tidak ditemukan. Buka After Effects manual.
)

:END
echo.
pause
exit /b 0