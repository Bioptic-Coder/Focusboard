import React, { useRef, useState } from "react";
import { LayoutGrid, Clock, Calendar, Hourglass, Timer as TimerIcon, FileText, Quote, Cloud, Calculator, Flame, Music, Globe, Wind, Eye, Brain, CircleDot, Flower2, Plus, X, Search } from "lucide-react";
import { WidgetWrapper } from "./WidgetWrapper";

// Widgets imports
import { ClockWidget } from "./widgets/ClockWidget";
import { DateWidget } from "./widgets/DateWidget";
import { TimerWidget } from "./widgets/TimerWidget";
import { StopwatchWidget } from "./widgets/StopwatchWidget";
import { QuickNotesWidget } from "./widgets/QuickNotesWidget";
import { QuoteWidget } from "./widgets/QuoteWidget";
import { WeatherWidget } from "./widgets/WeatherWidget";
import { CalculatorWidget } from "./widgets/CalculatorWidget";
import { PomodoroWidget } from "./widgets/PomodoroWidget";
import { MetronomeWidget } from "./widgets/MetronomeWidget";
import { WorldClockWidget } from "./widgets/WorldClockWidget";
import { BreathingWidget } from "./widgets/BreathingWidget";
import { EyeStrainWidget } from "./widgets/EyeStrainWidget";
import { BrainDumpWidget } from "./widgets/BrainDumpWidget";
import { VisualTimerWidget } from "./widgets/VisualTimerWidget";
import { GardenWidget } from "./widgets/GardenWidget";

export interface WidgetConfig {
  id: string;
  type: "clock" | "date" | "timer" | "stopwatch" | "quicknotes" | "quote" | "weather" | "calculator" | "pomodoro" | "metronome" | "worldclock" | "breathing" | "eyestrain" | "braindump" | "visualtimer" | "garden";
  x: number; // 0-11
  y: number; // 0+
  w: number; // 1-12
  h: number; // 1+
  title?: string;
}

// ── Widget Catalog for the Picker ──────────────────────────────────────

interface WidgetCatalogEntry {
  type: WidgetConfig["type"];
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  defaultW: number;
  defaultH: number;
}

const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  // ⏰ Time & Clocks
  { type: "clock", name: "Clock", description: "Large analog/digital desk clock", icon: <Clock className="w-5 h-5 text-blue-400" />, category: "⏰ Time & Clocks", defaultW: 6, defaultH: 2 },
  { type: "date", name: "Date", description: "Calendar date display", icon: <Calendar className="w-5 h-5 text-green-400" />, category: "⏰ Time & Clocks", defaultW: 4, defaultH: 2 },
  { type: "worldclock", name: "World Clock", description: "Multiple timezone clocks", icon: <Globe className="w-5 h-5 text-cyan-400" />, category: "⏰ Time & Clocks", defaultW: 6, defaultH: 3 },
  { type: "timer", name: "Timer", description: "Countdown timer with presets", icon: <Hourglass className="w-5 h-5 text-yellow-400" />, category: "⏰ Time & Clocks", defaultW: 6, defaultH: 2 },
  { type: "stopwatch", name: "Stopwatch", description: "Stopwatch with lap tracking", icon: <TimerIcon className="w-5 h-5 text-rose-400" />, category: "⏰ Time & Clocks", defaultW: 6, defaultH: 2 },
  { type: "visualtimer", name: "Visual Timer", description: "Circular depleting timer for time blindness", icon: <CircleDot className="w-5 h-5 text-violet-400" />, category: "⏰ Time & Clocks", defaultW: 4, defaultH: 3 },

  // 🧘 Focus & Wellness
  { type: "pomodoro", name: "Pomodoro", description: "25/5 focus session timer", icon: <Flame className="w-5 h-5 text-red-500" />, category: "🧘 Focus & Wellness", defaultW: 4, defaultH: 2 },
  { type: "breathing", name: "Breathing", description: "Guided breathing exercises", icon: <Wind className="w-5 h-5 text-teal-400" />, category: "🧘 Focus & Wellness", defaultW: 4, defaultH: 2 },
  { type: "eyestrain", name: "Eye Break", description: "20-20-20 eye strain prevention", icon: <Eye className="w-5 h-5 text-emerald-400" />, category: "🧘 Focus & Wellness", defaultW: 4, defaultH: 2 },
  { type: "metronome", name: "Metronome", description: "Rhythmic focus pacer", icon: <Music className="w-5 h-5 text-indigo-400" />, category: "🧘 Focus & Wellness", defaultW: 4, defaultH: 2 },

  // 🧠 ADHD Tools
  { type: "braindump", name: "Brain Dump", description: "Externalize intrusive thoughts instantly", icon: <Brain className="w-5 h-5 text-violet-400" />, category: "🧠 ADHD Tools", defaultW: 6, defaultH: 3 },
  { type: "garden", name: "Focus Garden", description: "Grow plants by completing focus sessions", icon: <Flower2 className="w-5 h-5 text-emerald-400" />, category: "🧠 ADHD Tools", defaultW: 6, defaultH: 3 },

  // 📝 Productivity
  { type: "quicknotes", name: "Quick Notes", description: "Scratch pad for quick notes", icon: <FileText className="w-5 h-5 text-purple-400" />, category: "📝 Productivity", defaultW: 6, defaultH: 3 },
  { type: "quote", name: "Quote", description: "Motivational quote display", icon: <Quote className="w-5 h-5 text-orange-400" />, category: "📝 Productivity", defaultW: 6, defaultH: 2 },
  { type: "calculator", name: "Calculator", description: "Quick desk calculator", icon: <Calculator className="w-5 h-5 text-zinc-400" />, category: "📝 Productivity", defaultW: 4, defaultH: 3 },

  // 🌤️ Environment
  { type: "weather", name: "Weather", description: "Local weather conditions", icon: <Cloud className="w-5 h-5 text-sky-400" />, category: "🌤️ Environment", defaultW: 4, defaultH: 2 },
];

