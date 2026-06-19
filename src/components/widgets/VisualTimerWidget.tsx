import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAudioService, playTransitionChime } from "../../services/audioService";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

const STORAGE_KEY = "focusboard-visualtimer-last";

interface VisualTimerWidgetProps {
  einkMode?: boolean;
  announce?: (text: string) => void;
}

/**
 * Interpolates between green → yellow → orange → red based on fraction (1.0 = full, 0.0 = empty).
 */
function getTimerColor(fraction: number): string {
  if (fraction > 0.6) {
    // Green to Yellow
    const t = (fraction - 0.6) / 0.4;
    const r = Math.round(234 - t * (234 - 34));
    const g = Math.round(179 + t * (197 - 179));
    const b = Math.round(8 + t * (94 - 8));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (fraction > 0.3) {
    // Yellow to Orange
    const t = (fraction - 0.3) / 0.3;
    const r = Math.round(249 - t * (249 - 234));
    const g = Math.round(115 + t * (179 - 115));
    const b = Math.round(22 - t * (22 - 8));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to Red
    const t = fraction / 0.3;
    const r = Math.round(239 - t * (239 - 249));
    const g = Math.round(68 + t * (115 - 68));
    const b = Math.round(68 - t * (68 - 22));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const VisualTimerWidget: React.FC<VisualTimerWidgetProps> = ({ einkMode, announce }) => {
  const { getAudioContext } = useAudioService();

  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) || 25 * 60 : 25 * 60;
    } catch {
      return 25 * 60;
    }
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Persist last-used duration
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(totalSeconds));
  }, [totalSeconds]);

  // Timer tick
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsComplete(true);
            // Fire completion event for Garden widget
            document.dispatchEvent(new CustomEvent("focusboard:timer-complete"));
            // Play completion chime
            try {
              const ctx = getAudioContext();
              playTransitionChime(ctx);
            } catch {
              // Audio not available
            }
            announce?.("Visual timer complete!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [isRunning, secondsLeft, getAudioContext, announce]);

  const selectPreset = useCallback(
    (seconds: number) => {
      setTotalSeconds(seconds);
      setSecondsLeft(seconds);
      setIsRunning(true);
      setIsComplete(false);
      announce?.(`Visual timer started: ${Math.floor(seconds / 60)} minutes`);
    },
    [announce]
  );

  const togglePause = () => {
    if (isComplete) return;
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      announce?.("Visual timer paused.");
    } else if (secondsLeft > 0) {
      setIsRunning(true);
      announce?.("Visual timer resumed.");
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsComplete(false);
    setSecondsLeft(totalSeconds);
    announce?.("Visual timer reset.");
  };

  const startEdit = () => {
    if (isRunning) return;
    setIsEditing(true);
    setEditValue(String(Math.ceil(totalSeconds / 60)));
    requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
  };

  const commitEdit = () => {
    const mins = parseInt(editValue, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 180) {
      const newTotal = mins * 60;
      setTotalSeconds(newTotal);
      setSecondsLeft(newTotal);
      setIsComplete(false);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // SVG ring calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const fraction = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - fraction);
  const ringColor = getTimerColor(fraction);
  const isPulsing = fraction <= 0.1 && fraction > 0 && isRunning;

  // Format time
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const displayTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full items-center justify-center p-3 gap-2">
      {/* SVG Ring Timer */}
      <div className="relative flex items-center justify-center flex-1 min-h-0">
        <svg
          viewBox="0 0 160 160"
          className={`w-full h-full max-w-[200px] max-h-[200px] ${
            isPulsing && !einkMode ? "animate-pulse" : ""
          }`}
          role="img"
          aria-label={`Timer: ${displayTime} remaining`}
        >
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-800/50"
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={einkMode ? "currentColor" : ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 80 80)"
            className={`${einkMode ? "text-[var(--color-text-main)]" : ""}`}
            style={{
              transition: einkMode ? "none" : "stroke-dashoffset 1s linear, stroke 1s linear",
            }}
          />
          {/* Center text */}
          <foreignObject x="20" y="35" width="120" height="90">
            <div className="flex flex-col items-center justify-center h-full">
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="number"
                  min="1"
                  max="180"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={commitEdit}
                  className="w-16 text-center text-2xl font-black bg-transparent border-b-2 border-violet-500 text-[var(--color-text-main)] outline-none"
                  aria-label="Enter minutes"
                />
              ) : (
                <button
                  onClick={startEdit}
                  disabled={isRunning}
                  className="text-3xl font-black tracking-tight tabular-nums text-[var(--color-text-main)] hover:text-violet-400 transition-colors disabled:hover:text-[var(--color-text-main)]"
                  aria-label={`Time remaining: ${displayTime}. Click to set custom time.`}
                >
                  {displayTime}
                </button>
              )}
              {isComplete && (
                <span className="text-xs font-bold text-emerald-400 mt-1">Done! 🎉</span>
              )}
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={togglePause}
          disabled={isComplete && secondsLeft === 0}
          className="h-10 w-10 rounded-xl bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center justify-center transition-colors accessible-focus disabled:opacity-30"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={reset}
          className="h-10 w-10 rounded-xl bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center justify-center transition-colors accessible-focus"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1 justify-center shrink-0">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => selectPreset(p.seconds)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors accessible-focus ${
              totalSeconds === p.seconds && !isRunning && !isComplete
                ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                : "bg-[var(--color-control-bg)] border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
            }`}
            aria-label={`Set timer to ${p.label}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
