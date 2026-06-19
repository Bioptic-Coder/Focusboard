import { useState, useEffect, useRef } from "react";
import { Settings, LayoutGrid } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import type { WidgetConfig } from "./components/Dashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import type { AppSettings } from "./components/SettingsPanel";
import { useFocusCoordinator } from "./context/FocusCoordinatorContext";

const isEinkDetected = (): boolean => {
  if (typeof window === "undefined" || !navigator || !navigator.userAgent) return false;
  return /Kindle|Silk|Kobo|Onyx|E-ink|Paperwhite|e-reader/i.test(navigator.userAgent);
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: isEinkDetected() ? "hc-light" : "glass",
  zoom: 120, // default 120% zoom is very readable for desk clocks
  focusWidth: 3,
  focusStyle: "dashed",
  focusColor: "#f59e0b", // Amber alert
  einkMode: isEinkDetected(),
  timeCueInterval: 0,
  timeCueVisual: true,
  timeCueAudio: true,
  timeCueVoice: false,
  blueLightFilter: false,
  stretchInterval: 0,
};

const STRETCHES = [
  { title: "Reach for the Sky", desc: "Extend your arms fully above your head, interlace your fingers, and stretch upward." },
  { title: "Shoulder Rolls", desc: "Roll your shoulders backward in a slow circle 5 times, then forward 5 times." },
  { title: "Neck Release", desc: "Gently tilt your head toward your shoulder, hold for 5 seconds, then switch sides." },
  { title: "Chest Opener", desc: "Clasp your hands behind your back, pull your shoulders down and back, and look gently upward." },
  { title: "Seated Twist", desc: "Sit tall, place your hand on the opposite knee, and gently twist your torso to look back." },
];

