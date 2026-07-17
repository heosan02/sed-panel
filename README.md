# SED Panel

**Scene Edit Detection Panel** — Adobe After Effects extension for automatic scene detection, marker management, thumbnail preview, and export.

## Features

- **Automatic Scene Detection** — Detect cuts in video layers via AE's native Scene Edit Detection (AE 2022+) or manual markers
- **Read Markers** — Read existing layer markers from AE's built-in detection
- **Multi-Layer Read Markers** — Read markers from all layers simultaneously, merge unique cut times
- **Scene Navigation** — Browse scenes via grid or list view with transport controls (⏮ ◀ ▶ ⏭)
- **Thumbnail Preview** — Generate preview thumbnails via Python cv2 (fast), FFmpeg, or AE saveFrameToPng
- **Merge Scenes** — Combine adjacent scenes into a single marker (supports both marker-based and split-layer merge)
- **Cut Layer** — Split video layer at all cut points or selected scenes only
- **Delete Except Selected** — Keep only marked scenes, remove the rest (split-layer preserves markers)
- **Export to Render Queue** — Export marked scenes as separate compositions with correct Work Areas
- **Thumbnail Cache** — JSON-based cache system in temp folder
- **Bilingual UI** — English and Indonesia language support

## Installation

### Option 1 — Inno Setup Installer
Download the latest `SED_Panel_vX.X_Setup.exe` from [Releases](https://github.com/heosan02/sed-panel/releases), run it, and follow the instructions.

### Option 2 — Manual Installation
1. Download the source from the latest release
2. Run `install.bat` as Administrator
3. Restart After Effects
4. Open via Window → Extensions → SED Panel

## Requirements

- Adobe After Effects 2022 (v22.0) through 2026 (v26.0)
- Windows 10/11 (macOS support via manual install)
- Python 3.13+ (optional, for fast cv2 thumbnail generation)

## Usage

1. Open a composition in AE, select a video layer in the Timeline
2. Click **DETECT SCENES** (AE 2022+) or use Layer → Scene Edit Detection → Create Layer Markers, then click **Read Markers**
3. Browse scenes, mark selections with Ctrl+Click or double-click
4. Generate thumbnails with 🖼 **Thumbs**
5. Use action buttons: Cut, Keep Only, Merge, Export to Render Queue

## Links

- Website: [heosan.web.app](https://heosan.web.app)
- TikTok: [@heosan](https://www.tiktok.com/@heosan)
- Instagram: [@_heosan](https://www.instagram.com/_heosan/)

## License

© 2026 Heosan

