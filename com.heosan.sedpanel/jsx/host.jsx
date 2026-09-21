// ============================================================
// host.jsx  -  SED Panel CEP  v3.4  (Multi-Layer)

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
        var t = Math.max(0, Math.min(snapSec, comp.duration - (1/comp.frameRate)));
        comp.time = t;
        var normPath = outFile.fsName.replace(/\\/g, "/");
        var normFile = new File(normPath);
        // v10.0: quarter res = ~16x faster saveFrameToPng
        var savedRes = comp.resolutionFactor;
        comp.resolutionFactor = [0.25, 0.25];
        try{
            comp.saveFrameToPng(t, normFile);
        }catch(e){
            comp.resolutionFactor = savedRes;
            throw e;
        }
        comp.resolutionFactor = savedRes;
        return _waitForOut(normFile, 3500);
    }catch(e){ try{ _writeLog("thumb","[CAPTURE] saveFrame failed: "+e.toString()); }catch(le){} }
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
        // v10.0: quarter res = ~16x faster RQ render
        miniComp.resolutionFactor=[0.25,0.25];

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
        try{ _writeLog("thumb","[CAPTURE] RQ fallback failed: "+e.toString()); }catch(le){}
        return null;
    }
}

// ── Main capture function ─────────────────────────────────
function _captureFrame(comp, snapSec, outFile){
    var result=_captureSaveFrame(comp,snapSec,outFile);
    if(result) return result;
    // Try RQ with mini comp (most reliable across all AE versions)
    result=_captureViaRQ(comp,snapSec,outFile);
    if(result) return result;
    return null;
}

function _captureFrameLazy(comp, snapSec, outFile){
    // v10.0: No duplicate, no CTI move, no resolution change.
    // comp.saveFrameToPng(time, file) renders at specified time regardless of CTI.
    try{
        var t = Math.max(0, Math.min(snapSec, comp.duration - (1/comp.frameRate)));
        var normPath = outFile.fsName.replace(/\\/g, "/");
        var normFile = new File(normPath);
        if(normFile.exists) try{ normFile.remove(); }catch(e){}
        comp.saveFrameToPng(t, normFile);
        return _waitForOut(normFile, 5000);
    }catch(e){ try{ _writeLog("thumb","[CAPTURE] lazy saveFrame failed: "+e.toString()); }catch(le){} }
    return _captureViaRQ(comp, snapSec, outFile);
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
    // v10.0: 5th param lazy=true → saveFrameToPng without CTI move (no viewer jump)
    var lazy = (arguments.length >= 5 && arguments[4] === true);
    var found = lazy ? _captureFrameLazy(comp, snapSec, outF) : _captureFrame(comp, snapSec, outF);

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

    var fps = comp.frameRate;
    var dur = comp.duration;

    var diag = {
        comp: String(comp.name),
        totalLayers: comp.numLayers,
        strictLayers: 0,
        strictMarkers: 0,
        lenientLayers: 0,
        lenientMarkers: 0,
        edgeMarkersSkipped: 0,
        note: ""
    };
    var edgeKeys = {};

    // Append {time,layerIndex,layerName} for every marker in range of the layer.
    function _collect(layer, li, arr){
        try{
            var mkr = layer.property("Marker");
            if(!mkr || mkr.numKeys === 0) return;
            for(var k = 1; k <= mkr.numKeys; k++){
                var t = mkr.keyTime(k);
                if(t > 0.001 && t < dur - 0.001){
                    arr.push({time:t, layerIndex:li, layerName: layer.name});
                } else {
                    var ek = li + "|" + t;
                    if(!edgeKeys[ek]){ edgeKeys[ek] = 1; diag.edgeMarkersSkipped++; }
                }
            }
        }catch(e){}
    }

    // Pass 1: strict scan — only layers that pass _isValidMarkerLayer
    // (video footage / pre-comps). Solids, adjustment, text, null are skipped.
    var strictMarkers = [];
    for(var li = 1; li <= comp.numLayers; li++){
        try{
            var l = comp.layer(li);
            if(!(l instanceof AVLayer)) continue;
            if(!_isValidMarkerLayer(l)) continue;
            diag.strictLayers++;
            _collect(l, li, strictMarkers);
        }catch(e){}
    }
    diag.strictMarkers = strictMarkers.length;
    if(strictMarkers.length > 0){
        _writeLog("diag","[READ] strict scan: "+diag.strictMarkers+" markers on "+diag.strictLayers+" valid layer(s)");
        return _buildScenesFromMarkers(strictMarkers, dur, fps);
    }

    // Pass 2: lenient scan — ANY AVLayer with markers, even solids,
    // adjustment/text/null/etc. that the strict filter rejects. This prevents
    // the false "No markers" when markers sit on such a layer.
    var anyMarkers = [];
    for(var li2 = 1; li2 <= comp.numLayers; li2++){
        try{
            var l2 = comp.layer(li2);
            if(!(l2 instanceof AVLayer)) continue;
            _collect(l2, li2, anyMarkers);
        }catch(e){}
    }
    diag.lenientMarkers = anyMarkers.length;
    diag.lenientLayers = _countDistinctLayers(anyMarkers);
    if(anyMarkers.length > 0){
        diag.note = "markers found via lenient scan (non-video layer types)";
        _writeLog("diag","[READ] strict=0, lenient fallback: "+diag.lenientMarkers+" markers on "+diag.lenientLayers+" layer(s)");
        return _buildScenesFromMarkers(anyMarkers, dur, fps);
    }

    // Pass 3: active layer fallback (original behavior) — catches markers on
    // a non-AVLayer (e.g. text) that the AVLayer scans cannot see.
    var singleLayer = _getActiveLayer(comp);
    if(singleLayer){
        try{
            var mkr3 = singleLayer.property("Marker");
            if(mkr3 && mkr3.numKeys > 0){
                diag.note = "markers found on active layer '"+singleLayer.name+"'";
                _writeLog("diag","[READ] strict=0 lenient=0, active layer '"+singleLayer.name+"' has markers");
                return readMarkersFromLayer(singleLayer, comp);
            }
        }catch(e){}
        diag.note = "no markers anywhere; active layer '"+singleLayer.name+"' has none";
    } else {
        diag.note = "no markers found and no active layer";
    }
    _writeLog("diag","[READ] NO MARKERS: "+JSON.stringify(diag));
    return JSON.stringify({ok:false,msg:"No markers found.",diag:diag});
}

