import React, { useRef, useState } from "react";
import { LayoutGrid, Clock, Calendar, Hourglass, Timer as TimerIcon, FileText, Quote, Cloud, Calculator, Flame, Music, Globe, Wind, Eye } from "lucide-react";
import { WidgetWrapper } from "./WidgetWrapper";

// Widgets import placeholders
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

export interface WidgetConfig {
  id: string;
  type: "clock" | "date" | "timer" | "stopwatch" | "quicknotes" | "quote" | "weather" | "calculator" | "pomodoro" | "metronome" | "worldclock" | "breathing" | "eyestrain";
  x: number; // 0-11
  y: number; // 0+
  w: number; // 1-12
  h: number; // 1+
  title?: string;
}

interface DashboardProps {
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[]) => void;
  editMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ widgets, setWidgets, editMode }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Pointer dragging state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragStartInfo = useRef<{
    startX: number;
    startY: number;
    startGridX: number;
    startGridY: number;
    w: number;
    h: number;
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
  } | null>(null);

  const handleDelete = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const handleUpdateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const addWidget = (type: WidgetConfig["type"]) => {
    // Determine the next empty row position at the bottom of the grid
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    
    // Choose sensible default dimensions for each widget type
    let w = 4;
    let h = 2;
    if (type === "clock") { w = 6; h = 2; }
    if (type === "quicknotes") { w = 6; h = 3; }
    if (type === "date") { w = 4; h = 2; }
    if (type === "quote") { w = 6; h = 2; }
    if (type === "weather") { w = 4; h = 2; }
    if (type === "calculator") { w = 4; h = 3; }
    if (type === "pomodoro") { w = 4; h = 2; }
    if (type === "metronome") { w = 4; h = 2; }
    if (type === "worldclock") { w = 6; h = 3; }
    if (type === "breathing") { w = 4; h = 2; }
    if (type === "eyestrain") { w = 4; h = 2; }

    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      w,
      h,
      title: type.toUpperCase(),
    };

    setWidgets([...widgets, newWidget]);
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

    handleUpdateWidget(activeDragId, { x: nextX, y: nextY });
  };

  const handleDragEnd = (e: React.PointerEvent, _id: string) => {
    const target = e.target as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safely ignore capture release issues
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

    handleUpdateWidget(activeResizeId, { w: nextW, h: nextH });
  };

  const handleResizeEnd = (e: React.PointerEvent, _id: string) => {
    const target = e.target as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safely ignore
    }
    setActiveResizeId(null);
    resizeStartInfo.current = null;
  };

  // Render widget content helper
  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case "clock":
        return <ClockWidget editMode={editMode} />;
      case "date":
        return <DateWidget editMode={editMode} />;
      case "timer":
        return <TimerWidget />;
      case "stopwatch":
        return <StopwatchWidget />;
      case "quicknotes":
        return <QuickNotesWidget />;
      case "quote":
        return <QuoteWidget />;
      case "weather":
        return <WeatherWidget />;
      case "calculator":
        return <CalculatorWidget />;
      case "pomodoro":
        return <PomodoroWidget editMode={editMode} />;
      case "metronome":
        return <MetronomeWidget />;
      case "worldclock":
        return <WorldClockWidget editMode={editMode} />;
      case "breathing":
        return <BreathingWidget />;
      case "eyestrain":
        return <EyeStrainWidget editMode={editMode} />;
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      
      {/* Editor Add-Widget Bar */}
      {editMode && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between flex-wrap gap-2 z-10">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">Edit Mode: Add Widgets</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto max-w-full pb-1">
            <button
              onClick={() => addWidget("clock")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Clock className="w-4 h-4 mr-1.5 text-blue-400" /> + Clock
            </button>
            <button
              onClick={() => addWidget("date")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-1.5 text-green-400" /> + Date
            </button>
            <button
              onClick={() => addWidget("timer")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Hourglass className="w-4 h-4 mr-1.5 text-yellow-400" /> + Timer
            </button>
            <button
              onClick={() => addWidget("stopwatch")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <TimerIcon className="w-4 h-4 mr-1.5 text-rose-400" /> + Stopwatch
            </button>
            <button
              onClick={() => addWidget("quicknotes")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-1.5 text-purple-400" /> + Notes
            </button>
            <button
              onClick={() => addWidget("quote")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Quote className="w-4 h-4 mr-1.5 text-orange-400" /> + Quote
            </button>
            <button
              onClick={() => addWidget("weather")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Cloud className="w-4 h-4 mr-1.5 text-sky-400" /> + Weather
            </button>
            <button
              onClick={() => addWidget("calculator")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Calculator className="w-4 h-4 mr-1.5 text-zinc-400" /> + Calc
            </button>
            <button
              onClick={() => addWidget("pomodoro")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Flame className="w-4 h-4 mr-1.5 text-red-500" /> + Pomodoro
            </button>
            <button
              onClick={() => addWidget("metronome")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Music className="w-4 h-4 mr-1.5 text-indigo-400" /> + Metronome
            </button>
            <button
              onClick={() => addWidget("worldclock")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Globe className="w-4 h-4 mr-1.5 text-cyan-400" /> + World Clock
            </button>
            <button
              onClick={() => addWidget("breathing")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Wind className="w-4 h-4 mr-1.5 text-teal-400" /> + Breathe
            </button>
            <button
              onClick={() => addWidget("eyestrain")}
              className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg flex items-center text-sm font-bold border border-[var(--color-card-border)] accessible-focus whitespace-nowrap"
            >
              <Eye className="w-4 h-4 mr-1.5 text-emerald-400" /> + Eye Break
            </button>
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
          className="grid grid-cols-12 gap-4 relative select-none w-full"
          style={{
            gridAutoRows: "140px",
            minHeight: "100%",
          }}
        >
          {/* Edit Mode Helper Grid Background */}
          {editMode && (
            <div className="absolute inset-0 grid grid-cols-12 gap-4 pointer-events-none z-0">
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
            >
              {renderWidgetContent(widget)}
            </WidgetWrapper>
          ))}
          
          {widgets.length === 0 && (
            <div className="col-span-12 py-20 flex flex-col items-center justify-center text-center text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-card-border)] rounded-2xl">
              <LayoutGrid className="w-16 h-16 mb-4 opacity-40 text-[var(--color-text-muted)]" />
              <h3 className="text-2xl font-bold">Your Dashboard is Empty</h3>
              <p className="text-lg max-w-md mt-2">
                {editMode ? "Use the top panel to add utility widgets and build your customized desk layout." : "Turn on Edit Mode in settings to add widgets and build your layout."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
