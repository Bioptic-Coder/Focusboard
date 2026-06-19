import React, { useState, useEffect, useCallback } from "react";
import { Droplets, Sparkles, RotateCcw } from "lucide-react";

const GROWTH_STAGES = ["🌱", "🌿", "🌻", "🌳"];
const GRID_SIZE = 16; // 4x4 grid
const DROPS_PER_STAGE = 3;

const STORAGE_KEY = "focusboard-garden";

interface GardenState {
  plants: number[]; // Growth stage index for each cell (0-3), -1 = empty
  waterDrops: number;
  totalCompleted: number;
  streakDays: string[]; // ISO date strings of active days
  lastHarvest: number; // timestamp
}

const DEFAULT_STATE: GardenState = {
  plants: Array(GRID_SIZE).fill(-1),
  waterDrops: 0,
  totalCompleted: 0,
  streakDays: [],
  lastHarvest: 0,
};

interface GardenWidgetProps {
  einkMode?: boolean;
  announce?: (text: string) => void;
}

function getConsecutiveStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...new Set(days)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];

  // If the latest day isn't today or yesterday, streak is 0
  const latest = sorted[0];
  const latestDate = new Date(latest);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const GardenWidget: React.FC<GardenWidgetProps> = ({ einkMode, announce }) => {
  const [garden, setGarden] = useState<GardenState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });
  const [showCelebration, setShowCelebration] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garden));
  }, [garden]);

  // Water the garden: advances plants or places new seeds
  const addWater = useCallback(() => {
    setGarden((prev) => {
      const today = new Date().toISOString().split("T")[0];
      const newDrops = prev.waterDrops + 1;
      const newTotal = prev.totalCompleted + 1;
      const newStreakDays = prev.streakDays.includes(today)
        ? prev.streakDays
        : [...prev.streakDays, today];

      const newPlants = [...prev.plants];

      if (newDrops >= DROPS_PER_STAGE) {
        // Find a plant to advance, or place a new seed
        const growableIndex = newPlants.findIndex(
          (stage) => stage >= 0 && stage < GROWTH_STAGES.length - 1
        );

        if (growableIndex !== -1) {
          // Advance existing plant
          newPlants[growableIndex] = newPlants[growableIndex] + 1;
        } else {
          // Place a new seed in the first empty slot
          const emptyIndex = newPlants.findIndex((stage) => stage === -1);
          if (emptyIndex !== -1) {
            newPlants[emptyIndex] = 0;
          }
          // If garden is full of max-stage plants, do nothing (harvest available)
        }

        return {
          plants: newPlants,
          waterDrops: 0,
          totalCompleted: newTotal,
          streakDays: newStreakDays,
          lastHarvest: prev.lastHarvest,
        };
      }

      return {
        ...prev,
        waterDrops: newDrops,
        totalCompleted: newTotal,
        streakDays: newStreakDays,
      };
    });
  }, []);

  // Listen for completion events from other widgets
  useEffect(() => {
    const handleCompletion = () => {
      addWater();
      announce?.("Water drop earned! 💧");
    };

    document.addEventListener("focusboard:pomodoro-complete", handleCompletion);
    document.addEventListener("focusboard:timer-complete", handleCompletion);
    document.addEventListener("focusboard:eyestrain-complete", handleCompletion);

    return () => {
      document.removeEventListener("focusboard:pomodoro-complete", handleCompletion);
      document.removeEventListener("focusboard:timer-complete", handleCompletion);
      document.removeEventListener("focusboard:eyestrain-complete", handleCompletion);
    };
  }, [addWater, announce]);

  // Check if garden is full (all cells planted and max stage)
  const isGardenFull =
    garden.plants.every((stage) => stage === GROWTH_STAGES.length - 1);
  const plantedCount = garden.plants.filter((s) => s >= 0).length;
  const maxedCount = garden.plants.filter((s) => s === GROWTH_STAGES.length - 1).length;

  const harvest = () => {
    if (!window.confirm("Harvest your garden and start fresh? Your stats will be kept.")) {
      return;
    }
    setShowCelebration(true);
    announce?.("🎉 Garden harvested! Starting fresh.");
    setTimeout(() => {
      setGarden((prev) => ({
        ...DEFAULT_STATE,
        totalCompleted: prev.totalCompleted,
        streakDays: prev.streakDays,
        lastHarvest: Date.now(),
      }));
      setShowCelebration(false);
    }, 2000);
  };

  const streak = getConsecutiveStreak(garden.streakDays);

  return (
    <div className="flex flex-col h-full p-3 gap-2 relative overflow-hidden">
      {/* Celebration overlay */}
      {showCelebration && !einkMode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl">
          <div className="text-center animate-bounce">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">Harvested! 🌾</p>
            <p className="text-sm text-zinc-300">Your garden is reborn</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌻</span>
          <div>
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Focus Garden
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Water drops indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 tabular-nums">
              {garden.waterDrops}/{DROPS_PER_STAGE}
            </span>
          </div>
          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-bold text-orange-400 tabular-nums">
                {streak}d
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Garden Grid */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="grid grid-cols-4 gap-1.5 w-full max-w-[200px]" role="img" aria-label={`Garden: ${plantedCount} plants, ${maxedCount} fully grown`}>
          {garden.plants.map((stage, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xl select-none transition-all ${
                stage >= 0
                  ? "bg-emerald-500/5 border border-emerald-500/20"
                  : "bg-[var(--color-control-bg)]/30 border border-[var(--color-card-border)]/30"
              }`}
              aria-label={
                stage >= 0
                  ? `Plant at stage ${stage + 1} of ${GROWTH_STAGES.length}`
                  : "Empty plot"
              }
            >
              {stage >= 0 ? (
                <span
                  className={`${!einkMode ? "transition-transform duration-500" : ""}`}
                  style={{
                    transform: `scale(${0.8 + stage * 0.15})`,
                  }}
                >
                  {GROWTH_STAGES[stage]}
                </span>
              ) : (
                <span className="text-[var(--color-text-muted)] opacity-20 text-xs">·</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats & Harvest */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
          {garden.totalCompleted} sessions completed
        </span>
        {isGardenFull && (
          <button
            onClick={harvest}
            className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/30 transition-colors accessible-focus"
            aria-label="Harvest garden"
          >
            <RotateCcw className="w-3 h-3" />
            Harvest
          </button>
        )}
      </div>
    </div>
  );
};
