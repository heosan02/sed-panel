// ============================================================
// host.jsx  -  SED Panel CEP  v3.1  (Multi-Layer)

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

    // Normalize: replace all backslashes with forward slashes (AE ExtendScript requirement)
    function _norm(p){ return p ? p.replace(/\\/g,"/") : p; }

    if(customPath && customPath !== "undefined" && customPath !== ""){
        try{
            base = new Folder(_norm(customPath));
            if(base.exists){
                // Verify folder is actually writable
                var testF = new File(base.fullName + "/sed_write_test.tmp");
                testF.encoding = "UTF8";
                if(!testF.open("w")){ base = null; }
                else{ testF.write("1"); testF.close(); testF.remove(); }
            } else {
                try{ base.create(); }catch(ec){ base = null; }
            }
        }catch(e1){ base = null; }
    }

    // Fallback 1: system temp folder
    if(!base){
        try{
            base = Folder.temp;
            if(base && !base.exists) base = null;
        }catch(e2){ base = null; }
    }

    // Fallback 2: script parent folder
    if(!base){
        try{ base = (new File($.fileName)).parent; }catch(e3){ base = null; }
    }

    // Build Temp_thumbnail subfolder
    var f = base ? new Folder(_norm(base.fullName) + "/Temp_thumbnail") : null;
    if(f && !f.exists){
        try{ f.create(); }catch(e4){ f = null; }
    }

    // Last resort: next to host.jsx
    if(!f || !f.exists){
        var scriptFolder = (new File($.fileName)).parent;
        f = new Folder(_norm(scriptFolder.fullName) + "/Temp_thumbnail");
        if(!f.exists){ try{ f.create(); }catch(e5){} }
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

// ══════════════════════════════════════════════════════════
// THUMBNAIL ENGINE — 3 strategies, no PNG template needed
// ══════════════════════════════════════════════════════════

// Strategy 1: saveFrameToPng — set comp.time first, then save
// AE requires comp.time to be set to the target frame before saveFrameToPng
// outFile.fsName must use forward slashes (ExtendScript requirement on Windows)
function _captureSaveFrame(comp, snapSec, outFile){
    try{
        // Clamp to valid comp range
        var t = Math.max(0, Math.min(snapSec, comp.duration - (1/comp.frameRate)));
        // Set CTI (Current Time Indicator) to target frame
        comp.time = t;
        // Ensure outFile path uses forward slashes
        var normPath = outFile.fsName.replace(/\\/g, "/");
        var normFile = new File(normPath);
        comp.saveFrameToPng(t, normFile);
        return _waitForOut(normFile, 3500);
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
    var outF = new File(tmp.fullName.replace(/\\/g,"/") + "/" + pfx + Math.round(snapSec*1000) + ".png");

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

    if(!found){
        _writeLog("thumb","[FAIL] sc"+(sceneIdx+1)+" snapSec="+snapSec.toFixed(3)+
            " tmpDir="+tmp.fullName+" tmpExists="+tmp.exists+
            " outPath="+outF.fsName+" comp="+comp.name+
            " compW="+comp.width+" compH="+comp.height+
            " aeVer="+app.version);
        return JSON.stringify({ok:false,msg:"Capture failed sc"+(sceneIdx+1),sceneIdx:sceneIdx});
    }

    _writeLog("thumb","[OK] sc"+(sceneIdx+1)+" path="+found.fsName+" size="+found.length);
    // Return path only — JS panel reads file via cep.fs (no size limit issue)
    return JSON.stringify({ok:true,path:found.fsName,sceneIdx:sceneIdx,frameSec:snapSec});
}

// ── readMarkersFromLayer ──────────────────────────────────
function readMarkersFromLayer(layer,comp){
    var fps=comp.frameRate,dur=comp.duration,cuts=[0];
    // Find layer index in comp
    var layerIdx = 1;
    try{
        for(var li=1; li<=comp.numLayers; li++){
            if(comp.layer(li) === layer){ layerIdx = li; break; }
        }
    }catch(e){}
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
    // NOTE: cuts.length===2 means [0, dur] with zero internal markers —
    // that is a perfectly valid single-scene result (e.g. after Merge
    // Scene collapses everything into one scene). Only bail out if we
    // somehow have fewer than 2 boundary points, which shouldn't happen.
    if(cuts.length<2) return JSON.stringify({ok:false,msg:"No cut points found. Run detection first."});
    var scenes=[];
    for(var i=0;i<cuts.length-1;i++){
        var s=cuts[i],e=cuts[i+1];
        scenes.push({index:i+1,start_sec:s,end_sec:e,dur_sec:e-s,
            start_tc:_fmtTC(s,fps),end_tc:_fmtTC(e,fps),
            dur_tc:_fmtTC(e-s,fps),dur_str:_fmtDur(e-s),fps:fps,
            layerIndex: layerIdx, layerName: layer.name});
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

    return readMarkers();
}

function _isValidMarkerLayer(l){
    try{
        if(l.adjustmentLayer) return false;
        try{ if(l.nullLayer) return false; }catch(e){}
        if(l instanceof TextLayer || l instanceof ShapeLayer) return false;
        var src = l.source;
        if(!src) return false;
        if(src instanceof FootageItem){
            try{ if(src.mainSource instanceof SolidSource) return false; }catch(e){}
            if(!src.file || !src.hasVideo) return false;
        }else if(!(src instanceof CompItem)){
            return false;
        }
        return true;
    }catch(e){ return false; }
}

function readMarkers(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Activate a composition first."});

    // Collect markers from ALL valid marker layers in the comp.
    // Single-pass scan (no Pass 1/Pass 2 split) ensures CONSISTENT results
    // whether called from the panel or from within mergeScenes/keepOnlyScenes.
    var allLayerMarkers = [];
    var fps = comp.frameRate;
    var dur = comp.duration;
    var eps = 0.5 / fps;

    for(var li = 1; li <= comp.numLayers; li++){
        try{
            var l = comp.layer(li);
            if(!(l instanceof AVLayer)) continue;
            if(!_isValidMarkerLayer(l)) continue;
            var mkr = l.property("Marker");
            if(!mkr || mkr.numKeys === 0) continue;
            for(var k = 1; k <= mkr.numKeys; k++){
                var t = mkr.keyTime(k);
                if(t > 0.001 && t < dur - 0.001){
                    allLayerMarkers.push({time: t, layerIndex: li, layerName: l.name});
                }
            }
        }catch(e){}
    }

    if(allLayerMarkers.length > 0) return _buildScenesFromMarkers(allLayerMarkers, dur, fps);

    // Fall back to single-layer active layer search (original behavior)
    var singleLayer = _getActiveLayer(comp);
    if(singleLayer) return readMarkersFromLayer(singleLayer, comp);
    return JSON.stringify({ok:false,msg:"No layers with markers found."});
}

function _buildScenesFromMarkers(markers, dur, fps){
    if(markers.length === 0) return JSON.stringify({ok:false,msg:"No markers found."});
    var eps = 0.5 / fps;
    markers.sort(function(a,b){ return a.time - b.time; });
    var uniqueMarkers = [];
    for(var mi = 0; mi < markers.length; mi++){
        if(uniqueMarkers.length === 0 ||
           Math.abs(markers[mi].time - uniqueMarkers[uniqueMarkers.length-1].time) > eps){
            uniqueMarkers.push(markers[mi]);
        }
    }
    var scenes = [];
    var prevCut = 0;
    for(var si = 0; si < uniqueMarkers.length; si++){
        var ct = uniqueMarkers[si].time;
        scenes.push({
            index: si + 1,
            start_sec: prevCut,
            end_sec: ct,
            dur_sec: ct - prevCut,
            start_tc: _fmtTC(prevCut, fps),
            end_tc: _fmtTC(ct, fps),
            dur_tc: _fmtTC(ct - prevCut, fps),
            dur_str: _fmtDur(ct - prevCut),
            fps: fps,
            layerIndex: uniqueMarkers[si].layerIndex,
            layerName: uniqueMarkers[si].layerName
        });
        prevCut = ct;
    }
    scenes.push({
        index: scenes.length + 1,
        start_sec: prevCut,
        end_sec: dur,
        dur_sec: dur - prevCut,
        start_tc: _fmtTC(prevCut, fps),
        end_tc: _fmtTC(dur, fps),
        dur_tc: _fmtTC(dur - prevCut, fps),
        dur_str: _fmtDur(dur - prevCut),
        fps: fps,
        layerIndex: scenes.length > 0 ? scenes[scenes.length-1].layerIndex : 1,
        layerName: scenes.length > 0 ? scenes[scenes.length-1].layerName : ""
    });
    var layerNameSet = {};
    for(var ni = 0; ni < uniqueMarkers.length; ni++){
        layerNameSet[uniqueMarkers[ni].layerName] = true;
    }
    var layerNames = [];
    for(var ln in layerNameSet){ if(layerNameSet.hasOwnProperty(ln)) layerNames.push(ln); }
    var displayName = layerNames.length === 1 ? layerNames[0] : (layerNames.length + " layers");
    return JSON.stringify({
        ok: true,
        scenes: scenes,
        layerName: displayName,
        fps: fps,
        multiLayer: uniqueMarkers.length > 1
    });
}

function getLayerName(){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return "";
        var l=_getActiveLayer(comp); return l?l.name:"";
    }catch(e){ return ""; }
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


function keepOnlyScenes(scenesJson,allScenesJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var keepS,allS;
    try{ keepS=JSON.parse(scenesJson); allS=JSON.parse(allScenesJson); }
    catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    if(!keepS||!keepS.length) return JSON.stringify({ok:false,msg:"No scenes to keep."});
    
    var fps = comp.frameRate;
    app.beginUndoGroup("SED: Keep Only");
    try{
        // Group kept scenes by layerIndex
        var layerGroups = {};
        var hasLayerIndex = false;
        for(var kg = 0; kg < keepS.length; kg++){
            var ks = keepS[kg];
            var li = ks.layerIndex || 0;
            if(!layerGroups[li]) layerGroups[li] = [];
            layerGroups[li].push(ks);
            if(li > 0) hasLayerIndex = true;
        }

        // Collect keys manually (ExtendScript has no Object.keys)
        var layerKeys = [];
        for(var lk in layerGroups){ if(layerGroups.hasOwnProperty(lk)) layerKeys.push(lk); }

        // Process layers from highest index to lowest so removals don't shift indices
        layerKeys.sort(function(a,b){ return parseInt(b) - parseInt(a); });

        for(var lg = 0; lg < layerKeys.length; lg++){
            var lidx = parseInt(layerKeys[lg]);
            var layer = null;
            var layerScenes = layerGroups[lidx];

            if(lidx > 0 && lidx <= comp.numLayers){
                // Known layerIndex: find the actual layer
                layer = comp.layer(lidx);
                if(!layer || !layer.property("Marker")) continue;
            } else if(lidx === 0){
                // Backward compat: scenes without layerIndex
                layer = _getActiveLayer(comp);
                if(!layer) continue;
            }

            // Remove ALL markers from this layer first
            var origMarkers = layer.property("Marker");
            if(origMarkers){
                while(origMarkers.numKeys > 0){
                    origMarkers.removeKey(1);
                }
            }

            // Duplicate for each kept scene (reverse order = top to bottom)
            for(var k2 = layerScenes.length - 1; k2 >= 0; k2--){
                var sc = layerScenes[k2];
                var dup = layer.duplicate();
                var st = sc.start_sec;
                var ed = sc.start_sec + sc.dur_sec;
                if(st < dup.startTime) st = dup.startTime;
                dup.inPoint  = st;
                dup.outPoint = ed;
                dup.name = dup.source ? dup.source.name : dup.name;
                try{
                    var dupMarkers = dup.property("Marker");
                    if(dupMarkers){
                        var mv = new MarkerValue("" + sc.index);
                        dupMarkers.setValueAtTime(st, mv);
                    }
                }catch(em){}
            }
            layer.remove();
        }
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
            var mv=new MarkerValue(""+scenes[i].index);
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

// ══════════════════════════════════════════════════════════
// MERGE SCENE — v8.3
// Combines 2+ ADJACENT scenes into a single scene by removing the
// AE layer markers that sit BETWEEN them (the boundary markers
// internal to the merged group), keeping only the group's outer
// boundaries. Multiple independent groups can be merged in a single
// call (e.g. merge 1+2 AND 5+6+7 at once), all under one undo step.
//
// groupsJson: array of groups, each group = array of scene objects
//   (the exact scene records the JS panel already has in S.scenes),
//   sorted ascending by start_sec, already verified adjacent by JS.
// Marker matching is done by TIME (with small epsilon) rather than by
// trusting array order, since markers are the ground truth in AE.
function mergeScenes(groupsJson){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});

    var groups;
    try{ groups = JSON.parse(groupsJson); }
    catch(e){ return JSON.stringify({ok:false,msg:"Parse error: "+e.toString()}); }
    if(!groups || !groups.length) return JSON.stringify({ok:false,msg:"No groups to merge."});

    var fps = comp.frameRate;
    var dur = comp.duration;
    var eps = 1/fps*0.5; // half-frame tolerance

    // v9.0: Group the groups by layerIndex so each layer is processed independently
    var groupsByLayer = {};
    var mergedCount = 0;
    for(var g=0; g<groups.length; g++){
        var grp = groups[g];
        if(!grp || grp.length < 2) continue;
        var li = grp[0].layerIndex || 0;
        if(!groupsByLayer[li]) groupsByLayer[li] = [];
        groupsByLayer[li].push(grp);
        mergedCount++;
    }

    if(mergedCount === 0)
        return JSON.stringify({ok:false,msg:"No valid groups (need 2+ adjacent scenes each)."});

    // ── Process each layer's groups independently ──
    var totalRemoved = 0;
    var allRemoveTimes = [];

    app.beginUndoGroup("SED: Merge Scenes");
    try{
        for(var liKey in groupsByLayer){
            if(!groupsByLayer.hasOwnProperty(liKey)) continue;
            var layerGroups = groupsByLayer[liKey];
            var layerIdx = parseInt(liKey);
            var markerLayer = null;

            // Find the actual layer for this group
            if(layerIdx > 0 && layerIdx <= comp.numLayers){
                var tl = comp.layer(layerIdx);
                if(tl && tl instanceof AVLayer && tl.property("Marker")){
                    markerLayer = tl;
                }
            }
            if(!markerLayer) markerLayer = _getActiveLayer(comp);
            if(!markerLayer || !markerLayer.property("Marker")) continue;

            // Collect removeTimes for this layer only
            var layerRemoveTimes = [];
            for(var lg=0; lg<layerGroups.length; lg++){
                var grp2 = layerGroups[lg];
                for(var s2=1; s2<grp2.length; s2++){
                    var rt = grp2[s2].start_sec;
                    layerRemoveTimes.push(rt);
                    allRemoveTimes.push(rt);
                }
            }

            // Remove internal boundary markers from this layer
            var mkr2 = markerLayer.property("Marker");
            if(mkr2 && mkr2.numKeys > 0){
                for(var k2 = mkr2.numKeys; k2 >= 1; k2--){
                    var kt2 = mkr2.keyTime(k2);
                    for(var r2 = 0; r2 < layerRemoveTimes.length; r2++){
                        if(Math.abs(kt2 - layerRemoveTimes[r2]) <= eps){
                            mkr2.removeKey(k2);
                            totalRemoved++;
                            break;
                        }
                    }
                }
            }
        }
    }catch(e){
        app.endUndoGroup();
        return JSON.stringify({ok:false,msg:"Merge failed: "+e.toString()});
    }
    app.endUndoGroup();

    if(totalRemoved === 0){
        // Per-layer search failed — try searching ALL layers for matching markers.
        // This handles cases where layerIndex from _buildScenesFromMarkers doesn't
        // match the actual marker layer (multi-layer dedup, layer reordering, etc.)
        _writeLog("diag","[MERGE] per-layer search found 0 markers, trying all layers. removeTimes count="+allRemoveTimes.length);
        if(allRemoveTimes.length === 0){
            return JSON.stringify({ok:false,msg:"No markers to remove."});
        }
        app.beginUndoGroup("SED: Merge Scenes (all layers)");
        try{
            for(var li6 = 1; li6 <= comp.numLayers; li6++){
                var l6 = comp.layer(li6);
                if(!l6 || !(l6 instanceof AVLayer)) continue;
                if(!l6.property("Marker")) continue;
                var mkr6 = l6.property("Marker");
                if(!mkr6 || mkr6.numKeys === 0) continue;
                var layerName6 = l6.name;
                for(var k6 = mkr6.numKeys; k6 >= 1; k6--){
                    var kt6 = mkr6.keyTime(k6);
                    for(var r6 = 0; r6 < allRemoveTimes.length; r6++){
                        if(Math.abs(kt6 - allRemoveTimes[r6]) <= eps){
                            _writeLog("diag","[MERGE] removing marker at t="+kt6+" from layer "+(li6)+" ("+layerName6+")");
                            mkr6.removeKey(k6);
                            totalRemoved++;
                            break;
                        }
                    }
                }
            }
        }catch(e){
            app.endUndoGroup();
            return JSON.stringify({ok:false,msg:"Merge (all-layers) failed: "+e.toString()});
        }
        app.endUndoGroup();
        _writeLog("diag","[MERGE] all-layers search totalRemoved="+totalRemoved);
    }

    if(totalRemoved === 0){
        return JSON.stringify({ok:false,
            msg:"No matching markers found to merge.\nScene data may be out of date — click [Read Markers] and try again."});
    }

    // ── Merge split layers (if any) ──
    // If the user previously used "Cut All Cut Points", the footage was
    // split into one layer per scene. After removing markers, we also need
    // to recombine those layers: extend the first layer's outPoint and
    // remove the intermediate layers.
    _writeLog("diag","[MERGE] attempting layer merge for "+mergedCount+" group(s)");
    var layersRemoved = 0;
    app.beginUndoGroup("SED: Merge Layers");
    try{
        for(var liKey in groupsByLayer){
            if(!groupsByLayer.hasOwnProperty(liKey)) continue;
            var layerGroups = groupsByLayer[liKey];
            for(var lg=0; lg<layerGroups.length; lg++){
                var grp3 = layerGroups[lg];
                if(grp3.length < 2) continue;
                var firstSc = grp3[0];
                var lastSc  = grp3[grp3.length - 1];

                // Find the first and last layer by matching inPoint/outPoint
                var firstLayer = null;
                var lastLayer  = null;
                for(var li7 = 1; li7 <= comp.numLayers; li7++){
                    try{
                        var l7 = comp.layer(li7);
                        if(!l7 || !(l7 instanceof AVLayer)) continue;
                        if(Math.abs(l7.inPoint - firstSc.start_sec) <= eps &&
                           Math.abs(l7.outPoint - firstSc.end_sec) <= eps){
                            firstLayer = l7;
                        }
                        if(Math.abs(l7.inPoint - lastSc.start_sec) <= eps &&
                           Math.abs(l7.outPoint - lastSc.end_sec) <= eps){
                            lastLayer = l7;
                        }
                    }catch(e){}
                }

                if(!firstLayer || !lastLayer){
                    _writeLog("diag","[MERGE] layer match failed for group: first="+(firstLayer?firstLayer.name:"null")+" last="+(lastLayer?lastLayer.name:"null"));
                    continue;
                }

                // Save original outPoint before extending
                var firstOrigOut = firstLayer.outPoint;

                // ── Transfer markers from lastLayer to firstLayer ──
                // Before removing lastLayer, copy its markers that are at or
                // after the merged range's end boundary to the extended firstLayer.
                try{
                    var lastMkr = lastLayer.property("Marker");
                    var firstMkr = firstLayer.property("Marker");
                    if(lastMkr && firstMkr && lastMkr.numKeys > 0){
                        for(var km = 1; km <= lastMkr.numKeys; km++){
                            var kmt = lastMkr.keyTime(km);
                            if(kmt > firstOrigOut - eps){
                                var kmv = lastMkr.keyValue(km);
                                firstMkr.setValueAtTime(kmt, kmv);
                            }
                        }
                    }
                }catch(e){}

                // Extend firstLayer's outPoint to cover the merged range
                firstLayer.outPoint = lastLayer.outPoint;

                // Remove ALL layers between first and last (inclusive of last,
                // exclusive of first), matching by source AND time range.
                for(var li8 = comp.numLayers; li8 >= 1; li8--){
                    try{
                        var l8 = comp.layer(li8);
                        if(!l8 || l8 === firstLayer) continue;
                        if(l8.source !== firstLayer.source) continue;
                        // Check if this layer's time range falls within the merge span
                        if(l8.inPoint >= firstSc.start_sec - eps &&
                           l8.outPoint <= lastLayer.outPoint + eps &&
                           l8.inPoint >= firstOrigOut - eps){
                            l8.remove();
                            layersRemoved++;
                        }
                    }catch(e){}
                }
                _writeLog("diag","[MERGE] merged layer: "+firstLayer.name+" outPoint="+lastLayer.outPoint+" layersRemoved="+layersRemoved);
            }
        }
    }catch(e){
        app.endUndoGroup();
        _writeLog("diag","[MERGE] layer merge error: "+e.toString());
    }
    app.endUndoGroup();

    // Do NOT call readMarkers() here — it may return inconsistent results
    // (different layers, different dedup, etc.). Instead, the panel (main.js)
    // reconstructs the scene list locally from the old scenes + merge groups.
    return JSON.stringify({
        ok: true,
        groupsMerged: mergedCount,
        removedMarkers: totalRemoved,
        layersRemoved: layersRemoved
    });
}

// Marker-based merge: remove internal boundary markers
function _mergeMarkers(comp, layer, groups, removeTimes, mergedCount, fps){
    app.beginUndoGroup("SED: Merge Scenes");
    var removedKeys = 0;
    try{
        var markers = layer.property("Marker");
        if(markers && markers.numKeys > 0){
            for(var k = markers.numKeys; k >= 1; k--){
                var kt = markers.keyTime(k);
                var matched = false;
                for(var r = 0; r < removeTimes.length; r++){
                    if(Math.abs(kt - removeTimes[r]) <= 1/fps*0.5){ matched = true; break; }
                }
                if(matched){
                    markers.removeKey(k);
                    removedKeys++;
                }
            }
        }
    }catch(e){
        app.endUndoGroup();
        return JSON.stringify({ok:false,msg:"Merge failed: "+e.toString()});
    }
    app.endUndoGroup();

    if(removedKeys === 0){
        return JSON.stringify({ok:false,
            msg:"No matching markers found to merge. Scene data may be out of date — click [Read Markers] and try again."});
    }

    var rebuilt = readMarkers();
    var rebuiltObj;
    try{ rebuiltObj = JSON.parse(rebuilt); }catch(e){ rebuiltObj = {ok:false}; }

    if(!rebuiltObj.ok){
        return JSON.stringify({ok:false, msg:"Merged markers but failed to re-read scenes: "+(rebuiltObj.msg||"")});
    }

    return JSON.stringify({
        ok: true,
        groupsMerged: mergedCount,
        removedMarkers: removedKeys,
        scenes: rebuiltObj.scenes,
        layerName: rebuiltObj.layerName,
        fps: rebuiltObj.fps
    });
}

// Layer-based merge: merge already-cut layers by extending the first
// layer's outPoint and deleting subsequent layers in each group
function _mergeLayers(comp, groups, allGroupScenes, mergedCount, fps){
    var eps = 1/fps * 0.5;
    var totalBefore = comp.numLayers;
    var totalRemoved = 0;
    var removedMarkers = 0;

    app.beginUndoGroup("SED: Merge Layers");
    try{
        for(var g = 0; g < groups.length; g++){
            var grp = groups[g];
            if(grp.length < 2) continue;

            // Find layers matching the first and last scene in this group
            var firstScene = grp[0];
            var lastScene  = grp[grp.length - 1];
            var firstLayer = null;
            var lastLayer  = null;
            var middleLayers = [];

            for(var li = 1; li <= comp.numLayers; li++){
                var l = comp.layer(li);
                if(!l || !(l instanceof AVLayer)) continue;
                // Match by inPoint/outPoint
                if(Math.abs(l.inPoint - firstScene.start_sec) <= eps &&
                   Math.abs(l.outPoint - firstScene.end_sec) <= eps){
                    firstLayer = l;
                }
                if(Math.abs(l.inPoint - lastScene.start_sec) <= eps &&
                   Math.abs(l.outPoint - (lastScene.start_sec + lastScene.dur_sec)) <= eps){
                    lastLayer = l;
                }
            }

            if(!firstLayer || !lastLayer) continue;

            // Extend firstLayer's outPoint to lastLayer's outPoint
            // This effectively merges all middle layers into the first one
            firstLayer.outPoint = lastLayer.outPoint;

            // Remove all markers on the first layer that fall between
            // the original firstLayer.outPoint and the new outPoint
            try{
                var fm = firstLayer.property("Marker");
                if(fm && fm.numKeys > 0){
                    for(var fk = fm.numKeys; fk >= 1; fk--){
                        var ft = fm.keyTime(fk);
                        if(ft > firstScene.end_sec - eps && ft < lastScene.end_sec - eps){
                            fm.removeKey(fk);
                            removedMarkers++;
                        }
                    }
                }
            }catch(em){}

            // Remove all layers between firstLayer and lastLayer
            // Walk the layer stack from last back to avoid index shifts
            for(var li2 = comp.numLayers; li2 >= 1; li2--){
                var l2 = comp.layer(li2);
                if(!l2 || l2 === firstLayer) continue;
                var skip = false;
                for(var gg = 0; gg < groups.length; gg++){
                    for(var ss = 0; ss < groups[gg].length; ss++){
                        var sc = groups[gg][ss];
                        if(Math.abs(l2.inPoint - sc.start_sec) <= eps &&
                           Math.abs(l2.outPoint - (sc.start_sec + sc.dur_sec)) <= eps){
                            // This layer matches a scene, but is it IN our current merge group?
                            var isInThisGroup = false;
                            for(var mi = 0; mi < grp.length; mi++){
                                if(Math.abs(grp[mi].start_sec - sc.start_sec) <= eps &&
                                   Math.abs(grp[mi].end_sec - sc.end_sec) <= eps){
                                    isInThisGroup = true; break;
                                }
                            }
                            if(isInThisGroup && l2 !== firstLayer){
                                try{ l2.remove(); totalRemoved++; } catch(er){}
                            }
                            skip = true;
                            break;
                        }
                    }
                    if(skip) break;
                }
            }
        }
    }catch(e){
        app.endUndoGroup();
        return JSON.stringify({ok:false,msg:"Layer merge failed: "+e.toString()});
    }
    app.endUndoGroup();

    if(totalRemoved === 0){
        // No layers matched — fall back to old behavior or report error
        return JSON.stringify({ok:false,
            msg:"No matching cut layers found. Try [Read Markers] first, then merge again."});
    }

    // Re-read scenes from the remaining layers
    // Use the first remaining footage layer as the source for re-reading
    var sceneLayer = null;
    for(var li3 = 1; li3 <= comp.numLayers; li3++){
        var l3 = comp.layer(li3);
        if(l3 && l3 instanceof AVLayer && l3.source instanceof FootageItem){
            sceneLayer = l3;
            break;
        }
    }

    if(sceneLayer){
        var rebuilt = readMarkers();
        var rebuiltObj;
        try{ rebuiltObj = JSON.parse(rebuilt); }catch(e){ rebuiltObj = {ok:false}; }
        if(rebuiltObj.ok){
            return JSON.stringify({
                ok: true,
                groupsMerged: mergedCount,
                removedMarkers: removedMarkers,
                scenes: rebuiltObj.scenes,
                layerName: rebuiltObj.layerName,
                fps: rebuiltObj.fps,
                layersRemoved: totalRemoved
            });
        }
    }

    // Fallback: construct scenes from the current layer trims
    var layerScenes = [];
    var layersFound = [];
    for(var li4 = 1; li4 <= comp.numLayers; li4++){
        var l4 = comp.layer(li4);
        if(!l4 || !(l4 instanceof AVLayer)) continue;
        var scStart = l4.inPoint;
        var scEnd   = l4.outPoint;
        if(scEnd > dur) scEnd = dur;
        layersFound.push({
            start_sec: scStart,
            end_sec:   scEnd
        });
    }
    layersFound.sort(function(a,b){ return a.start_sec - b.start_sec; });
    for(var si = 0; si < layersFound.length; si++){
        var s = layersFound[si].start_sec;
        var e = layersFound[si].end_sec;
        layerScenes.push({
            index: si+1,
            start_sec: s,
            end_sec: e,
            dur_sec: e-s,
            start_tc: _fmtTC(s, fps),
            end_tc: _fmtTC(e, fps),
            dur_tc: _fmtTC(e-s, fps),
            dur_str: _fmtDur(e-s),
            fps: fps,
            layerIndex: 1
        });
    }

    return JSON.stringify({
        ok: true,
        groupsMerged: mergedCount,
        removedMarkers: removedMarkers,
        scenes: layerScenes,
        layerName: "Merged layers",
        fps: fps,
        layersRemoved: totalRemoved
    });
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
    // Also clean JPGs produced by FFmpeg path
    var jpegs=tmp.getFiles("*.jpg");
    for(var j=0;j<jpegs.length;j++){ try{ jpegs[j].remove(); n++; }catch(e){} }
    return JSON.stringify({ok:true,deleted:n});
}

// ══════════════════════════════════════════════════════════
// FFMPEG SUPPORT
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// LOGGING — writes to CEP extension folder / logs /
// ══════════════════════════════════════════════════════════
function _getLogFolder(){
    // Try multiple paths to find writable log folder
    var candidates = [];

    // 1. Next to this script ($.fileName)
    try{
        var sf = new File($.fileName);
        candidates.push(sf.parent.parent.fullName + "/logs");
    }catch(e){}

    // 2. CEP install path via APPDATA env
    try{
        var appdata = system.getenv("APPDATA");
        if(appdata){
            candidates.push(appdata.replace(/\\/g,"/") +
                "/Adobe/CEP/extensions/com.heosan.sedpanel/logs");
        }
    }catch(e){}

    // 3. System temp folder as last resort
    try{ candidates.push(Folder.temp.fsName.replace(/\\/g,"/") + "/sed_panel_logs"); }
    catch(e){}

    for(var i = 0; i < candidates.length; i++){
        try{
            var f = new Folder(candidates[i]);
            if(!f.exists) f.create();
            if(f.exists){
                // Verify writable
                var t = new File(f.fullName + "/write_test.tmp");
                t.encoding = "UTF8";
                if(t.open("w")){ t.write("1"); t.close(); t.remove(); return f; }
            }
        }catch(e){}
    }
    return null;
}

function _writeLog(category, msg){
    // category: "thumb" | "ffmpeg" | "ae" | "diag"
    try{
        var lf = _getLogFolder();
        if(!lf) return;
        var logFile = new File(lf.fullName + "/sed_" + category + ".log");
        logFile.encoding = "UTF8";
        if(!logFile.open("a")) return;
        var now = new Date();
        var ts  = now.getFullYear() + "-" +
                  (now.getMonth()+1<10?"0":"") + (now.getMonth()+1) + "-" +
                  (now.getDate()<10?"0":"") + now.getDate() + " " +
                  (now.getHours()<10?"0":"") + now.getHours() + ":" +
                  (now.getMinutes()<10?"0":"") + now.getMinutes() + ":" +
                  (now.getSeconds()<10?"0":"") + now.getSeconds();
        logFile.writeln("[" + ts + "] " + msg);
        logFile.close();
    }catch(e){}
}

// findFFmpeg() — 3-tier detection
// Tier 1: ffmpeg in system PATH  (where ffmpeg on Windows)
// Tier 2: ffmpeg.exe bundled in plugin folder ./ffmpeg/ffmpeg.exe
// Tier 3: return null → caller falls back to saveFrameToPng
function findFFmpeg(){
    var log = [];

    // Tier 1: check PATH
    try{
        var r1 = system.callSystem("where ffmpeg");
        log.push("PATH search result: " + (r1||"(empty)").replace(/[\r\n]+/g," ").substring(0,200));
        if(r1 && r1.indexOf("ffmpeg") >= 0){
            var line = r1.replace(/\r/g,"").split("\n")[0].replace(/^\s+|\s+$/g,"");
            if(line){
                var f1 = new File(line);
                if(f1.exists){
                    _writeLog("ffmpeg","[FOUND] Tier 1 (PATH): " + line);
                    return JSON.stringify({ok:true, tier:1, path:line, log:log});
                }
                log.push("PATH hit but file not found: " + line);
            }
        }
    }catch(e1){ log.push("PATH check error: " + e1.toString()); }

    // Tier 2: bundled — resolve plugin root from $.fileName
    // $.fileName = full path of this script = …/com.heosan.sedpanel/jsx/host.jsx
    var pluginRootPath = "";
    try{
        var scriptFile = new File($.fileName);
        var jsxFolder  = scriptFile.parent;         // …/com.heosan.sedpanel/jsx
        var pluginRoot = jsxFolder.parent;          // …/com.heosan.sedpanel
        pluginRootPath = pluginRoot.fullName;
        log.push("$.fileName: " + $.fileName);
        log.push("Plugin root (from $.fileName): " + pluginRootPath);
        var bundled = new File(pluginRootPath + "/ffmpeg/ffmpeg.exe");
        log.push("Bundled path tried: " + bundled.fsName + " | exists: " + bundled.exists);
        if(bundled.exists){
            _writeLog("ffmpeg","[FOUND] Tier 2 (bundled): " + bundled.fsName);
            return JSON.stringify({ok:true, tier:2, path:bundled.fsName, log:log});
        }
    }catch(e2){ log.push("$.fileName tier2 error: " + e2.toString()); }

    // Tier 2b: try common CEP extension install path as additional fallback
    try{
        var envAppData = system.getenv("APPDATA");
        if(envAppData){
            var cepPath = envAppData + "\\Adobe\\CEP\\extensions\\com.heosan.sedpanel\\ffmpeg\\ffmpeg.exe";
            var f2b = new File(cepPath);
            log.push("Tier 2b CEP path: " + f2b.fsName + " | exists: " + f2b.exists);
            if(f2b.exists){
                _writeLog("ffmpeg","[FOUND] Tier 2b (CEP install): " + f2b.fsName);
                return JSON.stringify({ok:true, tier:2, path:f2b.fsName, log:log});
            }
        }
    }catch(e2b){ log.push("Tier 2b error: " + e2b.toString()); }

    // Tier 3: not found
    _writeLog("ffmpeg","[NOT FOUND] All tiers exhausted. Log: " + log.join(" | "));
    return JSON.stringify({ok:false, tier:0, path:"", log:log});
}

// getSourceFileInfo() — ambil info source footage dari layer aktif
// Returns: sourcePath, sourceStartSec, layerStartSec, fps, duration
// Caller (JS) uses ini untuk menghitung timecode yang benar untuk FFmpeg
function getSourceFileInfo(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem))
        return JSON.stringify({ok:false,msg:"No active comp."});

    var layer=_getActiveLayer(comp);
    if(!layer)
        return JSON.stringify({ok:false,msg:"No footage layer found."});

    if(!(layer.source instanceof FootageItem))
        return JSON.stringify({ok:false,msg:"Layer source is not footage."});

    var src=layer.source;
    if(!(src.mainSource instanceof FileSource))
        return JSON.stringify({ok:false,msg:"Footage source is not a file."});

    var srcFile=src.mainSource.file;
    if(!srcFile||!srcFile.exists)
        return JSON.stringify({ok:false,msg:"Source file not found on disk."});

    // Timecode offset: comp time → source time
    // source_time = comp_time - layer.startTime + src.displayStartTime
    // For image sequences, hasVideo=true but we handle it the same way
    var fps=comp.frameRate;
    var sourceStartSec=0;
    try{ sourceStartSec=src.mainSource.startTimecode; }catch(e){}
    try{ if(!sourceStartSec) sourceStartSec=src.displayStartTime||0; }catch(e2){}

    var result = {
        ok:          true,
        sourcePath:  srcFile.fsName,
        layerStartSec: layer.startTime,
        sourceStartSec: sourceStartSec,
        fps:         fps,
        compDuration:comp.duration,
        hasVideo:    src.hasVideo,
        width:       comp.width,
        height:      comp.height
    };
    _writeLog("ffmpeg","[SOURCE] path="+srcFile.fsName+" layerStart="+layer.startTime+
        " srcStart="+sourceStartSec+" fps="+fps+" hasVideo="+src.hasVideo);
    return JSON.stringify(result);
}

// getTempFolderPath() — return temp folder path for JS to use in FFmpeg output
// getAllSourceFilesInfo() — return source info for ALL footage layers
// Used by multi-layer thumbnail pipeline to get per-layer source paths
function getAllSourceFilesInfo(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"No active comp."});
    var results = [];
    for(var li=1; li<=comp.numLayers; li++){
        try{
            var l = comp.layer(li);
            if(!l || !(l instanceof AVLayer)) continue;
            if(!(l.source instanceof FootageItem)) continue;
            var src = l.source;
            if(!(src.mainSource instanceof FileSource)) continue;
            var srcFile = src.mainSource.file;
            if(!srcFile || !srcFile.exists) continue;
            var sourceStartSec = 0;
            try{ sourceStartSec = src.mainSource.startTimecode; }catch(e){}
            try{ if(!sourceStartSec) sourceStartSec = src.displayStartTime||0; }catch(e2){}
            results.push({
                layerIndex: li,
                layerName: l.name,
                sourcePath: srcFile.fsName,
                layerStartSec: l.startTime,
                sourceStartSec: sourceStartSec,
                hasVideo: src.hasVideo,
                fps: comp.frameRate,
                width: comp.width,
                height: comp.height
            });
        }catch(e){}
    }
    return JSON.stringify({ok:true, layers:results});
}

