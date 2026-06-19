/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Activity, Eye, AlertTriangle } from "lucide-react";
import {
  getSharedAudioContext,
  playCueBeep,
  playStretchAlertBeep,
  playEyeStrainAlertSound,
  playTimerAlarmBeep,
  playPomodoroChime,
  playTransitionChime
} from "../services/audioService";

export interface Alert {
  id: string;
  type: "timeCue" | "stretch" | "eyeStrain" | "timer";
  title?: string;
  desc?: string;
  time?: Date; // for timeCue
  duration?: number; // in seconds
  speakText?: string;
  chimeType?: "cue" | "stretchStart" | "stretchEnd" | "eyeStrainStart" | "eyeStrainEnd" | "timerAlarm" | "pomodoro" | "breathing";
  showSkip?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export type ChimeType = "cue" | "stretchStart" | "stretchEnd" | "eyeStrainStart" | "eyeStrainEnd" | "timerAlarm" | "pomodoro" | "breathing";

export const CHIME_DESCRIPTIONS: Record<ChimeType, string> = {
  cue: "[Chime: hourly time cue]",
  stretchStart: "[Chime: stretch break started]",
  stretchEnd: "[Chime: stretch break completed]",
  eyeStrainStart: "[Chime: eye strain break started]",
  eyeStrainEnd: "[Chime: eye strain break completed]",
  timerAlarm: "[Alarm: timer ringing]",
  pomodoro: "[Chime: pomodoro session started]",
  breathing: "[Chime: transition cue]"
};

interface FocusCoordinatorContextType {
  activeAlert: Alert | null;
  queueAlert: (alert: Omit<Alert, "id">) => void;
  dismissActiveAlert: () => void;
  skipActiveAlert: () => void;
  queueSpeak: (text: string) => void;
  playChime: (type: ChimeType) => void;
  isFallback?: boolean;
  caption?: string | null;
}

const FocusCoordinatorContext = createContext<FocusCoordinatorContextType | undefined>(undefined);

export const useFocusCoordinator = () => {
  const context = useContext(FocusCoordinatorContext);
  if (!context) {
    return {
      activeAlert: null,
      queueAlert: () => {},
      dismissActiveAlert: () => {},
      skipActiveAlert: () => {},
      queueSpeak: () => {},
      playChime: () => {},
      isFallback: true,
      caption: null
    };
  }
  return context;
};

interface FocusCoordinatorProviderProps {
  children: React.ReactNode;
}

export const FocusCoordinatorProvider: React.FC<FocusCoordinatorProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<Alert[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Caption State for DHH
  const [caption, setCaption] = useState<string | null>(null);
  const captionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateCaption = useCallback((text: string) => {
    setCaption((prev) => {
      // Combine chime description and spoken text if triggered back-to-back
      if (prev && (prev.startsWith("[Chime:") || prev.startsWith("[Alarm:")) && !text.startsWith("[")) {
        return `${prev} ${text}`;
      }
      return text;
    });

    if (captionTimeoutRef.current) {
      clearTimeout(captionTimeoutRef.current);
    }
    captionTimeoutRef.current = setTimeout(() => {
      setCaption(null);
    }, 3500);
  }, []);

  // Cleanup caption timeout on unmount
  useEffect(() => {
    return () => {
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }
    };
  }, []);

  // Speech Queue Refs
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  // Focus Refs
  const timeCueRef = useRef<HTMLDivElement>(null);
  const stretchSkipButtonRef = useRef<HTMLButtonElement>(null);
  const eyeStrainSkipButtonRef = useRef<HTMLButtonElement>(null);
  const timerStopButtonRef = useRef<HTMLButtonElement>(null);

  function processSpeechQueue() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;

