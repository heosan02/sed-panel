/* SED Panel v2.0 - main.js - (c) 2026 Heosan */
/* global CSInterface */
(function(){
"use strict";

var cs = new CSInterface();
var ONBOARD_KEY = "sed_panel_v5_onboarded";
var LANG_KEY = "sed_panel_lang";
var TMP_KEY = "sed_panel_custom_tmp";

// ═══ i18n ══════════════════════════════════════════════
var LANG="en";
var T={
  en:{
    status_idle:"Select a video layer → Detect",
    layer:"LAYER", detect:"DETECT SCENES", read_marker:"Read Markers",
    scenes:"SCENES", marked:"MARKED",
    th_in:"IN", th_dur:"DUR", no_scenes:"No scenes yet.",
    all:"All", none:"None", clear_marker:"✕ Markers",
    split_all:"Cut All Cut Points", split_sel:"Cut Selected Only",
    keep_sel:"Delete All Except Selected",
    comp_markers:"Add Comp Markers", export_rq:"Export → Render Queue",
    scene:"SCENE", dur:"DUR", mark:"○ Mark", marked_btn:"✔ Marked",
    go_frame:"Go to Frame", gen_thumbs:"🖼 Thumbs", clean_tmp:"🗑 Tmp",
    grid_hint:"Ctrl+click=mark · Dbl=mark", col:"Col",
    about_desc:"Scene Edit Detection Panel for Adobe After Effects.",
    language:"Language:", close:"Close",
    settings_title:"Settings",
    settings_desc:"Panel preferences and thumbnail temp folder.",
    temp_folder:"Temp Folder",
    temp_folder_desc:"Used for thumbnail render files. Choose a writable folder if AE cannot write to the extension folder.",
    choose_folder:"Choose Folder",
    use_default_temp:"Use Default Temp Folder",
    default_temp:"Default",
    temp_saved:"Temp folder saved.",
    temp_default:"Using default temp folder.",
    system_title:"SYSTEM",
    diag_btn:"Diagnose Render Pipeline",
    tutorial_btn:"Tutorial — Usage Guide",
    detecting:"Detecting scenes…", reading:"Reading markers…",
    cutting:"Cutting…", processing:"Processing…", exporting:"Exporting…",
    confirm_keep:"⚠ WARNING\n\n{kept} scene(s) KEPT.\n{del} scene(s) DELETED.\n\nThis CANNOT be undone!\n\nContinue?",
    confirm_clear:"Delete all layer markers?\nDetection results will be reset.",
    confirm_thumbs:"Generate {n} thumbnails?\n\n≈{min}–{max} sec. Continue?",
    confirm_clean:"Clear temporary thumbnail files?",
    no_detect:"Detect scenes first.", no_mark:"Mark at least 1 scene.",
    no_cut:"No cut points from selected scenes.",
    thumb_gen:"Thumb {i}/{n}…", thumb_done:"✓ {ok}/{n} thumbnails done.",
    split_ok:"✓ {n} cuts done.", keep_ok:"✓ {kept} kept · {del} deleted.",
    export_ok:"✓ {n} scenes → Render Queue.",
    export_alert:"{n} scenes added to Render Queue.\n\nWindow → Render Queue → Set output path → Render All",
    marker_clear:"All markers deleted.", markers_added:"✓ {n} comp markers added.",
    clean_ok:"✓ Cleared {n} temp file(s).",
    // Onboarding slides
    ob_back:"← Back", ob_next:"Next →", ob_start:"✓ Start Using",
    ae_no_detect:"Scene Edit Detection is not available in this AE version.",
    ae_upgrade_hint:"Update AE to version 2022 or newer, or wait for the next patch.",
    ae_detect_ok:"Scene Edit Detection ready (AE {name})",

    ob_h_welcome:"Welcome to SED Panel",
    ob_hint:"This guide appears once. Reopen anytime via About \u2192 Tutorial.",
    ob_welcome_desc:"Scene Edit Detection panel for Adobe After Effects.<br>Automatic scene cut detection, quick navigation, and easy scene export.",
    ob_h_detect:"DETECT SCENES", ob_h_read:"Read Markers", ob_h_nav:"Scene Navigation",
    ob_h_cut:"Cut Layer", ob_h_keep:"Delete Except Selected", ob_h_export:"Export to Render Queue",
    ob_h_thumb:"Thumbnail Preview", ob_h_ready:"Ready to Use!",
    ob_detect_desc:"Select a video layer in the AE Timeline, then click <strong>DETECT SCENES</strong>.",
    ob_detect_tip:"After Effects will automatically create markers at every detected cut point on the layer.",
    ob_read_desc:"Already have markers from AE manual detection?<br>Click <strong>Read Markers</strong> to read existing markers.",
    ob_read_tip:"Layer → Scene Edit Detection → Create Layer Markers → OK, then click Read Markers.",
    ob_nav_desc:"<strong>Click</strong> a scene card → select and move CTI to that scene.<br><strong>Ctrl+Click</strong> or <strong>Double-click</strong> → mark for export.<br><strong>Thumbnails</strong> appear after clicking 🖼 Thumbs.",
    ob_nav_tip:"Use ⏮ ◀ ▶ ⏭ buttons at the top for quick navigation between scenes.",
    ob_cut_desc:"<strong>Cut All Cut Points</strong> → split layer at all cut points (1 layer per scene).<br><strong>Cut Selected Only</strong> → split only at marked scene cut points.",
    ob_cut_tip:"After splitting, layers cannot be automatically restored — but Ctrl+Z works.",
    ob_keep_desc:"Mark scenes you want to <strong>keep</strong>, then click <strong>Delete All Except Selected</strong>.",
    ob_keep_tip:"This operation <strong>cannot be undone</strong>! Make sure marked scenes are correct before executing.",
    ob_export_desc:"Mark scenes to render, then click <strong>Export → Render Queue</strong>.<br>Each scene becomes a separate composition in AE Render Queue.",
    ob_export_tip:"After export, open Window → Render Queue, set output path, then Render All.",
    ob_thumb_desc:"Click <strong>🖼 Thumbs</strong> to generate thumbnails for each scene.<br>If it fails, open <strong>Settings → Temp Folder</strong> and choose a writable folder.",
    ob_thumb_tip:"Thumbnails are rendered by AE to the temp folder, then automatically cleaned after reading.",
    ob_ready_desc:"All main features explained.<br>Open <strong>About → Tutorial</strong> anytime to reopen this guide.",
    ob_ready_tip:"Set language and temp folder in Settings. Custom temp folder helps with thumbnails if AE cannot write to the extension folder.",
  },

  id:{
    status_idle:"Pilih layer video → Deteksi",
    layer:"LAYER", detect:"DETEKSI SCENE", read_marker:"Baca Marker",
    scenes:"SCENES", marked:"DITANDAI",
    th_in:"IN", th_dur:"DUR", no_scenes:"Belum ada scene.",
    all:"Semua", none:"Kosong", clear_marker:"✕ Marker",
    split_all:"Potong Semua Cut Points", split_sel:"Potong Hanya Terpilih",
    keep_sel:"Hapus Selain Terpilih",
    comp_markers:"Tambah Comp Markers", export_rq:"Export → Render Queue",
    scene:"SCENE", dur:"DUR", mark:"○ Mark", marked_btn:"✔ Ditandai",
    go_frame:"Go to Frame", gen_thumbs:"🖼 Thumbs", clean_tmp:"🗑 Tmp",
    grid_hint:"Ctrl+klik=tandai · Dbl=tandai", col:"Kol",
    about_desc:"Scene Edit Detection Panel untuk Adobe After Effects.",
    language:"Bahasa:", close:"Tutup",
    settings_title:"Pengaturan",
    settings_desc:"Preferensi panel dan folder temp thumbnail.",
    temp_folder:"Folder Temp",
    temp_folder_desc:"Dipakai untuk file render thumbnail. Pilih folder yang bisa ditulis jika AE tidak bisa menulis ke folder ekstensi.",
    choose_folder:"Pilih Folder",
    use_default_temp:"Pakai Folder Temp Default",
    default_temp:"Default",
    temp_saved:"Folder temp tersimpan.",
    temp_default:"Menggunakan folder temp default.",
    system_title:"SISTEM",
    diag_btn:"Diagnosa Pipeline Render",
    tutorial_btn:"Tutorial — Panduan Penggunaan",
    detecting:"Mendeteksi scene…", reading:"Membaca marker…",
    cutting:"Memotong…", processing:"Memproses…", exporting:"Mengekspor…",
    confirm_keep:"⚠ PERINGATAN\n\n{kept} scene DIPERTAHANKAN.\n{del} scene DIHAPUS.\n\nTIDAK BISA di-undo!\n\nLanjutkan?",
    confirm_clear:"Hapus semua layer marker?\nHasil deteksi akan direset.",
    confirm_thumbs:"Generate {n} thumbnail?\n\n≈{min}–{max} detik. Lanjutkan?",
    confirm_clean:"Hapus file thumbnail sementara?",
    no_detect:"Deteksi scene dulu.", no_mark:"Tandai minimal 1 scene.",
    no_cut:"Tidak ada cut point dari scene terpilih.",
    thumb_gen:"Thumb {i}/{n}…", thumb_done:"✓ {ok}/{n} thumbnail selesai.",
    split_ok:"✓ {n} potongan berhasil.", keep_ok:"✓ {kept} dipertahankan · {del} dihapus.",
    export_ok:"✓ {n} scene → Render Queue.",
    export_alert:"{n} scene → Render Queue.\n\nWindow → Render Queue → Atur output → Render All",
    marker_clear:"Semua marker dihapus.", markers_added:"✓ {n} comp marker ditambahkan.",
    clean_ok:"✓ {n} file temp dihapus.",
    // Onboarding slides
    ob_back:"← Kembali", ob_next:"Berikutnya →", ob_start:"✓ Mulai",
    ae_no_detect:"Scene Edit Detection tidak tersedia di versi AE ini.",
    ae_upgrade_hint:"Update AE ke versi 2022 atau lebih baru, atau tunggu patch selanjutnya.",
    ae_detect_ok:"Scene Edit Detection siap (AE {name})",

    ob_h_welcome:"Selamat Datang di SED Panel",
    ob_hint:"Panduan ini hanya muncul sekali. Bisa dibuka lagi di About \u2192 Tutorial.",
    ob_welcome_desc:"Scene Edit Detection panel untuk Adobe After Effects.<br>Deteksi cut scene otomatis, navigasi cepat, dan ekspor scene dengan mudah.",
    ob_h_detect:"DETEKSI SCENE", ob_h_read:"Baca Marker", ob_h_nav:"Navigasi Scene",
    ob_h_cut:"Potong Layer", ob_h_keep:"Hapus Selain Terpilih", ob_h_export:"Export ke Render Queue",
    ob_h_thumb:"Thumbnail Preview", ob_h_ready:"Siap Digunakan!",
    ob_detect_desc:"Pilih layer video di Timeline AE, lalu klik tombol <strong>DETEKSI SCENE</strong>.",
    ob_detect_tip:"After Effects akan otomatis membuat marker di setiap cut point yang terdeteksi pada layer.",
    ob_read_desc:"Sudah punya marker dari deteksi manual AE?<br>Klik <strong>Baca Marker</strong> untuk membaca marker yang sudah ada.",
    ob_read_tip:"Layer → Scene Edit Detection → Create Layer Markers → OK, lalu klik Baca Marker.",
    ob_nav_desc:"<strong>Klik</strong> kartu scene → pilih dan pindah CTI ke scene tersebut.<br><strong>Ctrl+Klik</strong> atau <strong>Dobel-klik</strong> → tandai untuk export.<br><strong>Thumbnail</strong> statis akan tampil setelah Anda klik tombol 🖼 Thumbs.",
    ob_nav_tip:"Gunakan tombol ⏮ ◀ ▶ ⏭ di atas untuk navigasi cepat antar scene.",
    ob_cut_desc:"<strong>Potong Semua Cut Points</strong> → split layer di semua cut point (1 layer per scene).<br><strong>Potong Hanya Terpilih</strong> → split hanya di cut point scene yang ditandai.",
    ob_cut_tip:"Setelah split, layer yang sudah terpotong tidak bisa dikembalikan otomatis — tapi bisa Ctrl+Z.",
    ob_keep_desc:"Tandai scene yang ingin <strong>dipertahankan</strong>, lalu klik <strong>Hapus Selain Terpilih</strong>.",
    ob_keep_tip:"Operasi ini <strong>tidak bisa di-undo</strong>! Pastikan scene yang ditandai sudah benar sebelum eksekusi.",
    ob_export_desc:"Tandai scene yang ingin dirender, lalu klik <strong>Export → Render Queue</strong>.<br>Setiap scene akan menjadi komposisi terpisah di Render Queue AE.",
    ob_export_tip:"Setelah export, buka Window → Render Queue, atur output path, lalu Render All.",
    ob_thumb_desc:"Klik <strong>🖼 Thumbs</strong> untuk generate thumbnail dari setiap scene.<br>Jika gagal, buka <strong>Settings → Temp Folder</strong> lalu pilih folder yang bisa ditulis.",
    ob_thumb_tip:"Thumbnail dirender oleh AE ke folder temp, lalu dibersihkan otomatis setelah dibaca panel.",
    ob_ready_desc:"Semua fitur utama sudah dijelaskan.<br>Buka <strong>About → Tutorial</strong> kapan saja untuk membuka panduan ini lagi.",
    ob_ready_tip:"Atur bahasa dan folder temp di Settings. Folder temp kustom membantu thumbnail jika AE tidak bisa menulis ke folder ekstensi.",
  }
};
function t(k,v){
  var s=(T[LANG]||T.en)[k]||k;
  if(v) Object.keys(v).forEach(function(x){s=s.replace(new RegExp("{"+x+"}","g"),v[x]);});
  return s;
}
function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(function(el){
    el.innerHTML=t(el.getAttribute("data-i18n"));
  });
}

// ═══ State ═════════════════════════════════════════════
var S={
  scenes:[], selected:[], activeIdx:-1,
  detectDone:false, fps:24,
  cols:3,
  cols:3,
  thumbs:{}, thumbPaths:{}, thumbDone:0, thumbLoading:false,
  diagInfo:null,
  customTmpPath:"",
  lastActiveIdx:-1
};

// ═══ DOM helpers ════════════════════════════════════════
var $=function(id){return document.getElementById(id);};
function evalScript(sc,cb){cs.evalScript(sc,function(r){if(cb)cb(r);});}
var seekTimer=null;
function scheduleGoToFrame(sec){
  if(seekTimer) clearTimeout(seekTimer);
  seekTimer=setTimeout(function(){
    seekTimer=null;
    callHost("goToFrame",[sec],function(){});
  },35);
}
function callHost(fn,args,cb){
  var a=(args||[]).map(function(x){return typeof x==="string"?JSON.stringify(x):x;}).join(",");
  evalScript(fn+"("+a+")",function(r){
    var p; try{p=JSON.parse(r);}catch(e){p={ok:false,msg:r};}
    if(cb)cb(p);
  });
}
function pad2(n){return (n<10?"0":"")+Math.floor(n);}
function pad3(n){return (n<10?"00":n<100?"0":"")+Math.floor(n);}
function fmtTC(sec,fps){
  sec=Math.max(0,sec); fps=fps||24;
  var f=Math.round(sec*fps),ifps=Math.round(fps);
  var ff=f%ifps,ts=Math.floor(f/ifps);
  return pad2(Math.floor(ts/3600))+":"+pad2(Math.floor((ts%3600)/60))+":"+pad2(ts%60)+":"+pad2(ff);
}
function setStatus(msg,cls){
  $("status").textContent=msg; $("status-dot").className=cls||"";
}
function setThumbCount(n){$("thumb-count-lbl").textContent=n;}
function setThumbProgress(txt){
  var el=$("thumb-progress");
  if(txt){el.textContent=txt;el.classList.remove("hidden");}
  else   {el.classList.add("hidden");}
}
function loadPrefs(){
  try{ LANG=localStorage.getItem(LANG_KEY)||LANG; }catch(e){}
  try{ S.customTmpPath=localStorage.getItem(TMP_KEY)||""; }catch(e){}
}
function saveLang(){
  try{ localStorage.setItem(LANG_KEY,LANG); }catch(e){}
}
function saveTmpPath(path){
  S.customTmpPath=path||"";
  try{
    if(S.customTmpPath) localStorage.setItem(TMP_KEY,S.customTmpPath);
    else localStorage.removeItem(TMP_KEY);
  }catch(e){}
  renderTmpPath();
}
function renderTmpPath(){
  var txt=S.customTmpPath||t("default_temp");
  ["temp-path","ob-temp-path"].forEach(function(id){
    var el=$(id); if(el){ el.textContent=txt; el.title=txt; }
  });
}
function pickTempFolder(){
  callHost("selectCustomTempFolder",[],function(res){
    if(!res||!res.ok) return;
    saveTmpPath(res.path||"");
    setStatus(t("temp_saved"),"ok");
  });
}
function filePathToURI(path){
  if(!path) return "";
  var p=String(path).replace(/\\/g,"/");
  if(p.charAt(0)!=="/") p="/"+p;
  return encodeURI("file://"+p);
}
function readThumbDataURI(path){
  if(!path) return "";
  try{
    if(typeof require==="function"){
      var fs=require("fs");
      if(fs&&fs.existsSync(path)){
        return "data:image/png;base64,"+fs.readFileSync(path).toString("base64");
      }
    }
  }catch(e1){}
  try{
    if(window.cep&&window.cep.fs&&window.cep.encoding){
      var r=window.cep.fs.readFile(path,window.cep.encoding.Base64);
      if(r&&r.err===0&&r.data) return "data:image/png;base64,"+r.data;
    }
  }catch(e2){}
  return filePathToURI(path);
}
function acceptThumb(idx,res){
  // v5.3 OPT: file:// URI — fastest approach
  // Browser CEP loads file:// async (non-blocking), no disk read in JS needed.
  // cep.fs.readFile is synchronous & slow for large PNG — avoid as primary path.
  var thumbSrc="";
  var thumbPath=(res&&res.path)||"";
  if(res&&res.dataURI){
    thumbSrc=res.dataURI; // legacy compat
  } else if(thumbPath){
    thumbSrc=filePathToURI(thumbPath); // fast: let browser load async
  } else if(res&&res.uri){
    thumbSrc=res.uri;
  }
  if(!thumbSrc) return false;
  if(thumbPath) S.thumbPaths[idx]=thumbPath;
  S.thumbs[idx]=thumbSrc; S.thumbDone++;
  setThumbCount(S.thumbDone);
  _injectThumb(idx,thumbSrc,thumbPath);
  return true;
}

// ═══ ONBOARDING ═════════════════════════════════════════
var OB_TOTAL=9, obCurrent=0;

function showOnboarding(){
  $("onboard-overlay").classList.remove("hidden");
  obGoTo(0);
}
function hideOnboarding(){
  $("onboard-overlay").classList.add("hidden");
  try{ localStorage.setItem(ONBOARD_KEY,"1"); }catch(e){}
}
function obGoTo(n){
  var slides=document.querySelectorAll(".ob-slide");
  var dots=document.querySelectorAll(".ob-dot");
  slides.forEach(function(s,i){
    s.classList.remove("active","exit-left");
    if(i<n) s.classList.add("exit-left");
    if(i===n) s.classList.add("active");
  });
  dots.forEach(function(d,i){ d.classList.toggle("active",i===n); });
  obCurrent=n;
  $("ob-prev").disabled=(n===0);
  // Update button text via i18n
  $("ob-prev").setAttribute("data-i18n", "ob_back");
  var nextBtn=$("ob-next");
  if(n===OB_TOTAL-1){
    nextBtn.setAttribute("data-i18n","ob_start");
    nextBtn.classList.add("ob-btn-primary");
  } else {
    nextBtn.setAttribute("data-i18n","ob_next");
    nextBtn.classList.remove("ob-btn-primary");
    nextBtn.classList.add("ob-btn-primary"); // keep primary style on next too for consistency
  }
  applyI18n();
}

$("ob-next").addEventListener("click",function(){
  if(obCurrent===OB_TOTAL-1){ hideOnboarding(); return; }
  obGoTo(obCurrent+1);
});
$("ob-prev").addEventListener("click",function(){
  if(obCurrent>0) obGoTo(obCurrent-1);
});
$("onboard-skip").addEventListener("click",function(){ hideOnboarding(); });
document.querySelectorAll(".ob-dot").forEach(function(d){
  d.addEventListener("click",function(){
    obGoTo(parseInt(d.getAttribute("data-to")));
  });
});

// Check first run
(function checkFirstRun(){
  var done=false;
  try{ done=!!localStorage.getItem(ONBOARD_KEY); }catch(e){}
  if(!done) showOnboarding();
})();

// Reopen tutorial from About
$("open-tutorial-btn").addEventListener("click",function(){
  $("about-overlay").classList.add("hidden");
  showOnboarding();
  obGoTo(0);
});

// ═══ Thumbnails ═════════════════════════════════════════
function startThumbGen(){
  if(S.thumbLoading){setStatus(t("thumb_gen",{i:"…",n:"…"}),"warn");return;}
  if(!S.scenes.length){setStatus(t("no_detect"),"warn");return;}
  var n=S.scenes.length;
  var mn=Math.ceil(n*1),mx=Math.ceil(n*3);
  if(!confirm(t("confirm_thumbs",{n:n,min:mn,max:mx}))) return;
  _doStartThumb();
}
// Auto: called after detect/readMarkers — no confirm dialog
function _startThumbAuto(){
  if(S.thumbLoading) return;
  if(!S.scenes.length) return;
  _doStartThumb();
}
// Shared core: reset state, start sequential capture
function _doStartThumb(){
  S.thumbLoading=true; S.thumbDone=0; S.thumbs={}; S.thumbPaths={};
  $("thumb-btn").classList.add("loading");
  setThumbCount(0); setThumbProgress("0/"+S.scenes.length);
  _captureNext(0);
}
// Sequential capture: one scene per CEP bridge call
// This is the safest approach — each call is independent and within CEP timeout budget
var _thumbFailStreak=0;
function _captureNext(i){
  if(i>=S.scenes.length){_finishThumbGen();return;}
  var sc=S.scenes[i];
  setThumbProgress((i+1)+"/"+S.scenes.length);
  callHost("captureSceneFrames",[sc.start_sec,sc.dur_sec,i,S.customTmpPath],function(res){
    if(res&&res.ok){
      _thumbFailStreak=0;
      acceptThumb(i,res);
    } else {
      _thumbFailStreak++;
      if(_thumbFailStreak===3) setStatus("Thumbs failing — check Settings → Temp Folder","warn");
    }
    setTimeout(function(){ _captureNext(i+1); }, 0);
  });
}
function _finishThumbGen(){
  S.thumbLoading=false;
  _thumbFailStreak=0;
  $("thumb-btn").classList.remove("loading");
  setThumbProgress(null);
  if(S.thumbDone===0){
    setStatus("Thumbs failed — check Settings → Temp Folder","warn");
  } else if(S.thumbDone<S.scenes.length){
    setStatus(t("thumb_done",{ok:S.thumbDone,n:S.scenes.length})+" ("+S.thumbDone+"/"+S.scenes.length+")","warn");
  } else {
    setStatus(t("thumb_done",{ok:S.thumbDone,n:S.scenes.length}),"ok");
  }
}
function _injectThumb(idx,uri,path){
  var card=document.querySelector(".scene-card[data-idx='"+idx+"']"); if(!card) return;
  var wrap=card.querySelector(".card-img-wrap"); if(!wrap) return;
  wrap.innerHTML=""; wrap.classList.remove("card-img-ph");
  var img=document.createElement("img");
  img.alt="";
  img.style.cssText="width:100%;height:100%;object-fit:cover;display:block;";
  if(path){
    // onload: delete temp file after browser has loaded it into memory
    img.onload=function(){
      try{ if(window.cep&&window.cep.fs) window.cep.fs.deleteFile(path); }catch(e){}
    };
    // onerror: file:// failed (rare), fallback to cep.fs base64
    img.onerror=function(){
      if(img.dataset.fallback==="1") return;
      img.dataset.fallback="1";
      var data=readThumbDataURI(path);
      if(data) img.src=data;
    };
  }
  img.src=uri; // set AFTER attaching handlers
  wrap.appendChild(img);
  var num=card.querySelector(".card-thumb-num"); if(num) num.style.display="none";
}

// ═══ About modal ════════════════════════════════════════
$("about-btn").addEventListener("click",function(){$("about-overlay").classList.remove("hidden");});
[$("about-close"),$("about-close-x")].forEach(function(b){
  b&&b.addEventListener("click",function(){$("about-overlay").classList.add("hidden");});
});
$("about-overlay").addEventListener("click",function(e){
  if(e.target===$("about-overlay"))$("about-overlay").classList.add("hidden");
});
$("link-tiktok").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://www.tiktok.com/@heosan/");});
$("link-ig").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://www.instagram.com/_heosan/");});
$("link-web").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://heosanweb.carrd.co/");});

// Settings modal
$("settings-btn").addEventListener("click",function(){
  renderTmpPath();
  $("settings-overlay").classList.remove("hidden");
});
[$("settings-close"),$("settings-close-x")].forEach(function(b){
  b&&b.addEventListener("click",function(){$("settings-overlay").classList.add("hidden");});
});
$("settings-overlay").addEventListener("click",function(e){
  if(e.target===$("settings-overlay"))$("settings-overlay").classList.add("hidden");
});
$("temp-pick-btn").addEventListener("click",pickTempFolder);
$("ob-temp-pick").addEventListener("click",pickTempFolder);
$("temp-clear-btn").addEventListener("click",function(){
  saveTmpPath("");
  setStatus(t("temp_default"),"ok");
});

// Language
function switchLang(l){
  LANG=l;
  $("lang-en").classList.toggle("active",l==="en");
  $("lang-id").classList.toggle("active",l==="id");
  $("ob-lang-en").classList.toggle("active",l==="en");
  $("ob-lang-id").classList.toggle("active",l==="id");
  saveLang();
  applyI18n();
  renderTmpPath();
  if(!S.detectDone) setStatus(t("status_idle"),"");
}
$("lang-en").addEventListener("click",function(){switchLang("en");});
$("lang-id").addEventListener("click",function(){switchLang("id");});
$("ob-lang-en").addEventListener("click",function(){switchLang("en");});
$("ob-lang-id").addEventListener("click",function(){switchLang("id");});

// Diag
$("diag-btn").addEventListener("click",function(){
  setStatus("Running diagnostics…","");
  callHost("getDiagnostics",[S.customTmpPath],function(res){
    if(!res.ok){setStatus("Diag error: "+(res.msg||""),"err");return;}
    S.diagInfo=res.info||{};
    var info=S.diagInfo;
    var tpls=info.templates||[];
    setStatus("AE "+info.aeVersion,"ok");
    alert(
      "SED Panel — AE Diagnostics\n\n"+
      "AE Version:    "+info.aeVersion+"\n"+
      "Temp folder:   "+info.tempFolder+"\n"+
      "Comp:          "+(info.compName||"?")+"\n\n"+
      "Output Templates:\n"+(tpls.length?tpls.map(function(t,i){return "  "+(i+1)+". "+t;}).join("\n"):"  (none)")
    );
  });
});



// ═══ Sensitivity (removed from UI — use AE default) ════
// Detection uses Medium (50) fixed

// ═══ Layer refresh ══════════════════════════════════════
$("rf-btn").addEventListener("click",function(){
  evalScript("getLayerName()",function(r){
    r=(r||"").replace(/^"|"$/g,""); $("layer-name").textContent=r||"—";
  });
});

// ═══ Detect / Read ══════════════════════════════════════
$("detect-btn").addEventListener("click",function(){
  setStatus(t("detecting"),"");
  $("detect-btn").classList.add("detecting");
  // Show loading state on status dot
  $("status-dot").classList.add("loading");
  callHost("runDetect",["Medium"],function(res){
    $("detect-btn").classList.remove("detecting");
    $("status-dot").classList.remove("loading");
    if(!res.ok){setStatus(res.msg||"Failed.","warn");return;}
    _applyScenes(res);
    setStatus("✓ "+S.scenes.length+" scenes — "+(res.layerName||"—"),"ok");
    if(S.scenes.length>0) _startThumbAuto();
  });
});
$("read-btn").addEventListener("click",function(){
  setStatus(t("reading"),"");
  $("status-dot").classList.add("loading");
  callHost("readMarkers",[],function(res){
    $("status-dot").classList.remove("loading");
    if(!res.ok){setStatus(res.msg||"No markers.","warn");return;}
    _applyScenes(res);
    setStatus("✓ "+S.scenes.length+" scenes from markers","ok");
    if(S.scenes.length>0) _startThumbAuto();
  });
});
function _applyScenes(res){
  S.scenes=res.scenes; S.detectDone=true;
  S.selected=[]; S.activeIdx=-1; S.fps=res.fps||24;
  S.thumbs={}; S.thumbPaths={}; S.thumbDone=0;
  $("layer-name").textContent=res.layerName||"—";
  setThumbCount(0); setThumbProgress(null);
  refreshAll();
}

// ═══ Select / Clear ═════════════════════════════════════
$("sel-all-btn").addEventListener("click",function(){
  S.selected=S.scenes.map(function(_,i){return i;});
  refreshList();refreshGrid();refreshStats();refreshInfoBar();
});
$("sel-none-btn").addEventListener("click",function(){
  S.selected=[];
  refreshList();refreshGrid();refreshStats();refreshInfoBar();
});
$("clr-btn").addEventListener("click",function(){
  if(!confirm(t("confirm_clear")))return;
  callHost("clearLayerMarkers",[],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    S.scenes=[];S.selected=[];S.detectDone=false;S.activeIdx=-1;
    S.thumbs={};S.thumbPaths={};S.thumbDone=0;
    setThumbCount(0);setThumbProgress(null);
    refreshAll();setStatus(t("marker_clear"),"warn");
  });
});

