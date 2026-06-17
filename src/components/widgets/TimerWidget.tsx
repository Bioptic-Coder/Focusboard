import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, VolumeX, AlertTriangle } from "lucide-react";

export const TimerWidget: React.FC = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [totalDuration, setTotalDuration] = useState(0); // in seconds
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "ringing">("idle");

  const timerInterval = useRef<any>(null);
  const alarmInterval = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopAlarm();
    };
  }, []);

  // Update timer loop
  useEffect(() => {
    if (status === "running") {
      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            triggerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [status]);

  const triggerAlarm = () => {
    setStatus("ringing");
    // Stop countdown timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    // Play synthesized beep alarm loop
    playBeep();
    alarmInterval.current = setInterval(() => {
      playBeep();
    }, 1000);
  };

  const playBeep = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5 pitch)
      
      // Fast alarm double-beep pattern
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.2);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      // Close context after play to prevent leakage
      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 500);

    } catch (e) {
      console.warn("Web Audio API not supported or interaction blocked:", e);
    }
  };

  const startTimer = () => {
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    if (totalSecs <= 0) return;

    setTimeLeft(totalSecs);
    setTotalDuration(totalSecs);
    setStatus("running");
  };

  const resumeTimer = () => {
    setStatus("running");
  };

  const pauseTimer = () => {
    setStatus("paused");
  };

  const stopTimer = () => {
    setStatus("idle");
    setTimeLeft(0);
    setTotalDuration(0);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const stopAlarm = () => {
    if (alarmInterval.current) {
      clearInterval(alarmInterval.current);
      alarmInterval.current = null;
    }
    setStatus("idle");
    setTimeLeft(0);
    setTotalDuration(0);

    // Try to safely close audio ctx
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {}
      audioCtxRef.current = null;
    }
  };

  const loadPreset = (presetMinutes: number) => {
    stopAlarm();
    stopTimer();
    const totalSecs = presetMinutes * 60;
    setHours(Math.floor(presetMinutes / 60));
    setMinutes(presetMinutes % 60);
    setSeconds(0);
    setTimeLeft(totalSecs);
    setTotalDuration(totalSecs);
    setStatus("running");
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const percentage = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;

  // Add / Subtract adjusters for low vision
  const adjustUnit = (unit: "h" | "m" | "s", amount: number) => {
    if (unit === "h") setHours((prev) => Math.max(0, Math.min(23, prev + amount)));
    if (unit === "m") setMinutes((prev) => Math.max(0, Math.min(59, prev + amount)));
    if (unit === "s") setSeconds((prev) => Math.max(0, Math.min(59, prev + amount)));
  };

  return (
    <div
      className={`w-full h-full flex flex-col justify-between items-center text-center p-2 select-none relative transition-all duration-300 ${
        status === "ringing" ? "bg-red-600/30 animate-pulse border-2 border-red-500 rounded-xl" : ""
      }`}
    >
      {/* Visual Header / Alarm Display */}
      {status === "ringing" && (
        <div className="flex items-center text-red-500 font-extrabold animate-bounce mb-1">
          <AlertTriangle className="w-5 h-5 mr-1" />
          <span className="text-lg">TIMER FINISHED!</span>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 w-full flex flex-col justify-center items-center">
        {status === "idle" ? (
          /* Manual Time Adjusters (High Visibility) */
          <div className="flex space-x-6 items-center justify-center">
            {/* Hours adjuster */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => adjustUnit("h", 1)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-t-lg font-bold text-xl flex items-center justify-center border border-[var(--color-card-border)] border-b-0 accessible-focus"
                aria-label="Increase Hours"
              >
                +
              </button>
              <div className="w-12 h-10 flex items-center justify-center font-bold text-2xl bg-black/40 text-[var(--color-text-main)] border-x border-[var(--color-card-border)] tabular-nums select-none">
                {hours}
              </div>
              <button
                onClick={() => adjustUnit("h", -1)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-b-lg font-bold text-xl flex items-center justify-center border border-[var(--color-card-border)] border-t-0 accessible-focus"
                aria-label="Decrease Hours"
              >
                -
              </button>
              <span className="text-xs font-bold text-[var(--color-text-muted)] mt-0.5 uppercase">Hr</span>
            </div>

            <span className="text-3xl font-bold text-[var(--color-text-muted)] pb-5">:</span>

            {/* Minutes adjuster */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => adjustUnit("m", 5)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-t-lg font-bold text-sm flex items-center justify-center border border-[var(--color-card-border)] border-b-0 accessible-focus"
                aria-label="Increase Minutes by 5"
              >
                +5
              </button>
              <div className="w-12 h-10 flex items-center justify-center font-bold text-2xl bg-black/40 text-[var(--color-text-main)] border-x border-[var(--color-card-border)] tabular-nums">
                {String(minutes).padStart(2, "0")}
              </div>
              <button
                onClick={() => adjustUnit("m", -5)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-b-lg font-bold text-sm flex items-center justify-center border border-[var(--color-card-border)] border-t-0 accessible-focus"
                aria-label="Decrease Minutes by 5"
              >
                -5
              </button>
              <span className="text-xs font-bold text-[var(--color-text-muted)] mt-0.5 uppercase">Min</span>
            </div>

            <span className="text-3xl font-bold text-[var(--color-text-muted)] pb-5">:</span>

            {/* Seconds adjuster */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => adjustUnit("s", 15)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-t-lg font-bold text-xs flex items-center justify-center border border-[var(--color-card-border)] border-b-0 accessible-focus"
                aria-label="Increase Seconds by 15"
              >
                +15
              </button>
              <div className="w-12 h-10 flex items-center justify-center font-bold text-2xl bg-black/40 text-[var(--color-text-main)] border-x border-[var(--color-card-border)] tabular-nums">
                {String(seconds).padStart(2, "0")}
              </div>
              <button
                onClick={() => adjustUnit("s", -15)}
                className="w-12 h-8 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 rounded-b-lg font-bold text-xs flex items-center justify-center border border-[var(--color-card-border)] border-t-0 accessible-focus"
                aria-label="Decrease Seconds by 15"
              >
                -15
              </button>
              <span className="text-xs font-bold text-[var(--color-text-muted)] mt-0.5 uppercase">Sec</span>
            </div>
          </div>
        ) : (
          /* Active Countdown display */
          <div className="flex flex-col items-center space-y-2 w-full px-6">
            <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight text-[var(--color-text-main)]">
              {formatTime(timeLeft)}
            </div>
            
            {/* Visual Progress Bar */}
            {status !== "ringing" && (
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-[var(--color-card-border)]">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-2 mt-2 w-full justify-center">
        {status === "idle" && (
          <button
            onClick={startTimer}
            disabled={hours === 0 && minutes === 0 && seconds === 0}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center text-sm border border-transparent transition-colors accessible-focus"
            aria-label="Start Timer"
          >
            <Play className="w-4 h-4 mr-1.5 fill-current" /> Start
          </button>
        )}

        {status === "running" && (
          <button
            onClick={pauseTimer}
            className="py-2.5 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center text-sm border border-transparent transition-colors accessible-focus"
            aria-label="Pause Timer"
          >
            <Pause className="w-4 h-4 mr-1.5" /> Pause
          </button>
        )}

        {status === "paused" && (
          <>
            <button
              onClick={resumeTimer}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center text-sm border border-transparent transition-colors accessible-focus"
              aria-label="Resume Timer"
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" /> Resume
            </button>
            <button
              onClick={stopTimer}
              className="py-2.5 px-4 bg-zinc-700 hover:bg-zinc-650 text-white font-bold rounded-xl flex items-center text-sm border border-[var(--color-card-border)] transition-colors accessible-focus"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </button>
          </>
        )}

        {status === "ringing" && (
          <button
            onClick={stopAlarm}
            className="py-3 px-8 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl flex items-center text-base border border-transparent transition-colors shadow-lg animate-bounce accessible-focus"
            aria-label="Stop Alarm"
          >
            <VolumeX className="w-5 h-5 mr-2" /> Stop Alarm
          </button>
        )}
      </div>

      {/* Quick Presets (only shown when not running/ringing for visual simplicity) */}
      {status === "idle" && (
        <div className="flex space-x-1.5 mt-2 overflow-x-auto w-full max-w-xs justify-center py-1">
          {[1, 5, 10, 25, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => loadPreset(mins)}
              className="py-1 px-2.5 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] transition-colors whitespace-nowrap accessible-focus"
              aria-label={`Set timer to ${mins} minute${mins > 1 ? "s" : ""}`}
            >
              {mins}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
