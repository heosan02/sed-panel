// ============================================================
// host.jsx  -  SED Panel CEP  v2.1

// ══════════════════════════════════════════════════════════
// AE VERSION DETECTION — called on panel startup
// Returns version number, name, and SED support flag
// Scene Edit Detection native: AE 2022+ (v22.0+)
// ══════════════════════════════════════════════════════════
function getAEVersion(){
    var raw="unknown", num=0, name="Unknown", sedSupport=false;
    try{
        raw = app.version;           // e.g. "26.1.0 (Build 12)" on AE 2026
        // parseFloat stops at first non-numeric char after decimal,
        // but "26.1.0" → parseFloat gives 26.1 which is correct.
        // Strip any parenthetical suffix first for safety.
        var clean = raw.replace(/\s*\(.*$/,"").replace(/[^0-9.]/g,"");
        num = parseFloat(clean) || 0;
    }catch(e){ raw="unknown"; num=0; }

    // Map version number to product name
    var names={
        13:"CC 2014", 14:"CC 2017", 15:"CC 2018",
        16:"CC 2019", 17:"2020",    18:"2021",
        22:"2022",    23:"2023",    24:"2024",
        25:"2025",    26:"2026"
    };
    var major = Math.floor(num);
    name = names[major] || (num>0 ? "v"+raw : "Unknown");

    // Scene Edit Detection available from AE 2022 (v22.0+)
    sedSupport = (num >= 22.0);

    return JSON.stringify({
        ok: true,
        raw: raw,
        num: num,
        major: major,
        name: name,
        sedSupport: sedSupport,
        fullName: "After Effects " + name + " (" + raw + ")"
    });
}

// (c) 2026 Heosan - @heosan
// ============================================================

function _pad2(n){ return (n<10?"0":"")+Math.floor(n); }
function _pad3(n){ return (n<10?"00":n<100?"0":"")+Math.floor(n); }

function _fmtTC(sec,fps){
    fps=fps||24; sec=Math.max(0,sec);
    var f=Math.round(sec*fps),ifps=Math.round(fps);
    var ff=f%ifps,ts=Math.floor(f/ifps);
    return _pad2(Math.floor(ts/3600))+":"+_pad2(Math.floor((ts%3600)/60))+":"+_pad2(ts%60)+":"+_pad2(ff);
}
function _fmtDur(sec){
    sec=Math.max(0,sec);
    var m=Math.floor(sec/60),s=(sec%60).toFixed(2);
    return (m>0?m+"m ":"")+s+"s";
}
function _getActiveLayer(comp){
    if(!comp||!(comp instanceof CompItem)) return null;
    // Pass 1: selected layer with video footage
    for(var i=1;i<=comp.numLayers;i++){
        try{
            var l=comp.layers[i];
            if(!l.selected) continue;
            var src=l.source;
            if(src&&(src instanceof FootageItem)&&src.hasVideo) return l;
        }catch(e){}
    }
    // Pass 2: any selected layer (older AE compat)
    for(var i=1;i<=comp.numLayers;i++){
        try{ if(comp.layers[i].selected) return comp.layers[i]; }catch(e){}
    }
    // Pass 3: first layer with video footage
    for(var j=1;j<=comp.numLayers;j++){
        try{
            var src=comp.layers[j].source;
            if(src&&(src instanceof FootageItem)&&src.hasVideo) return comp.layers[j];
        }catch(e){}
    }
    // Pass 4: any footage layer (widest compat)
    for(var j=1;j<=comp.numLayers;j++){
        try{
            if(comp.layers[j].source instanceof FootageItem) return comp.layers[j];
        }catch(e){}
    }
    return null;
}

function _getTmp(customPath){
    var base=null;
    if(customPath && customPath !== "undefined"){
        try{ base=new Folder(customPath); }catch(e1){ base=null; }
    }
    if(!base){
        try{ base=Folder.temp; }catch(e2){ base=null; }
    }
    if(!base){
        try{ base=(new File($.fileName)).parent; }catch(e3){ base=null; }
    }
    var f = base ? new Folder(base.fullName + "/Temp_thumbnail") : null;
    if(f && !f.exists){
        try{ f.create(); }catch(e4){}
    }
    if(!f || !f.exists){
        var scriptFolder = (new File($.fileName)).parent;
        f = new Folder(scriptFolder.fullName + "/Temp_thumbnail");
        if(!f.exists) f.create();
    }
    return f;
}

function selectCustomTempFolder(){
    try{
        var folder=Folder.selectDialog("Select SED Panel temp folder");
        if(!folder) return JSON.stringify({ok:false,cancelled:true});
        if(!folder.exists) folder.create();
        return JSON.stringify({ok:true,path:folder.fsName});
    }catch(e){
        return JSON.stringify({ok:false,msg:e.toString()});
    }
}

// ── Base64 encoder ────────────────────────────────────────
function _b64(file){
    file.encoding="BINARY";
    if(!file.open("r")) return null;
    var bin=""; try{ bin=file.read(); }catch(e){ file.close(); return null; }
    file.close();
    var ch="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out="",i=0,L=bin.length;
    while(i<L){
        var a=bin.charCodeAt(i)&0xff;
        var b=i+1<L?bin.charCodeAt(i+1)&0xff:0;
        var c=i+2<L?bin.charCodeAt(i+2)&0xff:0;
        out+=ch[(a>>2)&0x3f]+ch[((a&3)<<4)|((b>>4)&0xf)];
        out+=(i+1<L?ch[((b&0xf)<<2)|((c>>6)&3)]:"=")+( i+2<L?ch[c&0x3f]:"=");
        i+=3;
    }
    return out;
}

function _pngReady(file){
    if(!file || !file.exists || file.length < 1024) return false;
    var ok=false;
    try{
        file.encoding="BINARY";
        if(file.open("r")){
            file.seek(Math.max(0,file.length-12),0);
            var tail=file.read(12);
            file.close();
            if(tail && tail.length>=12){
                ok = tail.charCodeAt(4)===73 &&
                     tail.charCodeAt(5)===69 &&
                     tail.charCodeAt(6)===78 &&
                     tail.charCodeAt(7)===68;
            }
        }
    }catch(e){
        try{ file.close(); }catch(e2){}
        ok=false;
    }
    return ok;
}

function _findOut(f){
    if(_pngReady(f)) return f;
    var base=f.fsName.replace(/\.png$/i,"");
    var tries=[
        new File(base+"_00000.png"),new File(base+"_0.png"),
        new File(base+".PNG"),new File(base+"_00000.PNG")
    ];
    for(var i=0;i<tries.length;i++) if(_pngReady(tries[i])) return tries[i];
    if(f.parent&&f.parent.exists){
        var all=f.parent.getFiles("*.png");
        var bn=f.name.replace(/\.png$/i,"");
        for(var a=0;a<all.length;a++) if(all[a].name.indexOf(bn)===0 && _pngReady(all[a])) return all[a];
    }
    return null;
}

function _waitForOut(f, ms){
    // Initial delay: give AE time to start writing (skip first few polls)
    // Then poll at 50ms intervals — AE typically writes PNG in 100-400ms
    var elapsed=0, found=null;
    var step=50, initDelay=80;
    try{ $.sleep(initDelay); }catch(e){}
    elapsed=initDelay;
    while(elapsed <= ms){
        found=_findOut(f);
        if(found) return found;
        try{ $.sleep(step); }catch(e){}
        elapsed += step;
    }
    return _findOut(f);
}

function _fileURI(file){
    try{
        if(file.absoluteURI) return file.absoluteURI;
    }catch(e1){}
    var p=file.fsName.replace(/\\/g,"/");
    if(p.charAt(0)!="/") p="/"+p;
    return "file://"+p.replace(/ /g,"%20");
}

// ══════════════════════════════════════════════════════════
// THUMBNAIL ENGINE — 3 strategies, no PNG template needed
// ══════════════════════════════════════════════════════════

// Strategy 1: "Save Frame As File" command (AE built-in, silent)
// Sets CTI to target frame, then triggers saveFrameToPng
function _captureSaveFrame(comp, snapSec, outFile){
    try{
        comp.saveFrameToPng(snapSec, outFile);
        return _waitForOut(outFile, 2500);
    }catch(e){}
    return null;
}

// Strategy 2: Render Queue with EXISTING output module template
// Uses whatever templates AE has installed — avoids PNG-specific search
// Key fix: use comp.duration instead of custom timeSpan to avoid AE warning
function _captureViaRQ(comp, snapSec, outFile){
    var fps=comp.frameRate;
    var snap=Math.round(snapSec*fps)/fps;

    // Create a tiny 1-frame duplicate comp
    var miniComp=null, rq=null;
    try{
        // Duplicate the comp
        miniComp=comp.duplicate();
        miniComp.name="__SED_THUMB_TMP__";

        // Trim to exactly 1 frame at the target time
        // Set duration to 1 frame (avoids timeSpan warning)
        miniComp.duration = 1/fps;

        // Shift all layers so target frame is at t=0
        var offset=snap; // how much to shift back
        for(var li=1;li<=miniComp.numLayers;li++){
            try{
                var lyr=miniComp.layers[li];
                // Shift layer start time
                lyr.startTime -= offset;
            }catch(e){}
        }
        miniComp.displayStartTime=0;

        // Add to render queue
        rq=app.project.renderQueue.items.add(miniComp);

        // Use first available template (don't filter for PNG)
        var om=rq.outputModule(1);
        var tpls=om.templates;

        // Find best template: prefer anything with image/png/tiff/jpeg
        var imgWords=["png","tiff","tif","jpeg","jpg","image","bmp","dpx","exr","hdr","rla","rpf","sgi","tga"];
        var chosen=null;
        for(var iw=0;iw<imgWords.length;iw++){
            for(var t=0;t<tpls.length;t++){
                if(tpls[t].toLowerCase().indexOf(imgWords[iw])>=0){
                    chosen=tpls[t]; break;
                }
            }
            if(chosen) break;
        }

        // If no image template found, use whatever is default
        if(!chosen && tpls.length>0) chosen=tpls[0];
        if(chosen) try{ om.applyTemplate(chosen); }catch(e){}

        om.file=outFile;

        // NO timeSpan override — use full comp duration (which is 1 frame)
        rq.render();
        rq.remove(); rq=null;
        miniComp.remove(); miniComp=null;

        return _waitForOut(outFile, 3500);
    }catch(e){
        if(rq){ try{ rq.remove(); }catch(re){} }
        if(miniComp){ try{ miniComp.remove(); }catch(de){} }
        return null;
    }
}

// Strategy 3: Read from source footage directly (fastest, no render needed)
// Works when layer source is a video file with accessible frames
function _captureFromSource(layer, snapSec, outFile){
    if(!layer||!(layer.source instanceof FootageItem)) return null;
    var src=layer.source;
    if(!(src.mainSource instanceof FileSource)) return null;

    var srcFile=src.mainSource.file;
    if(!srcFile||!srcFile.exists) return null;

    // For image sequences and video: use thumbnail via system
    // ExtendScript can't read video frames directly.
    // But we can use the footage thumbnail if available.
    return null; // Not implementable purely in ExtendScript
}

// Strategy 4: Use AE "snapshot" — take viewer snapshot
// This captures whatever is visible in the AE viewer
// Works by: set CTI → app.callHandler("takesnapshot") 
// But this is viewer-specific and not reliable cross-version.
// Skip for now.

// ── Main capture function ─────────────────────────────────
function _captureFrame(comp, snapSec, outFile){
    var result=_captureSaveFrame(comp,snapSec,outFile);
    if(result) return result;
    // Try RQ with mini comp (most reliable across all AE versions)
    result=_captureViaRQ(comp,snapSec,outFile);
    if(result) return result;
    return null;
}

// ── captureSceneFrames ────────────────────────────────────
function captureSceneFrames(startSec, durSec, sceneIdx, customPath){
    // v5.5 FINAL: Return file path only — NO base64 encoding in ExtendScript.
    // Base64 encoding large PNG (1080p/4K = 3-10MB) inside ExtendScript causes
    // CEP bridge JSON overflow → crash at scene 2-3.
    // Reading is done in JS side via cep.fs.readFile (much more efficient).
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem))
        return JSON.stringify({ok:false,msg:"No active comp."});

    var fps=comp.frameRate, saved=comp.time;
    var tmp=_getTmp(customPath);

    // Snap at 30% into scene — avoids black first frames
    var snapSec = startSec + (durSec * 0.3);
    snapSec = Math.round(snapSec * fps) / fps;
    if(snapSec < startSec) snapSec = startSec;
    var lastFrame = startSec + durSec - (1/fps);
    if(snapSec > lastFrame) snapSec = startSec;

    var pfx = "sed_sc" + _pad3(sceneIdx+1) + "_";
    var outF = new File(tmp.fullName + "/" + pfx + Math.round(snapSec*1000) + ".png");

    // Reuse cached file if valid
    var cached = _findOut(outF);
    if(cached){
        try{ comp.time=saved; }catch(ce){}
        return JSON.stringify({ok:true,cached:true,path:cached.fsName,sceneIdx:sceneIdx});
    }

    // Remove stale file
    if(outF.exists){ try{ outF.remove(); }catch(e1){} }

    // Use _captureFrame: Strategy 1 (saveFrameToPng) → Strategy 2 (RQ fallback)
    var found = _captureFrame(comp, snapSec, outF);

    try{ comp.time=saved; }catch(e){}

    if(!found)
        return JSON.stringify({ok:false,msg:"Capture failed sc"+(sceneIdx+1),sceneIdx:sceneIdx});

    // Return path only — JS panel reads file via cep.fs (no size limit issue)
    return JSON.stringify({ok:true,path:found.fsName,sceneIdx:sceneIdx,frameSec:snapSec});
}

