import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye } from "lucide-react";
import { useFocusCoordinator } from "../../context/FocusCoordinatorContext";

interface EyeStrainWidgetProps {
  editMode: boolean;
  announce?: (text: string) => void;
}

export const EyeStrainWidget: React.FC<EyeStrainWidgetProps> = ({ editMode, announce }) => {
  const { queueAlert, playChime, queueSpeak, isFallback } = useFocusCoordinator();
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // 20 minutes in seconds
  const [breakTimeLeft, setBreakTimeLeft] = useState<number>(20); // 20 seconds eye break
  const [status, setStatus] = useState<"running" | "paused" | "break">("running");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const mainTimerRef = useRef<any>(null);

  useEffect(() => {
    if (status === "running") {
      mainTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            triggerBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (mainTimerRef.current) {
        clearInterval(mainTimerRef.current);
        mainTimerRef.current = null;
      }
    }

    return () => {
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status === "break" && isFallback) {
      const interval = setInterval(() => {
        setBreakTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus("running");
            setTimeLeft(20 * 60);
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, isFallback]);

  const triggerBreak = () => {
    setStatus("break");
    if (isFallback) {
      setBreakTimeLeft(20);
      announce?.("Rest break started. Look 20 feet away for 20 seconds.");
      return;
    }
    queueAlert({
      type: "eyeStrain",
      duration: 20,
      speakText: "Rest break started. Look 20 feet away for 20 seconds.",
      chimeType: isMuted ? undefined : "eyeStrainStart",
      showSkip: true,
      onComplete: () => {
        setStatus("running");
        setTimeLeft(20 * 60);
        if (!isMuted) {
          playChime("eyeStrainEnd");
        }
        queueSpeak("Rest break finished. Work timer restarted.");
        announce?.("Rest break finished. Work timer restarted.");
      },
      onSkip: () => {
        setStatus("running");
        setTimeLeft(20 * 60);
        queueSpeak("Rest break skipped.");
        announce?.("Rest break skipped.");
      }
    });
    announce?.("Rest break started. Look 20 feet away for 20 seconds.");
  };

  const handlePause = () => {
    if (status === "running") {
      setStatus("paused");
      announce?.("Eye break timer paused.");
    } else if (status === "paused") {
      setStatus("running");
      announce?.("Eye break timer started.");
    }
  };

  const handleReset = () => {
    setStatus("running");
    setTimeLeft(20 * 60);
    setBreakTimeLeft(20);
    announce?.("Eye break timer reset.");
  };

  // Convert seconds to MM:SS format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-1 select-none text-[var(--color-text-main)] relative">
      {/* 20-Second Active Break Overlay Placeholder or Full local overlay in fallback */}
      {status === "break" && (
        isFallback ? (
          <div role="alert" className="absolute inset-0 bg-black/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 z-20 border-2 border-emerald-500 animate-in fade-in duration-200">
            <Eye className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" aria-hidden="true" />
            <h4 className="text-xl font-black text-white text-center leading-tight uppercase tracking-wide">
              Look 20 feet away!
            </h4>
            <p className="text-xs font-bold text-zinc-400 text-center max-w-[200px] mt-1 leading-snug">
              Rest your eyes on a distant object for 20 seconds.
            </p>
            <div className="text-5xl font-black text-emerald-400 font-mono tracking-tight tabular-nums mt-4 p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
              {breakTimeLeft}
            </div>
            {editMode && (
              <button
                onClick={() => {
                  setStatus("running");
                  setTimeLeft(20 * 60);
                }}
                className="mt-4 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg transition-colors accessible-focus"
              >
                Skip Break
              </button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20 border border-emerald-500/50">
            <Eye className="w-8 h-8 text-emerald-400 mb-1 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-extrabold text-emerald-400">BREAK ACTIVE</span>
          </div>
        )
      )}

      {/* Main Countdown Display */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div
          role="timer"
          aria-label={`Eye strain break timer: ${formatTime(timeLeft)} remaining before next break`}
          className="text-4xl font-extrabold tabular-nums font-mono tracking-tight"
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-widest mt-1 flex items-center">
          <Eye className="w-3.5 h-3.5 mr-1 text-blue-400" aria-hidden="true" /> Eye Break Timer
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2 w-full mt-3">
        <button
          onClick={handlePause}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border border-transparent accessible-focus ${
            status === "running"
              ? "bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] border-[var(--color-card-border)]"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          aria-label={status === "running" ? "Pause Eye Timer" : "Start Eye Timer"}
        >
          {status === "running" ? (
            <>
              <Pause className="w-4 h-4 mr-1 fill-current" /> PAUSE
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1 fill-current" /> START
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-lg text-[var(--color-text-main)] transition-colors accessible-focus"
          title="Reset timer"
          aria-label="Reset eye strain timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-lg text-[var(--color-text-main)] transition-colors accessible-focus"
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
        </button>
      </div>

      {/* Edit Mode Test Trigger Button */}
      {editMode && (
        <div className="w-full mt-2 pt-2 border-t border-[var(--color-card-border)]/50 flex justify-center">
          <button
            onClick={triggerBreak}
            className="py-1 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider accessible-focus"
            title="Immediately trigger the 20-second rest break to test it"
          >
            ⚡ Test 20s Break
          </button>
        </div>
      )}
    </div>
  );
};