// ═══ Actions ════════════════════════════════════════════
$("split-all-btn").addEventListener("click",function(){
  if(!S.detectDone||S.scenes.length<2){setStatus(t("no_detect"),"warn");return;}
  var cuts=S.scenes.slice(1).map(function(sc){return sc.start_sec;});
  setStatus(t("cutting"),"");
  callHost("splitAtCuts",[JSON.stringify(cuts)],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    setStatus(t("split_ok",{n:res.count}),"ok");
  });
});
$("split-sel-btn").addEventListener("click",function(){
  if(!S.detectDone||S.scenes.length<2){setStatus(t("no_detect"),"warn");return;}
  if(!S.selected.length){setStatus(t("no_mark"),"warn");return;}
  var map={};
  S.selected.forEach(function(i){if(i>0)map[S.scenes[i].start_sec]=true;});
  var cuts=Object.keys(map).map(parseFloat);
  if(!cuts.length){setStatus(t("no_cut"),"warn");return;}
  setStatus(t("cutting"),"");
  callHost("splitAtCuts",[JSON.stringify(cuts)],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    setStatus(t("split_ok",{n:res.count}),"ok");
  });
});
$("keep-sel-btn").addEventListener("click",function(){
  if(!S.detectDone||S.scenes.length<2){setStatus(t("no_detect"),"warn");return;}
  if(!S.selected.length){setStatus(t("no_mark"),"warn");return;}
  // Sort selected by scene order (start_sec) regardless of click order
  var sortedSel=S.selected.slice().sort(function(a,b){return a-b;});
  var kept=sortedSel.map(function(i){return S.scenes[i];});
  var del=S.scenes.length-kept.length;
  if(!confirm(t("confirm_keep",{kept:kept.length,del:del})))return;
  setStatus(t("processing"),"");
  callHost("keepOnlyScenes",[JSON.stringify(kept),JSON.stringify(S.scenes)],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    setStatus(t("keep_ok",{kept:res.kept,del:res.deleted}),"ok");

    // Remap thumbnails: kept[i] was originally at oldIdx in S.scenes
    // Map old scene index → new index so thumbnails survive the operation
    var newThumbs={}, newPaths={}, newDone=0;
    kept.forEach(function(sc, newIdx){
      var oldIdx=S.scenes.indexOf(sc);
      if(oldIdx<0){
        // Fallback: match by start_sec in case reference differs
        for(var j=0;j<S.scenes.length;j++){
          if(S.scenes[j].start_sec===sc.start_sec){ oldIdx=j; break; }
        }
      }
      if(oldIdx>=0 && S.thumbs[oldIdx]){
        newThumbs[newIdx]=S.thumbs[oldIdx];
        if(S.thumbPaths[oldIdx]) newPaths[newIdx]=S.thumbPaths[oldIdx];
        newDone++;
      }
    });

    S.scenes=kept.map(function(sc,i){return Object.assign({},sc,{index:i+1});});
    S.selected=S.scenes.map(function(_,i){return i;});
    S.activeIdx=-1;
    S.thumbs=newThumbs; S.thumbPaths=newPaths; S.thumbDone=newDone;
    setThumbCount(newDone); refreshAll();
  });
});
$("comp-mrkr-btn").addEventListener("click",function(){
  if(!S.detectDone){setStatus(t("no_detect"),"warn");return;}
  callHost("addCompMarkers",[JSON.stringify(S.scenes)],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    setStatus(t("markers_added",{n:res.count}),"ok");
  });
});
$("export-btn").addEventListener("click",function(){
  if(!S.detectDone){setStatus(t("no_detect"),"warn");return;}
  if(!S.selected.length){setStatus(t("no_mark"),"warn");return;}
  var sel=S.selected.map(function(i){return S.scenes[i];});
  setStatus(t("exporting"),"");
  callHost("exportToRenderQueue",[JSON.stringify(sel)],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    setStatus(t("export_ok",{n:res.count}),"ok");
    alert(t("export_alert",{n:res.count}));
  });
});
$("thumb-btn").addEventListener("click",function(){
  if(!S.detectDone||!S.scenes.length){setStatus(t("no_detect"),"warn");return;}
  startThumbGen();
});
$("clean-btn").addEventListener("click",function(){
  if(!confirm(t("confirm_clean")))return;
  callHost("cleanTempFolder",[S.customTmpPath],function(res){
    setStatus(t("clean_ok",{n:res.deleted||0}),"ok");
    S.thumbs={}; S.thumbPaths={}; S.thumbDone=0; setThumbCount(0); refreshGrid();
  });
});