// Get unique categories in order
const CATEGORIES = [...new Set(WIDGET_CATALOG.map((w) => w.category))];

interface DashboardProps {
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[]) => void;
  editMode: boolean;
  einkMode: boolean;
  announce: (text: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ widgets, setWidgets, editMode, einkMode, announce }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pointer dragging state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragStartInfo = useRef<{
    startX: number;
    startY: number;
    startGridX: number;
    startGridY: number;
    w: number;
    h: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Pointer resizing state
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const resizeStartInfo = useRef<{
    startX: number;
    startY: number;
    startGridW: number;
    startGridH: number;
    x: number;
    y: number;
    currentW: number;
    currentH: number;
  } | null>(null);

  const handleDelete = (id: string) => {
    const widget = widgets.find((w) => w.id === id);
    setWidgets(widgets.filter((w) => w.id !== id));
    if (widget) {
      announce(`Deleted ${widget.title || widget.type} widget.`);
    }
  };

  const handleUpdateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const addWidget = (type: WidgetConfig["type"]) => {
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    const catalogEntry = WIDGET_CATALOG.find((c) => c.type === type);
    const w = catalogEntry?.defaultW || 4;
    const h = catalogEntry?.defaultH || 2;

    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      w,
      h,
      title: (catalogEntry?.name || type).toUpperCase(),
    };

    setWidgets([...widgets, newWidget]);
    setShowWidgetPicker(false);
    setSearchQuery("");
    announce(`Added ${catalogEntry?.name || type} widget at the bottom of your layout.`);
  };

  // Pointer Drag Handler (captures both touch and mouse)
  const handleDragStart = (e: React.PointerEvent, id: string) => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget || !gridRef.current) return;

    // Capture the pointer events so movement works outside the element
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setActiveDragId(id);
    dragStartInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      startGridX: widget.x,
      startGridY: widget.y,
      w: widget.w,
      h: widget.h,
      currentX: widget.x,
      currentY: widget.y,
    };
    
    e.stopPropagation();
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!activeDragId || !dragStartInfo.current || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / 12;
    const cellHeight = 140; // Defined row height in index.css

    const deltaX = e.clientX - dragStartInfo.current.startX;
    const deltaY = e.clientY - dragStartInfo.current.startY;

    const deltaCols = Math.round(deltaX / cellWidth);
    const deltaRows = Math.round(deltaY / cellHeight);

    const info = dragStartInfo.current;
    const nextX = Math.max(0, Math.min(12 - info.w, info.startGridX + deltaCols));
    const nextY = Math.max(0, info.startGridY + deltaRows);

    info.currentX = nextX;
    info.currentY = nextY;

    // Direct DOM manipulation of CSS custom properties on active wrapper element
    const activeElement = gridRef.current.querySelector(`[data-widget-id="${activeDragId}"]`) as HTMLElement;
    if (activeElement) {
      activeElement.style.setProperty('--widget-x', String(nextX + 1));
      activeElement.style.setProperty('--widget-y', String(nextY + 1));
    }
  };

  const handleDragEnd = (e: React.PointerEvent, id: string) => {
    const target = e.target as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safely ignore capture release issues
    }
    const info = dragStartInfo.current;
    if (info) {
      handleUpdateWidget(id, { x: info.currentX, y: info.currentY });
      const widget = widgets.find((w) => w.id === id);
      if (widget) {
        announce(`${widget.title || widget.type} widget layout position updated. Now at column ${info.currentX + 1}, row ${info.currentY + 1}.`);
      }
    }
    setActiveDragId(null);
    dragStartInfo.current = null;
  };

  // Pointer Resize Handler
  const handleResizeStart = (e: React.PointerEvent, id: string) => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget || !gridRef.current) return;

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setActiveResizeId(id);
    resizeStartInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      startGridW: widget.w,
      startGridH: widget.h,
      x: widget.x,
      y: widget.y,
      currentW: widget.w,
      currentH: widget.h,
    };

    e.stopPropagation();
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!activeResizeId || !resizeStartInfo.current || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / 12;
    const cellHeight = 140;

    const deltaX = e.clientX - resizeStartInfo.current.startX;
    const deltaY = e.clientY - resizeStartInfo.current.startY;

    const deltaCols = Math.round(deltaX / cellWidth);
    const deltaRows = Math.round(deltaY / cellHeight);

    const info = resizeStartInfo.current;
    const nextW = Math.max(1, Math.min(12 - info.x, info.startGridW + deltaCols));
    const nextH = Math.max(1, info.startGridH + deltaRows);

    info.currentW = nextW;
    info.currentH = nextH;

    // Direct DOM manipulation of CSS custom properties on active wrapper element
    const activeElement = gridRef.current.querySelector(`[data-widget-id="${activeResizeId}"]`) as HTMLElement;
    if (activeElement) {
      activeElement.style.setProperty('--widget-w', String(nextW));
      activeElement.style.setProperty('--widget-h', String(nextH));
    }
  };

  const handleResizeEnd = (e: React.PointerEvent, id: string) => {
    const target = e.target as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safely ignore
    }
    const info = resizeStartInfo.current;
    if (info) {
      handleUpdateWidget(id, { w: info.currentW, h: info.currentH });
      const widget = widgets.find((w) => w.id === id);
      if (widget) {
        announce(`${widget.title || widget.type} widget dimensions updated. Width ${info.currentW}, height ${info.currentH}.`);
      }
    }
    setActiveResizeId(null);
    resizeStartInfo.current = null;
  };

  // Render widget content helper
  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case "clock":
        return <ClockWidget editMode={editMode} einkMode={einkMode} />;
      case "date":
        return <DateWidget editMode={editMode} />;
      case "timer":
        return <TimerWidget announce={announce} />;
      case "stopwatch":
        return <StopwatchWidget einkMode={einkMode} announce={announce} />;
      case "quicknotes":
        return <QuickNotesWidget />;
      case "quote":
        return <QuoteWidget announce={announce} />;
      case "weather":
        return <WeatherWidget />;
      case "calculator":
        return <CalculatorWidget announce={announce} />;
      case "pomodoro":
        return <PomodoroWidget editMode={editMode} announce={announce} />;
      case "metronome":
        return <MetronomeWidget einkMode={einkMode} announce={announce} />;
      case "worldclock":
        return <WorldClockWidget editMode={editMode} announce={announce} />;
      case "breathing":
        return <BreathingWidget einkMode={einkMode} announce={announce} />;
      case "eyestrain":
        return <EyeStrainWidget editMode={editMode} announce={announce} />;
      case "braindump":
        return <BrainDumpWidget announce={announce} />;
      case "visualtimer":
        return <VisualTimerWidget einkMode={einkMode} announce={announce} />;
      case "garden":
        return <GardenWidget einkMode={einkMode} announce={announce} />;
      default:
        return <div>Unknown Widget</div>;
    }
  };

  // Determine grid visual heights in edit mode
  const getMaxGridRows = () => {
    const maxValY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    return Math.max(maxValY + 3, 6); // show a few extra rows for building
  };

  const gridRows = getMaxGridRows();

  // Filtered catalog for search
  const filteredCatalog = searchQuery.trim()
    ? WIDGET_CATALOG.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : WIDGET_CATALOG;

  const filteredCategories = CATEGORIES.filter((cat) =>
    filteredCatalog.some((w) => w.category === cat)
  );

  // Handle Escape for widget picker
  const handlePickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowWidgetPicker(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      
      {/* Editor Add-Widget Bar — now a simple add button */}
      {editMode && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">Edit Mode</span>
          </div>
          <button
            onClick={() => {
              setShowWidgetPicker(true);
              requestAnimationFrame(() => searchInputRef.current?.focus());
            }}
            className="h-11 px-5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl flex items-center gap-2 transition-colors accessible-focus text-sm"
            aria-label="Add Widget"
          >
            <Plus className="w-5 h-5" />
            Add Widget
          </button>
        </div>
      )}

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handlePickerKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Add Widget"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowWidgetPicker(false);
              setSearchQuery("");
            }}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl max-h-[80vh] glass-card border-2 border-amber-500/30 rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-card-border)] shrink-0">
              <div>
                <h2 className="text-xl font-black text-[var(--color-text-main)]">Add Widget</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Choose a widget to add to your dashboard</p>
              </div>
              <button
                onClick={() => {
                  setShowWidgetPicker(false);
                  setSearchQuery("");
                }}
                className="w-10 h-10 rounded-xl bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors accessible-focus"
                aria-label="Close widget picker"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-[var(--color-card-border)] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search widgets..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-control-bg)] border border-[var(--color-card-border)] rounded-xl text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/50 accessible-focus"
                  aria-label="Search widgets"
                />
              </div>
            </div>

            {/* Widget Grid by Category */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {filteredCategories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredCatalog
                      .filter((w) => w.category === category)
                      .map((entry) => (
                        <button
                          key={entry.type}
                          onClick={() => addWidget(entry.type)}
                          className="group flex flex-col items-start p-3 rounded-xl bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] hover:border-amber-500/40 transition-all accessible-focus text-left"
                          aria-label={`Add ${entry.name} widget`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {entry.icon}
                            <span className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-amber-400 transition-colors">
                              {entry.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--color-text-muted)] leading-snug">
                            {entry.description}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

              {filteredCatalog.length === 0 && (
                <div className="text-center py-8 text-[var(--color-text-muted)]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-bold">No widgets match "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid Dashboard Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6"
        onPointerMove={activeDragId ? handleDragMove : activeResizeId ? handleResizeMove : undefined}
      >
        <div
          ref={gridRef}
          className="dashboard-grid relative select-none w-full"
          style={{
            minHeight: "100%",
          }}
        >
          {/* Edit Mode Helper Grid Background */}
          {editMode && (
            <div className="absolute inset-0 grid grid-cols-12 gap-4 pointer-events-none z-0 edit-helper-grid">
              {Array.from({ length: 12 * gridRows }).map((_, i) => (
                <div
                  key={i}
                  className="border border-amber-500/5 bg-amber-500/[0.01] rounded-lg h-[140px]"
                />
              ))}
            </div>
          )}

          {/* Render Active Widgets */}
          {widgets.map((widget) => (
            <WidgetWrapper
              key={widget.id}
              widget={widget}
              editMode={editMode}
              onDelete={handleDelete}
              onUpdate={handleUpdateWidget}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onDragEnd={handleDragEnd}
              onResizeEnd={handleResizeEnd}
              announce={announce}
            >
              {renderWidgetContent(widget)}
            </WidgetWrapper>
          ))}
          
          {widgets.length === 0 && (
            <div className="col-span-12 py-20 flex flex-col items-center justify-center text-center text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-card-border)] rounded-2xl">
              <LayoutGrid className="w-16 h-16 mb-4 opacity-40 text-[var(--color-text-muted)]" />
              <h3 className="text-2xl font-bold">Your Dashboard is Empty</h3>
              <p className="text-lg max-w-md mt-2">
                {editMode ? "Use the Add Widget button above to build your customized desk layout." : "Turn on Edit Mode in settings to add widgets and build your layout."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
