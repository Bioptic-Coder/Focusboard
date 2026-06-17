import React, { useState, useEffect } from "react";

interface WorldClockWidgetProps {
  editMode: boolean;
  announce?: (text: string) => void;
}

const SUPPORTED_ZONES = [
  { name: "Local Time", zone: undefined },
  { name: "UTC (Coordinated Universal Time)", zone: "UTC" },
  { name: "New York (EST/EDT)", zone: "America/New_York" },
  { name: "Los Angeles (PST/PDT)", zone: "America/Los_Angeles" },
  { name: "London (GMT/BST)", zone: "Europe/London" },
  { name: "Paris (CET/CEST)", zone: "Europe/Paris" },
  { name: "Tokyo (JST)", zone: "Asia/Tokyo" },
  { name: "Sydney (AEST/AEDT)", zone: "Australia/Sydney" },
  { name: "Cairo (EET)", zone: "Africa/Cairo" },
  { name: "Mumbai (IST)", zone: "Asia/Kolkata" },
];

export const WorldClockWidget: React.FC<WorldClockWidgetProps> = ({ editMode }) => {
  const [zoneA, setZoneA] = useState<string>(() => {
    return localStorage.getItem("deskdash-worldclock-zoneA") || "America/New_York";
  });
  const [zoneB, setZoneB] = useState<string>(() => {
    return localStorage.getItem("deskdash-worldclock-zoneB") || "Europe/London";
  });

  const [offset, setOffset] = useState<number>(0);
  const [timeTick, setTimeTick] = useState<number>(Date.now());

  // Tick the clock every 10 seconds for general time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleZoneChange = (target: "A" | "B", zone: string) => {
    if (target === "A") {
      setZoneA(zone);
      localStorage.setItem("deskdash-worldclock-zoneA", zone);
    } else {
      setZoneB(zone);
      localStorage.setItem("deskdash-worldclock-zoneB", zone);
    }
  };

  const getOffsetTimeStr = (ianaZone: string | undefined, offsetHours: number) => {
    const date = new Date(timeTick);
    date.setHours(date.getHours() + offsetHours);
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: ianaZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (e) {
      return "Error";
    }
  };

  const getHourStatus = (ianaZone: string | undefined, offsetHours: number) => {
    const date = new Date(timeTick);
    date.setHours(date.getHours() + offsetHours);
    try {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: ianaZone,
        hour: "numeric",
        hour12: false,
      }).format(date);
      const hour = parseInt(hourStr, 10);

      if (hour >= 9 && hour < 17) {
        return { label: "Work", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/35", icon: "💼" };
      } else if (hour >= 6 && hour < 18) {
        return { label: "Day", color: "bg-sky-500/20 text-sky-400 border-sky-500/35", icon: "☀️" };
      } else {
        return { label: "Night", color: "bg-purple-950/40 text-purple-400 border-purple-500/20", icon: "🌙" };
      }
    } catch (e) {
      return { label: "Unknown", color: "bg-zinc-800 text-zinc-400 border-zinc-700", icon: "❓" };
    }
  };

  const activeZoneAInfo = SUPPORTED_ZONES.find((z) => z.zone === zoneA) || SUPPORTED_ZONES[2];
  const activeZoneBInfo = SUPPORTED_ZONES.find((z) => z.zone === zoneB) || SUPPORTED_ZONES[4];

  // Helper to render timezone row
  const renderZoneRow = (title: string, zoneVal: string | undefined, isConfigurable: boolean, configTarget?: "A" | "B") => {
    const timeStr = getOffsetTimeStr(zoneVal, offset);
    const status = getHourStatus(zoneVal, offset);

    return (
      <div className="flex items-center justify-between w-full py-1.5 border-b border-[var(--color-card-border)] last:border-b-0">
        <div className="flex flex-col items-start pr-4 truncate">
          {editMode && isConfigurable && configTarget ? (
            <select
              value={zoneVal || ""}
              onChange={(e) => handleZoneChange(configTarget, e.target.value)}
              className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-zinc-100 hover:text-white rounded-lg p-1.5 text-sm font-bold border border-[var(--color-card-border)] focus:outline-none max-w-[180px] truncate accessible-focus"
              aria-label={`Select Timezone ${configTarget}`}
            >
              {SUPPORTED_ZONES.filter((z) => z.zone !== undefined).map((z) => (
                <option key={z.zone} value={z.zone || ""}>
                  {z.name.replace(/ \(.*\)/, "")}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-base font-extrabold text-[var(--color-text-main)] truncate max-w-[180px]">
              {title}
            </span>
          )}
          <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mt-0.5">
            {zoneVal || "System Local"}
          </span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Day/Night/Work status pill */}
          <div
            className={`px-2 py-0.5 text-xs font-extrabold rounded-lg border flex items-center space-x-1 ${status.color}`}
          >
            <span aria-hidden="true">{status.icon}</span>
            <span className="uppercase tracking-wide">{status.label}</span>
          </div>

          <span className="text-2xl font-black font-mono tracking-tight tabular-nums w-[130px] text-right">
            {timeStr}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col p-1 text-[var(--color-text-main)] select-none">
      {/* Timezone stacked rows */}
      <div className="flex-1 flex flex-col w-full">
        {renderZoneRow("Local Time", undefined, false)}
        {renderZoneRow(activeZoneAInfo.name.replace(/ \(.*\)/, ""), zoneA, true, "A")}
        {renderZoneRow(activeZoneBInfo.name.replace(/ \(.*\)/, ""), zoneB, true, "B")}
      </div>

      {/* Hour Comparison Slider */}
      <div className="mt-4 pt-3 border-t border-[var(--color-card-border)] w-full">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--color-text-muted)] mb-1">
          <span aria-hidden="true">⏪ Past Hours</span>
          <span className="text-amber-500 font-extrabold text-sm px-2 bg-amber-500/10 border border-amber-500/25 rounded-lg">
            {offset === 0 ? "🕒 NOW" : offset > 0 ? `➕${offset} hours` : `➖${Math.abs(offset)} hours`}
          </span>
          <span aria-hidden="true">Future Hours ⏩</span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={offset}
            onChange={(e) => setOffset(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer focus:outline-none border border-[var(--color-card-border)] accent-blue-500 accessible-focus"
            aria-label="Time Comparison Offset Slider"
            aria-valuetext={offset === 0 ? "Current Time" : offset > 0 ? `Plus ${offset} hour${offset > 1 ? "s" : ""}` : `Minus ${Math.abs(offset)} hour${Math.abs(offset) > 1 ? "s" : ""}`}
          />
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="py-1 px-2.5 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] text-xs font-extrabold rounded-lg transition-colors shrink-0 accessible-focus"
              title="Reset to current time"
              aria-label="Reset timezone comparison to current time"
            >
              RESET
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