// ── getDiagnostics ────────────────────────────────────────
function getDiagnostics(customPath){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem))
        return JSON.stringify({ok:false,msg:"No active comp."});
    var rq=null;
    var info={aeVersion:app.version,tempFolder:_getTmp(customPath).fsName,
              compName:comp.name,compFps:comp.frameRate,
              compDur:comp.duration,compW:comp.width,compH:comp.height};
    try{
        rq=app.project.renderQueue.items.add(comp);
        var om=rq.outputModule(1);
        info.templates=om.templates;
        rq.remove(); rq=null;
    }catch(e){
        if(rq){ try{ rq.remove(); }catch(re){} }
        info.rqError=e.toString();
    }
    return JSON.stringify({ok:true,info:info});
}

// ── readMarkersFromLayer ──────────────────────────────────
function readMarkersFromLayer(layer,comp){
    var fps=comp.frameRate,dur=comp.duration,cuts=[0];
    try{
        var mkr=layer.property("Marker");
        if(mkr&&mkr.numKeys>0){
            for(var k=1;k<=mkr.numKeys;k++){
                var t=mkr.keyTime(k);
                if(t>0.001&&t<dur-0.001) cuts.push(t);
            }
        }
    }catch(e){ return JSON.stringify({ok:false,msg:"Failed to read markers: "+e.toString()}); }
    cuts.sort(function(a,b){return a-b;});
    cuts.push(dur);
    if(cuts.length<3) return JSON.stringify({ok:false,msg:"No cut points found. Run detection first."});
    var scenes=[];
    for(var i=0;i<cuts.length-1;i++){
        var s=cuts[i],e=cuts[i+1];
        scenes.push({index:i+1,start_sec:s,end_sec:e,dur_sec:e-s,
            start_tc:_fmtTC(s,fps),end_tc:_fmtTC(e,fps),
            dur_tc:_fmtTC(e-s,fps),dur_str:_fmtDur(e-s),fps:fps});
    }
    return JSON.stringify({ok:true,scenes:scenes,layerName:layer.name,fps:fps});
}

