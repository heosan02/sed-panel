@echo off
setlocal EnableDelayedExpansion
title SED Panel CEP v2.0 - Installer

echo.
echo  =====================================================
echo   SED Panel CEP  v2.0  ^|  Auto Installer
echo   (c) 2026 Heosan
echo  =====================================================
echo.

:: ── Pastikan berjalan dari folder yang benar ──────────────
if not exist "%~dp0com.heosan.sedpanel\CSXS\manifest.xml" (
    echo  [ERROR] File manifest.xml tidak ditemukan.
    echo.
    echo  Pastikan install.bat dijalankan dari folder yang
    echo  sama dengan folder com.heosan.sedpanel\
    echo.
    pause
    exit /b 1
)

:: ── Tentukan path APPDATA ─────────────────────────────────
set "ROAMING=%APPDATA%"
if not defined ROAMING set "ROAMING=C:\Users\%USERNAME%\AppData\Roaming"

echo  Folder instalasi: %ROAMING%\Adobe\CEP\extensions
echo.

:: ════════════════════════════════════════════════════════
:: [0/3] Periksa CSInterface.js
:: ════════════════════════════════════════════════════════
echo  [0/3] Memeriksa CSInterface.js...
echo.

set "CSIJS=%~dp0com.heosan.sedpanel\js\CSInterface.js"
set "CSI_URL=https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_12.x/CSInterface.js"
set "NEED_DL=0"
set "DL_OK=0"

:: Cek apakah masih stub / terlalu kecil
findstr /c:"placeholder" "%CSIJS%" >nul 2>&1 && set "NEED_DL=1"
if "%NEED_DL%"=="0" (
    for %%F in ("%CSIJS%") do if %%~zF LSS 1000 set "NEED_DL=1"
)

if "%NEED_DL%"=="1" (
    echo  Mendownload CSInterface.js...
    echo.

    :: Coba PowerShell
    where powershell >nul 2>&1
    if not errorlevel 1 (
        echo  Mencoba PowerShell...
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
            "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;(New-Object Net.WebClient).DownloadFile('%CSI_URL%','%CSIJS%')" >nul 2>&1
        for %%F in ("%CSIJS%") do if %%~zF GTR 5000 set "DL_OK=1"
    )

    :: Coba curl jika PowerShell gagal
    if "%DL_OK%"=="0" (
        where curl >nul 2>&1
        if not errorlevel 1 (
            echo  Mencoba curl...
            curl -L --silent --max-time 30 -o "%CSIJS%" "%CSI_URL%" >nul 2>&1
            for %%F in ("%CSIJS%") do if %%~zF GTR 5000 set "DL_OK=1"
        )
    )

    if "%DL_OK%"=="1" (
        for %%F in ("%CSIJS%") do echo  [OK] Download berhasil ^(%%~zF bytes^).
    ) else (
        echo  [GAGAL] Tidak bisa download otomatis.
        echo.
        echo  Download manual dari:
        echo    %CSI_URL%
        echo.
        echo  Timpa file: com.heosan.sedpanel\js\CSInterface.js
        echo  Lalu jalankan install.bat lagi.
        echo.
        echo  Tekan Y untuk lanjut tanpa CSInterface.js,
        echo  atau tekan N untuk batalkan.
        echo.
        choice /c YN /n /m "  Lanjut? (Y/N): "
        if errorlevel 2 (
            echo  Dibatalkan.
            pause
            exit /b 1
        )
    )
) else (
    echo  [OK] CSInterface.js valid, skip download.
)
echo.

:: ════════════════════════════════════════════════════════
:: [1/3] Aktifkan CEP Debug Mode
:: ════════════════════════════════════════════════════════
echo  [1/3] Mengaktifkan CEP Debug Mode...
echo.

set "REG_OK=0"
for %%v in (4 5 6 7 8 9 10 11 12 13) do (
    reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    if not errorlevel 1 set "REG_OK=1"
)

if "%REG_OK%"=="1" (
    echo  [OK] CEP Debug Mode aktif ^(CSXS 4-13 / AE CS6 s/d 2026^).
) else (
    echo  [WARN] Registry gagal ditulis.
    echo  Coba klik kanan install.bat ^> Run as Administrator.
)
echo.

:: ════════════════════════════════════════════════════════
:: [2/3] Cek After Effects
:: ════════════════════════════════════════════════════════
echo  [2/3] Memeriksa proses After Effects...
echo.

