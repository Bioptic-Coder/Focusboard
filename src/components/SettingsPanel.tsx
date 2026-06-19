import React from "react";
import { X, Plus, Minus, RotateCcw, Copy, Check, Upload } from "lucide-react";
import { useFocusCoordinator } from "../context/FocusCoordinatorContext";

export interface AppSettings {
  theme: "glass" | "hc-dark" | "hc-light";
  zoom: number; // 80 - 200 (%)
  focusWidth: number; // 1 - 8 (px)
  focusStyle: "solid" | "dashed" | "dotted" | "double";
  focusColor: string; // hex
  einkMode: boolean;
  timeCueInterval: 0 | 15 | 30 | 60; // minutes (0 is disabled)
  timeCueVisual: boolean;
  timeCueAudio: boolean;
  timeCueVoice: boolean;
  blueLightFilter: boolean;
  stretchInterval: 0 | 30 | 60 | 120; // minutes (0 is disabled)
}

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  onResetLayout: () => void;
  onImportLayout: (layoutJson: string) => boolean;
  currentLayoutJson: string;
  announce: (text: string) => void;
}

const COLOR_OPTIONS = [
  { name: "Amber Alert", value: "#f59e0b" },
  { name: "Neon Blue", value: "#3b82f6" },
  { name: "Safety Green", value: "#10b981" },
  { name: "Bright Red", value: "#ef4444" },
  { name: "Stark White", value: "#ffffff" },
  { name: "Solid Black", value: "#000000" },
];