function runDetect(sensitivity){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem))
        return JSON.stringify({ok:false,msg:"Activate a composition first."});
    var layer=_getActiveLayer(comp);
    if(!layer) return JSON.stringify({ok:false,msg:"No footage layer found.\nSelect a video layer in Timeline."});

    // Detect AE version: match parsing logic used in getAEVersion()
    // parseFloat("26.1.0 (Build 12)") only gives 26 — need to strip suffix first
    var aeVer=0;
    try{
        var rawVer=app.version;
        var cleanVer=rawVer.replace(/\s*\(.*$/,"").replace(/[^0-9.]/g,"");
        aeVer=parseFloat(cleanVer)||0;
    }catch(ev){}

    var threshMap={"Low":20,"Medium":50,"High":75};
    app.beginUndoGroup("SED: Detect");
    var ok=false, method="";

    // Strategy 1: Native API (AE 2022+ v22.0+, including AE 2026 v26.x)
    // Try multiple call signatures — AE 2025/2026 may behave differently
    if(aeVer>=22){
        // 1a: Standard: {sensitivity, apply:true}
        try{
            layer.doSceneEditDetection({sensitivity:threshMap[sensitivity]||50,apply:true});
            ok=true; method="native";
        }catch(e1a){ ok=false; }

        // 1b: Without options object (uses AE defaults — fallback for API signature changes)
        if(!ok){
            try{
                layer.doSceneEditDetection();
                ok=true; method="native_default";
            }catch(e1b){ ok=false; }
        }

        // 1c: Sensitivity only, no apply key (some AE 2025/2026 builds)
        if(!ok){
            try{
                layer.doSceneEditDetection({sensitivity:threshMap[sensitivity]||50});
                ok=true; method="native_noApply";
            }catch(e1c){ ok=false; }
        }
    }

    // Strategy 2: Menu command (covers edge cases and older AE versions)
    if(!ok){
        try{
            var menuNames=["Scene Edit Detection...","Scene Edit Detection",
                           "Detect Scene Edit","Scene Edit",
                           "Analyze Footage","Detect Cuts"];
            for(var m=0;m<menuNames.length;m++){
                var mid=app.findMenuCommandId(menuNames[m]);
                if(mid){ app.executeCommand(mid); ok=true; method="menu"; break; }
            }
        }catch(e2){ ok=false; }
    }

    app.endUndoGroup();

    if(!ok){
        var verMsg = aeVer>0 ? "AE version detected: "+app.version : "";
        var needVer = aeVer>0 && aeVer<22;
        return JSON.stringify({ok:false,
            msg:"Scene Edit Detection not available"+(needVer?" on this AE version (requires AE 2022+)":"")+"."
               +"\n\nRun manually:\n  Layer → Scene Edit Detection"
               +"\n  Choose 'Create Layer Markers' → OK"
               +"\n\nThen click [Read Markers]."
               +(verMsg?"\n\n"+verMsg:"")});
    }

    return readMarkersFromLayer(layer,comp);
}

