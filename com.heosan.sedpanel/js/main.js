/* SED Panel v3.2 - main.js - (c) 2026 Heosan */
/* global CSInterface */
(function(){
"use strict";

// Global error handler — catches ALL uncaught JS exceptions and logs them
window.onerror = function(msg, url, line, col, err){
  try{
    var _el = document.getElementById("status-text");
    if(_el && _el.textContent.indexOf("ERROR") < 0)
      _el.textContent = "⚠ JS Error";
  }catch(e){}
  try{
    var _cs = new CSInterface();
    _cs.evalScript('_writeLog("thumb","[GLOBAL ERROR] msg="+msg+" url="+url+" line="+line)');
  }catch(e){}
};

var cs = new CSInterface();
var ONBOARD_KEY = "sed_panel_v5_onboarded";
var LANG_KEY = "sed_panel_lang";
var TMP_KEY = "sed_panel_custom_tmp";
var THUMB_MODE_KEY = "sed_panel_thumb_mode";
var UPDATE_NOTIF_KEY = "sed_panel_update_notif";
var UPDATE_LATER_KEY = "sed_panel_update_later_at";
var CUR_VER = "3.2.0";
var GH_REPO = "heosan02/sed-panel";

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
    export_rq:"Export → Render Queue",
    scene:"SCENE", dur:"DUR", mark:"○ Mark", marked_btn:"✔ Marked",
    go_frame:"Go to Frame", gen_thumbs:"🖼 Thumbs", clean_tmp:"🗑 Tmp",
    grid_hint:"Ctrl+click=mark · Dbl=mark", col:"Col",
    about_desc:"Scene Edit Detection Panel for Adobe After Effects.",
    language:"Language:", close:"Close",
    update_notif:"Update Notification",
    update_notif_desc:"Check for new SED Panel releases on GitHub.",
    update_on:"On", update_off:"Off", update_uptodate:"Up to date",
    update_title:"Update Available",
    update_msg:"A new version of SED Panel is available!",
    update_later:"Later",
    update_view:"View Release",
    update_note:"If notification is annoying, turn it off in About.",
    update_check:"Check",
    update_check_fail:"Update check failed.",
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
    confirm_keep:"⚠ WARNING\n\n{kept} scene(s) KEPT.\n{del} scene(s) DELETED.\n\nContinue?",
    confirm_clear:"Delete all layer markers?\nDetection results will be reset.",
    confirm_thumbs:"Generate {n} thumbnails?\n\n≈{min}–{max} sec. Continue?",
    confirm_clean:"Clear temporary thumbnail files?",
    no_detect:"Detect scenes first.", no_mark:"Mark at least 1 scene.",
    no_cut:"No cut points from selected scenes.",
    scene_count:"✓ {n} scenes — {layer}",
    scene_from_markers:"✓ {n} scenes from markers",
    read_cancelled:"Read Markers cancelled.",
    no_markers:"No markers.",
    thumb_gen:"Thumb {i}/{n}…", thumb_done:"✓ {ok}/{n} thumbnails done.",
    split_ok:"✓ {n} cuts done.", keep_ok:"✓ {kept} kept · {del} deleted.",
    export_ok:"✓ {n} scenes → Render Queue.",
    export_alert:"{n} scenes added to Render Queue.\n\nWindow → Render Queue → Set output path → Render All",
    export_prep_ok:"✓ {n} scenes prepared.",
    export_prep_alert:"{n} scenes ready with correct Work Area.\nSet render manually → add to Render Queue.",
    // RQ freeze warning (v10.0)
    rq_warn_title:"Export Many Scenes?",
    rq_warn_msg:"Adding {n} scenes may freeze AE temporarily. Add all to Render Queue or do it manually?",
    rq_warn_go:"Add All", rq_warn_manual:"Manual", export_cancelled:"Export cancelled.",
    marker_clear:"All markers deleted.",
    clean_ok:"✓ Cleared {n} temp file(s).",
    // Thumbnail progress modal (v8.3)
    thumb_modal_title:"Generating Thumbnails",
    thumb_modal_sub:"Please wait, this won't block After Effects.",
    cancel_btn:"Cancel",
    // Thumbnail progress — Phase 1 (Render ETA) + Phase 2 (Load)
    thumb_eta:"≈ {time} remaining",
    thumb_loading:"Loading thumbnails...",
    thumb_fail:"Thumbs failed — check Settings → Temp Folder",
    thumb_failing:"Thumbs failing — check Settings → Temp Folder",
    thumb_start:"Generating thumbnails…",
    thumb_cancelled:"Thumbnail generation cancelled.",
    // Thumbnail mode
    thumb_mode:"Thumbnail Mode",
    thumb_mode_desc:"Choose how thumbnails are generated.",
    thumb_mode_fast:"Fast (Python cv2) — generate all at once with progress popup",
    thumb_mode_lazy:"Lazy (AE) — generate one-by-one, no popup",
    thumb_mode_saved:"Thumbnail mode saved.",
    // Merge Scene (v8.3)
    merge_scenes:"⛓ Merge Scene",
    merge_modal_title:"Merge Scene",
    merge_need_2:"Select at least 2 scenes to merge.",
    merge_need_adjacent:"None of the selected scenes are adjacent.\nMerge requires at least 2 scenes next to each other (e.g. 1+2 or 5+6+7).",
    merge_partial_skip:"Only adjacent scenes were merged.\nNon-adjacent scene(s) were skipped: {skipped}",
    merge_confirm:"Merge {n} scenes (#{from}–#{to}) into 1 scene?\nThis will combine their AE markers into a single marker.",
    merge_confirm_multi:"Merge {groups} group(s) of adjacent scenes ({n} scenes total) into {groups} scene(s)?\nThis will combine each group's AE markers into a single marker.",
    merging:"Merging scenes…",
    merge_ok:"✓ {groups} group(s) merged → {total} scene(s) total.",
    merge_fail:"Merge failed.",
    ob_h_merge:"Merge Scene",
    ob_merge_desc:"<strong>How to use:</strong><br>1. Mark 2+ <strong>adjacent</strong> scenes (Ctrl+Click or Double-click).<br>2. Click <strong>⛓ Merge Scene</strong> — a confirmation dialog will appear.<br>3. Click OK — the scenes are combined into one, AE markers are merged, and the thumbnail from the first scene is preserved.",
    ob_merge_tip:"Only adjacent scenes can merge (e.g. 1+2 or 5+6+7). Non-adjacent picks (e.g. 1+5) are skipped. Multiple separate adjacent groups (1+2 and 5+6) can be merged in one click.",
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
    ob_thumb_desc:"Click <strong>🖼 Thumbs</strong> to generate thumbnails for each scene.<br><strong>Fast mode</strong> (default) uses Python cv2 — generates all at once with a progress popup.<br><strong>Lazy mode</strong> uses AE's saveFrameToPng — thumbnails appear one-by-one without a popup.<br>Switch modes in <strong>Settings → Thumbnail Mode</strong>.",
    ob_thumb_tip:"Thumbnails are rendered to the temp folder, then automatically cleaned after reading. Lazy mode is best for quick previews; Fast mode is best for speed with large scene counts.",
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
    export_rq:"Export → Render Queue",
    scene:"SCENE", dur:"DUR", mark:"○ Mark", marked_btn:"✔ Ditandai",
    go_frame:"Go to Frame", gen_thumbs:"🖼 Thumbs", clean_tmp:"🗑 Tmp",
    grid_hint:"Ctrl+klik=tandai · Dbl=tandai", col:"Kol",
    about_desc:"Scene Edit Detection Panel untuk Adobe After Effects.",
    language:"Bahasa:", close:"Tutup",
    update_notif:"Notifikasi Update",
    update_notif_desc:"Cek rilis baru SED Panel di GitHub.",
    update_on:"Nyala", update_off:"Mati", update_uptodate:"Terbaru",
    update_title:"Update Tersedia",
    update_msg:"Versi baru SED Panel tersedia!",
    update_later:"Nanti",
    update_view:"Lihat Rilis",
    update_note:"Jika notif mengganggu bisa dimatikan di about.",
    update_check:"Cek",
    update_check_fail:"Pengecekan update gagal.",
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
    confirm_keep:"⚠ PERINGATAN\n\n{kept} scene DIPERTAHANKAN.\n{del} scene DIHAPUS.\n\nLanjutkan?",
    confirm_clear:"Hapus semua layer marker?\nHasil deteksi akan direset.",
    confirm_thumbs:"Generate {n} thumbnail?\n\n≈{min}–{max} detik. Lanjutkan?",
    confirm_clean:"Hapus file thumbnail sementara?",
    no_detect:"Deteksi scene dulu.", no_mark:"Tandai minimal 1 scene.",
    no_cut:"Tidak ada cut point dari scene terpilih.",
    scene_count:"✓ {n} scene — {layer}",
    scene_from_markers:"✓ {n} scene dari marker",
    read_cancelled:"Baca Marker dibatalkan.",
    no_markers:"Tidak ada marker.",
    thumb_gen:"Thumb {i}/{n}…", thumb_done:"✓ {ok}/{n} thumbnail selesai.",
    split_ok:"✓ {n} potongan berhasil.", keep_ok:"✓ {kept} dipertahankan · {del} dihapus.",
    export_ok:"✓ {n} scene → Render Queue.",
    export_alert:"{n} scene → Render Queue.\n\nWindow → Render Queue → Atur output → Render All",
    export_prep_ok:"✓ {n} scene siap.",
    export_prep_alert:"{n} scene siap dengan Work Area benar.\nAtur render manual → tambah ke Render Queue.",
    // RQ freeze warning (v10.0)
    rq_warn_title:"Export Banyak Scene?",
    rq_warn_msg:"Menambahkan {n} scene berpotensi freeze AE sebentar. Langsung masukin ke Render Queue atau manual?",
    rq_warn_go:"Langsung", rq_warn_manual:"Manual", export_cancelled:"Export dibatalkan.",
    marker_clear:"Semua marker dihapus.",
    clean_ok:"✓ {n} file temp dihapus.",
    // Thumbnail progress modal (v8.3)
    thumb_modal_title:"Membuat Thumbnail",
    thumb_modal_sub:"Mohon tunggu, After Effects tidak akan freeze.",
    cancel_btn:"Batal",
    // Thumbnail progress — Phase 1 (Render ETA) + Phase 2 (Load)
    thumb_eta:"≈ {time} tersisa",
    thumb_loading:"Memuat thumbnail...",
    thumb_fail:"Thumbnail gagal — cek Settings → Temp Folder",
    thumb_failing:"Thumbnail sering gagal — cek Settings → Temp Folder",
    thumb_start:"Membuat thumbnail…",
    thumb_cancelled:"Pembuatan thumbnail dibatalkan.",
    // Thumbnail mode
    thumb_mode:"Mode Thumbnail",
    thumb_mode_desc:"Pilih cara generate thumbnail.",
    thumb_mode_fast:"Fast (Python cv2) — generate semua sekaligus dengan popup progres",
    thumb_mode_lazy:"Lazy (AE) — generate satu per satu, tanpa popup",
    thumb_mode_saved:"Mode thumbnail disimpan.",
    // Merge Scene (v8.3)
    merge_scenes:"⛓ Gabungkan Scene",
    merge_modal_title:"Gabungkan Scene",
    merge_need_2:"Pilih minimal 2 scene untuk digabungkan.",
    merge_need_adjacent:"Tidak ada scene terpilih yang berdekatan.\nMerge membutuhkan minimal 2 scene yang bersebelahan (contoh: 1+2 atau 5+6+7).",
    merge_partial_skip:"Hanya scene yang berdekatan yang digabungkan.\nScene yang tidak berdekatan dilewati: {skipped}",
    merge_confirm:"Gabungkan {n} scene (#{from}–#{to}) menjadi 1 scene?\nMarker AE dari scene-scene ini akan digabung jadi 1 marker.",
    merge_confirm_multi:"Gabungkan {groups} grup scene yang berdekatan ({n} scene total) menjadi {groups} scene?\nMarker AE dari tiap grup akan digabung jadi 1 marker per grup.",
    merging:"Menggabungkan scene…",
    merge_ok:"✓ {groups} grup digabung → total {total} scene.",
    merge_fail:"Gabungkan scene gagal.",
    ob_h_merge:"Gabungkan Scene",
    ob_merge_desc:"<strong>Cara pakai:</strong><br>1. Tandai 2+ scene yang <strong>berdekatan</strong> (Ctrl+Klik atau Dobel-klik).<br>2. Klik <strong>⛓ Gabungkan Scene</strong> — akan muncul dialog konfirmasi.<br>3. Klik OK — scene akan digabung jadi satu, marker AE akan digabung, dan thumbnail dari scene pertama akan dipakai.",
    ob_merge_tip:"Hanya scene berdekatan yang bisa digabung (contoh: 1+2 atau 5+6+7). Scene tidak berdekatan (contoh: 1+5) otomatis dilewati. Beberapa grup berdekatan terpisah (1+2 dan 5+6) bisa digabung dalam satu klik.",
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
    ob_thumb_desc:"Klik <strong>🖼 Thumbs</strong> untuk generate thumbnail dari setiap scene.<br><strong>Mode Fast</strong> (default) pakai Python cv2 — generate semua sekaligus dengan popup progres.<br><strong>Mode Lazy</strong> pakai AE saveFrameToPng — thumbnail muncul satu per satu tanpa popup.<br>Ganti mode di <strong>Settings → Mode Thumbnail</strong>.",
    ob_thumb_tip:"Thumbnail dirender ke folder temp, lalu dibersihkan otomatis. Mode Lazy cocok untuk preview cepat; Mode Fast paling cepat untuk jumlah scene besar.",
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
  thumbs:{}, thumbPaths:{}, thumbDone:0, thumbLoading:false,
  diagInfo:null,
  customTmpPath:"",
  thumbMode:"fast",
  lastActiveIdx:-1
};

// ═══ DOM helpers ════════════════════════════════════════
var $=function(id){return document.getElementById(id);};
// Safe addEventListener: skip jika elemen null (prevents crash chain)
function _on(id,ev,fn){ var el=$(id); if(el) el.addEventListener(ev,fn); }
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

// ── JS-side log (written via JSX _writeLog) ──────────────
function _jsLog(category, msg){
  try{
    var escaped = msg.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    evalScript('_writeLog("'+category+'","'+escaped+'")', function(){});
  }catch(e){}
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

// setThumbProgress(done, total) — updates BOTH the small header label
// AND the popup modal progress bar/count, so the two stay perfectly in sync.
// Calling with no args (or done=null) hides both indicators.
function setThumbProgress(done, total){
  var el = $("thumb-progress");
  if(done===null || done===undefined){
    if(el) el.classList.add("hidden");
    _hideThumbProgressModal();
    _thumbStartTime = 0;
    return;
  }
  total = (total===undefined || total===null) ? S.scenes.length : total;
  var txt = done + "/" + total;
  if(el){ el.textContent = txt; el.classList.remove("hidden"); }
  _updateThumbProgressModal(done, total);
}

// ── Thumbnail Progress Modal — popup overlay (v8.3) ──────
// Always shown while thumbnail generation runs. Purely a UI/visual
// concern — the underlying pipeline already runs async (fire-and-forget
// JSX launch + JS-side polling), so showing this modal never blocks AE.
function _showThumbProgressModal(total){
  var ov = $("thumb-progress-overlay");
  if(!ov) return;
  var fill = $("thumb-progress-bar-fill");
  var cnt  = $("thumb-progress-count");
  if(fill) fill.style.width = "0%";
  if(cnt)  cnt.textContent = "";
  ov.classList.remove("hidden");
}
function _updateThumbProgressModal(done, total){
  var ov = $("thumb-progress-overlay");
  if(!ov || ov.classList.contains("hidden")) return;
  var fill = $("thumb-progress-bar-fill");
  var cnt  = $("thumb-progress-count");
  var pct  = total>0 ? Math.min(100, Math.round((done/total)*100)) : 0;
  if(fill) fill.style.width = pct + "%";
  if(cnt)  cnt.textContent = done + " / " + total;
}
function _hideThumbProgressModal(){
  var ov = $("thumb-progress-overlay");
  if(ov) ov.classList.add("hidden");
}
function loadPrefs(){
  try{LANG=localStorage.getItem(LANG_KEY)||LANG;}catch(e){}
  try{S.customTmpPath=localStorage.getItem(TMP_KEY)||"";}catch(e){}
  try{var tm=localStorage.getItem(THUMB_MODE_KEY);if(tm==="fast"||tm==="lazy")S.thumbMode=tm;}catch(e){}
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
function saveThumbMode(mode){
  if(mode!=="fast"&&mode!=="lazy") return;
  S.thumbMode=mode;
  try{localStorage.setItem(THUMB_MODE_KEY,mode);}catch(e){}
  renderThumbMode();
}
function renderThumbMode(){
  ["thumb-mode-fast","thumb-mode-lazy"].forEach(function(id){
    var el=$(id); if(!el) return;
    el.checked=(id==="thumb-mode-"+S.thumbMode);
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
var OB_TOTAL=10, obCurrent=0;

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
  var steps=document.querySelectorAll(".ob-step");
  slides.forEach(function(s,i){
    s.classList.remove("active","exit-left");
    if(i<n) s.classList.add("exit-left");
    if(i===n) s.classList.add("active");
  });
  steps.forEach(function(st,i){
    st.classList.remove("active","complete");
    if(i<n) st.classList.add("complete");
    if(i===n) st.classList.add("active");
  });
  obCurrent=n;
  $("ob-prev").disabled=(n===0);
  $("ob-prev").setAttribute("data-i18n", "ob_back");
  var nextBtn=$("ob-next");
  if(n===OB_TOTAL-1){
    nextBtn.setAttribute("data-i18n","ob_start");
  } else {
    nextBtn.setAttribute("data-i18n","ob_next");
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
document.querySelectorAll(".ob-step").forEach(function(st){
  st.addEventListener("click",function(){
    var si=parseInt(st.getAttribute("data-step"))-1;
    if(si<=obCurrent+1) obGoTo(si);
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

// ═══ Click Spark ═══════════════════════════════════
var _sparks = [];
var _sparkCanvas = document.getElementById("click-spark-canvas");
if(_sparkCanvas){
  var _sparkCtx = _sparkCanvas.getContext("2d");
  function _resizeSparkCanvas(){
    _sparkCanvas.width = window.innerWidth;
    _sparkCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", _resizeSparkCanvas);
  _resizeSparkCanvas();
  document.addEventListener("click", function(e){
    var x = e.clientX, y = e.clientY;
    for(var i = 0; i < 8; i++){
      _sparks.push({
        x: x, y: y,
        angle: (2 * Math.PI * i) / 8,
        start: performance.now()
      });
    }
  });
  (function _drawSparks(ts){
    _sparkCtx.clearRect(0, 0, _sparkCanvas.width, _sparkCanvas.height);
    _sparks = _sparks.filter(function(s){
      var t = (ts - s.start) / 400;
      if(t >= 1) return false;
      var e = t * (2 - t);
      var d = e * 15;
      var l = 10 * (1 - e);
      var x1 = s.x + d * Math.cos(s.angle);
      var y1 = s.y + d * Math.sin(s.angle);
      var x2 = s.x + (d + l) * Math.cos(s.angle);
      var y2 = s.y + (d + l) * Math.sin(s.angle);
      _sparkCtx.strokeStyle = "rgba(255,255,255,.7)";
      _sparkCtx.lineWidth = 1.5;
      _sparkCtx.beginPath();
      _sparkCtx.moveTo(x1, y1);
      _sparkCtx.lineTo(x2, y2);
      _sparkCtx.stroke();
      return true;
    });
    requestAnimationFrame(_drawSparks);
  })(performance.now());
}

// ═══ Thumbnails ═════════════════════════════════════════

// ── Python & source state (resolved once per session) ────
var _state = {
  pyChecked:  false,
  pyAvail:    false,
  pyPath:     "",
  srcInfoDone:    false,
  sourcePath:     "",
  layerStartSec:  0,
  sourceStartSec: 0,
  fps:            24,
  tmpPath:        "",
  // v9.0: per-layer source map for multi-layer support
  // {layerIndex: {sourcePath, layerStartSec, sourceStartSec}}
  layerSources: null
};

// ── Resolve source file info once per thumb session ──────
function _resolveSourceInfo(cb){
  if(_state.srcInfoDone){ cb(true); return; }
  // v9.0: Get source info for the primary (active) layer AND all layers
  callHost("getSourceFileInfo",[],function(primaryRes){
    if(!primaryRes || !primaryRes.ok){
      cb(false); return;
    }
    _state.sourcePath    = primaryRes.sourcePath || "";
    _state.layerStartSec = primaryRes.layerStartSec || 0;
    _state.sourceStartSec= primaryRes.sourceStartSec || 0;
    _state.fps           = primaryRes.fps || S.fps || 24;

    // Get source info for ALL footage layers (for multi-layer support)
    callHost("getAllSourceFilesInfo",[],function(allRes){
      if(allRes && allRes.ok && allRes.layers && allRes.layers.length > 0){
        _state.layerSources = {};
        for(var li = 0; li < allRes.layers.length; li++){
          var l = allRes.layers[li];
          _state.layerSources[l.layerIndex] = {
            sourcePath:     l.sourcePath,
            layerStartSec:  l.layerStartSec,
            sourceStartSec: l.sourceStartSec
          };
        }
      } else {
        // Fallback: use primary source for all scenes
        _state.layerSources = {1: {
          sourcePath:     _state.sourcePath,
          layerStartSec:  _state.layerStartSec,
          sourceStartSec: _state.sourceStartSec
        }};
      }
      _state.srcInfoDone = true;
      cb(true);
    });
  });
}

// ── Get source info for a specific scene (respects layerIndex) ──
function _getSourceForScene(sc){
  var layerIdx = sc.layerIndex || 1;
  if(_state.layerSources && _state.layerSources[layerIdx]){
    return _state.layerSources[layerIdx];
  }
  // Fallback to primary or first available source
  if(_state.layerSources){
    var keys = Object.keys(_state.layerSources);
    if(keys.length > 0) return _state.layerSources[keys[0]];
  }
  return {
    sourcePath:     _state.sourcePath || "",
    layerStartSec:  _state.layerStartSec || 0,
    sourceStartSec: _state.sourceStartSec || 0
  };
}

// ── Resolve temp folder path via JSX ─────────────────────
function _resolveTmpPath(cb){
  if(_state.tmpPath){ cb(_state.tmpPath); return; }
  callHost("getTempFolderPath",[S.customTmpPath],function(res){
    _state.tmpPath = (res && res.path) ? res.path : "";
    cb(_state.tmpPath);
  });
}

// ── Resolve Python executable (checked once) ─────────────
function _resolvePython(cb){
  if(_state.pyChecked){ cb(_state.pyAvail); return; }
  callHost("findPython",[],function(res){
    _state.pyChecked = true;
    _state.pyAvail   = !!(res && res.path);
    _state.pyPath    = (res && res.path) || "";
    _jsLog("thumb","[PYTHON] avail="+_state.pyAvail+" path="+_state.pyPath);
    cb(_state.pyAvail);
  });
}

// ── Thumbnail pipeline — async polling engine ─────────────
//
// Uses Python cv2.VideoCapture via async file-based bridge.
// Python writes results JSON to disk; JS polls for the flag file.
// This keeps AE fully responsive while Python processes all frames.

var _thumbCancelled = false; // cancel flag for thumb generation
var _readCancelled  = false; // cancel flag for read markers
var _thumbGenFinished = false; // guard against double _finishThumbGen call
var _thumbStartTime = 0; // timestamp when generation started (for ETA)
var _PY_POLL_INTERVAL = 150;
function _fmtDuration(sec){
  sec = Math.max(0, Math.round(sec));
  if(sec < 60) return sec + "s";
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + "m " + s + "s";
}

// ── Python results-file poller (v8.3) ─────────────────────
// Python writes ONE results JSON file, so we poll for a small "done"
// flag file instead of scanning hundreds of paths.
// Once the flag appears, we read+parse the results file exactly once.
// This keeps AE fully responsive while Python processes all frames —
// no evalScript call ever blocks waiting for Python to finish.
var _pyPollTimer   = null;
var _pyPollElapsed = 0;
var _pyPollTimeout = 300000; // 300s (5min) max wait — Python cv2 can take 1-2s per scene for 300+ scenes
function _stopPyPoller(){
  if(_pyPollTimer){ clearInterval(_pyPollTimer); _pyPollTimer=null; }
}
function _startPyResultPoller(donePath, resultsPath, errPath, expectedPaths, onDone, onFail){
  _stopPyPoller();
  _pyPollElapsed = 0;
  var renderRate = 3; // default estimate: 3 scenes/sec
  var totalScenes = S.scenes.length || 1;
  var etaTotalSec = Math.max(1, Math.round(totalScenes / renderRate));
  _jsLog("thumb","[PYPOLL] watching donePath="+donePath+" scenes="+totalScenes+" eta="+etaTotalSec+"s");

  // ═══════════════════════════════════════════════════════════
  // Phase 1 — Render: show ETA countdown while Python writes
  // all JPEGs to the temp folder. No file injection yet.
  // ═══════════════════════════════════════════════════════════
  _pyPollTimer = setInterval(function(){
    _pyPollElapsed += _PY_POLL_INTERVAL;
    if(_thumbCancelled){ _stopPyPoller(); return; }

    // Phase 1: show ETA only (no scenes count)
    var elapsedSec = Math.floor(_pyPollElapsed / 1000);
    var remaining = Math.max(0, etaTotalSec - elapsedSec);
    var subEl = $("thumb-progress-sub");
    if(subEl) subEl.textContent = t("thumb_eta",{time:_fmtDuration(remaining)});
    var fill = $("thumb-progress-bar-fill");
    if(fill){
      var pct = Math.min(100, Math.round((elapsedSec / etaTotalSec) * 100));
      fill.style.width = pct + "%";
    }
    var cnt = $("thumb-progress-count");
    if(cnt) cnt.textContent = "\u2248" + _fmtDuration(remaining);

    // Check for Python done flag
    var flagExists = false;
    try{
      var stat = window.cep.fs.stat(donePath.replace(/\\/g,"/"));
      flagExists = !!(stat && stat.err===0);
    }catch(e){}

    if(flagExists){
      _stopPyPoller();
      _jsLog("thumb","[PYPOLL] done flag found after "+(elapsedSec)+"s → load phase");
      // Flush delay, then enter Phase 2
      setTimeout(function(){
        _startPyLoadPhase(donePath, resultsPath, errPath, onDone, onFail);
      }, 60);
      return;
    }

    if(_pyPollElapsed >= _pyPollTimeout){
      _stopPyPoller();
      onFail("Python timed out after "+(_pyPollTimeout/1000)+"s");
    }
  }, _PY_POLL_INTERVAL);
}

// ═══════════════════════════════════════════════════════════
// Phase 2 — Load: Python finished, all JPEGs on disk.
// Read results JSON and inject thumbnails one-by-one with
// staggered setTimeout so user sees 1/311 → 2/311 → … → 311/311.
// ═══════════════════════════════════════════════════════════
function _startPyLoadPhase(donePath, resultsPath, errPath, onDone, onFail){
  // Flush delay already passed (60ms from caller)
  var resultsJson = null;
  try{
    var rd = window.cep.fs.readFile(resultsPath.replace(/\\/g,"/"));
    if(rd && rd.err === 0 && rd.data) resultsJson = rd.data;
  }catch(e){}
  try{ window.cep.fs.deleteFile(donePath.replace(/\\/g,"/")); }catch(e){}
  try{ window.cep.fs.deleteFile(resultsPath.replace(/\\/g,"/")); }catch(e){}
  try{ window.cep.fs.deleteFile(errPath.replace(/\\/g,"/")); }catch(e){}

  if(!resultsJson){ onFail("Python results file unreadable"); return; }
  var parsed;
  try{ parsed = JSON.parse(resultsJson); }
  catch(e){ onFail("Bad JSON from Python: "+resultsJson.substring(0,150)); return; }
  if(!parsed.ok){ onFail(parsed.msg || "unknown Python error"); return; }
  var results = parsed.results || [];
  // Sort by scene index to guarantee correct order
  results.sort(function(a,b){ return a.idx - b.idx; });

  // Reset modal: remove ETA, show "Loading X / Y" instead
  var subEl = $("thumb-progress-sub");
  if(subEl) subEl.textContent = t("thumb_loading");
  setThumbProgress(0, S.scenes.length);

  var _injIdx = 0;
  var BATCH = 100;
  function _injBatch(){
    if(_thumbCancelled) return;
    var end = Math.min(_injIdx + BATCH, results.length);
    for(; _injIdx < end; _injIdx++){
      var r = results[_injIdx];
      if(r.ok && r.path && S.thumbs[r.idx] === undefined){
        _thumbFailStreak = 0;
        acceptThumbJPG(r.idx, r.path, filePathToURI(r.path));
      }
    }
    setThumbProgress(S.thumbDone, S.scenes.length);
    if(_injIdx >= results.length){
      onDone(results);
    } else {
      requestAnimationFrame(_injBatch);
    }
  }
  _injBatch();
}

// _doStartThumb — pipeline entry point
function _doStartThumb(){
  S.thumbLoading=true; S.thumbDone=0; S.thumbs={}; S.thumbPaths={};
  _thumbCancelled = false;
  _thumbGenFinished = false;
  _thumbStartTime = Date.now();
  $("thumb-btn").classList.add("loading");
  $("thumb-cancel-btn").style.display = "";
  setThumbCount(0);

  if(S.thumbMode === "lazy"){
    _jsLog("thumb","[START] lazy mode — AE saveFrameToPng one-by-one");
    _captureNext(0);
    return;
  }

  _showThumbProgressModal(S.scenes.length);
  setThumbProgress(0, S.scenes.length);

  // Reset all per-session state
  _state.pyChecked    = false;
  _state.srcInfoDone  = false;
  _state.tmpPath      = "";

  _jsLog("thumb","[START] scenes="+S.scenes.length+" customTmpPath="+(S.customTmpPath||""));

  // Build full batch array once — reused by all pipeline tiers
  function _buildBatch(tmpPath){
    var batch = [];
    var tmpWin = tmpPath.replace(/\//g,"\\").replace(/\\+$/, "");
    var srcDur = (_state.fps > 0 && S.scenes.length > 0)
        ? (S.scenes[S.scenes.length-1].start_sec + S.scenes[S.scenes.length-1].dur_sec)
        : 999999;
    for(var i = 0; i < S.scenes.length; i++){
      var sc      = S.scenes[i];
      var snapRaw = sc.start_sec + sc.dur_sec * 0.3;
      var frameTime = 1.0 / (_state.fps || 24);
      var sceneEnd  = sc.start_sec + sc.dur_sec - frameTime;
      var compSec   = Math.max(sc.start_sec, Math.min(snapRaw, sceneEnd));
      compSec       = Math.min(compSec, srcDur - frameTime);
      compSec       = Math.max(0, compSec);
      // v9.0: use per-layer source for multi-layer support
      var srcInfo = _getSourceForScene(sc);
      var srcSec  = compSec - srcInfo.layerStartSec + srcInfo.sourceStartSec;
      srcSec      = Math.max(0, srcSec);
      var outName = "sed_ff_" + pad3(i+1) + "_" + Math.round(compSec*1000) + ".jpg";
      batch.push({
        idx:     i,
        seekSec: srcSec,
        srcPath: srcInfo.sourcePath,
        outPath: tmpWin + "\\" + outName
      });
    }
    return batch;
  }

  // ── Pipeline: Python → AE saveFrameToPng ──
  _resolvePython(function(pyAvail){
    _resolveSourceInfo(function(srcOk){
      _resolveTmpPath(function(tmpPath){
        _jsLog("thumb","[INFO] python="+pyAvail+" srcOk="+srcOk+" tmp="+tmpPath);

        if(!srcOk || !tmpPath){
          _jsLog("thumb","[FALLBACK] no src/tmp → AE pipeline");
          _captureNext(0); return;
        }

        // Try loading from cache (non-blocking — pipeline does NOT wait for this)
        _tryLoadThumbCache(tmpPath, S.scenes, function(cached, thumbs, paths, count){
          if(cached && thumbs && count === S.scenes.length && !_thumbGenFinished){
            S.thumbs = thumbs;
            S.thumbPaths = paths;
            S.thumbDone = count;
            setThumbCount(count);
            _finishThumbGen();
          }
        });

        var batch = _buildBatch(tmpPath);

        if(pyAvail){
          _jsLog("thumb","[PIPELINE] Python cv2");

          var _ctrl = {
            mode:      "python",
            batch:     batch,
            pythonExe: _state.pyPath
          };
          var _ctrlJson = JSON.stringify(_ctrl);

          evalScript("getSystemTempPath()", function(_stRes){
            var _st;
            try{ _st = JSON.parse(_stRes); }
            catch(e){ _st = {ok:false}; }
            if(!_st || !_st.ok || !_st.path || !window.cep || !window.cep.fs){
              _jsLog("thumb","[PY] Cannot get sys temp → AE fallback");
              _captureNext(0);
              return;
            }
            var _ctrlPath = _st.path.replace(/\\/g,"/") + "/sed_thumb_ctrl.json";
            try{
              window.cep.fs.writeFile(_ctrlPath, _ctrlJson);
            }catch(we){
              _jsLog("thumb","[PY] ctrl writeFile fail: "+(we+"").substring(0,80)+" → AE fallback");
              _captureNext(0);
              return;
            }
            _jsLog("thumb","[PY CTRL WROTE] path="+_ctrlPath);

            evalScript("runPendingThumb()", function(rawResult){
              var res;
              try{ res = JSON.parse(rawResult); }
              catch(e){ res = {ok:false, msg:rawResult}; }
              _jsLog("thumb","[PY LAUNCH RESULT] ok="+(res?res.ok:false)+" async="+(res&&res.async));

              if(res && res.ok && res.async && res.donePath){
                _startPyResultPoller(res.donePath, res.resultsPath, res.errPath, batch,
                  function onPyDone(results){
                    if(!_thumbGenFinished) _finishThumbGen();
                  },
                  function onPyFail(msg){
                    _jsLog("thumb","[PY FAIL] msg="+msg+" (partial="+S.thumbDone+")");
                    if(_thumbCancelled) return;
                    var remaining = batch.filter(function(b){
                      return S.thumbs[b.idx] === undefined;
                    });
                    if(remaining.length === 0){
                      if(!_thumbGenFinished) _finishThumbGen();
                    } else if(S.thumbDone > 0){
                      if(!_thumbGenFinished) _finishThumbGen();
                    } else {
                      _captureNext(0);
                    }
                  }
                );
              } else {
                _jsLog("thumb","[PY FAIL] msg="+(res&&(res.pyMsg||res.msg)||"unknown")+" → AE fallback");
                _captureNext(0);
              }
            });
          });
        } else {
            _jsLog("thumb","[PIPELINE] No Python → AE fallback");
            _captureNext(0);
        }
      }); // end _resolveTmpPath
    });
  });
}


// ── Public entry points ───────────────────────────────────
function startThumbGen(){
  if(S.thumbLoading){setStatus(t("thumb_gen",{i:"…",n:"…"}),"warn");return;}
  if(!S.detectDone||!S.scenes.length){setStatus(t("no_detect"),"warn");return;}
  _doStartThumb();
}
// Auto-trigger after detect/readMarkers — no confirm dialog
function _startThumbAuto(){
  if(S.thumbLoading) return;
  if(!S.detectDone||!S.scenes.length) return;
  _doStartThumb();
}

// acceptThumbJPG — inject a JPG thumbnail from Python/AE
// Called from AE fallback path (PNG files) and legacy code
function acceptThumbJPG(idx, path, uri){
  if(!path) return false;
  S.thumbPaths[idx] = path;
  S.thumbDone++;
  setThumbCount(S.thumbDone);
  S.thumbs[idx] = uri || filePathToURI(path);
  _injectThumb(idx, S.thumbs[idx], path);
  return true;
}

// _injectThumbDirect — inject pre-loaded data URI, no async loading needed
function _injectThumbDirect(idx, dataURI, path){
  var card = document.querySelector(".scene-card[data-idx='"+idx+"']");
  if(!card) return;
  var wrap = card.querySelector(".card-img-wrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  wrap.classList.remove("card-img-ph"); wrap.classList.add("thumb-loaded");
  wrap.style.backgroundImage = "url('"+dataURI.replace(/'/g,"%27")+"')";
  var num = card.querySelector(".card-thumb-num");
  if(num) num.style.display = "none";
}


// Sequential AE capture
var _thumbFailStreak=0;
function _captureNext(i){
  if(_thumbCancelled) return;
  if(i>=S.scenes.length){_finishThumbGen();return;}
  var sc=S.scenes[i];
  setThumbProgress(i+1, S.scenes.length);
  var lazyFlag = (S.thumbMode === "lazy");
  callHost("captureSceneFrames",[sc.start_sec,sc.dur_sec,i,S.customTmpPath,lazyFlag],function(res){
    if(_thumbCancelled) return;
    if(res&&res.ok){
      _thumbFailStreak=0;
      acceptThumb(i,res);
    } else {
      _thumbFailStreak++;
      if(_thumbFailStreak===3) setStatus(t("thumb_failing"),"warn");
    }
    setThumbProgress(S.thumbDone, S.scenes.length);
    setTimeout(function(){ _captureNext(i+1); }, 0);
  });
}
function _saveThumbCache(){
  if(!_state.tmpPath || S.thumbDone !== S.scenes.length) return;
  var cachePath = _state.tmpPath.replace(/\\/g,"/").replace(/\/+$/, "") + "/sed_thumb_cache.json";
  var sceneEntries = [];
  for(var ci = 0; ci < S.scenes.length; ci++){
    var sc = S.scenes[ci];
    var thumbPath = S.thumbPaths[ci] || "";
    var srcInfo = _getSourceForScene(sc);
    sceneEntries.push({
      idx: ci,
      sourcePath: srcInfo.sourcePath || "",
      startSec: sc.start_sec,
      durSec: sc.dur_sec,
      thumbPath: thumbPath
    });
  }
  var cacheData = {
    version: 1,
    scenes: sceneEntries,
    savedAt: new Date().toISOString()
  };
  try{
    window.cep.fs.writeFile(cachePath, JSON.stringify(cacheData));
    _jsLog("thumb","[CACHE SAVED] scenes="+sceneEntries.length);
  }catch(e){
    _jsLog("thumb","[CACHE SAVE FAIL] "+e.toString());
  }
}

function _tryLoadThumbCache(tmpPath, scenes, cb){
  var cachePath = tmpPath.replace(/\\/g,"/").replace(/\/+$/, "") + "/sed_thumb_cache.json";
  try{
    if(!window.cep || !window.cep.fs) { cb(false); return; }
    window.cep.fs.readFile(cachePath, "utf-8", function(err, data){
      if(err || !data){ cb(false); return; }
      var cache;
      try{ cache = JSON.parse(data); }catch(e){ cb(false); return; }
      if(!cache || cache.version !== 1 || !cache.scenes || cache.scenes.length !== scenes.length){
        cb(false); return;
      }
      var valid = true;
      var newThumbs = {};
      var newPaths = {};
      for(var ci = 0; ci < scenes.length; ci++){
        var sc = scenes[ci];
        var cached = null;
        for(var cj = 0; cj < cache.scenes.length; cj++){
          var ce = cache.scenes[cj];
          if(Math.abs(ce.startSec - sc.start_sec) < 0.01 &&
             Math.abs(ce.durSec - sc.dur_sec) < 0.01 &&
             ce.idx === ci){
            cached = ce;
            break;
          }
        }
        if(!cached || !cached.thumbPath || !cached.sourcePath){
          valid = false; break;
        }
        // Verify thumbnail file still exists
        var srcInfo = _getSourceForScene(sc);
        if(cached.sourcePath !== srcInfo.sourcePath){
          valid = false; break;
        }
        try{
          var finfo = window.cep.fs.stat(cached.thumbPath);
          if(!finfo || finfo.err){ valid = false; break; }
        }catch(e){ valid = false; break; }
        newThumbs[ci] = "file:///" + cached.thumbPath.replace(/\\/g,"/");
        newPaths[ci] = cached.thumbPath;
      }
      if(valid){
        _jsLog("thumb","[CACHE HIT] loading "+newPaths.length+" thumbnails from cache");
        cb(true, newThumbs, newPaths, newPaths.length);
      } else {
        _jsLog("thumb","[CACHE MISS] thumbnail cache invalid, re-rendering");
        cb(false);
      }
    });
  }catch(e){
    _jsLog("thumb","[CACHE CHECK FAIL] "+e.toString());
    cb(false);
  }
}

function _finishThumbGen(){
  if(_thumbCancelled) return;
  if(_thumbGenFinished) return;
  _thumbGenFinished = true;
  S.thumbLoading=false;
  _thumbFailStreak=0;
  $("thumb-btn").classList.remove("loading");
  $("thumb-cancel-btn").style.display = "none";
  setThumbProgress(null);
  _jsLog("thumb","[FINISH] done="+S.thumbDone+"/"+S.scenes.length);
  if(S.thumbDone===0){
    setStatus(t("thumb_fail"),"warn");
    // Auto-run diagnostics and show result
    _showThumbDiag();
  } else if(S.thumbDone<S.scenes.length){
    setStatus(t("thumb_done",{ok:S.thumbDone,n:S.scenes.length})+" ("+S.thumbDone+"/"+S.scenes.length+")","warn");
  } else {
    setStatus(t("thumb_done",{ok:S.thumbDone,n:S.scenes.length}),"ok");
    // Save thumbnail cache for future use
    _saveThumbCache();
  }
}

function _showThumbDiag(){
  callHost("getThumbDiagnostics",[S.customTmpPath],function(res){
    if(!res) return;
    var lines = [];
    lines.push("═══ SED Panel — Thumb Diagnostics ═══");
    lines.push("");
    lines.push("AE Version    : " + (res.aeVersion||"?"));
    lines.push("Comp          : " + (res.compInfo||"(no active comp)"));
    lines.push("");
    lines.push("─ Temp Folder ─");
    lines.push("Path          : " + (res.tempFolder||"?"));
    lines.push("Exists        : " + res.tempFolderExists);
    lines.push("Writable      : " + res.tempFolderWritable);
    lines.push("");
    lines.push("─ Source File ─");
    lines.push("Path          : " + (res.sourceFile||"(not found)"));
    lines.push("Exists on disk: " + res.sourceFileExists);
    if(res.errors && res.errors.length){
      lines.push("");
      lines.push("─ Errors ─");
      res.errors.forEach(function(e){ lines.push("  ✗ " + e); });
    }
    lines.push("");
    lines.push("─ Log Files ─");
    lines.push("Folder: " + (res.logFolder||"?"));
    alert(lines.join("\n"));
  });
}
function _injectThumb(idx,uri,path){
  var card=document.querySelector(".scene-card[data-idx='"+idx+"']"); if(!card) return;
  var wrap=card.querySelector(".card-img-wrap"); if(!wrap) return;
  wrap.innerHTML=""; wrap.classList.remove("card-img-ph"); wrap.classList.add("thumb-loaded");
  wrap.style.backgroundImage="url('"+uri.replace(/'/g,"%27")+"')";
  var num=card.querySelector(".card-thumb-num"); if(num) num.style.display="none";
}

// ═══ About modal ════════════════════════════════════════
$("about-btn").addEventListener("click",function(){
  $("about-overlay").classList.remove("hidden");
  _renderUpdateStatus();
  _renderUpdateToggle(_loadUpdateNotifPref());
});
[$("about-close"),$("about-close-x")].forEach(function(b){
  b&&b.addEventListener("click",function(){$("about-overlay").classList.add("hidden");});
});
$("about-overlay").addEventListener("click",function(e){
  if(e.target===$("about-overlay"))$("about-overlay").classList.add("hidden");
});
$("link-tiktok").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://www.tiktok.com/@heosan/");});
$("link-ig").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://www.instagram.com/_heosan/");});
$("link-web").addEventListener("click",function(e){e.preventDefault();cs.openURLInDefaultBrowser("https://heosan.web.app/");});

// ═══ Update notification ═════════════════════════════
var _latestVer = null; // tag of latest GitHub release (null = unchecked/error)

function _loadUpdateNotifPref(){
  try{
    var v = localStorage.getItem(UPDATE_NOTIF_KEY);
    if(v === "off") return "off";
  }catch(e){}
  return "on";
}
function _saveUpdateNotifPref(state){
  try{ localStorage.setItem(UPDATE_NOTIF_KEY, state); }catch(e){}
}
function _getUpdateLaterTime(){
  try{
    var t = parseInt(localStorage.getItem(UPDATE_LATER_KEY), 10);
    if(!isNaN(t) && t > 0) return t;
  }catch(e){}
  return 0;
}
function _setUpdateLaterTime(ts){
  try{ localStorage.setItem(UPDATE_LATER_KEY, String(ts)); }catch(e){}
}
function _renderUpdateToggle(state){
  var btn = $("update-notif-toggle");
  if(!btn) return;
  btn.disabled = false;
  btn.textContent = state === "on" ? t("update_on") : t("update_off");
  btn.dataset.state = state;
  btn.className = "toggle-btn" + (state === "on" ? " on" : "");
}
function _renderUpdateStatus(){
  var btn = $("update-status-btn");
  if(!btn) return;
  if(!_latestVer){
    btn.className = "update-status-btn check";
    btn.disabled = false;
    btn.textContent = t("update_check");
    btn.title = "Check for updates";
    return;
  }
  var hasUpdate = _cmpVer(_parseVer(_latestVer), _parseVer(CUR_VER)) > 0;
  if(hasUpdate){
    btn.className = "update-status-btn update-avail";
    btn.disabled = false;
    btn.textContent = _latestVer;
    btn.title = "Click to view release";
  } else {
    btn.className = "update-status-btn uptodate";
    btn.disabled = true;
    btn.textContent = "✓ " + t("update_uptodate") + " (v" + CUR_VER + ")";
    btn.title = "";
  }
}
// Parse semver "v3.2.0" or "3.2.0" → [3,2,0]
function _parseVer(s){
  var parts = (s||"").replace(/^v/i,"").split(".").map(Number);
  return [parts[0]||0, parts[1]||0, parts[2]||0];
}
function _cmpVer(a,b){
  for(var i=0;i<3;i++){
    if(a[i]!==b[i]) return a[i]-b[i];
  }
  return 0;
}
function _checkUpdate(){
  try{
    fetch("https://api.github.com/repos/"+GH_REPO+"/releases/latest", {
      cache: "no-cache"
    }).then(function(rsp){
      if(!rsp.ok){ _latestVer = null; _renderUpdateStatus(); _renderUpdateToggle(_loadUpdateNotifPref()); return; }
      rsp.json().then(function(data){
        if(!data || !data.tag_name){ _latestVer = null; _renderUpdateStatus(); _renderUpdateToggle(_loadUpdateNotifPref()); return; }
        _latestVer = data.tag_name;
        var tagVer = _parseVer(_latestVer);
        var curVer = _parseVer(CUR_VER);
        _renderUpdateStatus();
        _renderUpdateToggle(_loadUpdateNotifPref());
        var pref = _loadUpdateNotifPref();
        if(pref === "on" && _cmpVer(tagVer, curVer) > 0){
          var laterAt = _getUpdateLaterTime();
          if(laterAt > 0 && Date.now() < laterAt) return;
          _setUpdateLaterTime(0);
          var detail = $("update-modal-detail");
          if(detail) detail.textContent = data.tag_name + "  →  v" + CUR_VER;
          $("update-overlay").classList.remove("hidden");
        }
      });
    });
  }catch(e){ _latestVer = null; _renderUpdateStatus(); _renderUpdateToggle(_loadUpdateNotifPref()); }
}
function _hideUpdatePopup(){
  $("update-overlay").classList.add("hidden");
}
$("update-status-btn").addEventListener("click",function(){
  if(this.disabled) return;
  if(!_latestVer){ _checkUpdate(); return; }
  cs.openURLInDefaultBrowser("https://github.com/"+GH_REPO+"/releases/latest");
});
$("update-notif-toggle").addEventListener("click",function(){
  var cur = _loadUpdateNotifPref();
  var next = cur === "on" ? "off" : "on";
  _saveUpdateNotifPref(next);
  _renderUpdateToggle(next);
  if(next === "on") _checkUpdate();
});
$("update-modal-later").addEventListener("click",function(){
  _setUpdateLaterTime(Date.now() + 24*60*60*1000);
  _hideUpdatePopup();
});
$("update-modal-view").addEventListener("click",function(){
  cs.openURLInDefaultBrowser("https://github.com/"+GH_REPO+"/releases/latest");
  _hideUpdatePopup();
});
$("update-overlay").addEventListener("click",function(e){
  if(e.target === $("update-overlay")) _hideUpdatePopup();
});
(function(){
  var toggle = $("update-notif-toggle");
  if(toggle) _renderUpdateToggle(_loadUpdateNotifPref());
})();

// Settings modal
$("settings-btn").addEventListener("click",function(){
  renderTmpPath();
  renderThumbMode();
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

// Thumbnail mode
$("thumb-mode-fast").addEventListener("change",function(){
  if(this.checked){ saveThumbMode("fast"); setStatus(t("thumb_mode_saved"),"ok"); }
});
$("thumb-mode-lazy").addEventListener("change",function(){
  if(this.checked){ saveThumbMode("lazy"); setStatus(t("thumb_mode_saved"),"ok"); }
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
  setStatus("Running diagnostics… (may take 5-10s)","");
  var pyPath = _state.pyPath || "";
  callHost("getFullDiagnostics",[S.customTmpPath, pyPath], function(res){
    if(!res){ setStatus("Diagnostics failed","warn"); return; }

    var lines = [];
    lines.push("═══ SED Panel v3.2 — Full Diagnostics ═══");
    lines.push("");
    lines.push("AE Version    : " + (res.aeVersion||"?"));
    lines.push("");
    lines.push("─ Temp Folder ─────────────────────────");
    lines.push("Path     : " + (res.tmpPath||"?"));
    lines.push("Exists   : " + res.tmpExists + "  Writable: " + res.tmpWritable);
    if(res.tmpWriteError) lines.push("Error    : " + res.tmpWriteError);
    lines.push("");
    lines.push("─ Source File ──────────────────────────");
    lines.push("Path     : " + (res.sourceFile||"(not found)"));
    lines.push("Exists   : " + res.sourceExists);
    lines.push("");
    lines.push("─ Python ───────────────────────────────");
    lines.push("Path     : " + (res.pythonExe||"(not found)"));
    lines.push("Exists   : " + res.pythonExists + "  Runs: " + res.pythonRunsOk);
    lines.push("Version  : " + (res.pythonVersion||"?"));
    lines.push("cv2      : " + (res.cv2Available ? "✓ "+res.cv2Version : "✗ NOT INSTALLED"));
    if(res.cv2Error) lines.push("cv2 err  : " + res.cv2Error);
    lines.push("thumb_gen: " + (res.thumbGenPyExists ? "✓ "+res.thumbGenPyPath : "✗ NOT FOUND"));
    lines.push("Plugin root: " + (res.pluginRootFromDollar||"?"));
    if(res.pythonRunError) lines.push("Run err  : " + res.pythonRunError);
    lines.push("");
    lines.push("─ Logs ─────────────────────────────────");
    lines.push("Folder   : " + (res.logFolder||"?"));
    lines.push("");
    if(res.errors && res.errors.length){
      lines.push("─ Errors ───────────────────────────────");
      res.errors.forEach(function(e){ lines.push("  ✗ "+e); });
      lines.push("");
    }
    lines.push(res.ok ? "✓ All systems OK" : "✗ Issues detected — see errors above");

    setStatus(res.ok ? "Diagnostics OK" : "Issues found — see popup","" + (res.ok?"ok":"warn"));
    alert(lines.join("\n"));
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
    setStatus(t("scene_count",{n:S.scenes.length,layer:res.layerName||"—"}),"ok");
    if(S.scenes.length>0) _startThumbAuto();
  });
});
$("read-btn").addEventListener("click",function(){
  _readCancelled = false;
  $("read-btn").classList.add("loading");
  $("read-cancel-btn").style.display = "";
  setStatus(t("reading"),"");
  $("status-dot").classList.add("loading");
  callHost("readMarkers",[],function(res){
    $("read-btn").classList.remove("loading");
    $("read-cancel-btn").style.display = "none";
    $("status-dot").classList.remove("loading");
    if(_readCancelled) return;
    if(!res.ok){setStatus(res.msg||t("no_markers"),"warn");return;}
    _applyScenes(res);
    setStatus(t("scene_from_markers",{n:S.scenes.length}),"ok");
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

// ═══ Merge Scene (v8.3) ═════════════════════════════════
// Combines 2+ ADJACENT selected scenes into a single scene + single
// AE marker. Non-adjacent picks are skipped automatically; if NOTHING
// in the selection is adjacent, a warning modal is shown and nothing
// happens. Multiple separate adjacent groups can merge in one click
// (e.g. scenes 1,2 AND 5,6,7 selected together → two independent merges).

// _groupAdjacentSelection() — splits S.selected into clusters of
// consecutive scene indices from the SAME layer
// (e.g. [0,1,4,5,6,9] → [[0,1],[4,5,6],[9]]).
// Scenes from different layers are never grouped together.
// Returns ALL clusters (including singletons) sorted ascending —
// caller decides what to do with clusters of length 1 (skip them).
function _groupAdjacentSelection(){
  var sorted = S.selected.slice().sort(function(a,b){ return a-b; });
  var clusters = [];
  var current = [];
  for(var i=0;i<sorted.length;i++){
    var idx = sorted[i];
    var sc = S.scenes[idx];
    if(current.length===0){
      current.push(idx);
    } else {
      var lastIdx = current[current.length-1];
      var lastSc = S.scenes[lastIdx];
      // MUST be: consecutive panel index AND same layer
      if(idx === lastIdx+1 && sc.layerIndex === lastSc.layerIndex){
        current.push(idx);
      } else {
        clusters.push(current);
        current = [idx];
      }
    }
  }
  if(current.length) clusters.push(current);
  return clusters;
}

function _showMergeModal(msg){
  var modal = $("merge-overlay");
  var msgEl = $("merge-modal-msg");
  if(msgEl) msgEl.textContent = msg;
  if(modal) modal.classList.remove("hidden");
}
function _hideMergeModal(){
  var modal = $("merge-overlay");
  if(modal) modal.classList.add("hidden");
}
_on("merge-modal-close","click",_hideMergeModal);
_on("merge-overlay","click",function(e){
  if(e.target===$("merge-overlay")) _hideMergeModal();
});

$("merge-btn").addEventListener("click",function(){
  if(!S.detectDone||S.scenes.length<2){setStatus(t("no_detect"),"warn");return;}
  if(S.selected.length<2){
    _showMergeModal(t("merge_need_2"));
    return;
  }

  var clusters = _groupAdjacentSelection();
  var mergeable = clusters.filter(function(c){ return c.length>=2; });
  var skipped   = clusters.filter(function(c){ return c.length===1; })
                          .map(function(c){ return "#"+pad3(S.scenes[c[0]].index); });

  if(mergeable.length===0){
    // Nothing adjacent at all — explicit warning, no action taken
    _showMergeModal(t("merge_need_adjacent"));
    return;
  }

  // Build human-readable confirm summary across all groups being merged
  var totalScenesInvolved = 0;
  var rangeDescs = mergeable.map(function(c){
    totalScenesInvolved += c.length;
    var from = S.scenes[c[0]].index, to = S.scenes[c[c.length-1]].index;
    return from===to ? ("#"+pad3(from)) : ("#"+pad3(from)+"–#"+pad3(to));
  });

  var confirmMsg = mergeable.length === 1
    ? t("merge_confirm",{
        n: totalScenesInvolved,
        from: rangeDescs[0].replace(/^#/,"").split("–")[0],
        to:   rangeDescs[0].replace(/^#/,"").split("–").pop()
      })
    : t("merge_confirm_multi",{
        n: totalScenesInvolved,
        groups: mergeable.length
      });
  if(skipped.length){
    confirmMsg += "\n\n" + t("merge_partial_skip",{skipped: skipped.join(", ")});
  }
  if(!confirm(confirmMsg)) return;

  // Build the groups payload exactly as host.jsx expects: array of groups,
  // each group = array of scene records (ascending order already guaranteed
  // by _groupAdjacentSelection's sort).
  var groupsPayload = mergeable.map(function(c){
    return c.map(function(idx){ return S.scenes[idx]; });
  });

  $("merge-btn").classList.add("merging");
  $("merge-btn").disabled = true;
  setStatus(t("merging"),"");

  callHost("mergeScenes",[JSON.stringify(groupsPayload)],function(res){
    $("merge-btn").classList.remove("merging");
    $("merge-btn").disabled = false;

    if(!res||!res.ok){
      setStatus(res&&res.msg || t("merge_fail"),"err");
      return;
    }

    // ── Reconstruct scene list from old scenes + merge groups ──
    // DO NOT use res.scenes from the host — readMarkers() may return
    // different results due to multi-layer dedup. Instead, rebuild
    // locally: merge groups become single scenes, everything else stays.
    var oldScenes = S.scenes;
    var newScenes = [];
    var fps = oldScenes.length > 0 ? oldScenes[0].fps || 30 : 30;

    // Build a flat set of old indices that are part of a merge group.
    // Also build an array of group descriptors: [{head, tail, indices[]}]
    var mergedOldIdxSet = {};
    var mergeGroupList = [];
    mergeable.forEach(function(grp){
      var entry = {head: grp[0], tail: grp[grp.length-1], indices: grp};
      mergeGroupList.push(entry);
      grp.forEach(function(idx){ mergedOldIdxSet[idx] = true; });
    });

    // Build newScenes by walking old scenes sequentially.
    // When we hit the head of a merge group, create the merged scene
    // and skip past the group tail.
    var ni = 0;
    var oi = 0;
    while(oi < oldScenes.length){
      if(mergedOldIdxSet[oi]){
        // Find which group this belongs to
        var foundGroup = null;
        for(var mg = 0; mg < mergeGroupList.length; mg++){
          if(mergeGroupList[mg].indices.indexOf(oi) >= 0){
            foundGroup = mergeGroupList[mg];
            break;
          }
        }
        if(foundGroup && oi === foundGroup.head){
          // Create merged scene for this group
          var firstSc = oldScenes[foundGroup.head];
          var lastSc  = oldScenes[foundGroup.tail];
          var mergedStart = firstSc.start_sec;
          var mergedEnd   = lastSc.end_sec;
          var mergedDur   = mergedEnd - mergedStart;
          newScenes.push({
            index:     ni + 1,
            start_sec: mergedStart,
            end_sec:   mergedEnd,
            dur_sec:   mergedDur,
            start_tc:  firstSc.start_tc,
            end_tc:    lastSc.end_tc,
            dur_tc:    fmtTC(mergedDur, fps),
            dur_str:   _fmtDuration(mergedDur),
            fps:       fps,
            layerIndex: firstSc.layerIndex,
            layerName:  firstSc.layerName
          });
          ni++;
          oi = foundGroup.tail + 1; // skip all merged scenes
        } else {
          // Should not happen (middle of group) — skip
          oi++;
        }
      } else {
        // Non-merged scene — copy
        var osc = oldScenes[oi];
        newScenes.push({
          index:     ni + 1,
          start_sec: osc.start_sec,
          end_sec:   osc.end_sec,
          dur_sec:   osc.dur_sec,
          start_tc:  osc.start_tc,
          end_tc:    osc.end_tc,
          dur_tc:    osc.dur_tc,
          dur_str:   osc.dur_str,
          fps:       osc.fps,
          layerIndex: osc.layerIndex,
          layerName:  osc.layerName
        });
        ni++;
        oi++;
      }
    }

    _jsLog("thumb","[MERGE DEBUG] oldLen="+oldScenes.length+" mergeable="+JSON.stringify(mergeable)+" newLen="+newScenes.length);

    // ── Remap thumbnails ──
    var newThumbs={}, newPaths={}, newDone=0;
    var newSelected=[];

    for(var nii = 0; nii < newScenes.length; nii++){
      // Find donor old scene: the FIRST old scene whose start_sec falls
      // inside this new scene's range (same as before).
      var donorOldIdx = -1;
      var coveredOld = 0;
      var anySelectedInRange = false;
      for(var oi2 = 0; oi2 < oldScenes.length; oi2++){
        var osc2 = oldScenes[oi2];
        if(osc2.start_sec >= newScenes[nii].start_sec - 0.001 &&
           osc2.start_sec <  newScenes[nii].end_sec - 0.0005){
          if(donorOldIdx === -1) donorOldIdx = oi2;
          coveredOld++;
          if(S.selected.indexOf(oi2) >= 0 && !mergedOldIdxSet[oi2]){
            anySelectedInRange = true;
          }
        }
      }
      if(donorOldIdx >= 0 && S.thumbs[donorOldIdx]){
        newThumbs[nii] = S.thumbs[donorOldIdx];
        if(S.thumbPaths[donorOldIdx]) newPaths[nii] = S.thumbPaths[donorOldIdx];
        newDone++;
      }
      var spanIsMerge = coveredOld >= 2;
      if(spanIsMerge || anySelectedInRange) newSelected.push(nii);
    }

    S.scenes = newScenes;
    S.thumbs = newThumbs; S.thumbPaths = newPaths; S.thumbDone = newDone;
    S.selected = newSelected;
    S.activeIdx = -1;
    setThumbCount(newDone);
    refreshAll();

    setStatus(t("merge_ok",{groups:res.groupsMerged, total:S.scenes.length}),"ok");
    _jsLog("thumb","[MERGE] groups="+res.groupsMerged+" removedMarkers="+res.removedMarkers+" total="+S.scenes.length);
  });
});


var _exportCompId = null;

$("export-btn").addEventListener("click",function(){
  if(!S.detectDone){setStatus(t("no_detect"),"warn");return;}
  if(!S.selected.length){setStatus(t("no_mark"),"warn");return;}
  callHost("getActiveCompId",[],function(r){
    if(!r||!r.ok){setStatus("No active comp","err");return;}
    _exportCompId=r.id;
    var sel=S.selected.map(function(i){return S.scenes[i];});
    if(sel.length <= 100){
      _doExportRQ(sel); return;
    }
    _showRQWarn(sel);
  });
});
function _doExportRQ(sel, skipQueue){
  setStatus(t("exporting"),"");
  callHost("exportToRenderQueue",[JSON.stringify(sel), !!skipQueue, _exportCompId],function(res){
    if(!res.ok){setStatus(res.msg,"err");return;}
    if(res.skipQueue){
      setStatus(t("export_prep_ok",{n:res.count}),"ok");
      alert(t("export_prep_alert",{n:res.count}));
    } else {
      setStatus(t("export_ok",{n:res.count}),"ok");
      alert(t("export_alert",{n:res.count}));
    }
  });
}
var _rqWarnCount=0, _rqWarnTimer=0;
function _showRQWarn(sel){
  var ov=$("rq-warn-overlay"), go=$("rq-warn-go"), msg=$("rq-warn-msg");
  msg.textContent = t("rq_warn_msg",{n:sel.length});
  go.textContent = t("rq_warn_go") + " (5s)";
  go.disabled = true; go.classList.add("disabled");
  ov.classList.remove("hidden");
  _rqWarnCount = 5;
  _rqWarnTimer = setInterval(function(){
    _rqWarnCount--;
    if(_rqWarnCount <= 0){
      clearInterval(_rqWarnTimer); _rqWarnTimer=0;
      go.textContent = t("rq_warn_go");
      go.disabled = false; go.classList.remove("disabled");
    } else {
      go.textContent = t("rq_warn_go") + " (" + _rqWarnCount + "s)";
    }
  }, 1000);
}
function _hideRQWarn(){
  if(_rqWarnTimer){ clearInterval(_rqWarnTimer); _rqWarnTimer=0; }
  $("rq-warn-overlay").classList.add("hidden");
}
$("rq-warn-go").addEventListener("click",function(){
  if(this.disabled) return;
  _hideRQWarn();
  var sel = S.selected.map(function(i){return S.scenes[i];});
  _doExportRQ(sel);
});
$("rq-warn-manual").addEventListener("click",function(){
  _hideRQWarn();
  var sel = S.selected.map(function(i){return S.scenes[i];});
  _doExportRQ(sel, true);
});
$("rq-warn-overlay").addEventListener("click",function(e){
  if(e.target===$("rq-warn-overlay")) _hideRQWarn();
});
$("thumb-btn").addEventListener("click",function(){
  if(!S.detectDone||!S.scenes.length){setStatus(t("no_detect"),"warn");return;}
  startThumbGen();
});
// Shared cancel logic — triggered from sidebar ✕ button OR popup modal Cancel button
function _cancelThumbGen(){
  if(!S.thumbLoading) return;
  _thumbCancelled = true;
  S.thumbLoading  = false;
  $("thumb-btn").classList.remove("loading");
  $("thumb-cancel-btn").style.display = "none";
  _stopPyPoller();
  _hideThumbProgressModal();
  setThumbProgress(null);
  setStatus(t("thumb_cancelled"),"warn");
  _jsLog("thumb","[CANCELLED] user cancelled thumb gen");
}
$("thumb-cancel-btn").addEventListener("click",_cancelThumbGen);
_on("thumb-progress-cancel","click",_cancelThumbGen);
$("read-cancel-btn").addEventListener("click",function(){
  _readCancelled = true;
  $("read-btn").classList.remove("loading");
  $("read-cancel-btn").style.display = "none";
  setStatus(t("read_cancelled"),"warn");
  _jsLog("thumb","[CANCELLED] user cancelled read markers");
});
$("clean-btn").addEventListener("click",function(){
  if(!confirm(t("confirm_clean")))return;
  callHost("cleanTempFolder",[S.customTmpPath],function(res){
    setStatus(t("clean_ok",{n:res.deleted||0}),"ok");
    S.thumbs={}; S.thumbPaths={}; S.thumbDone=0; setThumbCount(0); refreshGrid();
    // Reset tmp path cache so next session re-resolves
    _state.tmpPath=""; _state.srcInfoDone=false;
  });
});

$("reset-thumb-btn").addEventListener("click",function(){
  if(!S.thumbDone && !Object.keys(S.thumbs).length) return;
  S.thumbs={}; S.thumbPaths={}; S.thumbDone=0;
  setThumbCount(0);
  var cards=$("grid").querySelectorAll(".scene-card");
  for(var ci=0;ci<cards.length;ci++){
    var wrap=cards[ci].querySelector(".card-img-wrap");
    var tnum=cards[ci].querySelector(".card-thumb-num");
    if(wrap){wrap.className="card-img-wrap card-img-ph";wrap.style.backgroundImage="";}
    if(!tnum){var s=document.createElement("span");s.className="card-thumb-num";
      s.textContent=pad3(S.scenes[ci]?S.scenes[ci].index:ci);cards[ci].querySelector(".card-thumb").appendChild(s);}
  }
  setStatus(t("clean_ok",{n:0}),"ok");
});
// ═══ Transport ══════════════════════════════════════════
$("nav-first").addEventListener("click",function(){selectScene(0);});
$("nav-prev").addEventListener("click",function(){if(S.activeIdx>0)selectScene(S.activeIdx-1);});
$("nav-next").addEventListener("click",function(){if(S.activeIdx<S.scenes.length-1)selectScene(S.activeIdx+1);});
$("nav-last").addEventListener("click",function(){if(S.scenes.length)selectScene(S.scenes.length-1);});
(function(){
  var goBtn=$("go-btn");
  if(goBtn) goBtn.addEventListener("click",function(){
    if(S.activeIdx<0)return;
    if(seekTimer){clearTimeout(seekTimer);seekTimer=null;}
    callHost("goToFrame",[S.scenes[S.activeIdx].start_sec],function(){
      setStatus("→ "+S.scenes[S.activeIdx].start_tc,"ok");
    });
  });
  var ramBtn=$("ram-btn");
  if(ramBtn) ramBtn.addEventListener("click",function(){
    if(S.activeIdx<0)return;
    var sc=S.scenes[S.activeIdx];
    callHost("goToScene",[sc.start_sec,sc.dur_sec],function(){
      callHost("ramPreview",[],function(){});
    });
  });
})();
$("mark-btn").addEventListener("click",function(){toggleMark(S.activeIdx);});
document.querySelectorAll(".col-btn").forEach(function(btn){
  btn.addEventListener("click",function(e){
    e.stopPropagation();
    var n=parseInt(btn.getAttribute("data-n")||btn.dataset.n||"3");
    if(!n||n<1||n>10) return;
    document.querySelectorAll(".col-btn").forEach(function(b){b.classList.remove("active");});
    btn.classList.add("active");
    S.cols=n;
    var grid=$("grid");
    if(grid) grid.style.gridTemplateColumns="repeat("+S.cols+",1fr)";
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
  var selSet = new Set(S.selected);
  var frag = document.createDocumentFragment();
  S.scenes.forEach(function(sc,i){
    var tr=document.createElement("tr");
    tr.dataset.idx=i;
    if(S.activeIdx===i)tr.classList.add("active");
    if(selSet.has(i))tr.classList.add("marked");
    tr.innerHTML="<td>"+pad3(sc.index)+"</td>"+
      "<td class='tc-cell'>"+sc.start_tc+"</td>"+
      "<td class='tc-cell'>"+sc.dur_str+"</td>"+
      "<td class='mark-cell'>"+(selSet.has(i)?"✔":"")+"</td>";
    frag.appendChild(tr);
  });
  tb.appendChild(frag);
  if(S.activeIdx>=0){
    var rows=tb.querySelectorAll("tr");
    if(rows[S.activeIdx])rows[S.activeIdx].scrollIntoView({block:"nearest"});
  }
}

var _gridRefreshToken = 0;

function refreshGrid(cb){
  var token = ++_gridRefreshToken;
  var grid=$("grid");grid.innerHTML="";
  grid.style.gridTemplateColumns="repeat("+S.cols+",1fr)";
  if(!S.detectDone||!S.scenes.length){
    var e=document.createElement("div");e.className="grid-empty";
    e.textContent=t("no_scenes");grid.appendChild(e);
    if(cb) cb();
    return;
  }
  var selSet = new Set(S.selected);
  var bi = 0;
  var BATCH = 100;
  function addNext(){
    if(token !== _gridRefreshToken) return;
    if(bi >= S.scenes.length){
      if(cb) setTimeout(cb, 0);
      return;
    }
    var end = Math.min(bi + BATCH, S.scenes.length);
    var frag = document.createDocumentFragment();
    for(; bi < end; bi++){
      var sc = S.scenes[bi];
      var i = bi;
      var card=document.createElement("div");
      card.className="scene-card"; card.dataset.idx=i;
      if(S.activeIdx===i)card.classList.add("active");
      if(selSet.has(i))card.classList.add("marked");
      var mk=selSet.has(i);
      var uri=S.thumbs[i]||null;
      var hasThumb = !!uri;
      var imgHTML = hasThumb
        ? "<div class='card-img-wrap thumb-loaded' style='background-image:url("+JSON.stringify(uri)+");background-size:cover;background-position:center'></div>"
        : "<div class='card-img-wrap card-img-ph'></div>" +
          "<span class='card-thumb-num'>"+pad3(sc.index)+"</span>";
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
      frag.appendChild(card);
    }
    grid.appendChild(frag);
    requestAnimationFrame(addNext);
  }
  addNext();
}

function _rebuildDisplay(restoreThumbs){
  refreshGrid(function(){
    if(restoreThumbs && S.thumbDone > 0) _restoreThumbsFromMemory();
  });
  refreshList();
}

// ═══ Init ════════════════════════════════════════════════
(function init(){
  loadPrefs();
  applyI18n();
  switchLang(LANG==="id"?"id":"en");
  renderTmpPath();
  renderThumbMode();
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
  // Event delegation for scene list (instead of per-row listeners)
  var tb=$("scene-tbody");
  tb.addEventListener("click",function(e){
    var tr=e.target.closest("tr");
    if(!tr||!tr.dataset)return;
    var i=parseInt(tr.dataset.idx,10);
    if(isNaN(i))return;
    if(e.ctrlKey||e.metaKey){toggleMark(i);}else{selectScene(i);}
  });
  tb.addEventListener("dblclick",function(e){
    var tr=e.target.closest("tr");
    if(!tr||!tr.dataset)return;
    var i=parseInt(tr.dataset.idx,10);
    if(isNaN(i))return;
    toggleMark(i);
  });
  // Event delegation for grid cards
  var grid=$("grid");
  grid.addEventListener("click",function(e){
    var card=e.target.closest(".scene-card");
    if(!card||!card.dataset)return;
    var i=parseInt(card.dataset.idx,10);
    if(isNaN(i))return;
    if(e.ctrlKey||e.metaKey){toggleMark(i);}else{selectScene(i);}
  });
  grid.addEventListener("dblclick",function(e){
    var card=e.target.closest(".scene-card");
    if(!card||!card.dataset)return;
    var i=parseInt(card.dataset.idx,10);
    if(isNaN(i))return;
    toggleMark(i);
  });
})();

// ── AE Version check: called once on startup ──────────────
var S_aeVer={num:0,name:'',sedSupport:false,checked:false};
function _applyVersionResult(num, major, name, sedSupport){
  S_aeVer.num        = num;
  S_aeVer.major      = major;
  S_aeVer.name       = name;
  S_aeVer.sedSupport = sedSupport;
  S_aeVer.checked    = true;
  applyAECompat();
}
function _fallbackVersionDetect(){
  // Use CEP HostEnvironment (no ExtendScript needed) as fallback
  try{
    var env = cs.hostEnvironment || cs.getHostEnvironment();
    if(env && env.appId === "AEFT" && env.appVersion){
      var clean = String(env.appVersion).replace(/[^0-9.]/g, "");
      var num = parseFloat(clean) || 0;
      var major = Math.floor(num);
      var names = {13:"CC 2014",14:"CC 2017",15:"CC 2018",16:"CC 2019",17:"2020",18:"2021",22:"2022",23:"2023",24:"2024",25:"2025",26:"2026"};
      var name = names[major] || (num > 0 ? "v"+String(env.appVersion) : "Unknown");
      var sedSupport = (num >= 22);
      _applyVersionResult(num, major, name, sedSupport);
      return;
    }
  }catch(e){}
  // Last resort: assume modern AE — force button visible
  S_aeVer.num        = 99;
  S_aeVer.major      = 99;
  S_aeVer.name       = "2026+";
  S_aeVer.sedSupport = true;
  S_aeVer.checked    = true;
  applyAECompat();
}
function checkAEVersion(){
  // AE may not be fully initialized when panel first loads.
  // If version=0, retry up to 3 times with 1s delay.
  var _retries = 0;
  function _doCheck(){
    try{
      callHost("getAEVersion",[],function(res){
        try{
          if(!res||!res.ok){
            if(_retries++ < 3){ setTimeout(_doCheck, 1000); return; }
            _fallbackVersionDetect();
            return;
          }
          var num = res.num||0;
          if(num === 0 && _retries++ < 3){
            // Version 0 = AE not ready yet, retry
            setTimeout(_doCheck, 1000); return;
          }
          _applyVersionResult(num, res.major||0, res.name||"", !!(res.sedSupport || num >= 22));
        }catch(e2){ _fallbackVersionDetect(); }
      });
    }catch(e){ _fallbackVersionDetect(); }
  }
  // Delay first check by 500ms to let AE finish loading
  setTimeout(_doCheck, 500);
}
function applyAECompat(){
  var btn=$('detect-btn');
  var notice=$('ae-compat-notice');
  var verEl=$('ae-compat-ver');
  if(!btn||!notice) return;
  // Safety net: if major >= 22 (AE 2022+), always show detect button
  // sedSupport should already be true, but guard against any parsing edge case
  var forceSupport = (S_aeVer.num >= 22);
  if(!S_aeVer.checked || S_aeVer.sedSupport || forceSupport){
    btn.style.display='';
    notice.style.display='none';
  } else {
    // Old AE (< 2022): hide detect button, show notice
    btn.style.display='none';
    notice.style.display='';
    if(verEl) verEl.textContent=t('ae_no_detect')+' (After Effects '+(S_aeVer.name||S_aeVer.num)+')';
    applyI18n();
  }
}

function _ready(){
  // Auto-clean leftover thumbnail files from previous AE sessions
  _cleanThumbTempOnStart();

  evalScript("getLayerName()",function(r){
    r=(r||"").replace(/^"|"$/g,""); if(r)$("layer-name").textContent=r;
  });
  checkAEVersion();
  setStatus(t("status_idle"),"ok");
  _initTopbarCollapse();
  _diagButtons();
  _initPanelVisibility();
  setTimeout(_checkUpdate, 2000);
}

function _cleanThumbTempOnStart(){
  if(!window.cep || !window.cep.fs) return;
  callHost("getTempFolderPath",[S.customTmpPath],function(res){
    if(!res || !res.path) return;
    var tmp = res.path.replace(/\\/g,"/").replace(/\/+$/, "");
    // Delete all sed_ff_* and sed_thumb_cache files
    try{
      var dir = window.cep.fs.readdir(tmp);
      if(dir && dir.data){
        for(var di = 0; di < dir.data.length; di++){
          var name = dir.data[di];
          if(name.indexOf("sed_ff_") === 0 || name.indexOf("sed_thumb_cache") === 0 ||
             name.indexOf("sed_results") === 0 || name.indexOf("sed_py_") === 0 ||
             name.indexOf("sed_jobs") === 0 || name.indexOf("sed_batch") === 0){
            window.cep.fs.deleteFileOrDirectory(tmp + "/" + name);
          }
        }
      }
    }catch(e){}
  });
}

// Prevent panel going blank when other CEP panels are closed/opened.
// CEP shares one Chromium renderer — other panels can disturb the DOM.
function _initPanelVisibility(){
  // Prevent closing AE when panel window is closed (undocked/floating)
  window.addEventListener("beforeunload",function(e){
    e.preventDefault();
    e.returnValue="";
  });
  // Ensure body and root are always visible
  document.body.style.visibility = "visible";
  document.body.style.display    = "block";
  var _panelHidden = false;

  // CSInterface visibility events
  try{
    var cs = new CSInterface();
    // Mark hidden when panel loses focus
    cs.addEventListener("com.adobe.csxs.events.panelHidden", function(){
      _panelHidden = true;
    });
    // Re-render when panel regains focus
    cs.addEventListener("com.adobe.csxs.events.panelShown", function(){
      document.body.style.visibility = "visible";
      document.body.style.display    = "block";
      _panelHidden = false;
      // Rebuild grid+list if DOM was cleared, else just restore thumbs
      if(S.scenes.length > 0 && !document.querySelector(".scene-card")){
        _rebuildDisplay(true);
      } else if(S.thumbDone > 0 && Object.keys(S.thumbs).length > 0){
        _restoreThumbsFromMemory();
      }
    });
    // Monitor visibility via Page Visibility API
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "visible"){
        document.body.style.visibility = "visible";
        _panelHidden = false;
        if(S.scenes.length > 0 && !document.querySelector(".scene-card")){
          _rebuildDisplay(true);
        } else if(S.thumbDone > 0){
          setTimeout(_restoreThumbsFromMemory, 100);
        }
      }
    });
    // pageshow — fires when the page is restored from bfcache (shared renderer reload)
    window.addEventListener("pageshow", function(){
      document.body.style.visibility = "visible";
      document.body.style.display    = "block";
      _panelHidden = false;
      if(S.scenes.length > 0){
        _rebuildDisplay(true);
      }
    });
  }catch(e){}

  // Periodic check: if panel appears blank, restore it
  setInterval(function(){
    if(document.body.style.display === "none" ||
       document.body.style.visibility === "hidden"){
      document.body.style.display    = "block";
      document.body.style.visibility = "visible";
    }
    // If DOM was wiped but data exists, rebuild it
    if(S.scenes.length > 0 && !document.querySelector(".scene-card") && !_panelHidden){
      _rebuildDisplay(false);
    }
  }, 2000);
}

// Restore thumbnails from S.thumbs memory after panel DOM is reset
function _restoreThumbsFromMemory(){
  var keys = Object.keys(S.thumbs);
  if(!keys.length) return;
  var ri = 0;
  function restoreBatch(){
    if(ri >= keys.length) return;
    var end = Math.min(ri + 100, keys.length);
    for(; ri < end; ri++){
      var idx = parseInt(keys[ri]);
      var dataURI = S.thumbs[idx];
      if(!dataURI) continue;
      var card = document.querySelector(".scene-card[data-idx='"+idx+"']");
      if(!card) continue;
      var wrap = card.querySelector(".card-img-wrap");
      if(wrap && !wrap.classList.contains("thumb-loaded")){
        _injectThumbDirect(idx, dataURI, S.thumbPaths[idx]||"");
      }
    }
    requestAnimationFrame(restoreBatch);
  }
  restoreBatch();
}

function _diagButtons(){
  var btns = ["thumb-btn","thumb-cancel-btn","read-btn","read-cancel-btn",
              "detect-btn","clean-btn","diag-btn",
              "split-all-btn","split-sel-btn","keep-sel-btn","export-btn"];
  var missing = [];
  btns.forEach(function(id){
    if(!$(id)) missing.push(id);
  });
  // Log critical functions
  var missingFns = [];
  var fns = ["startThumbGen","_startThumbAuto","acceptThumbJPG","_doStartThumb",
             "_captureNext","_finishThumbGen"];
  fns.forEach(function(fn){
    try{ if(typeof eval(fn) !== "function") missingFns.push(fn); }
    catch(e){ missingFns.push(fn+"(err)"); }
  });
  var msg = "[BUTTONS] missing_els=["+missing.join(",")+
            "] missing_fns=["+missingFns.join(",")+"]";
  _jsLog("diag", msg);
  if(missing.length || missingFns.length){
    setStatus("WARN: missing UI/fn — check diag log","warn");
  }
}

function _initTopbarCollapse(){
  var row2 = $("topbar-row2");
  var topbar = document.getElementById("topbar");
  if(!row2||!topbar) return;
  var baseW = 0;
  try{
    if(typeof ResizeObserver === "undefined") return;
    var ro = new ResizeObserver(function(entries){
      for(var i=0;i<entries.length;i++){
        var w = entries[i].contentRect.width;
        if(!baseW && w>0) baseW = w;
        if(!baseW) return;
        // Collapse saat panel <= 50% lebar awal
        if(w <= baseW * 0.5){
          row2.classList.add("collapsed");
        } else {
          row2.classList.remove("collapsed");
        }
      }
    });
    ro.observe(document.getElementById("main")||document.body);
  }catch(e){}
}

})();