const STYLE_OPTIONS: { name: string; value: AppSettings["focusStyle"] }[] = [
  { name: "Dashed", value: "dashed" },
  { name: "Solid", value: "solid" },
  { name: "Dotted", value: "dotted" },
  { name: "Double", value: "double" },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  isOpen,
  onClose,
  editMode,
  onToggleEditMode,
  onResetLayout,
  onImportLayout,
  currentLayoutJson,
  announce,
}) => {
  const { queueSpeak, playChime } = useFocusCoordinator();
  const [copied, setCopied] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [importError, setImportError] = React.useState(false);
  const [importSuccess, setImportSuccess] = React.useState(false);

  const panelRef = React.useRef<HTMLDivElement>(null);

  // Focus trap and Escape key listener
  React.useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable element when opened
    const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      // Focus the close button or first element
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const els = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!els || els.length === 0) return;

        const firstEl = els[0];
        const lastEl = els[els.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentLayoutJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setImportError(false);
    setImportSuccess(false);
    const success = onImportLayout(importText);
    if (success) {
      setImportSuccess(true);
      setImportText("");
      announce("Dashboard layout configuration successfully imported.");
      setTimeout(() => setImportSuccess(false), 2000);
    } else {
      setImportError(true);
    }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] glass-card rounded-r-none border-y-0 border-r-0 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--color-card-border)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-main)]" id="settings-heading">
          Accessibility Settings
        </h2>
        <button
          onClick={onClose}
          className="p-3 rounded-lg bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] transition-colors accessible-focus"
          aria-label="Close Settings Panel"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Toggle Edit Mode */}
        <div className="space-y-3">
          <label className="block text-lg font-bold text-[var(--color-text-main)]">
            Dashboard Editor
          </label>
          <button
            onClick={onToggleEditMode}
            className={`w-full py-4 px-6 rounded-xl text-xl font-bold text-center border transition-all duration-150 accessible-focus ${
              editMode
                ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500"
                : "bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border-[var(--color-card-border)] text-[var(--color-text-main)]"
            }`}
          >
            {editMode ? "🔒 Lock Layout (Exit Edit)" : "🔓 Unlock Layout (Drag & Resize)"}
          </button>
        </div>

        {/* Zoom Scale */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="zoom-slider" className="text-lg font-bold text-[var(--color-text-main)]">
              Interface Sizing
            </label>
            <span className="text-2xl font-bold text-[var(--color-text-main)]">{settings.zoom}%</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => updateSetting("zoom", Math.max(80, settings.zoom - 10))}
              disabled={settings.zoom <= 80}
              className="p-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] disabled:opacity-40 rounded-xl text-[var(--color-text-main)] font-bold accessible-focus"
              aria-label="Decrease Zoom Size"
            >
              <Minus className="w-6 h-6" />
            </button>
            
            <input
              id="zoom-slider"
              type="range"
              min="80"
              max="200"
              step="5"
              value={settings.zoom}
              onChange={(e) => updateSetting("zoom", parseInt(e.target.value))}
              className="flex-1 h-3 bg-[var(--color-card-border)] rounded-lg appearance-none cursor-pointer accent-blue-500 accessible-focus"
              aria-label="Text zoom scale"
            />
            
            <button
              onClick={() => updateSetting("zoom", Math.min(200, settings.zoom + 10))}
              disabled={settings.zoom >= 200}
              className="p-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] disabled:opacity-40 rounded-xl text-[var(--color-text-main)] font-bold accessible-focus"
              aria-label="Increase Zoom Size"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contrast Theme */}
        <div className="space-y-3">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Contrast Theme
          </span>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: "glass", label: "Glassmorphism (Default)" },
              { id: "hc-dark", label: "High Contrast Dark (Black/White)" },
              { id: "hc-light", label: "High Contrast Light (White/Black)" },
            ].map((themeOpt) => (
              <button
                key={themeOpt.id}
                onClick={() => updateSetting("theme", themeOpt.id as AppSettings["theme"])}
                className={`py-3 px-4 rounded-xl text-left font-bold text-lg border transition-all accessible-focus ${
                  settings.theme === themeOpt.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
                }`}
              >
                {themeOpt.label}
              </button>
            ))}
          </div>
        </div>

        {/* E-ink Mode Toggle */}
        <div className="space-y-3">
          <label className="block text-lg font-bold text-[var(--color-text-main)]">
            E-ink Optimization
          </label>
          <button
            onClick={() => updateSetting("einkMode", !settings.einkMode)}
            className={`w-full py-3 px-4 rounded-xl text-left font-bold text-lg border transition-all accessible-focus flex justify-between items-center ${
              settings.einkMode
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
            }`}
          >
            <span>E-ink Screen Friendly Mode</span>
            <span className="text-sm font-extrabold px-2.5 py-1 rounded bg-black/20 border border-[var(--color-card-border)]">
              {settings.einkMode ? "ON" : "OFF"}
            </span>
          </button>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Disables all smooth layout transitions, visual animations, separator blinking, and color glows to prevent screen ghosting and excessive refresh cycles on Kindle, Kobo, or Onyx tablets.
          </p>
        </div>

        {/* Blue-Light Filter Toggle */}
        <div className="space-y-3">
          <label className="block text-lg font-bold text-[var(--color-text-main)]">
            Blue-Light Filter (Screen Warmth)
          </label>
          <button
            onClick={() => {
              const nextVal = !settings.blueLightFilter;
              updateSetting("blueLightFilter", nextVal);
              announce(`Blue-light warmth filter ${nextVal ? "enabled" : "disabled"}`);
            }}
            className={`w-full py-3 px-4 rounded-xl text-left font-bold text-lg border transition-all accessible-focus flex justify-between items-center ${
              settings.blueLightFilter
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
            }`}
          >
            <span>Gradual Warm Screen Tint</span>
            <span className="text-sm font-extrabold px-2.5 py-1 rounded bg-black/20 border border-[var(--color-card-border)]">
              {settings.blueLightFilter ? "ON" : "OFF"}
            </span>
          </button>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Gradually warms screen colors in the evening (6 PM to 10 PM) and maintains comfort throughout the night, reducing eye strain for low-light environments.
          </p>
        </div>

        {/* Periodic Time Announcements */}
        <div className="space-y-4 border-t border-[var(--color-card-border)] pt-6">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Periodic Time Announcements
          </span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Get automated visual, audio, or spoken voice alerts at regular intervals to keep track of time.
          </p>

          {/* Interval selection */}
          <div className="space-y-2">
            <span className="block text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Cue Interval
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { value: 0, label: "Off" },
                { value: 15, label: "15m" },
                { value: 30, label: "30m" },
                { value: 60, label: "1h" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    updateSetting("timeCueInterval", opt.value as AppSettings["timeCueInterval"]);
                    announce(`Time cues set to ${opt.value === 0 ? "disabled" : `every ${opt.value} minutes`}`);
                  }}
                  className={`py-2 px-1 rounded-lg text-center font-bold text-sm border transition-all accessible-focus ${
                    settings.timeCueInterval === opt.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cue Types */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.timeCueVisual;
                updateSetting("timeCueVisual", nextVal);
                announce(`Visual flash cues ${nextVal ? "enabled" : "disabled"}`);
              }}
              className={`py-3 px-4 rounded-xl text-left font-bold text-sm border transition-all accessible-focus flex justify-between items-center ${
                settings.timeCueVisual
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
              }`}
            >
              <span>Visual Flash</span>
              <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-black/20 border border-[var(--color-card-border)]">
                {settings.timeCueVisual ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.timeCueAudio;
                updateSetting("timeCueAudio", nextVal);
                announce(`Audio chime cues ${nextVal ? "enabled" : "disabled"}`);
                if (nextVal) {
                  playChime("cue");
                }
              }}
              className={`py-3 px-4 rounded-xl text-left font-bold text-sm border transition-all accessible-focus flex justify-between items-center ${
                settings.timeCueAudio
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
              }`}
            >
              <span>Audio Beep</span>
              <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-black/20 border border-[var(--color-card-border)]">
                {settings.timeCueAudio ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.timeCueVoice;
                updateSetting("timeCueVoice", nextVal);
                announce(`Voice announcement cues ${nextVal ? "enabled" : "disabled"}`);
                if (nextVal) {
                  queueSpeak("Voice announcements enabled");
                }
              }}
              className={`py-3 px-4 rounded-xl text-left font-bold text-sm border transition-all accessible-focus flex justify-between items-center ${
                settings.timeCueVoice
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
              }`}
            >
              <span>Voice Announcement</span>
              <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-black/20 border border-[var(--color-card-border)]">
                {settings.timeCueVoice ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Physical Stand & Stretch Alerts */}
        <div className="space-y-4 border-t border-[var(--color-card-border)] pt-6">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Physical Stand & Stretch Alerts
          </span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Get fullscreen alerts prompting you to stand and stretch to avoid desk fatigue.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: 0, label: "Off" },
              { value: 30, label: "30m" },
              { value: 60, label: "1h" },
              { value: 120, label: "2h" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  updateSetting("stretchInterval", opt.value as AppSettings["stretchInterval"]);
                  announce(`Stand and stretch alerts set to ${opt.value === 0 ? "disabled" : `every ${opt.value} minutes`}`);
                }}
                className={`py-2 px-1 rounded-lg text-center font-bold text-sm border transition-all accessible-focus ${
                  settings.stretchInterval === opt.value
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Outline Color */}
        <div className="space-y-3">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Accessibility Focus Ring Color
          </span>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map((col) => (
              <button
                key={col.value}
                onClick={() => updateSetting("focusColor", col.value)}
                className={`py-3 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-sm transition-all accessible-focus ${
                  settings.focusColor === col.value
                    ? "border-blue-500"
                    : "border-[var(--color-card-border)] hover:bg-[var(--color-control-hover)]"
                }`}
                style={{ backgroundColor: settings.theme !== 'hc-light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }}
              >
                <span
                  className="w-6 h-6 rounded-full border border-zinc-500 mb-1"
                  style={{ backgroundColor: col.value }}
                />
                <span className="text-[12px] truncate max-w-full text-[var(--color-text-main)]">{col.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Outline Width */}
        <div className="space-y-3">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Focus Ring Thickness
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 5, 8].map((w) => (
              <button
                key={w}
                onClick={() => updateSetting("focusWidth", w)}
                className={`py-3 rounded-lg font-bold text-lg border transition-all accessible-focus ${
                  settings.focusWidth === w
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        {/* Focus Outline Style */}
        <div className="space-y-3">
          <span className="block text-lg font-bold text-[var(--color-text-main)]">
            Focus Ring Border Style
          </span>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSetting("focusStyle", opt.value)}
                className={`py-3 rounded-lg font-bold text-lg border capitalize transition-all accessible-focus ${
                  settings.focusStyle === opt.value
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Import/Export Config */}
        <div className="space-y-3 border-t border-[var(--color-card-border)] pt-6">
          <label className="block text-lg font-bold text-[var(--color-text-main)]">
            Dashboard Configuration (Layout)
          </label>
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] rounded-xl font-bold flex items-center justify-center border border-[var(--color-card-border)] text-[var(--color-text-main)] transition-colors accessible-focus"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Export Layout
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste layout JSON config here to import..."
              className="w-full h-24 p-3 bg-black/40 border border-[var(--color-card-border)] text-[var(--color-text-main)] rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none accessible-focus"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center transition-colors accessible-focus"
            >
              <Upload className="w-5 h-5 mr-2" />
              Import Config
            </button>
            {importError && (
              <p className="text-red-500 font-bold text-sm">Error: Invalid dashboard configuration format.</p>
            )}
            {importSuccess && (
              <p className="text-green-500 font-bold text-sm">Dashboard layout updated successfully!</p>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="border-t border-[var(--color-card-border)] pt-6">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset all widgets to the default layout? Your current positions will be lost.")) {
                onResetLayout();
                announce("Dashboard layout reset to default widgets.");
              }
            }}
            className="w-full py-4 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/30 hover:border-red-600 rounded-xl font-bold flex items-center justify-center transition-all duration-150 accessible-focus"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset Layout to Default
          </button>
        </div>

      </div>
    </div>
  );
};