tasklist 2>nul | find /i "AfterFX.exe" >nul 2>&1
if not errorlevel 1 (
    echo  After Effects sedang berjalan.
    choice /c YN /n /m "  Tutup AE sekarang? (Y/N): "
    if not errorlevel 2 (
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

:: ════════════════════════════════════════════════════════
:: [3/3] Install Extension
:: ════════════════════════════════════════════════════════
echo  [3/3] Menginstal extension...
echo.

set "CEP_DIR=%ROAMING%\Adobe\CEP\extensions"
set "DEST=%CEP_DIR%\com.heosan.sedpanel"
set "SRC=%~dp0com.heosan.sedpanel"

:: Buat folder jika belum ada
if not exist "%ROAMING%\Adobe"     mkdir "%ROAMING%\Adobe"     >nul 2>&1
if not exist "%ROAMING%\Adobe\CEP" mkdir "%ROAMING%\Adobe\CEP" >nul 2>&1
if not exist "%CEP_DIR%"           mkdir "%CEP_DIR%"           >nul 2>&1

:: Hapus instalasi lama
if exist "%DEST%" (
    echo  Menghapus instalasi lama...
    rmdir /s /q "%DEST%" >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: Buat folder struktur
echo  Membuat folder...
mkdir "%DEST%"          >nul 2>&1
mkdir "%DEST%\CSXS"     >nul 2>&1
mkdir "%DEST%\css"      >nul 2>&1
mkdir "%DEST%\js"       >nul 2>&1
mkdir "%DEST%\jsx"      >nul 2>&1

:: Salin file
echo  Menyalin file...
copy /y "%SRC%\index.html"          "%DEST%\index.html"         >nul 2>&1
copy /y "%SRC%\CSXS\manifest.xml"   "%DEST%\CSXS\manifest.xml"  >nul 2>&1
copy /y "%SRC%\css\style.css"       "%DEST%\css\style.css"      >nul 2>&1
copy /y "%SRC%\js\CSInterface.js"   "%DEST%\js\CSInterface.js"  >nul 2>&1
copy /y "%SRC%\js\main.js"          "%DEST%\js\main.js"         >nul 2>&1
copy /y "%SRC%\jsx\host.jsx"        "%DEST%\jsx\host.jsx"       >nul 2>&1
echo.

:: ── Verifikasi ────────────────────────────────────────────
echo  Verifikasi:
set "ALL_OK=1"

if exist "%DEST%\index.html"         (echo   [OK] index.html)         else (echo   [!!] index.html HILANG    & set "ALL_OK=0")
if exist "%DEST%\CSXS\manifest.xml"  (echo   [OK] CSXS\manifest.xml)  else (echo   [!!] manifest.xml HILANG  & set "ALL_OK=0")
if exist "%DEST%\css\style.css"      (echo   [OK] css\style.css)      else (echo   [!!] style.css HILANG     & set "ALL_OK=0")
if exist "%DEST%\js\main.js"         (echo   [OK] js\main.js)         else (echo   [!!] main.js HILANG       & set "ALL_OK=0")
if exist "%DEST%\jsx\host.jsx"       (echo   [OK] jsx\host.jsx)       else (echo   [!!] host.jsx HILANG      & set "ALL_OK=0")
if exist "%DEST%\js\CSInterface.js" (
    for %%F in ("%DEST%\js\CSInterface.js") do (
        if %%~zF GTR 5000 (
            echo   [OK] js\CSInterface.js ^(%%~zF bytes^)
        ) else (
            echo   [WARN] CSInterface.js terlalu kecil ^(%%~zF bytes^)
        )
    )
) else (
    echo   [!!] CSInterface.js HILANG
    set "ALL_OK=0"
)
echo.

if "%ALL_OK%"=="0" (
    echo  [ERROR] Ada file yang tidak tersalin.
    echo  Coba klik kanan ^> Run as Administrator.
    echo.
    pause
    exit /b 1
)

:: ════════════════════════════════════════════════════════
:: SELESAI
:: ════════════════════════════════════════════════════════
echo  =====================================================
echo   INSTALASI SELESAI!  SED Panel CEP v2.0
echo  =====================================================
echo.
echo  Terinstall di:
echo    %DEST%
echo.
echo  Cara buka: After Effects ^> Window ^> Extensions ^> SED Panel
echo.
echo  PENTING: Restart After Effects setelah install ini.
echo.

:: Tawarkan buka AE
choice /c YN /n /m "  Buka After Effects sekarang? (Y/N): "
if errorlevel 2 goto :END

:: Cari AfterFX.exe
set "AE_EXE="
for %%y in (2026 2025 2024 2023 2022 2021 2020 2019) do (
    if not defined AE_EXE (
        if exist "C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe" (
            set "AE_EXE=C:\Program Files\Adobe\Adobe After Effects %%y\Support Files\AfterFX.exe"
        )
    )
)

if defined AE_EXE (
    echo.
    echo  Membuka After Effects...
    start "" "%AE_EXE%"
) else (
    echo.
    echo  AfterFX.exe tidak ditemukan. Buka After Effects manual.
)

:END
echo.
pause
exit /b 0
