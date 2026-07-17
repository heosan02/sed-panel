# Changelog

All notable changes to SED Panel will be documented here.

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

## [3.1.0] — 2026-07-10

### Added
- keepOnlyScenes rewritten: duplicates kept scenes then removes original (reverse order)
- Scene naming uses layer.name instead of source.name
- Export RQ: skipQueue parameter for Manual mode
- Export RQ: workAreaDuration clamp for floating point safety

### Changed
- Keep Selected scenes now uses duplicate-remove approach instead of split-then-delete
- Custom naming format: {name}_1 (bottom) to {name}_N (top)

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

## [2.0.0] - 2026-06-28

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
