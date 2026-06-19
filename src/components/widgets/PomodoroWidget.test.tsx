import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PomodoroWidget } from "./PomodoroWidget";

describe("PomodoroWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default focus session state", () => {
    render(<PomodoroWidget editMode={false} />);

    expect(screen.getByText("Focus Session")).toBeInTheDocument();
    expect(screen.getByText("Completed: 0")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    
    // Start, Reset, Skip buttons
    expect(screen.getByRole("button", { name: "Start session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset session time" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip to next session" })).toBeInTheDocument();

    // Mode buttons should not be visible when editMode is false
    expect(screen.queryByRole("button", { name: "work" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "break" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Long" })).not.toBeInTheDocument();
  });

  it("renders mode selectors in editMode and switches modes", () => {
    render(<PomodoroWidget editMode={true} />);

    const workBtn = screen.getByRole("button", { name: "work" });
    const breakBtn = screen.getByRole("button", { name: "break" });
    const longBreakBtn = screen.getByRole("button", { name: "Long" });

    expect(workBtn).toBeInTheDocument();
    expect(breakBtn).toBeInTheDocument();
    expect(longBreakBtn).toBeInTheDocument();

    // Switch to short break
    fireEvent.click(breakBtn);
    expect(screen.getByText("Short Break")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");

    // Switch to long break
    fireEvent.click(longBreakBtn);
    expect(screen.getByText("Long Break")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("15:00");

    // Switch back to work
    fireEvent.click(workBtn);
    expect(screen.getByText("Focus Session")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
  });

  it("starts, pauses, and resets the timer", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<PomodoroWidget editMode={false} announce={mockAnnounce} />);

    // Start
    const startBtn = screen.getByRole("button", { name: "Start session" });
    fireEvent.click(startBtn);
    expect(mockAnnounce).toHaveBeenCalledWith("Pomodoro timer started.");

    // Ticks down
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("24:58");

    // Pause
    const pauseBtn = screen.getByRole("button", { name: "Pause session" });
    fireEvent.click(pauseBtn);
    expect(mockAnnounce).toHaveBeenCalledWith("Pomodoro timer paused. 24:58 remaining.");

    // Reset
    const resetBtn = screen.getByRole("button", { name: "Reset session time" });
    fireEvent.click(resetBtn);
    expect(mockAnnounce).toHaveBeenCalledWith("Pomodoro timer reset.");
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
  });

  it("skips current session", () => {
    const mockAnnounce = vi.fn();
    render(<PomodoroWidget editMode={false} announce={mockAnnounce} />);

    const skipBtn = screen.getByRole("button", { name: "Skip to next session" });
    fireEvent.click(skipBtn);

    // Skip is confirmed and triggers cycle complete immediately
    expect(screen.getByText("Short Break")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(screen.getByText("Completed: 1")).toBeInTheDocument();
    expect(mockAnnounce).toHaveBeenCalledWith("Focus session finished! Starting a 5-minute short break.");
  });

  it("automatically transitions modes upon completion", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<PomodoroWidget editMode={false} announce={mockAnnounce} />);

    // Start work session
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    // Advance 25 mins
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    // Finished focus session -> short break
    expect(screen.getByText("Short Break")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(screen.getByText("Completed: 1")).toBeInTheDocument();
    expect(mockAnnounce).toHaveBeenCalledWith("Focus session finished! Starting a 5-minute short break.");

    // Start break session
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    // Advance 5 mins
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    // Finished break -> focus session
    expect(screen.getByText("Focus Session")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
    expect(screen.getByText("Completed: 1")).toBeInTheDocument();
    expect(mockAnnounce).toHaveBeenCalledWith("Break finished! Starting a 25-minute focus session.");
  });

  it("transitions to long break after 4 completed focus sessions", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<PomodoroWidget editMode={false} announce={mockAnnounce} />);

    // Complete 3 full work/break cycles, and then the 4th work cycle
    for (let i = 0; i < 3; i++) {
      // Work session
      fireEvent.click(screen.getByRole("button", { name: "Start session" }));
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000);
      });
      // Short break session
      fireEvent.click(screen.getByRole("button", { name: "Start session" }));
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });
    }

    expect(screen.getByText("Completed: 3")).toBeInTheDocument();

    // 4th work session
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    // Should transition to long break
    expect(screen.getByText("Long Break")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("15:00");
    expect(screen.getByText("Completed: 4")).toBeInTheDocument();
    expect(mockAnnounce).toHaveBeenLastCalledWith("Focus session finished! Starting a 15-minute long break.");
  });
});