function _countDistinctLayers(markers){
    var seen = {}, n = 0;
    for(var i = 0; i < markers.length; i++){
        if(!seen[markers[i].layerIndex]){ seen[markers[i].layerIndex] = 1; n++; }
    }
    return n;
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
        // ponytail: clamp like exportToRenderQueue — unclamped values throw when start+dur exceeds comp duration
        var st=Math.max(0,Math.min(startSec,comp.duration));
        var maxDur=Math.max(comp.duration-st,0);
        comp.time=st; comp.workAreaStart=st; comp.workAreaDuration=Math.min(durSec,maxDur);
        return JSON.stringify({ok:true});
    }catch(e){ return JSON.stringify({ok:false,msg:e.toString()}); }
}

function goToFrame(startSec){
    try{
        var comp=app.project.activeItem;
        if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false});
        comp.time=startSec;
        // Force the composition viewer to refresh so AE visibly jumps to the frame
        try{
            var v=app.activeViewer;
            if(v && v.type===ViewerType.VIEWER_COMPOSITION) v.setActive();
        }catch(e2){}
        return JSON.stringify({ok:true});
    }catch(e){ return JSON.stringify({ok:false,msg:e.toString()}); }
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
        for(var kg = 0; kg < keepS.length; kg++){
            var ks = keepS[kg];
            var li = ks.layerIndex || 0;
            if(!layerGroups[li]) layerGroups[li] = [];
            layerGroups[li].push(ks);
        }

        var layerKeys = [];
        for(var lk in layerGroups){ if(layerGroups.hasOwnProperty(lk)) layerKeys.push(lk); }
        layerKeys.sort(function(a,b){ return parseInt(b) - parseInt(a); });

        for(var lg = 0; lg < layerKeys.length; lg++){
            var lidx = parseInt(layerKeys[lg]);
            var layer = null;
            var layerScenes = layerGroups[lidx];

            if(lidx > 0 && lidx <= comp.numLayers){
                layer = comp.layer(lidx);
                if(!layer || !layer.property("Marker")) continue;
            } else if(lidx === 0){
                layer = _getActiveLayer(comp);
                if(!layer) continue;
            }

            var srcName = layer.name;
            var dotIdx = srcName.lastIndexOf('.');
            if(dotIdx > 0) srcName = srcName.substring(0, dotIdx);

            // Clear all markers on the original first so each duplicate
            // starts clean and only gets the single start marker we add.
            var origMarkers = layer.property("Marker");
            if(origMarkers){
                while(origMarkers.numKeys > 0){
                    origMarkers.removeKey(1);
                }
            }

            // Duplicate from last to first: each duplicate is trimmed to its
            // scene's in/out range, renamed, and given 1 marker at its start.
            // Duplicate + trim is far cheaper than splitLayer on heavy layers.
            for(var k2 = layerScenes.length - 1; k2 >= 0; k2--){
                var sc = layerScenes[k2];
                var dup = layer.duplicate();
                var st = sc.start_sec;
                var ed = sc.start_sec + sc.dur_sec;
                if(st < dup.startTime) st = dup.startTime;
                dup.inPoint  = st;
                dup.outPoint = ed;
                dup.name = srcName + '_' + (k2 + 1);
                try{
                    var dupMarkers = dup.property("Marker");
                    if(dupMarkers){
                        dupMarkers.setValueAtTime(st, new MarkerValue(""));
                    }
                }catch(em){}
            }
            layer.remove();
        }
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,kept:keepS.length,deleted:allS.length-keepS.length});
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

