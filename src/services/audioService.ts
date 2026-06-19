import { useCallback } from "react";

let sharedAudioContext: AudioContext | null = null;

export const getSharedAudioContext = (): AudioContext => {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser");
  }
  if (!sharedAudioContext) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtxClass();
  }
  return sharedAudioContext;
};

export const useAudioService = () => {
  const getAudioContext = useCallback((): AudioContext => {
    const ctx = getSharedAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch((err) => {
        console.warn("Failed to resume shared AudioContext:", err);
      });
    }
    return ctx;
  }, []);

  const resume = useCallback((): Promise<void> => {
    if (typeof window === "undefined") return Promise.resolve();
    const ctx = getSharedAudioContext();
    if (ctx.state === "suspended") {
      return ctx.resume();
    }
    return Promise.resolve();
  }, []);

  return { getAudioContext, resume };
};

// Play audio cue chime (double chime: A5 / C#6)
export const playCueBeep = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2); // C#6
  gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

  osc.start();
  osc.stop(ctx.currentTime + 0.5);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// Play stand & stretch chime
export const playStretchAlertBeep = (ctx: AudioContext, isStart: boolean) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";

  if (isStart) {
    // Double warning beep
    osc.frequency.setValueAtTime(554.37, ctx.currentTime); // C#5
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } else {
    // Triumphant rising chime
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// Play transition chime (used in Breathing and Pomodoro)
export const playTransitionChime = (ctx: AudioContext) => {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.type = "sine";
  osc2.type = "sine";

  // Pleasant double-tone chord
  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.35);
  osc2.stop(ctx.currentTime + 0.35);

  const cleanup = () => {
    osc1.disconnect();
    osc2.disconnect();
    gain.disconnect();
  };
  osc1.onended = cleanup;
};

// Play eye strain alert sounds
export const playEyeStrainAlertSound = (ctx: AudioContext, isStart: boolean) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";

  if (isStart) {
    // Double warning beep
    osc.frequency.setValueAtTime(660, ctx.currentTime); // E5
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } else {
    // Triumphant rising triple chime
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.1); // D5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// Play metronome tick sound
export const playMetronomeTick = (ctx: AudioContext, isFirstBeat: boolean) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "triangle"; // softer click
  const freq = isFirstBeat ? 1000 : 600; // higher pitch for beat 1
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.start();
  osc.stop(ctx.currentTime + 0.06);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// Play Pomodoro focus transition chime
export const playPomodoroChime = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  
  // Tone 1: 523.25Hz (C5)
  osc.frequency.setValueAtTime(523.25, ctx.currentTime);
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
  
  // Tone 2: 659.25Hz (E5)
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.5, ctx.currentTime + 0.25);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.55);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// Play single Timer alarm beep
export const playTimerAlarmBeep = (ctx: AudioContext) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5 pitch)
  
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.2);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};