// ═══ Transport ══════════════════════════════════════════
$("nav-first").addEventListener("click",function(){selectScene(0);});
$("nav-prev").addEventListener("click",function(){if(S.activeIdx>0)selectScene(S.activeIdx-1);});
$("nav-next").addEventListener("click",function(){if(S.activeIdx<S.scenes.length-1)selectScene(S.activeIdx+1);});
$("nav-last").addEventListener("click",function(){if(S.scenes.length)selectScene(S.scenes.length-1);});
$("go-btn").addEventListener("click",function(){
  if(S.activeIdx<0)return;
  if(seekTimer){clearTimeout(seekTimer);seekTimer=null;}
  callHost("goToFrame",[S.scenes[S.activeIdx].start_sec],function(){
    setStatus("→ "+S.scenes[S.activeIdx].start_tc,"ok");
  });
});
$("ram-btn").addEventListener("click",function(){
  if(S.activeIdx<0)return;
  var sc=S.scenes[S.activeIdx];
  callHost("goToScene",[sc.start_sec,sc.dur_sec],function(){
    callHost("ramPreview",[],function(){});
  });
});
$("mark-btn").addEventListener("click",function(){toggleMark(S.activeIdx);});
document.querySelectorAll(".col-btn").forEach(function(btn){
  btn.addEventListener("click",function(){
    document.querySelectorAll(".col-btn").forEach(function(b){b.classList.remove("active");});
    btn.classList.add("active"); S.cols=parseInt(btn.dataset.n);
    $("grid").style.gridTemplateColumns="repeat("+S.cols+",1fr)";
    refreshGrid();
  });
});

