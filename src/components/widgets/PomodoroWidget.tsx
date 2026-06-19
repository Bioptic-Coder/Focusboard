import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Flame, Coffee, Trophy } from "lucide-react";
import { useAudioService, playPomodoroChime } from "../../services/audioService";

type PomodoroMode = "work" | "break" | "longBreak";

const MODE_CONFIGS = {
  work: {
    duration: 25 * 60, // 25 mins
    label: "Focus Session",
    colorClass: "text-amber-500",
    bgHighlightClass: "border-amber-500/30 bg-amber-500/5",
    icon: Flame,
  },
  break: {
    duration: 5 * 60, // 5 mins
    label: "Short Break",
    colorClass: "text-emerald-500",
    bgHighlightClass: "border-emerald-500/30 bg-emerald-500/5",
    icon: Coffee,
  },
  longBreak: {
    duration: 15 * 60, // 15 mins
    label: "Long Break",
    colorClass: "text-blue-500",
    bgHighlightClass: "border-blue-500/30 bg-blue-500/5",
    icon: Trophy,
  },
};

interface PomodoroWidgetProps {
  editMode: boolean;
  announce?: (text: string) => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ editMode, announce }) => {
  const { getAudioContext } = useAudioService();
  const [mode, setMode] = useState<PomodoroMode>("work");
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIGS.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const intervalRef = useRef<any>(null);

  // Synchronize modes
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCycleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, completedCount]);

  const handleCycleComplete = () => {
    setIsRunning(false);
    playChime();

    if (mode === "work") {
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);
      // Notify Garden widget of completed focus session
      document.dispatchEvent(new CustomEvent("focusboard:pomodoro-complete"));
      
      // Every 4th work cycle, trigger a long break
      if (nextCount % 4 === 0) {
        switchMode("longBreak");
        announce?.("Focus session finished! Starting a 15-minute long break.");
      } else {
        switchMode("break");
        announce?.("Focus session finished! Starting a 5-minute short break.");
      }
    } else {
      switchMode("work");
      announce?.("Break finished! Starting a 25-minute focus session.");
    }
  };

  const switchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(MODE_CONFIGS[newMode].duration);
    setIsRunning(false);
  };

  const playChime = () => {
    try {
      const ctx = getAudioContext();
      playPomodoroChime(ctx);
    } catch (e) {
      console.warn("Chime blocked by browser audio policy:", e);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    announce?.("Pomodoro timer started.");
  };
  
  const handlePause = () => {
    setIsRunning(false);
    announce?.(`Pomodoro timer paused. ${formatTime(timeLeft)} remaining.`);
  };
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_CONFIGS[mode].duration);
    announce?.("Pomodoro timer reset.");
  };

  const handleSkip = () => {
    if (confirm("Skip current session?")) {
      handleCycleComplete();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const activeConfig = MODE_CONFIGS[mode];
  const ModeIcon = activeConfig.icon;
  const progressPercent = ((activeConfig.duration - timeLeft) / activeConfig.duration) * 100;

  return (
    <div className={`w-full h-full flex flex-col justify-between items-center text-center p-3 select-none border rounded-xl transition-all duration-300 ${activeConfig.bgHighlightClass}`}>
      
      {/* Header Info */}
      <div className="flex justify-between items-center w-full px-1">
        <div className="flex items-center space-x-1">
          <ModeIcon className={`w-5 h-5 ${activeConfig.colorClass}`} aria-hidden="true" />
          <span className={`text-base font-extrabold ${activeConfig.colorClass} uppercase tracking-wider`}>
            {activeConfig.label}
          </span>
        </div>
        <div className="text-xs font-extrabold text-[var(--color-text-muted)] flex items-center bg-black/30 px-2.5 py-1 rounded-full border border-[var(--color-card-border)]">
          Completed: {completedCount}
        </div>
      </div>

      {/* Timer Countdown Display */}
      <div className="flex-1 w-full flex flex-col justify-center items-center py-2">
        <div
          role="timer"
          aria-label={`Time remaining in ${activeConfig.label}: ${formatTime(timeLeft)}`}
          className="text-5xl sm:text-6xl font-black tabular-nums tracking-tight text-[var(--color-text-main)]"
        >
          {formatTime(timeLeft)}
        </div>
        
        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${activeConfig.label} progress`}
          className="w-full max-w-xs h-2.5 bg-zinc-800/80 rounded-full overflow-hidden border border-[var(--color-card-border)] mt-3"
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              mode === "work" ? "bg-amber-500" : mode === "break" ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-2 mt-2 w-full justify-center">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center text-xs border border-transparent transition-colors accessible-focus"
            aria-label="Start session"
          >
            <Play className="w-4 h-4 mr-1 fill-current" /> Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="py-2 px-5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center text-xs border border-transparent transition-colors accessible-focus"
            aria-label="Pause session"
          >
            <Pause className="w-4 h-4 mr-1" /> Pause
          </button>
        )}

        <button
          onClick={handleReset}
          className="py-2 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] font-bold rounded-xl flex items-center text-xs border border-[var(--color-card-border)] transition-colors accessible-focus"
          aria-label="Reset session time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSkip}
          className="py-2 px-3.5 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] font-bold rounded-xl flex items-center text-xs border border-[var(--color-card-border)] transition-colors accessible-focus"
          title="Skip to next session"
          aria-label="Skip to next session"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selectors - Only visible in Edit Mode */}
      {editMode && (
        <div className="flex space-x-1.5 mt-2.5 overflow-x-auto w-full justify-center">
          {(["work", "break", "longBreak"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`py-1 px-2 text-[10px] uppercase font-bold rounded-lg border transition-colors whitespace-nowrap accessible-focus ${
                mode === m
                  ? m === "work"
                    ? "border-amber-500 bg-amber-500/15 text-amber-400"
                    : m === "break"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                    : "border-blue-500 bg-blue-500/15 text-blue-400"
                  : "border-[var(--color-card-border)] bg-black/20 text-[var(--color-text-muted)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {m === "longBreak" ? "Long" : m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
