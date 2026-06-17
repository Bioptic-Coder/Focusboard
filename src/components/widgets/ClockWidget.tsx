import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ClockWidgetProps {
  editMode: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ editMode }) => {
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    return localStorage.getItem("clock-is24h") === "true";
  });
  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    return localStorage.getItem("clock-show-sec") !== "false"; // default true
  });
  const [flashSeparator, setFlashSeparator] = useState<boolean>(true);

  // Sync time every tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 100); // high frequency to keep seconds precise
    return () => clearInterval(timer);
  }, []);

  // Sync separator flashing
  useEffect(() => {
    const flashTimer = setInterval(() => {
      setFlashSeparator((prev) => !prev);
    }, 1000);
    return () => clearInterval(flashTimer);
  }, []);

  // Save preferences
  const toggle24h = () => {
    const newVal = !is24Hour;
    setIs24Hour(newVal);
    localStorage.setItem("clock-is24h", String(newVal));
  };

  const toggleSeconds = () => {
    const newVal = !showSeconds;
    setShowSeconds(newVal);
    localStorage.setItem("clock-show-sec", String(newVal));
  };

  // Format numbers to 2 digits
  const pad = (num: number) => String(num).padStart(2, "0");

  let hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";

  if (!is24Hour) {
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
  }

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center relative p-2 select-none group">
      
      {/* Time Display */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex items-baseline justify-center font-bold tracking-tight">
          {/* Hours */}
          <span className="text-6xl sm:text-7xl md:text-8xl tabular-nums text-[var(--color-text-main)]">
            {is24Hour ? pad(hours) : hours}
          </span>

          {/* Flashable Separator */}
          <span
            className={`text-6xl sm:text-7xl md:text-8xl px-2 text-[var(--color-text-main)] transition-opacity duration-200 ${
              flashSeparator ? "opacity-100" : "opacity-30"
            }`}
          >
            :
          </span>

          {/* Minutes */}
          <span className="text-6xl sm:text-7xl md:text-8xl tabular-nums text-[var(--color-text-main)]">
            {pad(minutes)}
          </span>

          {/* Optional Seconds */}
          {showSeconds && (
            <>
              <span className="text-3xl sm:text-4xl md:text-5xl text-[var(--color-text-muted)] font-normal px-1">
                :
              </span>
              <span className="text-4xl sm:text-5xl md:text-6xl tabular-nums text-[var(--color-text-muted)] font-medium w-[1.2em] text-left">
                {pad(seconds)}
              </span>
            </>
          )}

          {/* AM/PM Indicator */}
          {!is24Hour && (
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold ml-4 text-amber-500 uppercase tracking-wide">
              {ampm}
            </span>
          )}
        </div>
      </div>

      {/* Options Bar - Only visible in Edit Mode */}
      {editMode && (
        <div className="flex space-x-2 mt-2">
          <button
            onClick={toggle24h}
            className="py-1.5 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] accessible-focus"
            aria-label={is24Hour ? "Switch to 12 hour mode" : "Switch to 24 hour mode"}
          >
            {is24Hour ? "24H Mode" : "12H Mode"}
          </button>
          <button
            onClick={toggleSeconds}
            className="py-1.5 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center accessible-focus"
            aria-label={showSeconds ? "Hide seconds" : "Show seconds"}
          >
            {showSeconds ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1" /> No Sec
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1" /> Show Sec
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