// ═══ Core UI ════════════════════════════════════════════
function selectScene(idx){
  if(idx<0||idx>=S.scenes.length)return;
  var prev=S.activeIdx;
  S.activeIdx=idx;
  var sc=S.scenes[idx];
  scheduleGoToFrame(sc.start_sec);
  updateActiveSceneUI(prev,idx);
  refreshInfoBar();
  setStatus("→ #"+pad3(sc.index)+"  "+sc.start_tc+" – "+sc.end_tc+"  ("+sc.dur_str+")","ok");
}
function toggleMark(idx){
  if(idx===undefined||idx<0)return;
  var pos=S.selected.indexOf(idx);
  if(pos>=0)S.selected.splice(pos,1); else S.selected.push(idx);
  updateMarkUI(idx);
  refreshStats();refreshInfoBar();
}
function getListRow(idx){
  return document.querySelector("#scene-tbody tr[data-idx='"+idx+"']");
}
function getGridCard(idx){
  return document.querySelector(".scene-card[data-idx='"+idx+"']");
}
function updateActiveSceneUI(prev,next){
  [prev,next].forEach(function(i){
    if(i===undefined||i<0) return;
    var active=(i===next);
    var row=getListRow(i);
    if(row) row.classList.toggle("active",active);
    var card=getGridCard(i);
    if(card) card.classList.toggle("active",active);
  });
  var nextRow=getListRow(next);
  if(nextRow) nextRow.scrollIntoView({block:"nearest"});
}
function updateMarkUI(idx){
  var marked=S.selected.indexOf(idx)>=0;
  var row=getListRow(idx);
  if(row){
    row.classList.toggle("marked",marked);
    var cell=row.querySelector(".mark-cell");
    if(cell) cell.textContent=marked?"✔":"";
  }
  var card=getGridCard(idx);
  if(card){
    card.classList.toggle("marked",marked);
    var thumb=card.querySelector(".card-thumb");
    var badge=card.querySelector(".card-thumb-mark");
    if(marked&&!badge&&thumb){
      badge=document.createElement("span");
      badge.className="card-thumb-mark";
      badge.textContent="✔";
      thumb.appendChild(badge);
    } else if(!marked&&badge){
      badge.parentNode.removeChild(badge);
    }
  }
}
function refreshStats(){
  $("count-lbl").textContent=S.scenes.length||"0";
  $("sel-count-lbl").textContent=S.selected.length||"0";
}
function refreshInfoBar(){
  var idx=S.activeIdx;
  if(idx<0||idx>=S.scenes.length||!S.detectDone){
    $("info-scene").textContent="—";$("info-in").textContent="—";
    $("info-out").textContent="—";$("info-dur").textContent="—";
    $("slide-counter").textContent="— / —";
    var mb=$("mark-btn");mb.textContent=t("mark");mb.className="mark-toggle";return;
  }
  var sc=S.scenes[idx];
  $("info-scene").textContent="#"+pad3(sc.index);
  $("info-in").textContent=sc.start_tc; $("info-out").textContent=sc.end_tc;
  $("info-dur").textContent=sc.dur_tc;
  $("slide-counter").textContent=(idx+1)+" / "+S.scenes.length;
  var mk=S.selected.indexOf(idx)>=0;
  var mb=$("mark-btn");
  mb.textContent=mk?t("marked_btn"):t("mark");
  mb.className=mk?"mark-toggle marked":"mark-toggle";
}
function refreshAll(){refreshList();refreshGrid();refreshStats();refreshInfoBar();}

