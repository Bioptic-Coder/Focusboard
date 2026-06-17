# Focusboard

Focusboard is an accessible, customizable, and offline-capable single-page Progressive Web App (PWA) dashboard. It is designed to act as a desktop utility companion, desk clock, and productivity hub, specifically optimized to run fullscreen on a **2018 iPad Pro 11"** or other tablet devices.

Built with **React**, **TypeScript**, and **Tailwind CSS v4**, Focusboard prioritizes low-vision legibility, offline functionality, and simple, clutter-free desk utility operations.

---

## Key Features

### 🔍 Low-Vision Accessibility & Customization
- **Atkinson Hyperlegible Font**: Styled using the Braille Institute of America's font specifically designed to improve character readability.
- **Interface Zoom Sizing**: A global slider and precision tap buttons scale the entire layout dynamically from **80% to 200%** using relative units (`rem`), ensuring widgets scale cleanly without layout breakage.
- **Contrast Themes**: Switch instantly between **Glassmorphism Dark**, **High Contrast Dark** (pure black with white borders), and **High Contrast Light** (pure white with black borders).
- **Customizable Focus Indicators**: Define your own keyboard/remote focus borders by thickness (1px–8px), style (dashed, solid, dotted, double), and high-contrast color (Amber, Neon Blue, Safety Green, etc.).
- **Accessible Layout Adjustment**: In addition to touch drag-and-drop, widgets feature hover/focus button controls to shift position (Up/Down/Left/Right) or size (Grow/Shrink) to prevent frustrating precision-dragging issues.

### 📱 PWA & iOS Home Screen Integration
- **Full Offline Operation**: Powered by a Service Worker (`sw.js`) that caches all static app assets and external Google Fonts, meaning the dashboard launches instantly even without Wi-Fi.
- **Safari Standalone Mode**: Configured with meta tags and a web manifest (`manifest.json`) using `viewport-fit=cover` and `black-translucent` status bar colors. It runs fullscreen as a standalone app when added to the iPad Home Screen.
- **Retina-Ready Vector App Icon**: References a scalable SVG icon for crisp rendering on high-DPI iOS displays.

---

## Widget Catalog

1. **🕒 Desk Clock**: Ultra-large time display. Supports toggling between 12-hour (with large AM/PM badge) and 24-hour modes, showing/hiding seconds, and flashable separators. Toggles are hidden outside of Edit Mode to avoid clutter.
2. **📅 Calendar Date**: Displays weekday, month, day, and year. Styles toggle between standard, compact, or calendar sheet views (options hidden outside Edit Mode).
3. **⌛ Interval Timer**: Interactive count-down timer with manual plus/minus adjusters, common presets (1m, 5m, Pomodoro 25m, etc.), and a browser-synthesized double-beep alarm (using the Web Audio API, fully offline).
4. **⏱️ Stopwatch**: Centisecond precision stopwatch with scrollable lap logging.
5. **📝 Scratchpad Notes**: A large-text writing pad that automatically saves notes to `localStorage` on every keystroke.
6. **💬 Quote of the Day**: Centered, large-font quote box. Features a curated offline list of 25 motivational quotes with author attribution.
7. **🌤️ Local Weather**: Uses HTML5 Geolocation to query the keyless Open-Meteo API. Maps weather conditions to high-contrast SVG weather icons. Supports manual coordinate entry overrides.
8. **🧮 Calculator**: A large-button 4x5 tactile grid for quick calculations on your desk without opening separate devices.
9. **🍅 Pomodoro Timer**: Standard 25-minute focus / 5-minute break timer. Dynamically shifts theme border colors (Amber for Focus, Emerald/Blue for Break) to be visible across a room, and sounds a synthesized chime on cycle transition.

---

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation
1. Clone the repository or navigate to the project directory:
   ```bash
   cd focusboard
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the development server:
   ```bash
   npm run dev
   ```

### Running for iPad (Local Network Sharing)
To expose the development server to your local Wi-Fi network so your iPad can access it:
   ```bash
   npm run dev -- --host
   ```
Look at the printed terminal output for the **Network IP** address (e.g., `http://192.168.1.50:5173`).

---

## Installing on iPad (Home Screen PWA)

1. Open **Safari** on your iPad.
2. Navigate to the local network host URL printed by the dev server (e.g., `http://192.168.x.x:5173`).
3. Tap the **Share** button (the square icon with the upward arrow) in the Safari toolbar.
4. Scroll down and tap **Add to Home Screen**.
5. Launch the **Focusboard** app icon from your home screen. It will open fullscreen without Safari browser toolbars, cache files, and run completely offline!

---

## Building for Production
To compile the production-ready static assets in the `dist` folder:
   ```bash
   npm run build
   ```