function readMarkers(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Activate a composition first."});
    var layer=_getActiveLayer(comp);
    if(!layer) return JSON.stringify({ok:false,msg:"No footage layer found."});
    return readMarkersFromLayer(layer,comp);
}

function getLayerName(){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return "";
        var l=_getActiveLayer(comp); return l?l.name:"";
    }catch(e){ return ""; }
}

function seekFrame(timeSec){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return "no_comp";
        comp.time=timeSec; return "ok";
    }catch(e){ return "err"; }
}

function goToScene(startSec,durSec){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false});
        comp.time=startSec; comp.workAreaStart=startSec; comp.workAreaDuration=durSec;
        return JSON.stringify({ok:true});
    }catch(e){ return JSON.stringify({ok:false,msg:e.toString()}); }
}

function goToFrame(startSec){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false});
        comp.time=startSec; return JSON.stringify({ok:true});
    }catch(e){ return JSON.stringify({ok:false}); }
}

function ramPreview(){
    try{
        var pid=app.findMenuCommandId("RAM Preview");
        if(!pid) pid=app.findMenuCommandId("Preview");
        if(pid) app.executeCommand(pid);
        return JSON.stringify({ok:true});
    }catch(e){ return JSON.stringify({ok:false}); }
}

function splitAtCuts(cutTimesJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var layer=_getActiveLayer(comp);
    if(!layer) return JSON.stringify({ok:false,msg:"No layer found."});
    var cuts; try{ cuts=JSON.parse(cutTimesJson); }catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    cuts.sort(function(a,b){return a-b;});
    var origIdx=-1;
    for(var li=1;li<=comp.numLayers;li++){ if(comp.layers[li]===layer){ origIdx=li; break; } }
    if(origIdx<0) return JSON.stringify({ok:false,msg:"Layer not in comp."});
    var fps=comp.frameRate;
    app.beginUndoGroup("SED: Split");
    var count=0;
    try{
        // v6.0 OPT: Strip ALL markers from the source layer BEFORE splitting.
        // AE redistributes markers across each splitLayer() call — with 180 markers
        // this causes severe lag and occasional crash. Removing first = instant splits.
        var splitMarkers = layer.property("Marker");
        if(splitMarkers){
            while(splitMarkers.numKeys > 0){
                splitMarkers.removeKey(1);
            }
        }

        for(var c=0;c<cuts.length;c++){
            var cur=comp.layers[origIdx]; if(!cur) break;
            var snap=Math.round(cuts[c]*fps)/fps;
            if(snap<=cur.inPoint+(1/fps)*0.5) continue;
            if(snap>=cur.outPoint-(1/fps)*0.5) continue;
            cur.splitLayer(snap); count++;
        }
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Split failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,count:count});
}


