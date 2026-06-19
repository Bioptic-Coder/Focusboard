# Focusboard — Product Roadmap

> A neurodivergent-first productivity dashboard PWA built with React 19, TypeScript, Vite, and Tailwind CSS v4.

---

## Vision

Focusboard helps neurodivergent individuals manage time, stay focused, and build healthy habits through a customizable, distraction-free dashboard. The product is designed offline-first, accessible, and "always-on" for iPads, tablets, and desk displays.

---

## Phase 1: ADHD Core Widgets ✅ → 🚧

### 1.1 Brain Dump Widget (`BrainDumpWidget.tsx`)

**Status**: 🚧 In Progress  
**Priority**: P0  
**Category**: Capture & Externalization  
**Default Size**: 6×3

**Problem Statement**  
ADHD users experience intrusive thoughts and task anxiety. Without a frictionless way to externalize ideas, they either lose them or get derailed trying to remember.

**Specification**
- Full-width text input with instant-add on Enter key
- Unordered list of "dump" items — each can be tapped to mark as "processed" (strikethrough + fade)
- Clear All button with confirmation
- Drag-to-reorder support (stretch goal)
- localStorage persistence under `focusboard-braindump`
- Visual: Semi-transparent card with a brain icon, pulsing "+" button
- Accessibility: ARIA live region announces item additions; keyboard-operable list

**Acceptance Criteria**
- [ ] User can type and press Enter to add items
- [ ] Items persist across page reloads
- [ ] Processed items have visual strikethrough and reduced opacity
- [ ] Clear All requires confirmation
- [ ] Screen readers announce additions and removals

---

### 1.2 Visual Timer Widget (`VisualTimerWidget.tsx`)

**Status**: 🚧 In Progress  
**Priority**: P0  
**Category**: Time Perception  
**Default Size**: 4×3

**Problem Statement**  
ADHD users struggle with "time blindness" — difficulty perceiving the passage of time. A shrinking visual representation of remaining time provides an intuitive spatial cue that numeric countdowns cannot.

**Specification**
- Large circular progress ring (SVG-based) that visually depletes as time passes
- Preset quick-select buttons: 5m, 10m, 15m, 25m, 45m, 60m
- Custom time input via click-to-edit on the center display
- Color gradient transition: green → yellow → orange → red as time depletes
- Final 10% triggers a pulsing animation and optional chime
- Dispatches `focusboard:timer-complete` CustomEvent for Garden widget integration
- localStorage persistence of last-used duration

**Acceptance Criteria**
- [ ] Circle visually depletes proportionally to elapsed time
- [ ] Color transitions smoothly through green → red spectrum
- [ ] Preset buttons set and start timer in one tap
- [ ] Custom time entry accepts minutes input
- [ ] Timer completion fires document event and optional audio chime
- [ ] Works correctly with e-ink mode (no animations, 1s refresh)

---

### 1.3 Focus Garden Widget (`GardenWidget.tsx`)

**Status**: 🚧 In Progress  
**Priority**: P1  
**Category**: Gamification & Motivation  
**Default Size**: 6×3

**Problem Statement**  
ADHD users benefit from immediate, visual feedback loops. A virtual garden that grows based on completed focus sessions provides gentle positive reinforcement without performance pressure.

**Specification**
- Grid-based garden display (4×4) showing plant growth stages: 🌱 → 🌿 → 🌻 → 🌳
- Plants grow when the user earns "water drops" by completing:
  - Pomodoro sessions (`focusboard:pomodoro-complete`)
  - Visual Timer countdowns (`focusboard:timer-complete`)
  - Eye strain breaks (`focusboard:eyestrain-complete`)
- Each completion grants 1 water drop; 3 drops advance a plant one growth stage
- Plants are placed in the next empty cell; full garden shows a "harvest" celebration
- localStorage persistence under `focusboard-garden`
- Harvest button resets the garden with a confetti-like celebration animation
- Streak counter showing consecutive days with at least one completed session

**Acceptance Criteria**
- [ ] Garden renders a 4×4 grid of plant slots
- [ ] Completing focus activities increments water counter
- [ ] Plants advance through 4 visible growth stages
- [ ] Full garden triggers harvest celebration
- [ ] Garden state persists across sessions
- [ ] Works in e-ink mode (text-based plant representations)

---

## Phase 2: Widget Selector Redesign