function getTempFolderPath(customPath){
    var f=_getTmp(customPath);
    _writeLog("thumb","[TMP] resolved path="+f.fsName+" exists="+f.exists);
    return JSON.stringify({ok:true,path:f.fsName});
}

// getSystemTempPath() — return system temp folder path (Folder.temp)
// Used by JS to write the thumb control file via cep.fs instead of evalScript
function getSystemTempPath(){
    try{
        var t = Folder.temp;
        if(!t || !t.exists) return JSON.stringify({ok:false, path:""});
        return JSON.stringify({ok:true, path:t.fsName});
    }catch(e){
        return JSON.stringify({ok:false, path:"", msg:e.toString()});
    }
}

// getThumbDiagnostics() — comprehensive thumb pipeline diagnostics
// Returns detailed info about AE, temp folder, source file, ffmpeg
function getThumbDiagnostics(customPath){
    var result = {
        ok: true,
        aeVersion: "unknown",
        tempFolder: "",
        tempFolderExists: false,
        tempFolderWritable: false,
        sourceFile: "",
        sourceFileExists: false,
        ffmpegPath: "",
        ffmpegExists: false,
        logFolder: "",
        compInfo: "",
        errors: []
    };

    // AE version
    try{ result.aeVersion = app.version; }catch(e){ result.errors.push("aeVersion: "+e); }

    // Temp folder
    try{
        var tmp = _getTmp(customPath);
        result.tempFolder = tmp.fsName;
        result.tempFolderExists = tmp.exists;
        if(tmp.exists){
            var wtest = new File(tmp.fullName + "/sed_diagtest.tmp");
            wtest.encoding = "UTF8";
            if(wtest.open("w")){ wtest.write("1"); wtest.close(); wtest.remove(); result.tempFolderWritable = true; }
            else { result.errors.push("Temp folder NOT writable: " + tmp.fsName); }
        } else {
            result.errors.push("Temp folder does not exist: " + tmp.fsName);
        }
    }catch(e){ result.errors.push("tempFolder: "+e); }

    // Source file
    try{
        var comp = app.project.activeItem;
        if(comp && comp instanceof CompItem){
            result.compInfo = comp.name + " " + comp.width + "x" + comp.height + " " + comp.frameRate + "fps";
            var layer = _getActiveLayer(comp);
            if(layer && layer.source instanceof FootageItem){
                var src = layer.source;
                if(src.mainSource instanceof FileSource){
                    var sf = src.mainSource.file;
                    result.sourceFile = sf ? sf.fsName : "(null)";
                    result.sourceFileExists = sf ? sf.exists : false;
                }
            } else {
                result.errors.push("No footage layer found in active comp");
            }
        } else {
            result.errors.push("No active comp");
        }
    }catch(e){ result.errors.push("sourceFile: "+e); }

    // FFmpeg
    try{
        var ffRes = JSON.parse(findFFmpeg());
        result.ffmpegPath = ffRes.path || "";
        result.ffmpegTier = ffRes.tier || 0;
        result.ffmpegExists = !!(ffRes.ok && ffRes.path);
        result.ffmpegLog = ffRes.log || [];
    }catch(e){ result.errors.push("ffmpeg: "+e); }

    // Log folder
    try{
        var lf = _getLogFolder();
        result.logFolder = lf ? lf.fsName : "";
    }catch(e){ result.errors.push("logFolder: "+e); }

    _writeLog("diag", JSON.stringify(result));
    return JSON.stringify(result);
}