// ══════════════════════════════════════════════════════════
// BATCH THUMBNAIL ENGINE — v5.5 optimization
// Renders multiple scene frames in one script call, reducing
// per-call overhead from CEP bridge significantly
// ══════════════════════════════════════════════════════════
function captureSceneFramesBatch(batchJson, customPath){
    var batch;
    try{ batch=JSON.parse(batchJson); }catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    if(!batch||!batch.length) return JSON.stringify({ok:false,msg:"Empty batch"}); 
    
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"No active comp"});
    
    var tmpFolder=_getTmp(customPath);
    var results=[];
    
    for(var b=0;b<batch.length;b++){
        var item=batch[b];
        var idx=item.idx;
        var start_sec=item.start_sec;
        var dur_sec=item.dur_sec;
        
        // Snap frame: use midpoint of scene for better representation
        var snapSec = start_sec + Math.min(dur_sec * 0.1, 0.5);
        var outFile=new File(tmpFolder.fullName+"/sed_thumb_"+idx+"_"+Math.floor(snapSec*1000)+".png");
        
        var found=null;
        try{
            // Try saveFrameToPng first (fastest method)
            comp.saveFrameToPng(snapSec, outFile);
            found=_waitForOut(outFile, 2000);
        }catch(e1){
            found=null;
        }
        
        if(found){
            var b64=_b64(found);
            if(b64){
                results.push({ok:true, idx:idx, dataURI:"data:image/png;base64,"+b64, path:found.fsName});
                // Clean up immediately after reading to free disk space
                try{ found.remove(); }catch(e2){}
            } else {
                results.push({ok:true, idx:idx, uri:_fileURI(found), path:found.fsName});
            }
        } else {
            results.push({ok:false, idx:idx, msg:"Frame not captured"});
        }
    }
    
    return JSON.stringify({ok:true, results:results});
}