    const text = speechQueueRef.current.shift()!;
    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => 
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Siri") || v.name.includes("Premium")) && 
        v.lang.startsWith("en")
      ) || voices.find(v => v.lang.startsWith("en"));
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      processSpeechQueue();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Queue Text-to-Speech Announcements
  const queueSpeak = useCallback((text: string) => {
    updateCaption(text);
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    speechQueueRef.current.push(text);
    processSpeechQueue();
  }, [updateCaption]);

  // Play chimes using the shared AudioContext
  const playChime = useCallback((type: ChimeType) => {
    const desc = CHIME_DESCRIPTIONS[type] || `[Chime: ${type}]`;
    updateCaption(desc);
    try {
      const ctx = getSharedAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      switch (type) {
        case "cue":
          playCueBeep(ctx);
          break;
        case "stretchStart":
          playStretchAlertBeep(ctx, true);
          break;
        case "stretchEnd":
          playStretchAlertBeep(ctx, false);
          break;
        case "eyeStrainStart":
          playEyeStrainAlertSound(ctx, true);
          break;
        case "eyeStrainEnd":
          playEyeStrainAlertSound(ctx, false);
          break;
        case "pomodoro":
          playPomodoroChime(ctx);
          break;
        case "breathing":
          playTransitionChime(ctx);
          break;
        case "timerAlarm":
          playTimerAlarmBeep(ctx);
          break;
      }
    } catch (err) {
      console.warn("Failed to play chime:", err);
    }
  }, [updateCaption]);

  // Queue Alert
  const queueAlert = useCallback((alertConfig: Omit<Alert, "id">) => {
    const id = `${alertConfig.type}-${Date.now()}-${Math.random()}`;
    const newAlert: Alert = { ...alertConfig, id };
    setQueue((prev) => [...prev, newAlert]);
  }, []);

  // Process next alert in queue when activeAlert changes or is dismissed
  useEffect(() => {
    if (!activeAlert && queue.length > 0) {
      const nextAlert = queue[0];
      setQueue((prev) => prev.slice(1));
      setActiveAlert(nextAlert);
    }
  }, [queue, activeAlert]);

  // Handle countdowns for active timed alerts
  useEffect(() => {
    if (!activeAlert || activeAlert.duration === undefined) return;

    setTimeLeft(activeAlert.duration);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const cb = activeAlert.onComplete;
          setActiveAlert(null); // Will trigger next alert in next render loop
          setCaption(null); // Clear caption on timer completion
          if (cb) cb();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAlert]);

  // Handle repeating Timer alarm beep playbacks
  useEffect(() => {
    if (!activeAlert || activeAlert.chimeType !== "timerAlarm") return;

    const playBeep = () => playChime("timerAlarm");
    playBeep();

    const interval = setInterval(playBeep, 1000);
    return () => clearInterval(interval);
  }, [activeAlert, playChime]);

  // Handle start-alert TTS and chime playbacks
  useEffect(() => {
    if (!activeAlert) return;

    if (activeAlert.chimeType && activeAlert.chimeType !== "timerAlarm") {
      playChime(activeAlert.chimeType);
    }
    if (activeAlert.speakText) {
      queueSpeak(activeAlert.speakText);
    }
  }, [activeAlert, playChime, queueSpeak]);

  // Dismiss Active Alert
  const dismissActiveAlert = useCallback(() => {
    if (!activeAlert) return;
    const cb = activeAlert.onComplete;
    setActiveAlert(null);
    setCaption(null); // Clear caption on dismissal
    if (cb) cb();
  }, [activeAlert]);

  // Skip Active Alert
  const skipActiveAlert = useCallback(() => {
    if (!activeAlert) return;
    const cb = activeAlert.onSkip || activeAlert.onComplete;
    setActiveAlert(null);
    setCaption(null); // Clear caption on skip
    if (cb) cb();
  }, [activeAlert]);

  // Focus management
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      if (activeAlert.type === "timeCue") {
        timeCueRef.current?.focus();
      } else if (activeAlert.type === "stretch") {
        stretchSkipButtonRef.current?.focus();
      } else if (activeAlert.type === "eyeStrain") {
        eyeStrainSkipButtonRef.current?.focus();
      } else if (activeAlert.type === "timer") {
        timerStopButtonRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  // Keydown listener for Time Cue (dismisses on any key)
  useEffect(() => {
    if (!activeAlert || activeAlert.type !== "timeCue") return;
    const handleDismiss = () => {
      dismissActiveAlert();
    };
    window.addEventListener("keydown", handleDismiss);
    return () => window.removeEventListener("keydown", handleDismiss);
  }, [activeAlert, dismissActiveAlert]);

  // Keydown listener for Stretch & EyeStrain Escape key
  useEffect(() => {
    if (!activeAlert || (activeAlert.type !== "stretch" && activeAlert.type !== "eyeStrain")) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeAlert.type === "stretch" || (activeAlert.type === "eyeStrain" && activeAlert.showSkip)) {
          skipActiveAlert();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAlert, skipActiveAlert]);

  return (
    <FocusCoordinatorContext.Provider
      value={{
        activeAlert,
        queueAlert,
        dismissActiveAlert,
        skipActiveAlert,
        queueSpeak,
        playChime,
        caption
      }}
    >
      {children}

      {/* Visual Caption Toast */}
      {caption && (
        <div
          role="status"
          aria-live="polite"
          data-testid="visual-caption-toast"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] max-w-xl w-[calc(100%-2rem)] bg-zinc-950/95 text-yellow-400 font-extrabold text-base md:text-lg px-6 py-4 rounded-xl border-2 border-yellow-400 shadow-2xl text-center select-none animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none"
        >
          <span>{caption}</span>
        </div>
      )}

      {/* Render Alert Takeover Modal Overlays */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          
          {/* Time Cue Overlay */}
          {activeAlert.type === "timeCue" && activeAlert.time && (
            <div
              ref={timeCueRef}
              tabIndex={0}
              role="alert"
              aria-live="assertive"
              onClick={dismissActiveAlert}
              className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center cursor-pointer animate-in fade-in duration-300 accessible-focus"
            >
              <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 mb-2">
                Time Announcement Cue
              </span>
              <time
                dateTime={activeAlert.time.toISOString()}
                className="text-8xl md:text-9xl font-black text-white tracking-tight tabular-nums select-none"
              >
                {(() => {
                  const hours = activeAlert.time.getHours();
                  const minutes = activeAlert.time.getMinutes();
                  const ampm = hours >= 12 ? "PM" : "AM";
                  const formattedHours = hours % 12 || 12;
                  return `${formattedHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
                })()}
              </time>
              <span className="text-sm font-bold text-zinc-400 mt-6 animate-pulse">
                Tap anywhere or press any key to dismiss
              </span>
            </div>
          )}

          {/* Stand & Stretch Break Overlay */}
          {activeAlert.type === "stretch" && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="stretch-heading"
              aria-describedby="stretch-description"
              className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="max-w-md w-full glass-card p-8 border-2 border-emerald-500 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 mb-4 animate-bounce">
                  <Activity className="w-8 h-8 text-emerald-400" />
                </div>
                
                <h3 id="stretch-heading" className="text-3xl font-black text-white leading-tight tracking-wide uppercase">
                  {activeAlert.title}
                </h3>
                
                <p id="stretch-description" className="text-base font-medium text-zinc-300 mt-2 max-w-sm leading-relaxed">
                  {activeAlert.desc}
                </p>

                <div className="text-7xl font-black text-emerald-400 font-mono tracking-tight tabular-nums my-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl w-40 text-center">
                  {timeLeft}
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / (activeAlert.duration || 30)) * 100}%` }}
                  />
                </div>

                <button
                  ref={stretchSkipButtonRef}
                  onClick={skipActiveAlert}
                  className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors accessible-focus text-lg"
                  aria-label="Skip Stand and Stretch Break"
                >
                  Skip Stretch
                </button>
              </div>
            </div>
          )}

          {/* Eye Strain rest break overlay */}
          {activeAlert.type === "eyeStrain" && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="eyestrain-heading"
              aria-describedby="eyestrain-description"
              className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="max-w-md w-full glass-card p-8 border-2 border-emerald-500 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 mb-4 animate-bounce">
                  <Eye className="w-8 h-8 text-emerald-400" />
                </div>
                
                <h3 id="eyestrain-heading" className="text-3xl font-black text-white leading-tight tracking-wide uppercase">
                  Look 20 feet away!
                </h3>
                
                <p id="eyestrain-description" className="text-base font-medium text-zinc-300 mt-2 max-w-sm leading-relaxed">
                  Rest your eyes on a distant object for 20 seconds.
                </p>

                <div className="text-7xl font-black text-emerald-400 font-mono tracking-tight tabular-nums my-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl w-40 text-center">
                  {timeLeft}
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / (activeAlert.duration || 20)) * 100}%` }}
                  />
                </div>

                {activeAlert.showSkip && (
                  <button
                    ref={eyeStrainSkipButtonRef}
                    onClick={skipActiveAlert}
                    className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors accessible-focus text-lg"
                    aria-label="Skip Eye Strain Break"
                  >
                    Skip Break
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Timer Alarm takeover */}
          {activeAlert.type === "timer" && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="timer-heading"
              className="fixed inset-0 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="max-w-md w-full glass-card p-8 border-2 border-red-500 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-4 animate-bounce">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                
                <h3 id="timer-heading" className="text-3xl font-black text-white leading-tight tracking-wide uppercase">
                  Timer Finished!
                </h3>
                
                <p className="text-base font-medium text-zinc-300 mt-2 max-w-sm leading-relaxed">
                  Your countdown timer has completed.
                </p>

                <button
                  ref={timerStopButtonRef}
                  onClick={dismissActiveAlert}
                  className="mt-8 py-4 px-10 bg-red-600 hover:bg-red-750 text-white font-extrabold rounded-xl transition-colors shadow-lg animate-bounce accessible-focus text-xl"
                  aria-label="Stop Timer Alarm"
                >
                  Stop Timer
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </FocusCoordinatorContext.Provider>
  );
};
