import React, { useState, useEffect, useRef } from "react";
import { Brain, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface BrainDumpItem {
  id: string;
  text: string;
  processed: boolean;
  createdAt: number;
}

const STORAGE_KEY = "focusboard-braindump";

interface BrainDumpWidgetProps {
  announce?: (text: string) => void;
}

export const BrainDumpWidget: React.FC<BrainDumpWidgetProps> = ({ announce }) => {
  const [items, setItems] = useState<BrainDumpItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newItem: BrainDumpItem = {
      id: `dump-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      processed: false,
      createdAt: Date.now(),
    };

    setItems((prev) => [...prev, newItem]);
    setInputValue("");
    announce?.(`Added: ${trimmed}`);

    // Scroll to bottom after render
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const toggleProcessed = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, processed: !item.processed } : item
      )
    );
    const item = items.find((i) => i.id === id);
    if (item) {
      announce?.(item.processed ? `Unmarked: ${item.text}` : `Processed: ${item.text}`);
    }
  };

  const removeItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (item) {
      announce?.(`Removed: ${item.text}`);
    }
  };

  const clearAll = () => {
    if (items.length === 0) return;
    if (window.confirm("Clear all brain dump items? This cannot be undone.")) {
      setItems([]);
      announce?.("All brain dump items cleared.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const activeCount = items.filter((i) => !i.processed).length;
  const processedCount = items.filter((i) => i.processed).length;

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Brain Dump
            </span>
            {items.length > 0 && (
              <span className="ml-2 text-[10px] font-bold text-violet-400">
                {activeCount} active · {processedCount} done
              </span>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors accessible-focus"
            aria-label="Clear all items"
            title="Clear all items"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input Row */}
      <div className="flex gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          className="flex-1 bg-[var(--color-control-bg)] border border-[var(--color-card-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]/50 accessible-focus"
          aria-label="Add a thought to brain dump"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors accessible-focus"
          aria-label="Add item"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto min-h-0" role="list" aria-label="Brain dump items">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] opacity-50">
            <Brain className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs font-bold">Empty mind, clear focus</p>
            <p className="text-[10px]">Type a thought and press Enter</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className={`group flex items-start gap-2 px-2 py-1.5 rounded-lg transition-all ${
                  item.processed
                    ? "opacity-40 bg-transparent"
                    : "hover:bg-[var(--color-control-bg)]"
                }`}
              >
                <button
                  onClick={() => toggleProcessed(item.id)}
                  className="mt-0.5 shrink-0 text-violet-400 hover:text-violet-300 transition-colors accessible-focus p-0.5 rounded"
                  aria-label={item.processed ? `Unmark "${item.text}"` : `Mark "${item.text}" as processed`}
                >
                  {item.processed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm leading-snug ${
                    item.processed
                      ? "line-through text-[var(--color-text-muted)]"
                      : "text-[var(--color-text-main)]"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-red-400 transition-all accessible-focus"
                  aria-label={`Remove "${item.text}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div ref={listEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