function getActiveCompId(){
    var comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false});
    return JSON.stringify({ok:true,id:comp.id});
}

function exportToRenderQueue(scenesJson, skipQueue, compId){
    var comp;
    if(compId) try{ comp=app.project.item(compId); }catch(e){ comp=null; }
    if(!comp||!(comp instanceof CompItem)) comp=app.project.activeItem;
    if(!comp||!(comp instanceof CompItem)) return JSON.stringify({ok:false,msg:"Invalid composition."});
    var scenes; try{ scenes=JSON.parse(scenesJson); }catch(e){ return JSON.stringify({ok:false,msg:"Parse error"}); }
    if(!scenes||!scenes.length) return JSON.stringify({ok:false,msg:"No scenes selected."});
    app.beginUndoGroup("SED: Export RQ");
    var added=0;
    try{
        for(var s=0;s<scenes.length;s++){
            var sc=scenes[s],dup=comp.duplicate();
            dup.name=comp.name+"_Sc"+_pad3(sc.index);
            dup.workAreaStart=sc.start_sec;
            var maxDur = dup.duration - dup.workAreaStart;
            dup.workAreaDuration = Math.min(sc.dur_sec, Math.max(maxDur, 0));
            if(!skipQueue){
                var rq=app.project.renderQueue.items.add(dup);
                rq.timeSpanStart=sc.start_sec; rq.timeSpanDuration=Math.min(sc.dur_sec, Math.max(maxDur, 0));
            }
            added++;
        }
    }catch(e){ app.endUndoGroup(); return JSON.stringify({ok:false,msg:"Export failed: "+e.toString()}); }
    app.endUndoGroup();
    return JSON.stringify({ok:true,count:added,skipQueue:!!skipQueue});
}

function cleanTempFolder(customPath){
    var tmp=_getTmp(customPath);
    var files=tmp.getFiles("*.png");
    var n=0;
    for(var f=0;f<files.length;f++){ try{ files[f].remove(); n++; }catch(e){} }
    // Also clean JPGs produced by thumb generation
    var jpegs=tmp.getFiles("*.jpg");
    for(var j=0;j<jpegs.length;j++){ try{ jpegs[j].remove(); n++; }catch(e){} }
    return JSON.stringify({ok:true,deleted:n});
}

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
    // category: "thumb" | "ae" | "diag"
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

// getSourceFileInfo() — ambil info source footage dari layer aktif
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
    _writeLog("thumb","[SOURCE] path="+srcFile.fsName+" layerStart="+layer.startTime+
        " srcStart="+sourceStartSec+" fps="+fps+" hasVideo="+src.hasVideo);
    return JSON.stringify(result);
}

// getTempFolderPath() — return temp folder path for JS to use in thumb output
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

// getThumbDiagnostics() — comprehensive thumb pipeline diagnostics
// Returns detailed info about AE, temp folder, source file
function getThumbDiagnostics(customPath){
    var result = {
        ok: true,
        aeVersion: "unknown",
        tempFolder: "",
        tempFolderExists: false,
        tempFolderWritable: false,
        sourceFile: "",
        sourceFileExists: false,
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

    // Log folder
    try{
        var lf = _getLogFolder();
        result.logFolder = lf ? lf.fsName : "";
    }catch(e){ result.errors.push("logFolder: "+e); }

    _writeLog("diag", JSON.stringify(result));
    return JSON.stringify(result);
}

// ══════════════════════════════════════════════════════════
// CMD RUNNER (VBScript-based async process launcher)
// ══════════════════════════════════════════════════════════

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
        try{
            if(waitForFinish) system.callSystem('cmd /C "' + cmd + '"');
            else system.callSystem('cmd /C start "" /B cmd /C "' + cmd + '"');
        }catch(e){}
        return;
    }

    try{
        if(waitForFinish){
            system.callSystem('wscript.exe "' + vbsPath + '"');
            try{ vbsFile.remove(); }catch(e2){}
        } else {
            system.callSystem('cmd /C start "" /B wscript.exe "' + vbsPath + '"');
        }
    }catch(e){ _writeLog("thumb","[CMD ERR] "+e.toString()); }
}

