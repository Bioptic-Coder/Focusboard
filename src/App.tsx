import { useState, useEffect } from "react";
import { Settings, LayoutGrid } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import type { WidgetConfig } from "./components/Dashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import type { AppSettings } from "./components/SettingsPanel";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "glass",
  zoom: 120, // default 120% zoom is very readable for desk clocks
  focusWidth: 3,
  focusStyle: "dashed",
  focusColor: "#f59e0b", // Amber alert
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
        return JSON.parse(saved);
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

  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Apply settings to document element
  useEffect(() => {
    localStorage.setItem("deskdash-settings", JSON.stringify(settings));

    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    root.style.setProperty("--app-zoom", `${settings.zoom}%`);
    root.style.setProperty("--focus-width", `${settings.focusWidth}px`);
    root.style.setProperty("--focus-style", settings.focusStyle);
    root.style.setProperty("--focus-color", settings.focusColor);
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
            ["clock", "date", "timer", "stopwatch", "quicknotes"].includes(w.type) &&
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--color-dashboard-bg)] text-[var(--color-text-main)] transition-colors duration-200">
      
      {/* Top Header Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-card-border)] bg-black/20 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <LayoutGrid className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-none text-[var(--color-text-main)]">
              DeskDash
            </h1>
            <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-widest mt-0.5">
              iPad Utility Dashboard
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
            className={`p-3 rounded-xl border text-sm font-bold flex items-center transition-colors accessible-focus ${
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
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-text-main)] transition-colors accessible-focus"
            title="Open Accessibility Settings"
            aria-label="Open Accessibility Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Dashboard widgets={widgets} setWidgets={setWidgets} editMode={editMode} />
      </main>

      {/* Settings Overlay side-drawer */}
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
      />
      
      {/* Background click overlay when settings is open */}
      {isSettingsOpen && (
        <div
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        />
      )}
    </div>
  );
}

export default App;
