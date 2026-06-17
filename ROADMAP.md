# Focusboard — Product Tester Feedback & Tech Architecture Roadmap

This document compiles the evaluations, accessibility audits, usability reports, and architectural reviews performed by our specialized product tester feedback personas. It outlines a unified strategy to address critical bugs, improve compliance with accessibility standards (WCAG 2.2 AAA), and scale the codebase.

---

## 1. Tester Panel Status

| # | Persona | Focus Area | Status |
|---|---------|-----------|--------|
| 1 | **Alex** | Low-Vision & Screen Reader (WCAG) | ✅ Complete |
| 2 | **Jordan** | Neurodiversity & Focus/Attention | ✅ Complete |
| 3 | **Taylor** | E-ink Tablet Optimization | ✅ Complete |
| 4 | **Morgan** | Motor/Mobility Impairments | ✅ Complete |
| 5 | **Robin** | Deaf & Hard-of-Hearing (DHH) | ✅ Complete |
| 6 | **Charlie** | Cognitive Simplicity & UX | ✅ Complete |
| 7 | **Casey** | Power User & Productivity | ✅ Complete |
| 8 | **Sam** | Senior & Elder Usability | ✅ Complete |
| 9 | **Devon** | Software Architect & QA Engineer | ✅ Complete |
| 10 | **Avery** | Mobile & PWA Device | ✅ Complete |

---

## 2. Executive Summary & Critical Deficiencies

The evaluations highlight that Focusboard has an **outstanding foundational structure**:
* **Atkinson Hyperlegible** as the primary typeface for excellent legibility.
* **120% default interface zoom** scaling natively across the dashboard.
* **E-ink Mode detection** that strips animations and transitions to respect low refresh rates.
* **High-Contrast Themes** (HC Dark/Light) offering maximum 21:1 color contrast.
* **Keyboard-operable widget controls** for users unable to use drag-and-drop.

However, the team identified **systemic bugs and compliance issues** that must be resolved:

