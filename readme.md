# Script Genie 🎬
*Professional Screenplay Editor for the Web*

A modern, feature-rich screenplay writing application built for GitHub Pages. Write professional screenplays using industry-standard Fountain format with live preview, auto-completion, and export capabilities.

![Script Genie Screenshot](https://img.shields.io/badge/Status-Live-brightgreen) ![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### 🧠 **Script Writing**
- **Live Fountain Editor** - Type screenplay format directly in browser
- **Real-time Preview** - See formatted script as you type
- **Scene Detection** - Auto-detects `INT.`, `EXT.`, `INT./EXT.` headings
- **Character Recognition** - Automatically formats character names
- **Transition Support** - Recognizes `CUT TO:`, `FADE IN:`, etc.
- **Dialogue & Parentheticals** - Proper industry formatting

### 🔠 **Smart Assistance** 
- **Auto-complete** - Suggests characters, locations, and presets
- **Quick Insert Buttons** - One-click character, scene, transition insertion
- **Reusable Presets** - Save and manage common locations/characters
- **Keyboard Shortcuts** - `Ctrl+S` save, `Ctrl+P` export, `Ctrl+T` theme toggle

### 📝 **Professional Formatting**
- **Industry Standard** - Courier 12pt font, proper margins
- **Title Page** - Professional title page with author info
- **Page Layout** - Correct margins for screenplay format
- **Print Ready** - Optimized for PDF export

### 🧭 **User Experience**
- **Dark/Light Themes** - Eye-friendly options with smooth transitions
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Auto-save** - Never lose your work
- **Persistent Storage** - Saves themes, presets, and scripts locally

### ⏱ **Writing Tools**
- **Writing Sprint Timer** - Pomodoro-style writing sessions
- **Retro Alarm** - Audio notification when sprint completes
- **Customizable Duration** - Set your preferred writing time

### 📄 **Export & Sharing**
- **PDF Export** - Professional print-ready format
- **Browser Integration** - Uses native print dialog
- **GitHub Pages Ready** - Deploy instantly

## 🚀 Quick Start

### Option 1: Use the Live Demo
Visit: [https://hellcinder.github.io/scriptgenie/](https://hellcinder.github.io/scriptgenie/)

### Option 2: Fork & Deploy
1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Your app will be live at `https://<your-username>.github.io/scriptgenie/`

### Option 3: Local Development
1. Clone the repository (you need `index.html`, `script.js` and `styles.css` together)
2. Open `index.html` in any modern browser, or serve the folder with `python3 -m http.server`
3. Start writing! No build process, no dependencies.

## 📖 How to Use

### Basic Screenplay Format

Script Genie reads [Fountain](https://fountain.io), the plain-text screenplay
format. Type normally and the preview formats it as you go.

```
FADE IN:

INT. COFFEE SHOP - MORNING

RAIN streaks the window. MAYA nurses a cold espresso.

MAYA
You're late.

DEV (O.S.)
Traffic.

MAYA
(not looking up)
It's always traffic.

CUT TO:
```

### Formatting Rules

| Element | How to write it |
| --- | --- |
| **Scene heading** | Start the line with `INT.`, `EXT.`, `INT./EXT.`, `EST.` or `I/E.` |
| **Character cue** | Put it in UPPERCASE on its own line, with a blank line above and dialogue directly below |
| **Extension** | Append it in parentheses: `DEV (O.S.)`, `MAYA (V.O.)`, `DEV (CONT'D)` |
| **Parenthetical** | A line containing only `(text)` |
| **Dialogue** | Any line directly under a cue or parenthetical — a blank line ends the block |
| **Transition** | UPPERCASE ending in `TO:`, e.g. `CUT TO:`, `DISSOLVE TO:` |
| **Action** | Anything else |

Character cues must be uppercase, which is what Fountain expects and what keeps
ordinary action lines from being mistaken for cues. To force a cue that isn't
uppercase, prefix it with `@`:

```
@McAvoy
Not every name shouts.
```

### Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + P` | Export to PDF |
| `Ctrl/Cmd + T` | Toggle theme |
| `Tab` | Indent (or accept an autocomplete suggestion) |
| `↑` / `↓` | Move through autocomplete suggestions |
| `Enter` | Accept the highlighted suggestion |
| `Esc` | Dismiss autocomplete |

### Saving & Export

Your script, title page and presets are stored in the browser's local storage
and restored the next time you open the app. Autosave runs as you type and
again every 30 seconds. **Export PDF** opens a print-formatted copy and calls
the browser's print dialog — choose "Save as PDF" as the destination. Allow
pop-ups for the site or the print window won't open.

Because storage is per-browser, clearing site data clears your script. Export
anything you want to keep.

## 📄 License

MIT — see [LICENSE](LICENSE).