### 2.1 Categorized Widget Picker Modal

**Status**: 🚧 In Progress  
**Priority**: P0  
**Category**: UX Infrastructure

**Problem Statement**  
The current widget add bar is a single horizontal scroll of buttons that becomes unmanageable as the widget count grows. Users with ADHD are particularly overwhelmed by long, unstructured lists.

**Specification**
- Replace the horizontal scroll bar with a "+" button that opens a modal/popover
- Widget categories with tabs or sections:
  - **⏰ Time & Clocks**: Clock, Date, World Clock, Timer, Stopwatch, Visual Timer
  - **🧘 Focus & Wellness**: Pomodoro, Breathing, Eye Strain, Metronome
  - **🧠 ADHD Tools**: Brain Dump, Focus Garden
  - **📝 Productivity**: Quick Notes, Quote, Calculator
  - **🌤️ Environment**: Weather
- Each widget shows: icon, name, and one-line description
- Search/filter input at the top
- Responsive grid layout (2-3 columns)
- Close on widget add or Escape key

**Acceptance Criteria**
- [ ] "+" button replaces horizontal scroll bar
- [ ] Modal displays widgets in categorized sections
- [ ] Each widget has icon, name, and description
- [ ] Clicking a widget adds it and closes modal
- [ ] Escape key closes modal
- [ ] Keyboard navigable (Tab through items)

---

## Phase 3: Engagement & Retention

### 3.1 Snooze Support for Alerts

**Priority**: P1  
**Category**: Alert Coordination

- Add a "Snooze 5m" button to stretch and eye-strain alert overlays
- Snooze resets the alert's internal timer without marking it complete
- Connect to `FocusCoordinatorContext.tsx` via `onSnooze` callback

### 3.2 Dashboard Presets

**Priority**: P2  
**Category**: Onboarding

- Offer 3 starter layouts: "Minimal Focus", "Full Dashboard", "ADHD Toolkit"
- Show preset picker on first launch or via Settings

### 3.3 Medication / Appointment Reminders

**Priority**: P2  
**Category**: ADHD Health

- Configurable recurring reminders with snooze
- Visual + audio + TTS alert through FocusCoordinator

---

## Phase 4: Premium Features (Monetization)

### 4.1 Premium Widget Tier

- **Custom Theme Engine**: User-created color palettes and backgrounds
- **Multi-Dashboard Workspaces**: Save and switch between named layouts
- **Custom Audio Tones**: Choose from bamboo, marimba, woodblock, or upload custom sounds
- **Advanced Statistics**: Session history, focus trends, streak analytics
- **Cloud Sync**: Optional iCloud/Firebase sync for multi-device layouts

### 4.2 Pricing Model

- **Free Tier**: All core widgets + 1 dashboard
- **Pro Tier** ($3.99/month or $29.99/year): Premium widgets, unlimited dashboards, cloud sync, custom themes

---

## Phase 5: E-Ink & Accessibility

### 5.1 E-Ink Optimizations

- Reduced refresh rate rendering (1s intervals)
- High-contrast black/white mode
- No animations, transitions, or gradients
- Optimized for Kindle Scribe (1404×1872, 300ppi)

### 5.2 Advanced Accessibility

- **Single Switch Scanning**: Auto-cycling focus navigation
- **Voice Commands**: "Add Clock", "Start Timer", "Increase Zoom"
- **Haptic Vibration Patterns**: Distinct patterns for different alert types

---

## Technical Debt & Infrastructure

| Item | Priority | Effort |
|------|----------|--------|
| Refactor `App.tsx` into custom hooks (`useSettings`, `useTimeCues`, etc.) | P2 | Medium |
| Add `React.memo` to widget wrappers | P2 | Small |
| Debounce `QuickNotesWidget` localStorage writes | P2 | Small |
| CI pipeline with Vitest coverage | P2 | Medium |
| Automated `sw.js` asset hash generation | P1 | Small |

---

## Release Timeline

| Milestone | Target | Contents |
|-----------|--------|----------|
| **v1.1** | Current Sprint | Brain Dump, Visual Timer, Garden widgets + Widget Selector redesign |
| **v1.2** | Sprint +1 | Snooze support, Dashboard presets, Medication reminders |
| **v1.3** | Sprint +2 | Premium widget tier, Cloud sync |
| **v2.0** | Q3 | E-ink optimization, Voice commands, App Store submission |
