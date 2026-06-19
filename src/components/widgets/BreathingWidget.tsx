import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useAudioService, playTransitionChime as playTransitionChimeSound } from "../../services/audioService";

interface BreathStep {
  name: "inhale" | "holdIn" | "exhale" | "holdOut";
  label: string;
  duration: number;
  scale: number;
  color: string;
}

const BOX_BREATHING: BreathStep[] = [
  { name: "inhale", label: "Breathe In", duration: 4, scale: 1.8, color: "bg-teal-500 shadow-teal-500/50" },
  { name: "holdIn", label: "Hold", duration: 4, scale: 1.8, color: "bg-blue-500 shadow-blue-500/50" },
  { name: "exhale", label: "Breathe Out", duration: 4, scale: 1.0, color: "bg-indigo-500 shadow-indigo-500/50" },
  { name: "holdOut", label: "Hold", duration: 4, scale: 1.0, color: "bg-zinc-500 shadow-zinc-500/50" },
];

const CALM_BREATHING: BreathStep[] = [
  { name: "inhale", label: "Breathe In", duration: 4, scale: 1.8, color: "bg-teal-500 shadow-teal-500/50" },
  { name: "holdIn", label: "Hold", duration: 7, scale: 1.8, color: "bg-blue-500 shadow-blue-500/50" },
  { name: "exhale", label: "Breathe Out", duration: 8, scale: 1.0, color: "bg-indigo-500 shadow-indigo-500/50" },
];

const EQUAL_BREATHING: BreathStep[] = [
  { name: "inhale", label: "Breathe In", duration: 4, scale: 1.8, color: "bg-teal-500 shadow-teal-500/50" },
  { name: "exhale", label: "Breathe Out", duration: 4, scale: 1.0, color: "bg-indigo-500 shadow-indigo-500/50" },
];

type PatternType = "box" | "calm" | "equal";

interface BreathingWidgetProps {
  einkMode?: boolean;
  announce?: (text: string) => void;
}

export const BreathingWidget: React.FC<BreathingWidgetProps> = ({ einkMode, announce }) => {
  const { getAudioContext } = useAudioService();
  const [patternType, setPatternType] = useState<PatternType>("box");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(4);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const stepTimerRef = useRef<any>(null);
  const secondTimerRef = useRef<any>(null);

  const getPattern = (): BreathStep[] => {
    if (patternType === "calm") return CALM_BREATHING;
    if (patternType === "equal") return EQUAL_BREATHING;
    return BOX_BREATHING;
  };

  const pattern = getPattern();
  const currentStep = pattern[stepIndex] || pattern[0];

  useEffect(() => {
    if (isActive) {
      // Audio chime at session start
      playTransitionChime();

      // Countdown loop
      secondTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Move to next step
            setStepIndex((idx) => {
              const nextIdx = (idx + 1) % pattern.length;
              const nextStep = pattern[nextIdx];
              setTimeLeft(nextStep.duration);
              playTransitionChime();
              announce?.(`Breathing: ${nextStep.label}. ${nextStep.duration} seconds.`);
              return nextIdx;
            });
            return 0; // Temp placeholder, reset by stepIndex update
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopSession();
    }

    return () => {
      clearTimers();
    };
  }, [isActive, patternType]);

  const stopSession = () => {
    clearTimers();
    setStepIndex(0);
    setTimeLeft(pattern[0].duration);
  };

  const clearTimers = () => {
    if (secondTimerRef.current) {
      clearInterval(secondTimerRef.current);
      secondTimerRef.current = null;
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const playTransitionChime = () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      playTransitionChimeSound(ctx);
    } catch (e) {
      console.warn("AudioContext blocked or not supported:", e);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none text-[var(--color-text-main)]">
      {/* Pattern Selector Pills */}
      {!isActive && (
        <div className="flex space-x-1.5 p-1 bg-black/25 border border-[var(--color-card-border)] rounded-xl mb-3">
          {(["box", "calm", "equal"] as PatternType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setPatternType(type);
                setStepIndex(0);
                const newPattern = type === "calm" ? CALM_BREATHING : type === "equal" ? EQUAL_BREATHING : BOX_BREATHING;
                setTimeLeft(newPattern[0].duration);
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all accessible-focus ${
                patternType === type
                  ? "bg-blue-600 text-white shadow"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {type === "equal" ? "Equal (4:4)" : type === "calm" ? "Calm (4:7:8)" : "Box (4:4:4:4)"}
            </button>
          ))}
        </div>
      )}

      {/* Main Breathing Visual Circle */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-3">
        {/* Animated scaling bubble */}
        <div
          className={`w-16 h-16 rounded-full border border-white/10 flex items-center justify-center ${
            einkMode 
              ? "border-4 border-[var(--color-text-main)] bg-transparent" 
              : `transition-transform duration-1000 ease-out shadow-lg ${isActive ? currentStep.color : "bg-zinc-600 shadow-zinc-600/30"}`
          }`}
          style={einkMode ? undefined : {
            transform: `scale(${isActive ? currentStep.scale : 1.0})`,
            transitionDuration: `${isActive ? currentStep.duration * 1000 : 1000}ms`,
          }}
        >
          {/* Internal text inside the bubble */}
          <span className={`${einkMode ? "text-[var(--color-text-main)] font-black" : "text-white font-black"} text-xs uppercase tracking-wider scale-90 text-center px-1`}>
            {isActive ? currentStep.label.split(" ").pop() : "IDLE"}
          </span>
        </div>

        {/* Floating timer overlay */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`${einkMode ? "text-[var(--color-text-main)]" : "text-white drop-shadow"} font-mono text-3xl font-black tabular-nums`}>
              {timeLeft}
            </div>
          </div>
        )}
      </div>

      {/* Outer Status Text */}
      <div className="h-6 text-center font-extrabold text-sm mb-3">
        {isActive ? (
          <span className="uppercase text-blue-400 tracking-widest">{currentStep.label}...</span>
        ) : (
          <span className="text-[var(--color-text-muted)] uppercase tracking-widest">Ready to Begin</span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2 w-full max-w-[240px]">
        <button
          onClick={() => {
            const nextActive = !isActive;
            setIsActive(nextActive);
            if (nextActive) {
              announce?.(`Breathing session started. First step is: ${pattern[0].label} for ${pattern[0].duration} seconds.`);
            } else {
              announce?.("Breathing session stopped.");
            }
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-extrabold transition-colors flex items-center justify-center border border-transparent accessible-focus ${
            isActive
              ? "bg-zinc-700 hover:bg-zinc-650 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          aria-label={isActive ? "Stop breathing exercise" : "Start breathing exercise"}
        >
          {isActive ? (
            <>
              <Pause className="w-4.5 h-4.5 mr-1 fill-current" /> STOP
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5 mr-1 fill-current" /> BREATHE
            </>
          )}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] rounded-xl text-[var(--color-text-main)] transition-colors accessible-focus"
          title={isMuted ? "Unmute chimes" : "Mute chimes"}
          aria-label={isMuted ? "Unmute chimes" : "Mute chimes"}
        >
          {isMuted ? <VolumeX className="w-4.5 h-4.5 text-red-500" /> : <Volume2 className="w-4.5 h-4.5 text-blue-400" />}
        </button>
      </div>
    </div>
  );
};