// ══════════════════════════════════════════════════════════
// FFMPEG FAST THUMBNAIL ENGINE
//
// KEY INSIGHT: Use ONE FFmpeg process with select= filter to
// extract ALL frames in a single video read pass.
// No per-frame process startup overhead.
//
// select='eq(n,F1)+eq(n,F2)+...+eq(n,FN)' extracts exactly
// the frames we need in one pass.
//
// Execution is NON-BLOCKING:
//   1. JSX writes bat file and launches via VBScript (fire-and-forget)
//   2. JSX returns IMMEDIATELY with list of expected output paths
//   3. JS polls cep.fs.stat on each path in background (setInterval)
//   4. Each thumbnail is injected to DOM the moment its file appears
//   Result: thumbnails appear one-by-one in real-time, no freezing
// ══════════════════════════════════════════════════════════

// _runCmd(cmd, waitForFinish)
// Execute cmd string via VBScript hidden window.
// waitForFinish=true  → synchronous (blocks JSX until done) — use ONLY for
//                        short, fast operations. NEVER use for FFmpeg/Python
//                        batches with many scenes — system.callSystem() blocks
//                        the entire ExtendScript engine (and AE's UI thread)
//                        until the launched process tree fully exits.
// waitForFinish=false → true async fire-and-forget. We launch wscript.exe
//                        itself via "start" so system.callSystem() returns
//                        the instant the launcher process spawns — it does
//                        NOT wait for wscript.exe (or the cmd it spawns) to
//                        finish. This is what actually prevents AE freezing
//                        for long-running batches (v8.3 fix).
function _runCmd(cmd, waitForFinish){
    var tmpDir  = Folder.temp.fsName.replace(/\\/g, "/");
    var vbsPath = tmpDir + "/sed_run_" + Math.floor(Math.random()*1000000) + ".vbs";
    var vbsFile = new File(vbsPath);
    vbsFile.encoding = "UTF8";

    var vbsContent;
    if(waitForFinish){
        vbsContent =
            'CreateObject("WScript.Shell")' +
            '.Run "cmd /C " & Chr(34) & "' + cmd + '" & Chr(34), 0, True';
    } else {
        // Async case: the vbs deletes itself after launching, so a leftover
        // wscript.exe process never leaves stray temp files behind.
        vbsContent =
            'CreateObject("WScript.Shell")' +
            '.Run "cmd /C " & Chr(34) & "' + cmd + '" & Chr(34), 0, False' + "\r\n" +
            'CreateObject("Scripting.FileSystemObject").DeleteFile WScript.ScriptFullName';
    }

    var ok = false;
    try{
        if(vbsFile.open("w")){ vbsFile.write(vbsContent); vbsFile.close(); ok=true; }
    }catch(e){}

    if(!ok){
        // VBScript file could not be written — fallback: run directly via cmd
        try{
            if(waitForFinish) system.callSystem('cmd /C "' + cmd + '"');
            else system.callSystem('cmd /C start "" /B cmd /C "' + cmd + '"');
        }catch(e){}
        return;
    }

    try{
        if(waitForFinish){
            // Synchronous: caller explicitly wants to wait (short ops only)
            system.callSystem('wscript.exe "' + vbsPath + '"');
            try{ vbsFile.remove(); }catch(e2){}
        } else {
            // TRUE async: "start" detaches wscript.exe itself from this
            // process tree. callSystem() returns as soon as the new process
            // is spawned — it does not wait for wscript.exe to exit, let
            // alone the FFmpeg/Python processes it launches. This is what
            // actually keeps AE responsive for long-running batches (v8.3 fix).
            system.callSystem('cmd /C start "" /B wscript.exe "' + vbsPath + '"');
        }
    }catch(e){ _writeLog("ffmpeg","[CMD ERR] "+e.toString()); }
}