// ══════════════════════════════════════════════════════════
// THUMBNAIL RUNNER — compiled thumb_gen.exe
// Uses cv2.VideoCapture via the compiled exe (no external deps).
// ~5-10x faster than bat-based approaches for large scene counts.
// Falls back to AE's saveFrameToPng if the exe is not found.
// ══════════════════════════════════════════════════════════

// findThumbGen() — locate thumb_gen.exe only (no Python fallback)
function findThumbGen(){
    var exePath = "";

    // PRIORITY 1: Check for thumb_gen.exe relative to plugin root (works for dev + prod)
    try{
        var scriptFile = new File($.fileName);
        var pluginRoot = scriptFile.parent.parent;
        var exeFile = new File(pluginRoot.fullName + "/py/thumb_gen.exe");
        if(exeFile.exists){
            exePath = exeFile.fsName;
            _writeLog("thumb","[EXE FOUND] "+exePath);
        }
    }catch(e){ _writeLog("thumb","[EXE CHECK pluginRoot] "+e); }

    // PRIORITY 2: Fallback to standard CEP extension path (APPDATA)
    if(!exePath){
        try{
            var appdata = system.getenv("APPDATA");
            if(appdata){
                var exeFile = new File(
                    appdata.replace(/\\/g,"/") +
                    "/Adobe/CEP/extensions/com.heosan.sedpanel/py/thumb_gen.exe"
                );
                if(exeFile.exists){
                    exePath = exeFile.fsName;
                    _writeLog("thumb","[EXE FOUND APPDATA] "+exePath);
                }
            }
        }catch(e){ _writeLog("thumb","[EXE CHECK APPDATA] "+e); }
    }

    if(!exePath){
        _writeLog("thumb","[EXE] thumb_gen.exe not found");
    }

    return JSON.stringify({
        ok: !!exePath,
        exePath: exePath || ""
    });
}


// runThumbGenExe(batchJson, exePath)
// Launches thumb_gen.exe ASYNCHRONOUSLY (fire-and-forget) and returns
// immediately with the results file path. JS polls that file on disk
// (see _startResultFilePoller in main.js) instead of AE waiting for
// the exe to finish — keeps AE fully responsive.
function runThumbGenExe(batchJson, exePath){
    try{
        var batch = JSON.parse(batchJson);
        if(!batch || batch.length === 0)
            return JSON.stringify({ok:true, async:true, expectedCount:0});

        // Temp files for IPC
        var tmpDir = Folder.temp.fsName;
        var jobsPath = tmpDir + "\\sed_jobs_" + Math.random().toString(36).substring(2, 10) + ".json";
        var resultsPath = tmpDir + "\\sed_results.json";
        var errPath = tmpDir + "\\sed_exe_err.txt";
        var donePath = tmpDir + "\\sed_exe_done.flag";

        var jobsFile = new File(jobsPath);
        jobsFile.encoding = "UTF8";
        if(!jobsFile.open("w")){
            _writeLog("thumb","[EXE ERR] Cannot write jobs file: "+jobsPath);
            return JSON.stringify({ok:false, msg:"Cannot write jobs file"});
        }

        var jobsData = {jobs: batch};
        jobsFile.write(JSON.stringify(jobsData));
        jobsFile.close();

        // Clean stale files
        try{ var rf=new File(resultsPath); if(rf.exists) rf.remove(); }catch(e){}
        try{ var ef=new File(errPath);     if(ef.exists) ef.remove(); }catch(e){}
        try{ var df=new File(donePath);    if(df.exists) df.remove(); }catch(e){}

        var dq = String.fromCharCode(34);
        var batPath = tmpDir + "\\sed_exe_run.bat";
        var batFile = new File(batPath);
        batFile.encoding = "UTF8";

        var nl = "\r\n";
        var cmdLine = dq + exePath + dq + " " + dq + jobsPath + dq;
        var batContent =
            "@echo off" + nl +
            cmdLine +
            " > " + dq + resultsPath + dq +
            " 2> " + dq + errPath + dq + nl +
            "echo done > " + dq + donePath + dq + nl +
            "del /f /q " + dq + batPath + dq + nl;

        _writeLog("thumb","[EXE RUN-ASYNC] batch="+batch.length+
            " exe="+exePath);

        if(!batFile.open("w")){
            try{ jobsFile.remove(); }catch(e){}
            _writeLog("thumb","[EXE ERR] Cannot write bat: "+batPath);
            return JSON.stringify({ok:false, msg:"Cannot write bat file"});
        }
        batFile.write(batContent);
        batFile.close();

        // Fire-and-forget via VBScript
        var vbsPath = tmpDir + "\\sed_exe_launch.vbs";
        try{
            var vbsFile = new File(vbsPath);
            vbsFile.encoding = "UTF8";
            vbsFile.open("w");
            vbsFile.write('CreateObject("WScript.Shell").Run "' + batPath + '", 0, False');
            vbsFile.close();
            system.callSystem('cscript.exe //Nologo //B "' + vbsPath + '"');
        }catch(le){
            _writeLog("thumb","[EXE VBS FALLBACK] "+le);
            _runCmd(batPath, false);
        }

        _writeLog("thumb","[EXE LAUNCHED] async, non-blocking, donePath="+donePath);

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
        _writeLog("thumb","[EXE RUN THROW] "+e.toString()+" line="+(e.line||0));
        try{ if(jobsFile) jobsFile.remove(); }catch(ee){}
        return JSON.stringify({ok:false, msg:"runThumbGenExe error: "+e.toString(), line:e.line||0});
    }
}


