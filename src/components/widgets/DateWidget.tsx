import React, { useState, useEffect } from "react";

interface DateWidgetProps {
  editMode: boolean;
}

export const DateWidget: React.FC<DateWidgetProps> = ({ editMode }) => {
  const [date, setDate] = useState(new Date());
  const [styleMode, setStyleMode] = useState<"standard" | "compact" | "calendar">(
    () => (localStorage.getItem("date-style") as any) || "standard"
  );

  useEffect(() => {
    // Update daily or on load
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const changeStyle = (mode: typeof styleMode) => {
    setStyleMode(mode);
    localStorage.setItem("date-style", mode);
  };

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center p-2 relative select-none group">
      
      {/* Date display based on styling selection */}
      <div className="flex-1 flex flex-col justify-center items-center">
        {styleMode === "standard" && (
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-extrabold text-blue-400 tracking-tight">
              {weekday}
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text-main)]">
              {month} {dayNum}
            </div>
            <div className="text-xl sm:text-2xl text-[var(--color-text-muted)] tracking-wider">
              {year}
            </div>
          </div>
        )}

        {styleMode === "compact" && (
          <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text-main)] leading-normal">
            <div>{weekday}</div>
            <div className="text-blue-400">
              {dayNum}/{date.getMonth() + 1}/{year}
            </div>
          </div>
        )}

        {styleMode === "calendar" && (
          <div className="w-32 h-36 rounded-2xl overflow-hidden border border-[var(--color-card-border)] bg-zinc-900/60 shadow-lg flex flex-col">
            <div className="bg-red-500 text-white font-bold text-center py-1.5 uppercase text-sm tracking-wider">
              {month.substring(0, 3)}
            </div>
            <div className="flex-1 flex flex-col justify-center items-center bg-transparent">
              <span className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text-main)] tabular-nums leading-none">
                {dayNum}
              </span>
              <span className="text-xs font-bold text-[var(--color-text-muted)] mt-1 uppercase">
                {weekday.substring(0, 3)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Style selectors - Only visible in Edit Mode */}
      {editMode && (
        <div className="flex space-x-1 mt-2">
          {(["standard", "compact", "calendar"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => changeStyle(mode)}
              className={`py-1 px-2.5 text-xs font-bold rounded-lg border transition-colors capitalize accessible-focus ${
                styleMode === mode
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-[var(--color-card-border)] bg-[var(--color-control-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-control-hover)]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
