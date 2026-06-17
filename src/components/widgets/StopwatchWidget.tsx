import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

export const StopwatchWidget: React.FC = () => {
  const [timeElapsed, setTimeElapsed] = useState(0); // in ms
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const totalAccumulatedTime = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const delta = Date.now() - startTimeRef.current;
        setTimeElapsed(totalAccumulatedTime.current + delta);
      }, 10); // high frequency updates for millisecond tracking
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    totalAccumulatedTime.current = timeElapsed;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setLaps([]);
    totalAccumulatedTime.current = 0;
  };

  const handleLap = () => {
    setLaps((prev) => [timeElapsed, ...prev]);
  };

  const formatTime = (timeMs: number) => {
    const min = Math.floor(timeMs / 60000);
    const sec = Math.floor((timeMs % 60000) / 1000);
    const ms = Math.floor((timeMs % 1000) / 10); // 2 digits centiseconds

    const minStr = String(min).padStart(2, "0");
    const secStr = String(sec).padStart(2, "0");
    const msStr = String(ms).padStart(2, "0");

    return { minStr, secStr, msStr };
  };

  const { minStr, secStr, msStr } = formatTime(timeElapsed);

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center p-2 select-none relative">
      
      {/* Stopwatch & Laps Container */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-4 overflow-hidden">
        
        {/* Main Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-baseline font-bold tracking-tight text-[var(--color-text-main)]">
            <span className="text-5xl sm:text-6xl tabular-nums">{minStr}</span>
            <span className="text-4xl sm:text-5xl px-1 text-[var(--color-text-muted)]">:</span>
            <span className="text-5xl sm:text-6xl tabular-nums">{secStr}</span>
            <span className="text-3xl sm:text-4xl px-0.5 text-[var(--color-text-muted)]">.</span>
            <span className="text-3xl sm:text-4xl tabular-nums text-[var(--color-text-muted)] w-[1.2em] text-left">
              {msStr}
            </span>
          </div>
        </div>

        {/* Laps List (Right side/underneath) */}
        {laps.length > 0 && (
          <div className="w-full md:w-36 max-h-24 md:max-h-28 overflow-y-auto border border-[var(--color-card-border)] bg-black/20 rounded-xl p-2 text-left">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block mb-1">
              Laps ({laps.length})
            </span>
            <div className="space-y-1 text-xs">
              {laps.map((lapTime, idx) => {
                const formatted = formatTime(lapTime);
                return (
                  <div key={idx} className="flex justify-between font-mono text-[var(--color-text-main)] border-b border-[var(--color-card-border)]/30 pb-0.5 last:border-0">
                    <span className="text-[var(--color-text-muted)]">#{laps.length - idx}</span>
                    <span>
                      {formatted.minStr}:{formatted.secStr}.{formatted.msStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-2 mt-3 w-full justify-center">
        {!isRunning ? (
          <>
            <button
              onClick={handleStart}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center text-sm border border-transparent transition-colors accessible-focus"
              aria-label="Start Stopwatch"
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" /> Start
            </button>
            
            {timeElapsed > 0 && (
              <button
                onClick={handleReset}
                className="py-2.5 px-4 bg-zinc-700 hover:bg-zinc-650 text-white font-bold rounded-xl flex items-center text-sm border border-[var(--color-card-border)] transition-colors accessible-focus"
                aria-label="Reset Stopwatch"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="py-2.5 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center text-sm border border-transparent transition-colors accessible-focus"
              aria-label="Pause Stopwatch"
            >
              <Pause className="w-4 h-4 mr-1.5" /> Pause
            </button>
            
            <button
              onClick={handleLap}
              className="py-2.5 px-4 bg-zinc-750 hover:bg-zinc-700 text-zinc-100 hover:text-white font-bold rounded-xl flex items-center text-sm border border-[var(--color-card-border)] transition-colors accessible-focus"
              aria-label="Record Lap"
            >
              <Flag className="w-4 h-4 mr-1.5" /> Lap
            </button>
          </>
        )}
      </div>
    </div>
  );
};