function refreshList(){
  var tb=$("scene-tbody");tb.innerHTML="";
  if(!S.detectDone||!S.scenes.length){
    tb.innerHTML='<tr><td colspan="4" class="list-empty">'+t("no_scenes")+'</td></tr>';return;
  }
  S.scenes.forEach(function(sc,i){
    var tr=document.createElement("tr");
    tr.dataset.idx=i;
    if(S.activeIdx===i)tr.classList.add("active");
    if(S.selected.indexOf(i)>=0)tr.classList.add("marked");
    tr.innerHTML="<td>"+pad3(sc.index)+"</td>"+
      "<td class='tc-cell'>"+sc.start_tc+"</td>"+
      "<td class='tc-cell'>"+sc.dur_str+"</td>"+
      "<td class='mark-cell'>"+(S.selected.indexOf(i)>=0?"✔":"")+"</td>";
    tr.addEventListener("click",function(e){if(e.ctrlKey||e.metaKey)toggleMark(i);else selectScene(i);});
    tr.addEventListener("dblclick",function(){toggleMark(i);});
    tb.appendChild(tr);
  });
  if(S.activeIdx>=0){
    var rows=tb.querySelectorAll("tr");
    if(rows[S.activeIdx])rows[S.activeIdx].scrollIntoView({block:"nearest"});
  }
}

