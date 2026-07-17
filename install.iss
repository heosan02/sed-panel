; SED Panel v3.2 — Inno Setup installer
; Build: ISCC install.iss

#define AppName "SED Panel"
#define AppVer "3.2.0"
#define AppPub "Heosan"
#define AppURL "https://heosan.web.app"
#define SrcDir "com.heosan.sedpanel"
#define DestDir "{userappdata}\Adobe\CEP\extensions\com.heosan.sedpanel"

[Setup]
AppName={#AppName}
AppVersion={#AppVer}
AppPublisher={#AppPub}
AppPublisherURL={#AppURL}
DefaultDirName={#DestDir}
DisableDirPage=yes
DisableProgramGroupPage=yes
UninstallFilesDir={app}\uninst
OutputDir=.
OutputBaseFilename=SED_Panel_v3.2_Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
DisableWelcomePage=yes
DisableFinishedPage=no
ShowLanguageDialog=no
LicenseFile=LICENSE.txt

[Messages]
FinishedLabel=Setup has finished installing %1 on your computer.%n%nRestart After Effects, then open the panel via Window > Extensions > SED Panel.

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#SrcDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "ffmpeg\ffmpeg.exe"

[Registry]
; Enable CEP debug mode for all CSXS versions (AE CS6 through 2026)
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.4";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.5";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.6";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.7";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.8";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.9";  ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.10"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.11"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.12"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror
Root: HKCU; Subkey: "SOFTWARE\Adobe\CSXS.13"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: createvalueifdoesntexist noerror

[Code]
function GetAEPath(Param: string): string;
begin
  Result := '';
  if FileExists('C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2022\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2022\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2021\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2021\Support Files\AfterFX.exe'
  else if FileExists('C:\Program Files\Adobe\Adobe After Effects 2020\Support Files\AfterFX.exe') then
    Result := 'C:\Program Files\Adobe\Adobe After Effects 2020\Support Files\AfterFX.exe';
end;

function IsAERunning: Boolean;
begin
  Result := FindWindowByWindowName('After Effects') <> 0;
end;

function KillAE: Boolean;
var
  ResCode: Integer;
begin
  Result := Exec('taskkill', '/f /im AfterFX.exe', '', SW_HIDE, ewWaitUntilTerminated, ResCode) and (ResCode = 0);
end;

function InitializeSetup: Boolean;
var
  Ans: Integer;
begin
  Result := True;
  if IsAERunning then
  begin
    Ans := MsgBox('After Effects sedang berjalan.' + #13#10 + #13#10 +
                  'Disarankan tutup AE sebelum install. Tutup sekarang?',
                  mbConfirmation, MB_YESNO);
    if Ans = IDYES then
    begin
      if not KillAE then
        MsgBox('Gagal menutup AE. Tutup manual lalu jalankan installer lagi.', mbError, MB_OK);
    end;
  end;
end;

[Run]
Filename: "{code:GetAEPath}"; Flags: postinstall nowait skipifsilent unchecked skipifdoesntexist; Description: "Launch After Effects"