function keepOnlyScenes(scenesJson,allScenesJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var layer=_getActiveLayer(comp);
    if(!layer) return JSON.stringify({ok:false,msg:"No layer found."});
    var keepS,allS;
    try{ keepS=JSON.parse(scenesJson); allS=JSON.parse(allScenesJson); }
    catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    if(!keepS||!keepS.length) return JSON.stringify({ok:false,msg:"No scenes to keep."});
    
    app.beginUndoGroup("SED: Keep Only");
    try{
        // v6.0 OPT: Remove ALL markers from original layer FIRST (1 pass only)
        // Then duplicate() already yields clean layers — no per-duplicate marker cleanup needed.
        // Old approach: N_keep × N_markers iterations (e.g. 21 keeps × 180 markers = 3780 ops)
        // New approach: 1 × N_markers + N_keep × 0 = 180 ops total → much faster
        var origMarkers = layer.property("Marker");
        if(origMarkers){
            while(origMarkers.numKeys > 0){
                origMarkers.removeKey(1);
            }
        }

        // Iterate REVERSE: scene[0] duplicated last → sits at top of AE stack (layer index 1)
        for(var k=keepS.length-1; k>=0; k--){
            var sc = keepS[k];
            var dup = layer.duplicate();
            var st = sc.start_sec;
            var ed = sc.start_sec + sc.dur_sec;
            if(st < dup.startTime) st = dup.startTime;
            dup.inPoint  = st;
            dup.outPoint = ed;
            dup.name = dup.source ? dup.source.name : dup.name;
            // No marker cleanup needed — original already stripped above
        }
        layer.remove();
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,kept:keepS.length,deleted:allS.length-keepS.length});
}