function refreshGrid(){
  var grid=$("grid");grid.innerHTML="";
  grid.style.gridTemplateColumns="repeat("+S.cols+",1fr)";
  if(!S.detectDone||!S.scenes.length){
    var e=document.createElement("div");e.className="grid-empty";
    e.textContent=t("no_scenes");grid.appendChild(e);return;
  }
  S.scenes.forEach(function(sc,i){
    var card=document.createElement("div");
    card.className="scene-card"; card.dataset.idx=i;
    if(S.activeIdx===i)card.classList.add("active");
    if(S.selected.indexOf(i)>=0)card.classList.add("marked");
    var mk=S.selected.indexOf(i)>=0;
    var uri=S.thumbs[i]||null;
    var imgHTML=uri
      ?"<div class='card-img-wrap'><img src='"+uri+"' alt=''/></div>"
      :"<div class='card-img-wrap card-img-ph'></div><span class='card-thumb-num'>"+pad3(sc.index)+"</span>";
    card.innerHTML=
      "<div class='card-thumb'>"+imgHTML+
        "<span class='card-thumb-tc'>"+sc.start_tc+"</span>"+
        (mk?"<span class='card-thumb-mark'>✔</span>":"")+
        "<div class='card-play-track'><div class='card-play-bar'></div></div>"+
      "</div>"+
      "<div class='card-meta'>"+
        "<span class='card-num'>#"+pad3(sc.index)+"</span>"+
        "<span class='card-dur'>"+sc.dur_str+"</span>"+
      "</div>";
    if(uri&&S.thumbPaths[i]){
      (function(img,path){
        if(!img) return;
        img.onerror=function(){
          if(img.dataset.fallback==="1") return;
          img.dataset.fallback="1";
          var data=readThumbDataURI(path);
          if(data&&data!==img.src) img.src=data;
        };
      })(card.querySelector("img"),S.thumbPaths[i]);
    }
    card.addEventListener("click",function(e){if(e.ctrlKey||e.metaKey)toggleMark(i);else selectScene(i);});
    card.addEventListener("dblclick",function(){toggleMark(i);});
    grid.appendChild(card);
  });
}

