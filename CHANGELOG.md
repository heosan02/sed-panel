# Changelog

All notable changes to SED Panel will be documented here.

## [3.4.0] — 2026-09-21

### Fixed
- **Thumbnail cache never hit**: `_tryLoadThumbCache` passed `newPaths.length` (always `undefined` on a plain object), so the `count === scenes.length` check could never pass — now uses `Object.keys(newPaths).length`
- Cache-hit thumbnails now use `filePathToURI()` (proper `encodeURI`) instead of raw `"file:///"` concat — paths with spaces/`#`/unicode no longer break
- `goToScene`: clamp `workAreaStart`/`workAreaDuration` to comp duration like `exportToRenderQueue` (unclamped values threw on last scene)
- `_jsLog` and `window.onerror`: escape backslash/quote/newline before injecting into JSX string literal (multi-line messages broke the log call)
- `t()` i18n substitution uses a function replacer so values containing `$&`/`$'` stay literal
- Update check: 10s `AbortController` timeout + `.catch` handlers (offline no longer leaves unhandled rejection)
- `beforeunload` uses standard `e.returnValue = ""`
- Capture fallbacks (`saveFrameToPng` / RQ / lazy) now log the root-cause error via `_writeLog` instead of swallowing it
- Update check: primary via `releases/latest` redirect (web page, no API rate limit) with GitHub API as fallback; visible "Checking…" state, failure reason in status bar + log
- Grid render: windowed around viewport (spacer divs, unmount far cards) instead of infinite append — DOM/images stay bounded at 2000+ scenes, no more lag creep while scrolling
- Thumbnails: native `<img loading="lazy" decoding="async">` instead of `background-image` (no file:// I/O storm); broken files hide gracefully
- Card lookup via `_cardEls` map (O(1)) instead of `querySelector` per thumb (was O(n²) at 2500 scenes)
- `_rebuildDisplay` no longer restarts grid from 0 during thumb load (killed in-flight renders, looked like truncated scenes)
- Nav jump to unrendered card completes render then scrolls (`_ensureCardRendered`)
- `_applyScenes`: enforce chronological sort + sequential index (panel-wide invariant — no producer can show skipped/duplicated numbers)
- `window.__sedDiag()`: one-line console ground truth (data order + rendered cards + thumbs)
- Startup cleanup also removes stale `sed_thumb_cancel_*.flag` files
- Blank-panel watchdog interval relaxed 2s → 5s

### Changed
- Version bump to 3.4.0 across manifest.xml, main.js, host.jsx, index.html, install.bat, install.iss, debug.bat
- `install.iss`: `AppVer`/`OutputBaseFilename` 3.2.0 → 3.4.0
- `install.bat`: verifies `py\thumb_gen.exe` presence (warn-only, AE fallback still works)
- `debug.bat`: `head` → `more` (stock Windows), checks `py\thumb_gen.exe` instead of removed `ffmpeg/`
- `README_CEP.txt`: version header, `py/` folder structure, hot-reload note, website URL
- `style.css`: fixed stale `v9.5` comments

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)
- CSXS 6.0 runtime, manifest Host AEFT [13.0, 99.9]
- Registry CSXS 9–13 for CEP debug mode (`install.iss` writes 4–13 superset, harmless)

## [3.3.0] — 2026-07-24

### Added
- Cancel thumbnail generation properly kills background processes (`ffmpeg.exe`, `thumb_gen.exe`, `python.exe` running `thumb_gen.py`)
- `thumb_gen.exe` (compiled executable in `py/` folder) as primary thumbnail generator — no Python dependency required
- Fallback to ExtendScript native capture (`saveFrameToPng` / Render Queue) if `thumb_gen.exe` missing

### Changed
- `keepOnlyScenes`: duplicate layers now keep source name without `"_N"` suffix (was `srcName + '_' + (k2 + 1)`)
- Removed `thumb_gen.py` Python fallback entirely — faster, dependency-free install
- `runThumbGenPy()` no longer accepts `pythonExe` parameter
- Install: no Python auto-install (since v3.1)

### Fixed
- **Thumbs failed after cancel**: background process kept running and conflicted on next Read Markers — now killed via `taskkill`
- `install.bat` BOM fix (UTF-8 without BOM to prevent `'∩╗┐@echo off'` error)
- Version bump to 3.3.0 across manifest.xml, main.js, host.jsx, install.bat

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)
- CSXS 6.0 runtime, manifest Host AEFT [13.0, 99.9]
- Registry CSXS 9–13 for CEP debug mode