function runPendingThumb(ctrlDir){
    try{
        // ctrlDir is the SAME directory JS wrote the ctrl file to.
        // Without it we'd have to guess Folder.temp — which may NOT match
        // the custom temp folder JS used (ctrl-file path mismatch bug).
        var ctrlPath = (ctrlDir ? String(ctrlDir).replace(/\\/g,"/") : Folder.temp.fsName.replace(/\\/g,"/")) + "/sed_thumb_ctrl.json";
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

        _writeLog("thumb","[CTRL] batch="+(ctrl.batch?ctrl.batch.length:0)+" mode=exe");

        if(!ctrl.exePath){
            _writeLog("thumb","[CTRL] no exePath → fail fast");
            return JSON.stringify({ok:false, msg:"thumb_gen.exe path missing from ctrl file"});
        }
        return runThumbGenExe(JSON.stringify(ctrl.batch), ctrl.exePath);
    }catch(e){
        _writeLog("thumb","[RUN PENDING THROW] "+e.toString()+" line="+(e.line||0));
        return JSON.stringify({ok:false, msg:"runPendingThumb error: "+e.toString()});
    }
}

// ══════════════════════════════════════════════════════════
// THUMB GEN CANCEL — kill background processes
// ══════════════════════════════════════════════════════════
function _cancelThumbGen(){
    try{
          // Kill ffmpeg processes spawned by this plugin
          system.callSystem('cmd /C "taskkill /F /IM ffmpeg.exe /T 2>nul"');
          // Kill compiled thumb_gen.exe (and any child processes)
          system.callSystem('cmd /C "taskkill /F /IM thumb_gen.exe /T 2>nul"');
    }catch(e){
        _writeLog("thumb","[CANCEL KILL] "+e.toString());
    }
    return JSON.stringify({ok:true});
}

// ══════════════════════════════════════════════════════════
// FULL DIAGNOSTIC — getFullDiagnostics()
// Tests every pipeline component and reports status.
// Called from JS when user clicks Diagnose button.
// ══════════════════════════════════════════════════════════
function getFullDiagnostics(customPath){
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
        // thumbnail generator exe
        thumbGenExePath:   "",
        thumbGenExeExists: false,
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

    // ── thumb_gen.exe ──
    try{
        // Try $.fileName path
        var tgFile = new File(d.pluginRootFromDollar + "/py/thumb_gen.exe");
        d.thumbGenExePath   = tgFile.fsName;
        d.thumbGenExeExists = tgFile.exists;
        // Try APPDATA fallback
        if(!d.thumbGenExeExists){
            var appdata = system.getenv("APPDATA") || "";
            if(appdata){
                var tg2 = new File(appdata.replace(/\\/g,"/")+
                    "/Adobe/CEP/extensions/com.heosan.sedpanel/py/thumb_gen.exe");
                if(tg2.exists){ tgFile=tg2; d.thumbGenExePath=tg2.fsName; d.thumbGenExeExists=true; }
            }
        }
        if(!d.thumbGenExeExists) d.errors.push("thumb_gen.exe not found at: "+d.thumbGenExePath);
    }catch(e){ d.errors.push("thumbGenExe: "+e); }

    // ── Log folder ──
    try{
        var lf = _getLogFolder();
        d.logFolder = lf ? lf.fsName : "(none)";
    }catch(e){}

    d.ok = (d.errors.length === 0);
    _writeLog("diag", JSON.stringify(d));
    return JSON.stringify(d);
}