// ═══ Init ════════════════════════════════════════════════
(function init(){
  loadPrefs();
  applyI18n();
  switchLang(LANG==="id"?"id":"en");
  renderTmpPath();
  var loc=window.location.href;
  var dir=loc.substring(0,loc.lastIndexOf("/"));
  var fsDir=dir.replace("file:///","").replace(/\//g,"\\");
  try{fsDir=decodeURIComponent(fsDir);}catch(e){}
  var jsxPath=fsDir+"\\jsx\\host.jsx";
  var ls='var _j=new File("'+jsxPath.replace(/\\/g,"\\\\")+'");'+
         'if(_j.exists){$.evalFile(_j);"ok:"+_j.fsName;}else{"nf:"+_j.fsName;}';
  cs.evalScript(ls,function(res){
    if(res&&res.indexOf("ok:")===0){_ready();return;}
    var fwd=dir.replace("file:///","")+"/jsx/host.jsx";
    try{fwd=decodeURIComponent(fwd);}catch(e){}
    var ls2='var _j2=new File("'+fwd.replace(/\\/g,"\\\\")+'");'+
            'if(_j2.exists){$.evalFile(_j2);"ok2";}else{"nf2:"+_j2.fsName;}';
    cs.evalScript(ls2,function(r2){
      if(r2&&r2.indexOf("ok")===0){_ready();}
      else{setStatus("ERROR: "+(r2||res),"err");}
    });
  });
  refreshAll();
})();

// ── AE Version check: called once on startup ──────────────
var S_aeVer={num:0,name:'',sedSupport:false,checked:false};
function checkAEVersion(){
  // Wrap in try/catch — if host.jsx not loaded yet, fail silently
  // Default: assume sedSupport=true so detect btn shows (safe fallback)
  try{
    callHost('getAEVersion',[],function(res){
      try{
        if(!res||!res.ok){ S_aeVer.checked=true; applyAECompat(); return; }
        S_aeVer.num=res.num||0;
        S_aeVer.name=res.name||'';
        S_aeVer.sedSupport=!!res.sedSupport;
        S_aeVer.checked=true;
        applyAECompat();
      }catch(e2){ S_aeVer.checked=true; applyAECompat(); }
    });
  }catch(e){ S_aeVer.checked=true; applyAECompat(); }
}
function applyAECompat(){
  var btn=$('detect-btn');
  var notice=$('ae-compat-notice');
  var verEl=$('ae-compat-ver');
  if(!btn||!notice) return;
  // Default: tampilkan tombol jika belum dicek atau sedSupport true
  if(!S_aeVer.checked||S_aeVer.sedSupport){
    btn.style.display='';
    notice.style.display='none';
  } else {
    // AE lama: sembunyikan tombol, tampilkan notice
    btn.style.display='none';
    notice.style.display='';
    if(verEl) verEl.textContent='Versi terdeteksi: After Effects '+(S_aeVer.name||S_aeVer.num);
    // Terapkan teks i18n ke notice
    applyI18n();
  }
}

function _ready(){
  evalScript("getLayerName()",function(r){
    r=(r||"").replace(/^"|"$/g,""); if(r)$("layer-name").textContent=r;
  });
  // Cek versi AE saat pertama load
  checkAEVersion();
  setStatus(t("status_idle"),"ok");
}

})();