1. **🔴 [StopwatchWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/StopwatchWidget.tsx) Leak**: Two concurrent `useEffect` loops run when active (1s and 10ms intervals). The 1s loop becomes orphaned and leaks, consuming CPU and causing performance degradation over start/stop cycles.
2. **🔴 Fullscreen Overlay Focus Traps**: Keyboard focus leaks behind the [Stretch Alert dialog](file:///Users/ericglasser/projects/Focusboard/src/App.tsx#L549-L591) and [Time Cue overlays](file:///Users/ericglasser/projects/Focusboard/src/App.tsx#L520-L546), violating WCAG 2.4.3 (Focus Order).
3. **🔴 PWA Cache Desynchronization**: The custom service worker in [sw.js](file:///Users/ericglasser/projects/Focusboard/public/sw.js) caches hashed assets dynamically at runtime using Stale-While-Revalidate. When a new version is deployed and the user is offline, the cached `index.html` references updated hashed JS bundle names that aren't in the cache, resulting in a blank screen crash.
4. **🔴 AudioContext Over-Allocation**: AudioContext instances are instantiated dynamically for every single tone. High-frequency operations like the [Metronome](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/MetronomeWidget.tsx) or repeating alarms will exceed browser hardware audio limits and crash the audio layer.
5. **🔴 Viewport Zoom Blocked**: The meta tag in [index.html](file:///Users/ericglasser/projects/Focusboard/index.html#L6) disables pinch-to-zoom (`user-scalable=no`), preventing low-vision tablet users from using system scaling gestures.
6. **🔴 Hidden Touch Controls**: Critical controls in [WeatherWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/WeatherWidget.tsx#L241) are hidden behind hover (`opacity-0 group-hover:opacity-100`), making them completely inaccessible on touch screens.
7. **🟠 Timer Collision & Transient Loss**: Active timer widgets (Pomodoro, Timer, Stopwatch) store state purely in volatile React memory, resetting on reload or when the OS refreshes background web views. Additionally, these timers run on decentralized intervals and can alert/clash simultaneously with no central coordinator.
8. **🟠 Rendering Waste & Mobile Squeezing**: The dashboard re-renders the entire widget tree on every single pixel of pointer movement during widget dragging. On mobile viewports, the rigid 12-column coordinate system squeezes widgets into unreadable, overlapping components.

---

## 3. Detailed Persona Reports

---

### 3.1 👁️ Alex — Low-Vision & Screen Reader Tester

#### Key Findings
* **DOM Order vs. Visual Order**: Widgets are read in array insertion order instead of spatial visual order (left-to-right, top-to-bottom). Screen readers jump erratically. See [Dashboard.tsx](file:///Users/ericglasser/projects/Focusboard/src/components/Dashboard.tsx).
* **Modal Accessibility**: Background elements are not hidden (`aria-hidden="true"`) when modals or drawers are open. The accessibility tree remains fully readable behind the Settings panel and alerts.
* **Focus Management**: No focusable element in the Time Cue overlay. The dialog can be dismissed by any keypress, but that keypress also triggers whatever button was focused on the background.
* **Disabled Elements Trap**: The focus trap in [SettingsPanel.tsx](file:///Users/ericglasser/projects/Focusboard/src/components/SettingsPanel.tsx#L72-L78) fails to exclude disabled buttons (like disabled zoom bounds), breaking tab navigation.

#### Recommendations
1. Sort widget configurations spatially (by `y` first, then `x`) prior to rendering DOM elements.
2. Use `<dialog>` elements or a robust library like `focus-trap-react` for all overlays.
3. Keep live regions concise (under 40 characters) in Braille-friendly mode.

---

### 3.2 🧠 Jordan — Neurodiversity & Focus Tester

#### Key Findings
* **Coercive Alerts**: The fullscreen Stretch Alert takes over the entire viewport with no option to snooze, forcing users to interrupt their current flow.
* **Aggressive Tones**: The default 880Hz/1100Hz audio tones sound like clinical errors rather than pleasant wellness triggers.
* **Timer Overlaps**: Pomodoro break alerts, stretch alarms, and hourly beeps can conflict, playing audio over spoken text.

#### Recommendations
1. Introduce a "Snooze" button (5m/10m) to stretch alerts.
2. Switch to softer musical scales (e.g., marimba or bamboo chime synth).
3. Introduce non-intrusive notification types like screen-border glows rather than fullscreen takeovers.
4. Implement a gamified, low-distraction pixel garden (E-ink safe) where plants grow upon completing focus sessions.

---

### 3.3 📟 Taylor — E-Ink Tablet Tester

#### Key Findings
* **10ms Rendering Frenzy**: The stopwatch's 10ms update interval ([StopwatchWidget.tsx](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/StopwatchWidget.tsx#L39-L56)) forces 100 state updates per second. On E-ink screens (e.g., Onyx Boox, Kindle), this causes severe flashing, ghosting, and battery drain.
* **Drag-and-Drop Latency**: Pixel-tracking dragging is unusable on screens with 150ms+ refresh latency.
* **Scroll-Drawer Ghosting**: Scrolling the settings panel produces continuous E-ink ghosting.

#### Recommendations
1. Throttle the stopwatch to 1000ms updates when `einkMode` is active, and hide centiseconds.
2. Implement a tabbed interface for the Settings Drawer to eliminate scrolling.
3. Auto-hide drag handles and display large, explicit layout adjustment arrow keys in `einkMode`.
4. Provide a manual E-ink page-flash button to force-clear ghosting.

---

### 3.4 🖐️ Morgan — Motor & Mobility Tester

#### Key Findings
* **Sub-standard Touch Targets**: Widget edit controls (delete, move, size) are 28×28px. The WCAG 2.2 AAA minimum target size is 44×44px. Tremors cause accidental widget deletions.
* **Stacked Controls**: The Timer's increment/decrement (+/-) adjustments are stacked vertically with zero separation.
* **Tab Fatigue**: Keyboard navigation requires up to 8 tab stops per widget in edit mode, totaling 40+ stops for a standard layout.

#### Recommendations
1. Implement direct keyboard shortcut modifiers for the active widget (e.g., `Arrow Keys` to move, `Shift + Arrow Keys` to resize, `Delete` to remove).
2. Group and space buttons to prevent accidental activations.
3. Integrate voice control navigations and quick voice-dictation notes.

---

### 3.5 🦻 Robin — Deaf & Hard-of-Hearing Tester

#### Key Findings
* **No Visual Captions**: Speech synthesis (TTS) prompts and beep alarms have zero visual equivalents. DHH users are unaware of cues or spoken announcements.
* **Subtle Transitions**: Fade-in overlays are too gradual and can be missed in peripheral vision.

#### Recommendations
1. Implement a **Visual Caption Toast System** that displays text banners whenever audio or speech is triggered.
2. Integrate native haptic vibrations using `navigator.vibrate()` (e.g., specific pulse patterns for Pomodoro, cues, and stretch events).
3. Add a screen-edge border flash setting (flash rate configurable) to capture peripheral attention.

---

### 3.6 🧩 Charlie — Cognitive Simplicity & UX Tester

#### Key Findings
* **Jargon & Raw Configs**: The configuration import panel expects raw JSON. Error messages like "Invalid dashboard configuration format" are technical and confusing.
* **Default Dialogs**: Standard browser `confirm()` boxes are unstyled and disorienting.

#### Recommendations
1. Introduce a set of curated layout templates (e.g., "Deep Work Study", "Wellness Desk", "Clock-Only") selectable with a single click.
2. Replace JSON copy-pasting with a simple numeric "Layout Code" or standard file upload.
3. Add a "Distraction-Free Mode" that dims inactive widgets and hides seconds.
4. Implement an interactive first-run tutorial walkthrough.

---

### 3.7 ⚡ Casey — Power User & Productivity Tester

#### Key Findings
* **Single Dashboard Constraint**: No support for saving and switching between separate dashboards (e.g., "Work" vs. "Weekend").
* **No Collision Detection**: Widgets overlap when resized or moved, obscuring underlying widgets and creating keyboard focus traps.
* **Static Density**: Layout columns are fixed to 12 and rows are locked to 140px.

#### Recommendations
1. Implement **Multi-Workspace Layouts** with hotkeys (`Alt+Shift+[1-9]`) to toggle between them.
2. Support Workspace Tags (e.g., `#focus` auto-starts Pomodoro; `#evening` increases blue-light warmth).
3. Introduce an API Feed Widget to pull custom JSON endpoints and render metrics (weather, server statuses, tasks).
4. Implement a grid collision solver that shifts overlapping widgets.

---

### 3.8 👴 Sam — Senior & Elder Usability Tester

#### Key Findings
* **Font CDN Dependency**: Loading Atkinson Hyperlegible from Google Fonts CDN makes the accessibility features fragile. If offline or on weak networks, fallback fonts lose hyperlegibility shapes.
* **Contrast Violations in HC Themes**:
  * The blue accent (`text-blue-400` / `#60a5fa`) on the white background in `hc-light` theme yields only 3.3:1 contrast (**WCAG AA Fail**).
  * The amber edit mode text (`text-amber-500` / `#f59e0b`) on white yields 2.2:1 contrast (**WCAG AA Fail**).
  * The red error text (`text-red-500`) on white yields 4.0:1 contrast (**WCAG AA Fail**).
* **Tiny Details**: Settings help text and descriptions utilize `text-xs` (~12px), which is illegible for many senior eyes.

#### Recommendations
1. Self-host Atkinson Hyperlegible files inside the `public/` directory for offline reliability.
2. Update theme rules in [index.css](file:///Users/ericglasser/projects/Focusboard/src/index.css) to enforce dark blue/black contrast elements for text on HC Light.
3. Remove `user-scalable=no` from the viewport meta tag to restore system pinch-to-zoom.
4. Provide voice confirmations when settings are changed (e.g., `"Zoom set to 150 percent"`).
5. Add a "Warm Sepia" theme to reduce eye fatigue.

---

### 3.9 🛠️ Devon — Software Architect & QA Engineer

#### Key Technical Findings
* **Memory Leaks & Timer Pollution**:
  * [StopwatchWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/StopwatchWidget.tsx) registers two parallel effects updating `timerRef.current`. The 1s interval is leaked permanently upon activation.
  * Pomodoro's `handleCycleComplete` accesses values within a stale closure in its interval handler.
* **Audio Layer Overhead**: Individual `AudioContext` constructs are created and closed on every sound play, violating limits during high-frequency usage (e.g. fast metronome clicks).
* **Performance Hotspots**:
  * `ClockWidget` ticks every 100ms when seconds are shown.
  * `StopwatchWidget` state updates 100 times per second, triggering heavy React re-renders.
  * `Dashboard` updates layouts inside a high-frequency `pointermove` event handler, forcing complete widget tree re-renders at 60fps.
  * `JSON.stringify(widgets)` executes on every render cycle of `App.tsx`.
* **State & Code Health**:
  * `App.tsx` has grown into a 608 LOC "God Component" handling settings, layouts, cue states, and multiple browser APIs.
  * No widgets utilize `React.memo`, meaning any layout drag re-renders all 13 widgets.
  * `QuickNotesWidget` writes to `localStorage` synchronously on *every keystroke*, blocking the UI thread.
* **Test Architecture gaps**:
  * The most complex, high-risk widgets—[TimerWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/TimerWidget.tsx), [StopwatchWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/StopwatchWidget.tsx), [PomodoroWidget](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/PomodoroWidget.tsx), and [Dashboard](file:///Users/ericglasser/projects/Focusboard/src/components/Dashboard.tsx)—have **zero test coverage**.
  * No test command exists in `package.json`.
  * `window.confirm` is stubbed to return `true` globally, obscuring safety bugs.

#### Recommendations
1. Resolve the stopwatch interval leak immediately.
2. Refactor state into Custom Hooks: `useSettings`, `useAudioService`, `useTimeCues`, and `useStretchAlerts`.
3. Switch Stopwatch and Clock rendering to a `requestAnimationFrame` loop.
4. Debounce storage writes for notes and widget positions.
5. Setup Vitest coverage trackers and establish a CI workflow.

---

### 3.10 📱 Avery — Mobile & PWA Device Tester

#### Key Findings
* **PWA Offline Asset Drift**: The custom stale-while-revalidate dynamic caching handles hashed Vite assets (`assets/index-*.js`) unsafely. If the user loads an updated index cached in the background while offline, the browser requests the new hashed assets which do not exist in the offline cache, causing a blank-screen startup crash.
* **CDN font dependency**: Atkinson Hyperlegible is retrieved at runtime from Google CDN. In offline conditions, cross-origin opaque response restrictions can prevent service worker caching, dropping hyperlegibility styling.
* **Mobile Column Squeezing**: Stretched layout coordinates (`gridColumn: widget.x + 1 / span widget.w`) squeeze widgets to a width of under 120px on mobile screens, making text overflow and buttons clip.
* **Timers Loss in Background**: Since running timers and Pomodoros are kept entirely in volatile React memory, they reset when mobile web views refresh in the background to reclaim system resources.
* **Weather Service Offline Failure**: Launching the app offline renders `⚠️ Weather service unreachable`, displaying empty widgets with no last-known-data caching.

#### Recommendations
1. Write a post-build node script or use a Vite plugin to populate `ASSETS_TO_CACHE` in `sw.js` with correct hashed filenames automatically.
2. Bundle Atkinson Hyperlegible files directly in the `public/` directory to satisfy the offline-first criteria.
3. Implement a **Responsive Column Stacking fallback** using custom CSS variables (e.g. `--widget-x`) and media queries in `index.css` to collapse widgets to 12-column span on screens narrower than `768px`.
4. Cache the weather forecasts locally via `localStorage` and display a fallback stamp (e.g. `"Offline — Cached 2 hours ago"`).
5. Persist running timer target timestamps in `localStorage` on start, calculating elapsed drift on mount to maintain countdown state across background web view reloads.

---

## 4. Consolidated Priority Matrix

### 🔴 P0 — Critical Fixes & Compliance (Immediate)

| Target Item | Focus Area | Source | Effort |
|-------------|------------|--------|--------|
| **Fix Stopwatch Interval Leak** | Clean up duplicate `useEffect` hooks in [StopwatchWidget.tsx](file:///Users/ericglasser/projects/Focusboard/src/components/widgets/StopwatchWidget.tsx) | Devon, Sam | Small |
| **Restore Viewport Scaling** | Remove `maximum-scale=1.0, user-scalable=no` from [index.html](file:///Users/ericglasser/projects/Focusboard/index.html) | Sam, Avery | Small |
| **Fix Modals Focus Trap** | Enforce focus trapping on Stretch Prompt and Time Cues | Alex, Morgan | Medium |
| **PWA Cache Resolution** | Build script to generate static hashes cache in `sw.js` to prevent blank crashes | Avery | Medium |
| **Bundle Fonts Locally** | Self-host Atkinson Hyperlegible font assets in `public/` for offline-first | Sam, Avery | Small |
| **Ensure HC Light Contrast** | Eliminate low contrast colors (blue, amber, red) on HC Light theme | Sam | Small |
| **Expose Touch Controls** | Remove hover requirement from weather and timer widgets controls | Sam, Morgan | Small |
| **Secure Background Modals** | Apply `aria-hidden="true"` to app root when overlays are open | Alex | Small |

### 🟠 P1 — Performance & High-Impact Usability (Next Sprint)

| Target Item | Focus Area | Source | Effort |
|-------------|------------|--------|--------|
| **Responsive Stacking Grid** | Convert coordinates to CSS variables and stack widgets vertically on mobile screens | Avery | Medium |
| **Weather Offline Caching** | Store last successful query in `localStorage` and show "offline — cached" badge | Avery | Small |
| **Timer State Persistence** | Persist running timer targets to localStorage to survive PWA reloads/sleep | Avery, Devon | Small |
| **Visual Caption Toasts** | Create overlay to display text captions for all audio triggers | Robin | Medium |
| **Central Alert Coordinator** | Implement event coordinator context to serialize and queue timers | Jordan, Devon | Large |
| **Direct Keyboard Navigation** | Enable Arrow Key movement/resize when a widget is focused | Morgan, Alex | Medium |
| **Touch Target Enhancements** | Upscale all interactive elements to at least 44×44px | Morgan, Sam | Small |
| **Stopwatch Optimization** | Replace 10ms state intervals with `requestAnimationFrame` | Devon, Taylor | Medium |
| **Dashboard Drag Optimization**| Use temporary refs during drags; update widget state only on drag end | Devon | Medium |
| **Write Tests for Core Widgets**| Cover Timer, Stopwatch, and Pomodoro widgets | Devon | Medium |
| **Add Test Scripts** | Configure `"test": "vitest"` and `"coverage"` in `package.json` | Devon | Small |

### 🟡 P2 — Value Features & Code Cleanup (Near-Term)

| Target Item | Focus Area | Source | Effort |
|-------------|------------|--------|--------|
| **Refactor God Component** | Move settings, cues, and alerts logic out of `App.tsx` into custom hooks | Devon | Medium |
| **Memoize Dashboard Tree** | Wrap widget wrappers in `React.memo` to prevent cascading renders | Devon | Small |
| **Dashboard Presets** | Create selectable layout configurations | Charlie, Sam | Medium |
| **Tabbed Settings Drawer** | Paginate options to improve settings navigation (critical for E-ink) | Taylor, Sam | Medium |
| **Haptic Vibrations** | Trigger haptic feedback patterns on timers and alarms | Robin | Small |
| **Medication / Task Reminders**| Add a dedicated medication and appointment reminder widget | Sam | Medium |
| **Warm Sepia Theme** | Add an low-contrast cream/sepia reading theme | Sam | Small |
| **Debounce Note Input** | Batch note storage writes to prevent synchronous IO locks | Devon | Small |

### 🔵 P3 — Long-Term Strategic Enhancements

| Target Item | Focus Area | Source | Effort |
|-------------|------------|--------|--------|
| **Multi-Dashboard Workspaces**| Save and load independent workspaces with switcher bar | Casey | Large |
| **Custom Audio Tone Selector**| Select bamboo, woodblocks, marimbas, or classic beep oscillators | Jordan | Medium |
| **Single Switch Scanning** | Auto-cycling focus navigation for users with severe motor impairments | Morgan | Large |
| **Onboarding Tour** | Walk new users through layout editing, sizing, and widget selection | Charlie | Medium |
| **Custom API/JSON Widget** | Call endpoint, parse JSONPath, and render results on dashboard | Casey | Large |
| **Voice Command Suite** | Hands-free commands ("Add Clock", "Start Study", "Increase Zoom") | Morgan | Large |