// _launchHidden(cmd) — backward compat alias for async launch
function _launchHidden(cmd){ _runCmd(cmd, false); }




// launchFFmpegAllAsync(batchJson, ffmpegPath)
// PARALLEL approach: one bat file with all FFmpeg commands using "start /B"
// All processes run simultaneously — much faster than sequential.
// Returns immediately (fire-and-forget via VBScript).
// JS polls each output path independently.
//
// Key differences from ffconcat approach:
// - Each FFmpeg uses -ss for accurate seek (no GOP issues)
// - All run in parallel (start /B = background, no window)
// - Stale files deleted before launch to avoid poller false-positives
// - Output paths are per-scene filenames (no %04d needed)
// launchFFmpegAllAsync(batchJson, ffmpegPath)
// TRUE async launch — fire-and-forget, returns IMMEDIATELY.
// v8.3 FIX: previous versions called _runCmd(batPath, true) which BLOCKS
// the ExtendScript engine (and therefore the entire AE UI) until every
// FFmpeg process finishes — for 300-500 scenes this froze AE for the
// full duration of generation. Root cause: system.callSystem() used by
// _runCmd is always synchronous from ExtendScript's point of view; the
// "wait" flag only controls whether wscript.exe waits for the *child*
// cmd process, but wscript.exe itself is still awaited by callSystem().
// Fix: ALWAYS launch with waitForFinish=false. We no longer verify
// results here — JS polls each output path on disk via _startPoller(),
// which is fully async (setInterval) and never touches AE's thread.
function launchFFmpegAllAsync(batchJson, ffmpegPath){
    var batch;
    try{ batch = JSON.parse(batchJson); }
    catch(e){ return JSON.stringify({ok:false, msg:"Parse error: "+e.toString()}); }
    if(!batch || !batch.length)
        return JSON.stringify({ok:false, msg:"Empty batch"});

    var firstOut = batch[0].outPath;
    var tmpDir   = firstOut.substring(0, firstOut.lastIndexOf("\\"));

    // Delete any stale output files first
    // This prevents poller from picking up files from a previous run
    for(var d = 0; d < batch.length; d++){
        try{
            var stale = new File(batch[d].outPath);
            if(stale.exists) stale.remove();
        }catch(e){}
    }

    // Build bat file with parallel FFmpeg calls using "start /B"
    // start /B = launch in background (no new window, non-blocking)
    // All FFmpeg processes run concurrently
    // MAX_PARALLEL limits concurrent processes to avoid disk thrash
    var MAX_PARALLEL = 8;
    var batLines = ["@echo off"];

    for(var i = 0; i < batch.length; i++){
        var item = batch[i];
        var ffLine = 'start /B "" ' +
            '"' + ffmpegPath + '"' +
            ' -ss ' + item.seekSec.toFixed(4) +
            ' -i "' + item.srcPath + '"' +
            ' -vf scale=320:-2 -frames:v 1 -q:v 3 -loglevel error -y' +
            ' "' + item.outPath + '"';
        batLines.push(ffLine);

        // After every MAX_PARALLEL commands, brief stagger before launching
        // more — prevents overwhelming disk I/O. This delay happens inside
        // the detached bat process itself, NOT inside AE/ExtendScript,
        // so it never blocks the host application.
        if((i + 1) % MAX_PARALLEL === 0 && i + 1 < batch.length){
            batLines.push("timeout /t 1 /nobreak >nul");
        }
    }

    var batPath = tmpDir + "\\sed_ff_all.bat";
    var batFile = new File(batPath);
    batFile.encoding = "UTF8";
    if(!batFile.open("w")){
        return JSON.stringify({ok:false, msg:"Cannot write bat file"});
    }
    batFile.write(batLines.join("\r\n"));
    batFile.close();
    _writeLog("ffmpeg","[PARALLEL-ASYNC] scenes="+batch.length+
        " max_parallel="+MAX_PARALLEL+" bat="+batPath);

    // Build expected paths (using exact per-scene output paths)
    var expectedPaths = [];
    for(var j = 0; j < batch.length; j++){
        expectedPaths.push({idx: batch[j].idx, outPath: batch[j].outPath});
    }

    // Fire-and-forget: launch the bat WITHOUT waiting. Returns instantly —
    // AE stays fully responsive while FFmpeg processes run in the background.
    // The bat file deletes itself at the end so we don't need to clean it up here.
    var selfDeleteCmd = batPath + " & del /f /q \"" + batPath + "\"";
    _runCmd(selfDeleteCmd, false);

    _writeLog("ffmpeg","[LAUNCHED] "+batch.length+" scene(s), async, non-blocking");

    // Return expected paths immediately — JS will poll disk for completion.
    // This small JSON always fits well under the evalScript bridge limit
    // since it only contains {idx, outPath} pairs (no base64/image data).
    return JSON.stringify({ok:true, async:true, expectedPaths:expectedPaths});
}
// launchFFmpegPerFrame(batchJson, ffmpegPath)
// Fallback: one FFmpeg per frame in a single bat, fire-and-forget.
// Returns expected paths immediately for JS polling.
function launchFFmpegPerFrame(batchJson, ffmpegPath){
    var batch;
    try{ batch = JSON.parse(batchJson); }
    catch(e){ return JSON.stringify({ok:false, msg:"Parse error: "+e.toString()}); }
    if(!batch || !batch.length)
        return JSON.stringify({ok:false, msg:"Empty batch"});

    var firstOut = batch[0].outPath;
    var tmpDir   = firstOut.substring(0, firstOut.lastIndexOf("\\"));
    var batPath  = tmpDir + "\\sed_ff_per.bat";
    var batFile  = new File(batPath);
    batFile.encoding = "UTF8";
    if(!batFile.open("w")){
        return JSON.stringify({ok:false, msg:"Cannot write bat file"});
    }

    var lines = ["@echo off"];
    var expectedPaths = [];
    for(var i = 0; i < batch.length; i++){
        var item = batch[i];
        lines.push('"' + ffmpegPath + '"' +
            ' -ss ' + item.seekSec.toFixed(4) +
            ' -i "' + item.srcPath + '"' +
            ' -vf scale=320:-2 -frames:v 1 -q:v 3 -loglevel error -y' +
            ' "' + item.outPath + '"');
        expectedPaths.push({idx: item.idx, outPath: item.outPath});
    }
    batFile.write(lines.join("\r\n"));
    batFile.close();
    _writeLog("ffmpeg","[PER-FRAME] scenes="+batch.length+" bat="+batPath);

    _launchHidden(batPath);

    return JSON.stringify({
        ok:            true,
        async:         true,
        expectedPaths: expectedPaths,
        batPath:       batPath
    });
}

