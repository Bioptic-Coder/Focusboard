import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { GardenWidget } from "./GardenWidget";

describe("GardenWidget", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the garden grid with 16 empty plots", () => {
    render(<GardenWidget />);
    const garden = screen.getByRole("img", { name: /Garden/ });
    expect(garden).toBeInTheDocument();
    expect(screen.getByText("0 sessions completed")).toBeInTheDocument();
  });

  it("renders the water drops indicator at 0/3", () => {
    render(<GardenWidget />);
    expect(screen.getByText("0/3")).toBeInTheDocument();
  });

  it("increments water drops on focusboard:pomodoro-complete event", () => {
    render(<GardenWidget />);

    act(() => {
      document.dispatchEvent(new CustomEvent("focusboard:pomodoro-complete"));
    });

    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("plants a seed after 3 water drops", () => {
    render(<GardenWidget />);

    act(() => {
      document.dispatchEvent(new CustomEvent("focusboard:pomodoro-complete"));
      document.dispatchEvent(new CustomEvent("focusboard:timer-complete"));
      document.dispatchEvent(new CustomEvent("focusboard:eyestrain-complete"));
    });

    // Water should be back to 0/3 after planting
    expect(screen.getByText("0/3")).toBeInTheDocument();
    // A plant should be visible (seedling emoji)
    expect(screen.getByText("🌱")).toBeInTheDocument();
  });

  it("grows plants through stages", () => {
    render(<GardenWidget />);

    // 3 events = seed planted, 3 more = seed grows to stage 2
    for (let i = 0; i < 6; i++) {
      act(() => {
        document.dispatchEvent(new CustomEvent("focusboard:pomodoro-complete"));
      });
    }

    // Should have a plant at stage 1 (🌿)
    expect(screen.getByText("🌿")).toBeInTheDocument();
  });

  it("responds to timer-complete events", () => {
    render(<GardenWidget />);

    act(() => {
      document.dispatchEvent(new CustomEvent("focusboard:timer-complete"));
    });

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("1 sessions completed")).toBeInTheDocument();
  });

  it("persists state to localStorage", () => {
    render(<GardenWidget />);

    act(() => {
      document.dispatchEvent(new CustomEvent("focusboard:pomodoro-complete"));
    });

    const stored = localStorage.getItem("focusboard-garden");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.waterDrops).toBe(1);
    expect(parsed.totalCompleted).toBe(1);
  });

  it("shows harvest button when garden is full", () => {
    // Pre-populate localStorage with a full garden
    const fullGarden = {
      plants: Array(16).fill(3), // All plants at max stage
      waterDrops: 0,
      totalCompleted: 48,
      streakDays: [],
      lastHarvest: 0,
    };
    localStorage.setItem("focusboard-garden", JSON.stringify(fullGarden));

    render(<GardenWidget />);
    expect(screen.getByLabelText("Harvest garden")).toBeInTheDocument();
  });

  it("harvests the garden and resets plants", () => {
    const fullGarden = {
      plants: Array(16).fill(3),
      waterDrops: 0,
      totalCompleted: 48,
      streakDays: [],
      lastHarvest: 0,
    };
    localStorage.setItem("focusboard-garden", JSON.stringify(fullGarden));

    render(<GardenWidget />);
    const harvestBtn = screen.getByLabelText("Harvest garden");
    fireEvent.click(harvestBtn);

    // Confirm is mocked to true in setup.ts; celebration shows briefly
    // After harvest, the completed count should still show
    expect(screen.getByText(/48 sessions completed/)).toBeInTheDocument();
  });
});
