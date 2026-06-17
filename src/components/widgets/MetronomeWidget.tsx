import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Plus, Minus } from "lucide-react";

interface MetronomeWidgetProps {
  einkMode?: boolean;
  announce?: (text: string) => void;
}

export const MetronomeWidget: React.FC<MetronomeWidgetProps> = ({ einkMode, announce }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(1);

  const intervalRef = useRef<any>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Keep track of latest bpm and currentBeat for the interval callback
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  
  const currentBeatRef = useRef(currentBeat);
  currentBeatRef.current = currentBeat;

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 60000 / bpm;
      
      const tick = () => {
        // Synthesize tick sound
        playTick(currentBeatRef.current === 1);
        
        // Advance beat
        setCurrentBeat((prev) => (prev % 4) + 1);
      };

      // Play immediate first tick
      tick();

      intervalRef.current = setInterval(tick, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm]);

  const playTick = (isFirstBeat: boolean) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle"; // softer click than a sine or square
      const freq = isFirstBeat ? 1000 : 600; // higher pitch for beat 1
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);

      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 100);
    } catch (e) {
      console.warn("AudioContext blocked or not supported:", e);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const times = [...tapTimesRef.current, now].slice(-5); // keep last 5 taps
    tapTimesRef.current = times;

    if (times.length > 1) {
      // Calculate intervals
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const computedBpm = Math.round(60000 / avgInterval);
      
      // Clamp BPM between 30 and 300
      const clampedBpm = Math.max(30, Math.min(300, computedBpm));
      setBpm(clampedBpm);
      announce?.(`Tapped tempo set to ${clampedBpm} beats per minute.`);
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm((prev) => {
      const newVal = Math.max(30, Math.min(300, prev + delta));
      announce?.(`Metronome speed set to ${newVal} beats per minute.`);
      return newVal;
    });
  };

  return (
    <div className="w-full flex flex-col items-center select-none text-[var(--color-text-main)]">
      {/* Visual Indicator Dots */}
      <div className="flex justify-center items-center space-x-3 mb-3" aria-hidden="true">
        {[1, 2, 3, 4].map((b) => {
          const isActive = isPlaying && currentBeat === b;
          return (
            <div
              key={b}
              className={`w-6 h-6 rounded-full border border-[var(--color-text-main)] ${
                isActive
                  ? einkMode
                    ? "bg-[var(--color-text-main)]"
                    : b === 1
                      ? "bg-red-500 scale-125 shadow-lg shadow-red-500/50 transition-all duration-75"
                      : "bg-blue-500 scale-115 shadow-lg shadow-blue-500/50 transition-all duration-75"
                  : einkMode
                    ? "bg-transparent"
                    : "bg-black/30 transition-all duration-75"
              }`}
            />
          );
        })}
      </div>

      {/* BPM Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4 w-full">
        <button
          onClick={() => adjustBpm(-5)}
          className="p-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-xl accessible-focus text-lg font-bold"
          title="Decrease BPM by 5"
          aria-label="Decrease BPM by 5"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div
          role="spinbutton"
          aria-valuenow={bpm}
          aria-valuemin={30}
          aria-valuemax={300}
          aria-label="Beats Per Minute"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              adjustBpm(1);
              e.preventDefault();
            }
            if (e.key === "ArrowDown") {
              adjustBpm(-1);
              e.preventDefault();
            }
          }}
          className="text-center min-w-[100px] cursor-pointer accessible-focus rounded-xl p-1"
        >
          <span className="text-4xl font-extrabold tabular-nums block tracking-tight">
            {bpm}
          </span>
          <span className="text-xs uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
            BPM
          </span>
        </div>

        <button
          onClick={() => adjustBpm(5)}
          className="p-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-xl accessible-focus text-lg font-bold"
          title="Increase BPM by 5"
          aria-label="Increase BPM by 5"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 w-full max-w-[280px]">
        <button
          onClick={() => {
            const nextPlaying = !isPlaying;
            setIsPlaying(nextPlaying);
            announce?.(nextPlaying ? "Metronome started." : "Metronome stopped.");
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-base font-bold transition-colors flex items-center justify-center border border-transparent accessible-focus ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          aria-label={isPlaying ? "Stop Metronome" : "Start Metronome"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-1.5 fill-current" /> STOP
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-1.5 fill-current" /> START
            </>
          )}
        </button>

        <button
          onClick={handleTap}
          className="py-3 px-4 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] border border-[var(--color-card-border)] rounded-xl text-sm font-extrabold uppercase tracking-wide accessible-focus whitespace-nowrap"
          title="Tap rhythm to set tempo"
          aria-label="Tap Tempo"
        >
          Tap Tempo
        </button>
      </div>
    </div>
  );
};
