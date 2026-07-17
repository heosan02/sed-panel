# Changelog

All notable changes to SED Panel will be documented here.

## [3.1.0] — 2026-07-10

### Added
- keepOnlyScenes rewritten: duplicates kept scenes then removes original (reverse order)
- Scene naming uses layer.name instead of source.name
- Export RQ: skipQueue parameter for Manual mode
- Export RQ: workAreaDuration clamp for floating point safety

### Changed
- Keep Selected scenes now uses duplicate-remove approach instead of split-then-delete
- Custom naming format: {name}_1 (bottom) to {name}_N (top)

### Removed
- readThumbDataURI() — logic inlined into acceptThumb
- _calcSourceSec() — replaced by _calcSourceSecForScene()

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

## [2.2.0] — 2026-07-03

### Added
- FFmpeg thumbnail pipeline for fast batch extraction
- Python cv2 thumbnail fallback when FFmpeg unavailable
- Thumbnail poller system with 45s timeout
- Thumbnail progress modal with progress bar, count, ETA, cancel button
- Merge adjacent scenes feature
- Global error handler (window.onerror) catches uncaught JS exceptions
- _jsLog() structured logging helper to AE ExtendScript console
- Cancel flags (_thumbCancelled, _readCancelled) for safe abort
- ETA display during thumbnail generation
- New i18n strings: scene_count, scene_from_markers, read_cancelled, no_markers, ffmpeg_stalled

### Changed
- readThumbDataURI() now detects JPG vs PNG for correct MIME type
- Thumbnail system rewritten to support FFmpeg/cv2/AE fallback chain

### Compatibility
- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)

## [2.1.0] — 2026-07-01

### Added
- AE 2025 (v25) compatibility verified
- Scene grid column switcher (2/3/4/5 columns)
- Scene card timecodes and thumbnails inline
- Better error handling for missing temp folder

### Changed
- Thumbnail grid layout improvements
- install.bat: broader AE launch path search (2020–2026)

### Fixed
- Panel visibility on AE 2025 in some configurations

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
