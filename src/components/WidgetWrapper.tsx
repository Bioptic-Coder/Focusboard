import React from "react";
import { Move, Maximize2, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shrink, Expand } from "lucide-react";
import type { WidgetConfig } from "./Dashboard";

interface WidgetWrapperProps {
  widget: WidgetConfig;
  editMode: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WidgetConfig>) => void;
  children: React.ReactNode;
  onDragStart: (e: React.PointerEvent, id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onDragEnd: (e: React.PointerEvent, id: string) => void;
  onResizeEnd: (e: React.PointerEvent, id: string) => void;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  editMode,
  onDelete,
  onUpdate,
  children,
  onDragStart,
  onResizeStart,
  onDragEnd,
  onResizeEnd,
}) => {
  // Grid coordinates map to tailwind style or inline style.
  // Tailwind v4 uses standard CSS variables or inline styles for dynamic grid coordinates.
  const gridStyle: React.CSSProperties = {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
    minHeight: `${widget.h * 140 - 16}px`, // slightly less than grid track height
  };

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    let { x, y } = widget;
    if (direction === "up") y = Math.max(0, y - 1);
    if (direction === "down") y += 1;
    if (direction === "left") x = Math.max(0, x - 1);
    if (direction === "right") x = Math.min(12 - widget.w, x + 1);
    onUpdate(widget.id, { x, y });
  };

  const handleResize = (type: "grow-w" | "shrink-w" | "grow-h" | "shrink-h") => {
    let { w, h } = widget;
    if (type === "grow-w") w = Math.min(12 - widget.x, w + 1);
    if (type === "shrink-w") w = Math.max(1, w - 1);
    if (type === "grow-h") h += 1;
    if (type === "shrink-h") h = Math.max(1, h - 1);
    onUpdate(widget.id, { w, h });
  };

  return (
    <div
      style={gridStyle}
      className={`glass-card flex flex-col relative transition-shadow duration-150 accessible-focus group ${
        editMode ? "border-dashed border-amber-500/60 ring-2 ring-amber-500/10 cursor-default" : ""
      }`}
      tabIndex={0}
      aria-label={`${widget.title || widget.type} widget. Grid position column ${widget.x + 1}, row ${
        widget.y + 1
      }, width ${widget.w}, height ${widget.h}.`}
    >
      {/* Widget Header with title & Edit buttons */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b border-[var(--color-card-border)] rounded-t-2xl ${
          editMode ? "bg-amber-500/10" : "bg-black/20"
        }`}
      >
        <span className="font-bold text-sm text-[var(--color-text-muted)] uppercase tracking-wider select-none">
          {widget.title || widget.type}
        </span>
        
        {editMode && (
          <div className="flex items-center space-x-1">
            {/* Delete button */}
            <button
              onClick={() => onDelete(widget.id)}
              className="p-1.5 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors accessible-focus"
              title="Delete widget"
              aria-label={`Delete ${widget.title || widget.type} widget`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-hidden w-full flex flex-col items-center">
        <div className="my-auto w-full flex flex-col items-center">
          {children}
        </div>
      </div>

      {/* Edit Overlay UI (handles, accessibility adjustment buttons) */}
      {editMode && (
        <>
          {/* Drag Handle Overlay */}
          <div
            onPointerDown={(e) => onDragStart(e, widget.id)}
            onPointerUp={(e) => onDragEnd(e, widget.id)}
            className="absolute top-2 right-10 p-1.5 bg-[var(--color-control-bg)] hover:bg-amber-500 hover:text-black text-[var(--color-text-main)] rounded-lg cursor-grab active:cursor-grabbing transition-colors"
            title="Drag widget"
            aria-label="Drag widget handle"
          >
            <Move className="w-4 h-4" />
          </div>

          {/* Resize Handle (Bottom-Right) */}
          <div
            onPointerDown={(e) => onResizeStart(e, widget.id)}
            onPointerUp={(e) => onResizeEnd(e, widget.id)}
            className="absolute bottom-2 right-2 p-1.5 bg-[var(--color-control-bg)] hover:bg-amber-500 hover:text-black text-[var(--color-text-main)] rounded-lg cursor-se-resize transition-colors"
            title="Resize widget"
            aria-label="Resize widget handle"
          >
            <Maximize2 className="w-4.5 h-4.5 rotate-90" />
          </div>

          {/* Accessible Positioning Button Bar (shown on hover/focus) */}
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 hidden group-focus-within:flex group-hover:flex bg-zinc-900 border-2 border-amber-500 p-2 rounded-xl shadow-xl items-center space-x-2 z-40 animate-in fade-in zoom-in-95 duration-100">
            <span className="text-xs font-bold text-amber-500 px-1 uppercase">Move:</span>
            <button
              onClick={() => handleMove("up")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Move Up"
              aria-label="Move Up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMove("down")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Move Down"
              aria-label="Move Down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMove("left")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Move Left"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMove("right")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Move Right"
              aria-label="Move Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <div className="w-[1px] h-6 bg-zinc-700" />
            
            <span className="text-xs font-bold text-amber-500 px-1 uppercase">Size:</span>
            <button
              onClick={() => handleResize("shrink-w")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Shrink Width"
              aria-label="Shrink Width"
            >
              <Shrink className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleResize("grow-w")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Expand Width"
              aria-label="Expand Width"
            >
              <Expand className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleResize("shrink-h")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Shrink Height"
              aria-label="Shrink Height"
            >
              <ArrowDown className="w-4 h-4 scale-y-[-1]" />
            </button>
            <button
              onClick={() => handleResize("grow-h")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-100 rounded accessible-focus"
              title="Expand Height"
              aria-label="Expand Height"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