// ══════════════════════════════════════════════════════════
// FILE-BASED BRIDGE FUNCTIONS
// Pass data via disk files instead of evalScript strings.
// Avoids ALL escaping issues with Windows paths in JSON.
// ══════════════════════════════════════════════════════════

// runThumbGenPyFromFile(batchFilePath, pythonExe)
// Reads batch JSON from file, runs Python, returns results path
function runThumbGenPyFromFile(batchFilePath, pythonExe){
    // Read batch from file
    var batchFile = new File(batchFilePath);
    if(!batchFile.exists)
        return JSON.stringify({ok:false, msg:"Batch file not found: "+batchFilePath});
    batchFile.encoding = "UTF8";
    batchFile.open("r");
    var batchJson = batchFile.read();
    batchFile.close();

    // Delegate to runThumbGenPy with the JSON content
    return runThumbGenPy(batchJson, pythonExe);
}

// launchFFmpegFromFile(batchFilePath, ffmpegPath)
// Reads batch JSON from file, launches FFmpeg, returns results path
function launchFFmpegFromFile(batchFilePath, ffmpegPath){
    var batchFile = new File(batchFilePath);
    if(!batchFile.exists)
        return JSON.stringify({ok:false, msg:"Batch file not found: "+batchFilePath});
    batchFile.encoding = "UTF8";
    batchFile.open("r");
    var batchJson = batchFile.read();
    batchFile.close();
    try{ batchFile.remove(); }catch(e){}

    return launchFFmpegAllAsync(batchJson, ffmpegPath);
}