## [3.2.0] — 2026-07-16

### Added
- Color theme matching heosan.web.app site palette (warm brown/tan, teal accent)
- Tutorial stepper restyled to React Bits-style (numbered 1-10 circles, active dot, animated connectors)
- Click spark particle effect on click (canvas-based, 8 sparks, 400ms)
- Reset thumbnail button alongside refresh layer button
- beforeunload handler to prevent panel close from closing After Effects
- Export: capture comp ID at click time to avoid "Invalid composition" on 700+ scenes

### Changed
- Onboarding stepper: numbered circles with connector lines, clickable up to next step
- Website URL updated from heosanweb.carrd.co to heosan.web.app

### Removed
- "Add Comp Markers" button and associated JSX/i18n code

### Fixed
- Export to Render Queue: Manual mode now skips Render Queue addition, sets correct Work Areas
- workAreaDuration clamped to comp duration minus workAreaStart (floating point safety)
- keepOnlyScenes reverted to v3.1 duplicate approach with layer.name naming

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)
- CSXS 6.0 runtime, manifest Host AEFT [13.0, 99.9]
- Registry CSXS 4–13 for CEP debug mode

## [3.1.0] — 2026-07-10

### Added
- keepOnlyScenes rewritten: duplicates kept scenes then removes original (reverse order)
- Scene naming uses layer.name instead of source.name
- Export RQ: skipQueue parameter for Manual mode
- Export RQ: workAreaDuration clamp for floating point safety

### Changed
- Keep Selected scenes now uses duplicate-remove approach instead of split-then-delete
- Custom naming format: {name}_1 (bottom) to {name}_N (top)

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)

## [3.0.0] — 2026-07-05

### Added
- Multi-layer scene marker reading support
- Merge adjacent scenes feature
- Export RQ: warning modal for >100 scenes with Langsung (Add All) and Manual options
- Thumbnail cache system (JSON cache file in temp folder)
- Python cv2 thumbnail pipeline for fast batch generation
- Lazy thumbnail mode via AE saveFrameToPng
- Custom temp folder picker via Settings

### Changed
- Thumbnail grid: column switcher (2/3/4/5 columns)
- Scene cards show timecodes and thumbnails inline
- Scene list with #, IN, DUR columns

### Fixed
- Thumbnail not stuck on scene 1-3 anymore
- Cache miss detection and fallback to regeneration

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)

## [2.0.0] — 2026-06-28

### Added
- Support AE 2022 (v22) through 2026 (v26)
- AE < 2022: detect button replaced with upgrade notice
- AE 2022+: native Scene Edit Detection API
- Thumbnail shimmer loading animation
- Thumbnail fail streak counter (auto-warning after 3 consecutive fails)
- _waitForOut initial delay optimization (80ms before polling)

### Changed
- manifest.xml: CSXS 6.0 format for maximum compatibility
- manifest.xml: MinSize panel (400x280)
- install.bat: registry CSXS 4–13 (AE 2022–2026)
- Panel now appears in Window → Extensions on all supported AE versions (2022–2026)

### Fixed
- Panel not visible on AE 2022+ in some configurations (manifest fix)
- Panel blank after minimize/restore in some AE versions

## [1.1.0] — 2026-06-22

### Added
- Scene order always chronological after "Hapus Selain Terpilih"
- Thumbnail remapping: thumbs persist after scene deletion

### Changed
- keepOnlyScenes processes scenes in chronological order regardless of selection order

### Fixed
- Thumbnails disappearing after "Delete Except Selected"

## [1.0.0] — 2026-06-15

### Added
- Initial release of SED Panel CEP
- Scene Edit Detection via AE native API
- Read markers from layer
- Scene navigation (grid/list view, transport controls)
- Thumbnail generation (file:// URI with onload-delete)
- Cut layer at cut points (all or selected)
- Delete all except selected scenes
- Add composition markers
- Export to Render Queue
- Bilingual interface (English / Indonesia)
- Tutorial onboarding overlay
- Settings: language + temp folder
- Inno Setup installer
- Auto-download CSInterface.js via install.bat