function addCompMarkers(scenesJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var scenes; try{ scenes=JSON.parse(scenesJson); }catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    var markers=comp.property("Marker");
    app.beginUndoGroup("SED: Comp Markers");
    try{
        for(var i=0;i<scenes.length;i++){
            var mv=new MarkerValue("Scene "+scenes[i].index);
            mv.duration=scenes[i].dur_sec;
            markers.setValueAtTime(scenes[i].start_sec,mv);
        }
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,count:scenes.length});
}

function clearLayerMarkers(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var layer=_getActiveLayer(comp);
    if(!layer) return JSON.stringify({ok:false,msg:"No target layer."});
    var markers=layer.property("Marker");
    app.beginUndoGroup("SED: Clear Markers");
    try{ while(markers.numKeys>0) markers.removeKey(1); }
    catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true});
}

function exportToRenderQueue(scenesJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var scenes; try{ scenes=JSON.parse(scenesJson); }catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    if(!scenes||!scenes.length) return JSON.stringify({ok:false,msg:"No scenes selected."});
    app.beginUndoGroup("SED: Export RQ");
    var added=0;
    try{
        for(var s=0;s<scenes.length;s++){
            var sc=scenes[s],dup=comp.duplicate();
            dup.name=comp.name+"_Sc"+_pad3(sc.index);
            dup.workAreaStart=sc.start_sec; dup.workAreaDuration=sc.dur_sec;
            var rq=app.project.renderQueue.items.add(dup);
            rq.timeSpanStart=sc.start_sec; rq.timeSpanDuration=sc.dur_sec;
            added++;
        }
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Export failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,count:added});
}

function cleanTempFolder(customPath){
    var tmp=_getTmp(customPath);
    var files=tmp.getFiles("*.png");
    var n=0;
    for(var f=0;f<files.length;f++){ try{ files[f].remove(); n++; }catch(e){} }
    return JSON.stringify({ok:true,deleted:n});
}
