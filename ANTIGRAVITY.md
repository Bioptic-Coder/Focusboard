# Antigravity Instructions for Focusboard

This file serves as a persistent context guide and instruction set for **Antigravity** (your AI coding assistant) when working on the **Focusboard** project.

---

## 🚀 Key Commands

### Development
- **Start Dev Server (Local):** `npm run dev`
- **Start Dev Server (Local Network/iPad Access):** `npm run dev -- --host`
- **Preview Production Build:** `npm run preview`

### Build & Lint
- **Production Build:** `npm run build`
- **Lint Codebase:** `npm run lint`

### Testing
- **Run Tests (Vitest):** `npx vitest run` (or `npx vitest` for watch mode)
- **Test Setup File:** [src/test/setup.ts](file:///Users/ericglasser/projects/Focusboard/src/test/setup.ts) (handles mocks for Web Audio API and `localStorage`).

### Docker & Portability
- **Build & Start Container:** `docker compose up --build -d` (serves Focusboard locally at `http://localhost:8080`)
- **Stop Container:** `docker compose down`

---

## 🛠️ Technology Stack
- **React 19:** Functional components, hooks, semantic JSX.
- **TypeScript 6.0:** Strict typing, clean interfaces.
- **Vite 8.0:** Modern fast bundler and dev server.
- **Tailwind CSS v4:** Imports and theme configuration located in [src/index.css](file:///Users/ericglasser/projects/Focusboard/src/index.css).
- **Icons:** Lucide React (`lucide-react`).
- **PWA Capabilities:** Enabled offline support via [public/sw.js](file:///Users/ericglasser/projects/Focusboard/public/sw.js) caching, standalone iPad fullscreen mode configurations in [public/manifest.json](file:///Users/ericglasser/projects/Focusboard/public/manifest.json) and `index.html`.

---

## 📏 Coding Standards & Conventions

### Sizing and Zoom Scaling
- **Relative Units (`rem` / `em`):** The app supports dynamic global zooming (from 80% to 200%) controlled via `--app-zoom` at the root document level. **Do not use hardcoded `px` dimensions** for layout or typography; use relative sizing (`rem`/`em`/`vh`/`vw` or percentage) so widgets scale gracefully when the zoom setting changes.
- **Grid Layout:** 12-column dynamic CSS grid structure where widget position `(x, y)` and size `(w, h)` are defined by grid-column and grid-row configurations.

### Themes & Variables
- Color themes are controlled via `data-theme` attribute at the root (`glass` default, `hc-dark` high contrast dark, `hc-light` high contrast light).
- Always use the predefined design tokens (CSS custom properties) like `var(--color-dashboard-bg)`, `var(--color-text-main)`, and `var(--color-card-border)` instead of raw color classes (like `bg-zinc-900`) to guarantee high-contrast readability.

### Accessibility (A11y)
- **High legibility font:** The Braille Institute's *Atkinson Hyperlegible* font is integrated.
- **Focus Indicators:** Ensure all interactive elements have the `.accessible-focus` class, which handles dynamic outline styles, custom colors, and outline widths.
- **Touch/Screen controls:** To avoid dragging precision issues on iPad, widgets should provide simple button controls (Up/Down/Left/Right shifts, Grow/Shrink sizes) visible during Edit Mode.
- **Screen Reader Ready:** Use semantic HTML (`<button>`, `<main>`, `<header>`) and appropriate `aria-label` tags for visual-only controls (e.g., icons with no visible text).

### E-ink Mode Optimization
- **Auto-Detection & Toggle:** E-ink screens (like Kindle, Kobo, or Onyx tablets) are auto-detected by matching `/Kindle|Silk|Kobo|Onyx|E-ink|Paperwhite|e-reader/i` against the User Agent, defaulting to the High Contrast Light theme. Users can manually override this toggle in the Accessibility Settings panel.
- **Global CSS Overrides:** When `einkMode` is enabled, `data-eink="true"` is set on the document element. A global CSS rule in [src/index.css](file:///Users/ericglasser/projects/Focusboard/src/index.css) matches `[data-eink="true"]` and disables all smooth transitions, animations, box-shadows, and backdrop-blurs.
- **Component Specific Actions:**
  - **ClockWidget:** Disable clock separator colon blinking (keeps it solid) and cap the time ticking interval to `1000ms` (avoiding 100ms ticks).
  - **MetronomeWidget:** Force active visual beat indicators to be solid `var(--color-text-main)` and inactive indicators to be transparent (removing gray gradients and scaling).
  - **BreathingWidget:** Remove circle scale transitions (uses static sizes and text instructions only).

### Audio and Offline Capability
- Focusboard operates completely offline. Do **not** load external scripts, media, fonts, or assets dynamically from the web.
- Audio warnings (e.g., in `TimerWidget`, `PomodoroWidget`, or alerts) must be synthesized offline using the browser's **Web Audio API**.

### Data & Configuration Sync
- Sync layout configurations, widget inputs (notes, stopwatch state, location details) and user settings automatically to `localStorage`.

---

## 🧪 Testing Guidelines
- **Test Location:** Keep unit and integration tests inside files ending in `.test.tsx` next to the file being tested (e.g., `SettingsPanel.test.tsx` next to `SettingsPanel.tsx`).
- **Mocks:** Use mocks for state persistence (`localStorage`) or browser-only APIs (like `AudioContext`) in the [src/test/setup.ts](file:///Users/ericglasser/projects/Focusboard/src/test/setup.ts) file.
- **Verification:** Always run `npx vitest run` and `npm run build` after completing any modification to verify that typing and testing remain green.

---

## 🤖 Antigravity Behavioral Guidelines
- **Direct & Concise:** Keep explanations clear and concise. Prioritize showing code diffs.
- **File Manipulation:** Use precise file modification tools (`replace_file_content` or `multi_replace_file_content`) instead of full file overwrites where possible.
- **Check-ins:** Always run tests and verify changes before reporting back to the user.