// ══════════════════════════════════════════════════════════
// PYTHON THUMBNAIL RUNNER
// Uses cv2.VideoCapture (single process, no per-frame FFmpeg startup).
// ~5-10x faster than FFmpeg bat for large scene counts.
// Falls back to FFmpeg if Python/cv2 not available.
// ══════════════════════════════════════════════════════════

// findPython() — find Python executable on Windows
function findPython(){
    // Try python, python3, py in PATH
    var candidates = ["python", "python3", "py"];
    for(var i = 0; i < candidates.length; i++){
        try{
            var r = system.callSystem("where " + candidates[i]);
            if(r && r.length > 3){
                var line = r.replace(/\r/g,"").split("\n")[0].replace(/^\s+|\s+$/g,"");
                if(line.length > 3){
                    // Verify it actually works
                    var ver = system.callSystem('"' + line + '" --version');
                    if(ver && ver.indexOf("Python") >= 0){
                        _writeLog("ffmpeg","[PYTHON] found: "+line+" ver="+ver.replace(/[\r\n]/g,""));
                        return JSON.stringify({ok:true, path:line});
                    }
                }
            }
        }catch(e){}
    }
    // Try common Windows install paths directly
    var appdata = "";
    try{ appdata = system.getenv("LOCALAPPDATA") || ""; }catch(e){}
    var winPaths = [];
    if(appdata){
        // Python 3.13, 3.14 etc
        for(var v = 14; v >= 9; v--){
            winPaths.push(appdata.replace(/\\/g,"/") + "/Programs/Python/Python3" + v + "/python.exe");
        }
    }
    winPaths.push("C:/Python313/python.exe");
    winPaths.push("C:/Python312/python.exe");
    for(var p = 0; p < winPaths.length; p++){
        try{
            var pf = new File(winPaths[p]);
            if(pf.exists){
                _writeLog("ffmpeg","[PYTHON] found at: "+pf.fsName);
                return JSON.stringify({ok:true, path:pf.fsName});
            }
        }catch(e){}
    }
    _writeLog("ffmpeg","[PYTHON] not found");
    return JSON.stringify({ok:false, path:""});
}