const getWarmthIntensity = (date: Date): number => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentHourFraction = hours + minutes / 60;

  if (currentHourFraction >= 18 && currentHourFraction < 22) {
    // 6 PM to 10 PM: scales linearly from 0.0 to 0.35
    return ((currentHourFraction - 18) / 4) * 0.35;
  } else if (currentHourFraction >= 22 || currentHourFraction < 6) {
    // 10 PM to 6 AM: static at 0.35
    return 0.35;
  } else if (currentHourFraction >= 6 && currentHourFraction < 8) {
    // 6 AM to 8 AM: scales down linearly from 0.35 to 0.0
    return (1 - (currentHourFraction - 6) / 2) * 0.35;
  } else {
    // 8 AM to 6 PM: zero warm tinting
    return 0.0;
  }
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock-1", type: "clock", x: 0, y: 0, w: 8, h: 2, title: "Desk Clock" },
  { id: "date-1", type: "date", x: 8, y: 0, w: 4, h: 2, title: "Calendar Date" },
  { id: "timer-1", type: "timer", x: 0, y: 2, w: 6, h: 2, title: "Desk Timer" },
  { id: "stopwatch-1", type: "stopwatch", x: 6, y: 2, w: 6, h: 2, title: "Stopwatch" },
  { id: "notes-1", type: "quicknotes", x: 0, y: 4, w: 12, h: 3, title: "Scratchpad" },
];

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("deskdash-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          einkMode: parsed.einkMode !== undefined ? parsed.einkMode : DEFAULT_SETTINGS.einkMode,
          timeCueInterval: parsed.timeCueInterval !== undefined ? parsed.timeCueInterval : DEFAULT_SETTINGS.timeCueInterval,
          timeCueVisual: parsed.timeCueVisual !== undefined ? parsed.timeCueVisual : DEFAULT_SETTINGS.timeCueVisual,
          timeCueAudio: parsed.timeCueAudio !== undefined ? parsed.timeCueAudio : DEFAULT_SETTINGS.timeCueAudio,
          timeCueVoice: parsed.timeCueVoice !== undefined ? parsed.timeCueVoice : DEFAULT_SETTINGS.timeCueVoice,
          blueLightFilter: parsed.blueLightFilter !== undefined ? parsed.blueLightFilter : DEFAULT_SETTINGS.blueLightFilter,
          stretchInterval: parsed.stretchInterval !== undefined ? parsed.stretchInterval : DEFAULT_SETTINGS.stretchInterval,
        };
      } catch (_) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("deskdash-widgets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_WIDGETS;
  });

  const { queueAlert, activeAlert, queueSpeak, playChime } = useFocusCoordinator();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  // Unified clock tracking
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const wasSettingsOpen = useRef(false);
  
  // Initialize to current time on mount to prevent instant alerts
  const lastTriggeredMinRef = useRef<number>(new Date().getMinutes());
  const lastTriggeredStretchMinRef = useRef<number>(new Date().getHours() * 60 + new Date().getMinutes());

  const triggerTimeCue = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
    const voiceStr = `The time is now ${formattedHours} ${minutes === 0 ? "o'clock" : minutes} ${ampm}`;

    queueAlert({
      type: "timeCue",
      time: time,
      duration: 5,
      speakText: settings.timeCueVoice ? voiceStr : undefined,
      chimeType: settings.timeCueAudio ? "cue" : undefined,
    });
    
    // Also send an accessible announcement
    announce(`Periodic Cue: Current time is ${timeStr}`);
  };

  const triggerStretchPrompt = () => {
    // Pick a random stretch
    const randomIndex = Math.floor(Math.random() * STRETCHES.length);
    const stretch = STRETCHES[randomIndex];
    
    queueAlert({
      type: "stretch",
      title: stretch.title,
      desc: stretch.desc,
      duration: 30,
      speakText: settings.timeCueVoice ? "Stand and stretch break. Take 30 seconds to stand and stretch." : undefined,
      chimeType: settings.timeCueAudio ? "stretchStart" : undefined,
      onComplete: () => {
        if (settings.timeCueAudio) {
          playChime("stretchEnd");
        }
        if (settings.timeCueVoice) {
          queueSpeak("Stretch break complete. Great job.");
        }
        announce("Stand and stretch break complete.");
      },
      onSkip: () => {
        if (settings.timeCueVoice) {
          queueSpeak("Stretch break skipped.");
        }
        announce("Stand and stretch break skipped.");
      }
    });

    announce("Stand and stretch break. 30 seconds remaining.");
  };

  // Run unified ticking timer (every 5 seconds)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(clockTimer);
  }, []);

  // Monitor intervals for periodic time cues and stretch alerts
  useEffect(() => {
    const m = currentTime.getMinutes();
    const h = currentTime.getHours();
    const totalMinutes = h * 60 + m;

    // 1. Time Cues
    if (settings.timeCueInterval > 0) {
      if (m % settings.timeCueInterval === 0 && m !== lastTriggeredMinRef.current) {
        lastTriggeredMinRef.current = m;
        triggerTimeCue(currentTime);
      }
    }

    // 2. Stand & Stretch Alerts
    if (settings.stretchInterval > 0) {
      if (totalMinutes % settings.stretchInterval === 0 && totalMinutes !== lastTriggeredStretchMinRef.current) {
        lastTriggeredStretchMinRef.current = totalMinutes;
        triggerStretchPrompt();
      }
    }
  }, [currentTime, settings.timeCueInterval, settings.stretchInterval]);

  // Return focus to settings button on close
  useEffect(() => {
    if (!isSettingsOpen && wasSettingsOpen.current) {
      settingsButtonRef.current?.focus();
    }
    wasSettingsOpen.current = isSettingsOpen;
  }, [isSettingsOpen]);

  const announce = (text: string) => {
    setAnnouncement("");
    setTimeout(() => {
      setAnnouncement(text);
    }, 50);
  };

  // Apply settings to document element
  useEffect(() => {
    localStorage.setItem("deskdash-settings", JSON.stringify(settings));

    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    root.style.setProperty("--app-zoom", `${settings.zoom}%`);
    root.style.setProperty("--focus-width", `${settings.focusWidth}px`);
    root.style.setProperty("--focus-style", settings.focusStyle);
    root.style.setProperty("--focus-color", settings.focusColor);

    if (settings.einkMode) {
      root.setAttribute("data-eink", "true");
    } else {
      root.removeAttribute("data-eink");
    }
  }, [settings]);

  // Sync widgets to localStorage
  useEffect(() => {
    localStorage.setItem("deskdash-widgets", JSON.stringify(widgets));
  }, [widgets]);

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const handleImportLayout = (layoutJson: string): boolean => {
    try {
      const parsed = JSON.parse(layoutJson);
      if (Array.isArray(parsed)) {
        const isValid = parsed.every(
          (w: any) =>
            typeof w.id === "string" &&
            ["clock", "date", "timer", "stopwatch", "quicknotes", "quote", "weather", "calculator", "pomodoro", "metronome", "worldclock", "breathing", "eyestrain"].includes(w.type) &&
            typeof w.x === "number" &&
            typeof w.y === "number" &&
            typeof w.w === "number" &&
            typeof w.h === "number"
        );
        if (isValid) {
          setWidgets(parsed);
          return true;
        }
      }
    } catch (_) {}
    return false;
  };

  const hasOverlay = isSettingsOpen || activeAlert !== null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--color-dashboard-bg)] text-[var(--color-text-main)] transition-colors duration-200">
      
      {/* Screen Reader Live Announcement Region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Top Header Bar */}
      <header
        inert={hasOverlay}
        className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-card-border)] bg-black/20 backdrop-blur-md z-30 shrink-0"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <LayoutGrid className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-none text-[var(--color-text-main)]">
              Focusboard
            </h1>
            <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-widest mt-0.5">
              Accessible Desk Dashboard
            </p>
          </div>
        </div>

        {/* Global Settings & Edit Controls */}
        <div className="flex items-center space-x-2">
          {editMode && (
            <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/30 animate-pulse">
              Edit Mode Active
            </span>
          )}
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`h-12 px-4 rounded-xl border text-sm font-bold flex items-center transition-colors accessible-focus ${
              editMode
                ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-600"
                : "bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border-[var(--color-card-border)] text-[var(--color-text-main)]"
            }`}
            title="Toggle Edit Mode"
            aria-label="Toggle Dashboard Edit Mode"
          >
            {editMode ? "🔒 Lock Layout" : "🛠️ Edit Layout"}
          </button>

          <button
            ref={settingsButtonRef}
            onClick={() => setIsSettingsOpen(true)}
            className="h-12 w-12 flex items-center justify-center bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-text-main)] transition-colors accessible-focus"
            title="Open Accessibility Settings"
            aria-label="Open Accessibility Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main
        inert={hasOverlay}
        className="flex-1 flex flex-col overflow-hidden relative"
      >
        <Dashboard widgets={widgets} setWidgets={setWidgets} editMode={editMode} einkMode={settings.einkMode} announce={announce} />
      </main>

      {/* Settings Overlay side-drawer */}
      <div inert={isSettingsOpen && activeAlert !== null}>
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(!editMode)}
          onResetLayout={handleResetLayout}
          onImportLayout={handleImportLayout}
          currentLayoutJson={JSON.stringify(widgets, null, 2)}
          announce={announce}
        />
      </div>
      
      {/* Background click overlay when settings is open */}
      {isSettingsOpen && (
        <div
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}


      {/* Gradual Warmth Overlay (Blue-light filter) */}
      {settings.blueLightFilter && (
        <div
          className="fixed inset-0 pointer-events-none z-[49] transition-colors duration-1000"
          style={{
            backgroundColor: `rgba(245, 158, 11, ${getWarmthIntensity(currentTime)})`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default App;