// runThumbGenPy(batchJson, pythonExe)
// Launches thumb_gen.py ASYNCHRONOUSLY (fire-and-forget) and returns
// immediately with the results file path. JS polls that file on disk
// (see _startResultFilePoller in main.js) instead of AE waiting for
// Python to finish — this is the v8.3 fix for the AE-freeze bug:
// previously _runCmd(batPath, true) blocked the ExtendScript engine
// (and the whole AE UI) for as long as Python took to process every
// scene (seconds to tens of seconds for 300-500 scenes).
function runThumbGenPy(batchJson, pythonExe){
    try{
    var batch;
    try{ batch = JSON.parse(batchJson); }
    catch(e){ return JSON.stringify({ok:false, msg:"Parse error: "+e.toString()}); }
    if(!batch || !batch.length)
        return JSON.stringify({ok:false, msg:"Empty batch"});

    // Derive tmp folder from first item
    var firstOut = batch[0].outPath;
    var tmpDir   = firstOut.substring(0, firstOut.lastIndexOf("\\"));

    // Write jobs JSON file
    // NOTE: ExtendScript JSON.parse produces objects with numeric keys + length
    // but NOT proper Arrays — Array methods like .map() are undefined. Always
    // use manual for-loops on JSON-parsed arrays.
    var jobsArr = [];
    for(var ji = 0; ji < batch.length; ji++){
        var item = batch[ji];
        jobsArr.push({
            idx:     item.idx,
            seekSec: item.seekSec,
            srcPath: item.srcPath,
            outPath: item.outPath
        });
    }
    var jobsData = {
        jobs: jobsArr
    };
    var jobsPath = tmpDir + "\\sed_jobs.json";
    var jobsFile = new File(jobsPath);
    jobsFile.encoding = "UTF8";
    if(!jobsFile.open("w")){
        _writeLog("ffmpeg","[PY ERR] Cannot write jobs file: "+jobsPath);
        return JSON.stringify({ok:false, msg:"Cannot write jobs file"});
    }
    jobsFile.write(JSON.stringify(jobsData));
    jobsFile.close();

    // Find thumb_gen.py — try multiple locations
    var scriptFile  = new File($.fileName);
    var pluginRoot  = scriptFile.parent.parent;
    var thumbGenPy  = new File(pluginRoot.fullName + "/thumb_gen.py");
    _writeLog("ffmpeg","[PY SEARCH] $.fileName="+$.fileName);
    _writeLog("ffmpeg","[PY SEARCH] pluginRoot="+pluginRoot.fullName);
    _writeLog("ffmpeg","[PY SEARCH] thumb_gen.py="+thumbGenPy.fsName+" exists="+thumbGenPy.exists);

    // Fallback: try CEP install path via APPDATA
    if(!thumbGenPy.exists){
        try{
            var appdata = system.getenv("APPDATA");
            if(appdata){
                var cepPy = new File(
                    appdata.replace(/\\/g,"/") +
                    "/Adobe/CEP/extensions/com.heosan.sedpanel/thumb_gen.py"
                );
                _writeLog("ffmpeg","[PY SEARCH] CEP path="+cepPy.fsName+" exists="+cepPy.exists);
                if(cepPy.exists) thumbGenPy = cepPy;
            }
        }catch(e){ _writeLog("ffmpeg","[PY SEARCH] APPDATA err: "+e); }
    }

    if(!thumbGenPy.exists){
        try{ jobsFile.remove(); }catch(e){}
        _writeLog("ffmpeg","[PY ERR] thumb_gen.py not found anywhere");
        return JSON.stringify({ok:false, msg:"thumb_gen.py not found at: "+thumbGenPy.fsName});
    }

    // Output paths — results JSON + stderr log
    var resultsPath = tmpDir + "\\sed_results.json";
    var errPath      = tmpDir + "\\sed_py_err.txt";
    var donePath     = tmpDir + "\\sed_py_done.flag";

    // Delete stale files from any previous run so the JS poller never
    // picks up leftovers from a prior session
    try{ var rf=new File(resultsPath); if(rf.exists) rf.remove(); }catch(e){}
    try{ var ef=new File(errPath);     if(ef.exists) ef.remove(); }catch(e){}
    try{ var df=new File(donePath);    if(df.exists) df.remove(); }catch(e){}

    var dq      = String.fromCharCode(34);
    var batPath = tmpDir + "\\sed_py_run.bat";
    var batFile = new File(batPath);
    batFile.encoding = "UTF8";

    // Build bat: run python, redirect stdout to results, stderr to err file,
    // then write a "done" flag file LAST — this is what the JS poller waits
    // for, guaranteeing the results file is fully flushed before JS reads it.
    // Finally the bat deletes itself.
    var nl = "\r\n";
    var batContent =
        "@echo off" + nl +
        dq + pythonExe + dq +
        " " + dq + thumbGenPy.fsName + dq +
        " " + dq + jobsPath + dq +
        " > " + dq + resultsPath + dq +
        " 2> " + dq + errPath + dq + nl +
        "echo done > " + dq + donePath + dq + nl +
        "del /f /q " + dq + batPath + dq + nl;

    _writeLog("ffmpeg","[PY RUN-ASYNC] batch="+batch.length+
        " python="+pythonExe+" script="+thumbGenPy.fsName);

    if(!batFile.open("w")){
        try{ jobsFile.remove(); }catch(e){}
        _writeLog("ffmpeg","[PY ERR] Cannot write bat: "+batPath);
        return JSON.stringify({ok:false, msg:"Cannot write bat file"});
    }
    batFile.write(batContent);
    batFile.close();

    // Fire-and-forget — use VBScript + WScript.Shell.Run for TRUE async launch.
    // system.callSystem(start/start) can still block ExtendScript when Python
    // runs for a long time (300+ scenes). WScript.Shell.Run with False never
    // blocks — it returns immediately and the child process is fully detached.
    var vbsPath = tmpDir + "\\sed_py_launch.vbs";
    try{
        var vbsFile = new File(vbsPath);
        vbsFile.encoding = "UTF8";
        vbsFile.open("w");
        vbsFile.write('CreateObject("WScript.Shell").Run "' + batPath + '", 0, False');
        vbsFile.close();
        // cscript runs the VBS and exits instantly (VBS just calls Run+return).
        // callSystem blocks ~50ms while cscript starts/run/exits — NOT while
        // Python processes scenes. Python is fully detached in its own process.
        system.callSystem('cscript.exe //Nologo //B "' + vbsPath + '"');
    }catch(le){
        _writeLog("ffmpeg","[PY VBS FALLBACK] "+le);
        _runCmd(batPath, false);
    }

    _writeLog("ffmpeg","[PY LAUNCHED] async, non-blocking, donePath="+donePath);

    // Tell JS where to poll. jobsFile cleanup is deferred to the bat's own
    // lifetime since Python needs to read it after we return.
    return JSON.stringify({
        ok: true,
        async: true,
        resultsPath: resultsPath,
        donePath: donePath,
        errPath: errPath,
        jobsPath: jobsPath,
        expectedCount: batch.length
    });
    }catch(e){
        _writeLog("ffmpeg","[PY RUN THROW] "+e.toString()+" line="+(e.line||0));
        try{ if(jobsFile) jobsFile.remove(); }catch(ee){}
        return JSON.stringify({ok:false, msg:"runThumbGenPy error: "+e.toString(), line:e.line||0});
    }
}


// runPendingThumb() — reads control file, runs Python or FFmpeg
// Control file path: system temp + sed_thumb_ctrl.json
// JS writes the control file, then calls this with NO arguments
// This completely avoids evalScript string escaping issues
function runPendingThumb(){
    try{
        // Find control file in system temp
        var ctrlPath = Folder.temp.fsName.replace(/\\/g,"/") + "/sed_thumb_ctrl.json";
        var ctrlFile = new File(ctrlPath);
        if(!ctrlFile.exists)
            return JSON.stringify({ok:false, msg:"No control file: "+ctrlPath});

        ctrlFile.encoding = "UTF8";
        ctrlFile.open("r");
        var ctrlJson = ctrlFile.read();
        ctrlFile.close();
        try{ ctrlFile.remove(); }catch(e){}

        var ctrl;
        try{ ctrl = JSON.parse(ctrlJson); }
        catch(e){ return JSON.stringify({ok:false, msg:"Control parse error: "+e}); }

        _writeLog("ffmpeg","[CTRL] mode="+ctrl.mode+" batch="+
            (ctrl.batch?ctrl.batch.length:0)+" py="+ctrl.pythonExe);

        if(ctrl.mode === "python"){
            return runThumbGenPy(JSON.stringify(ctrl.batch), ctrl.pythonExe);
        } else if(ctrl.mode === "ffmpeg"){
            return launchFFmpegAllAsync(JSON.stringify(ctrl.batch), ctrl.ffmpegPath);
        }
        return JSON.stringify({ok:false, msg:"Unknown mode: "+ctrl.mode});
    }catch(e){
        _writeLog("ffmpeg","[RUN PENDING THROW] "+e.toString()+" line="+(e.line||0));
        return JSON.stringify({ok:false, msg:"runPendingThumb error: "+e.toString()});
    }
}

// ══════════════════════════════════════════════════════════
// FULL DIAGNOSTIC — getFullDiagnostics()
// Tests every pipeline component and reports status.
// Called from JS when user clicks Diagnose button.
// ══════════════════════════════════════════════════════════
function getFullDiagnostics(customPath, pythonExe, ffmpegPath){
    var d = {
        ok: true,
        aeVersion:        "?",
        // temp folder
        tmpPath:          "",
        tmpExists:        false,
        tmpWritable:      false,
        tmpWriteError:    "",
        // source file
        sourceFile:       "",
        sourceExists:     false,
        // Python
        pythonExe:        pythonExe || "",
        pythonExists:     false,
        pythonVersion:    "",
        pythonRunsOk:     false,
        pythonRunError:   "",
        thumbGenPyPath:   "",
        thumbGenPyExists: false,
        // FFmpeg
        ffmpegPath:       ffmpegPath || "",
        ffmpegExists:     false,
        ffmpegVersion:    "",
        ffmpegRunsOk:     false,
        ffmpegRunError:   "",
        // CEP bridge
        jsFn_dollarFileName: $.fileName,
        pluginRootFromDollar: "",
        // Log folder
        logFolder:        "",
        errors:           []
    };

    // ── AE version ──
    try{ d.aeVersion = app.version; }catch(e){ d.errors.push("aeVersion: "+e); }

    // ── Temp folder ──
    try{
        var tmp = _getTmp(customPath);
        d.tmpPath   = tmp.fsName;
        d.tmpExists = tmp.exists;
        if(tmp.exists){
            var wt = new File(tmp.fullName+"/sed_diag_write.tmp");
            wt.encoding="UTF8";
            if(wt.open("w")){ wt.write("diag"); wt.close(); wt.remove(); d.tmpWritable=true; }
            else { d.tmpWriteError="open() returned false"; d.errors.push("Temp not writable"); }
        } else { d.errors.push("Temp folder missing: "+d.tmpPath); }
    }catch(e){ d.errors.push("tmp: "+e); }

    // ── Source file ──
    try{
        var comp = app.project.activeItem;
        if(comp && comp instanceof CompItem){
            var layer = _getActiveLayer(comp);
            if(layer && layer.source instanceof FootageItem){
                var src = layer.source;
                if(src.mainSource instanceof FileSource){
                    var sf = src.mainSource.file;
                    d.sourceFile   = sf ? sf.fsName : "(null)";
                    d.sourceExists = sf ? sf.exists : false;
                    if(!d.sourceExists) d.errors.push("Source file not on disk: "+d.sourceFile);
                }
            } else { d.errors.push("No footage layer in active comp"); }
        } else { d.errors.push("No active comp"); }
    }catch(e){ d.errors.push("source: "+e); }

    // ── Plugin root from $.fileName ──
    try{
        var sf2 = new File($.fileName);
        var pr  = sf2.parent.parent;
        d.pluginRootFromDollar = pr.fullName;
    }catch(e){ d.errors.push("$.fileName: "+e); }

    // ── thumb_gen.py ──
    try{
        // Try $.fileName path
        var tgFile = new File(d.pluginRootFromDollar + "/thumb_gen.py");
        d.thumbGenPyPath   = tgFile.fsName;
        d.thumbGenPyExists = tgFile.exists;
        // Try APPDATA fallback
        if(!d.thumbGenPyExists){
            var appdata = system.getenv("APPDATA") || "";
            if(appdata){
                var tg2 = new File(appdata.replace(/\\/g,"/")+
                    "/Adobe/CEP/extensions/com.heosan.sedpanel/thumb_gen.py");
                if(tg2.exists){ tgFile=tg2; d.thumbGenPyPath=tg2.fsName; d.thumbGenPyExists=true; }
            }
        }
        if(!d.thumbGenPyExists) d.errors.push("thumb_gen.py not found at: "+d.thumbGenPyPath);
    }catch(e){ d.errors.push("thumbGenPy: "+e); }

    // ── Python executable ──
    try{
        d.pythonExists = (new File(pythonExe)).exists;
        if(!d.pythonExists){
            // Try finding it
            var wp = system.callSystem("where python");
            if(wp && wp.length>3){
                var wl = wp.replace(/\r/g,"").split("\n")[0].replace(/^\s+|\s+$/g,"");
                if(wl && (new File(wl)).exists){ d.pythonExe=wl; d.pythonExists=true; }
            }
        }
        if(d.pythonExists){
            // Test run python --version
            var tmpPy = _getTmp(customPath).fullName+"/sed_diag_pyver.txt";
            system.callSystem('"'+d.pythonExe+'" --version > "'+tmpPy+'" 2>&1');
            var pvf = new File(tmpPy);
            if(pvf.exists){ pvf.encoding="UTF8"; pvf.open("r"); d.pythonVersion=pvf.read().replace(/[\r\n]+/g," ").substring(0,50); pvf.close(); pvf.remove(); d.pythonRunsOk=true; }
            else { d.pythonRunError="--version produced no output"; }
        } else { d.errors.push("Python not found: "+pythonExe); }
    }catch(e){ d.errors.push("python: "+e); }

    // ── cv2 check ──
    try{
        if(d.pythonExists){
            var tmpCv = _getTmp(customPath).fullName+"/sed_diag_cv2.txt";
            system.callSystem('"'+d.pythonExe+'" -c "import cv2; print(cv2.__version__)" > "'+tmpCv+'" 2>&1');
            var cvf = new File(tmpCv);
            if(cvf.exists){ cvf.encoding="UTF8"; cvf.open("r"); var cvTxt=cvf.read().replace(/[\r\n]+/g," "); cvf.close(); cvf.remove();
                if(cvTxt.indexOf("ModuleNotFoundError")>=0||cvTxt.indexOf("ImportError")>=0){
                    d.cv2Available=false; d.cv2Error=cvTxt.substring(0,100);
                    d.errors.push("cv2 not installed: "+d.cv2Error);
                } else { d.cv2Available=true; d.cv2Version=cvTxt.trim().substring(0,20); }
            }
        }
    }catch(e){ d.errors.push("cv2: "+e); }

    // ── FFmpeg ──
    try{
        d.ffmpegExists = (new File(ffmpegPath)).exists;
        if(!d.ffmpegExists) d.errors.push("FFmpeg not found: "+ffmpegPath);
        if(d.ffmpegExists){
            var tmpFf = _getTmp(customPath).fullName+"/sed_diag_ffver.txt";
            system.callSystem('"'+ffmpegPath+'" -version > "'+tmpFf+'" 2>&1');
            var fff = new File(tmpFf);
            if(fff.exists){ fff.encoding="UTF8"; fff.open("r"); d.ffmpegVersion=fff.read().substring(0,80).replace(/[\r\n]+/g," "); fff.close(); fff.remove(); d.ffmpegRunsOk=true; }
            else { d.ffmpegRunError="no output from -version"; }
        }
    }catch(e){ d.errors.push("ffmpeg: "+e); }

    // ── Log folder ──
    try{
        var lf = _getLogFolder();
        d.logFolder = lf ? lf.fsName : "(none)";
    }catch(e){}

    d.ok = (d.errors.length === 0);
    _writeLog("diag", JSON.stringify(d));
    return JSON.stringify(d);
}


