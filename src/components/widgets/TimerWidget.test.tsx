import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TimerWidget } from "./TimerWidget";

describe("TimerWidget", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders manual time adjusters when idle", () => {
    render(<TimerWidget />);
    
    // Check spinbuttons
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveTextContent("0");
    expect(screen.getByRole("spinbutton", { name: "Minutes" })).toHaveTextContent("00");
    expect(screen.getByRole("spinbutton", { name: "Seconds" })).toHaveTextContent("00");
    
    // Start button is disabled when time is 0
    const startBtn = screen.getByRole("button", { name: "Start Timer" });
    expect(startBtn).toBeDisabled();

    // Check presets
    expect(screen.getByRole("button", { name: "Set timer to 1 minute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set timer to 5 minutes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set timer to 25 minutes" })).toBeInTheDocument();
  });

  it("adjusts time using plus and minus buttons", () => {
    render(<TimerWidget />);
    
    const increaseHours = screen.getByRole("button", { name: "Increase Hours" });
    const decreaseHours = screen.getByRole("button", { name: "Decrease Hours" });
    const increaseMinutes = screen.getByRole("button", { name: "Increase Minutes by 5" });
    const decreaseMinutes = screen.getByRole("button", { name: "Decrease Minutes by 5" });
    const increaseSeconds = screen.getByRole("button", { name: "Increase Seconds by 15" });
    const decreaseSeconds = screen.getByRole("button", { name: "Decrease Seconds by 15" });

    // Hours
    fireEvent.click(increaseHours);
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveTextContent("1");
    fireEvent.click(decreaseHours);
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveTextContent("0");

    // Minutes
    fireEvent.click(increaseMinutes);
    expect(screen.getByRole("spinbutton", { name: "Minutes" })).toHaveTextContent("05");
    fireEvent.click(decreaseMinutes);
    expect(screen.getByRole("spinbutton", { name: "Minutes" })).toHaveTextContent("00");

    // Seconds
    fireEvent.click(increaseSeconds);
    expect(screen.getByRole("spinbutton", { name: "Seconds" })).toHaveTextContent("15");
    fireEvent.click(decreaseSeconds);
    expect(screen.getByRole("spinbutton", { name: "Seconds" })).toHaveTextContent("00");

    // Check boundary limit (cannot go below 0)
    fireEvent.click(decreaseHours);
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toHaveTextContent("0");
  });

  it("adjusts time using keyboard ArrowUp and ArrowDown", () => {
    render(<TimerWidget />);

    const hoursSpin = screen.getByRole("spinbutton", { name: "Hours" });
    const minutesSpin = screen.getByRole("spinbutton", { name: "Minutes" });
    const secondsSpin = screen.getByRole("spinbutton", { name: "Seconds" });

    fireEvent.keyDown(hoursSpin, { key: "ArrowUp" });
    expect(hoursSpin).toHaveTextContent("1");
    fireEvent.keyDown(hoursSpin, { key: "ArrowDown" });
    expect(hoursSpin).toHaveTextContent("0");

    fireEvent.keyDown(minutesSpin, { key: "ArrowUp" });
    expect(minutesSpin).toHaveTextContent("01");
    fireEvent.keyDown(minutesSpin, { key: "ArrowDown" });
    expect(minutesSpin).toHaveTextContent("00");

    fireEvent.keyDown(secondsSpin, { key: "ArrowUp" });
    expect(secondsSpin).toHaveTextContent("01");
    fireEvent.keyDown(secondsSpin, { key: "ArrowDown" });
    expect(secondsSpin).toHaveTextContent("00");
  });

  it("starts the timer and counts down", () => {
    vi.useFakeTimers();
    render(<TimerWidget />);

    // Add some time
    fireEvent.click(screen.getByRole("button", { name: "Increase Minutes by 5" }));
    
    // Start timer
    const startBtn = screen.getByRole("button", { name: "Start Timer" });
    expect(startBtn).toBeEnabled();
    fireEvent.click(startBtn);

    // Displays running state
    expect(screen.queryByRole("spinbutton", { name: "Hours" })).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    // Advance time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByRole("timer")).toHaveTextContent("04:50");
  });

  it("handles pause, resume, and reset states", () => {
    vi.useFakeTimers();
    render(<TimerWidget />);

    // Increase minutes by 5 and start
    fireEvent.click(screen.getByRole("button", { name: "Increase Minutes by 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Start Timer" }));

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("04:55");

    // Pause timer
    const pauseBtn = screen.getByRole("button", { name: "Pause Timer" });
    fireEvent.click(pauseBtn);

    // Verify pause state buttons
    const resumeBtn = screen.getByRole("button", { name: "Resume Timer" });
    const resetBtn = screen.getByRole("button", { name: "Reset Timer" });
    expect(resumeBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();

    // Advance timers (should not decrement while paused)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("04:55");

    // Resume timer
    fireEvent.click(resumeBtn);
    expect(screen.queryByRole("button", { name: "Resume Timer" })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("04:50");

    // Pause again and Reset
    fireEvent.click(screen.getByRole("button", { name: "Pause Timer" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset Timer" }));

    // Should return to manual adjusters
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toBeInTheDocument();
  });

  it("starts running immediately when preset button is clicked", () => {
    render(<TimerWidget />);

    const preset5 = screen.getByRole("button", { name: "Set timer to 5 minutes" });
    fireEvent.click(preset5);

    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(screen.getByRole("button", { name: "Pause Timer" })).toBeInTheDocument();
  });

  it("triggers alarm when time expires and can be stopped", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<TimerWidget announce={mockAnnounce} />);

    // Click 1 minute preset
    fireEvent.click(screen.getByRole("button", { name: "Set timer to 1 minute" }));

    // Tick remaining 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Verify alert message and announcement
    expect(screen.getByRole("alert")).toHaveTextContent("TIMER FINISHED!");
    expect(mockAnnounce).toHaveBeenCalledWith("Timer finished! Alarm is ringing.");

    // Stop alarm button should be active
    const stopAlarmBtn = screen.getByRole("button", { name: "Stop Alarm" });
    expect(stopAlarmBtn).toBeInTheDocument();

    fireEvent.click(stopAlarmBtn);

    // Back to idle
    expect(screen.getByRole("spinbutton", { name: "Hours" })).toBeInTheDocument();
  });

  it("restores active countdown from localStorage", () => {
    const futureExpiry = Date.now() + 120 * 1000; // 2 minutes remaining
    localStorage.setItem("deskdash-timer-status", "running");
    localStorage.setItem("deskdash-timer-timeleft", "120");
    localStorage.setItem("deskdash-timer-duration", "300");
    localStorage.setItem("deskdash-timer-expiry", String(futureExpiry));

    render(<TimerWidget />);

    // Renders active timer at 2 minutes (02:00)
    expect(screen.getByRole("timer")).toHaveTextContent("02:00");
    expect(screen.getByRole("button", { name: "Pause Timer" })).toBeInTheDocument();
  });

  it("restores paused state from localStorage", () => {
    localStorage.setItem("deskdash-timer-status", "paused");
    localStorage.setItem("deskdash-timer-timeleft", "90");
    localStorage.setItem("deskdash-timer-duration", "180");

    render(<TimerWidget />);

    expect(screen.getByRole("timer")).toHaveTextContent("01:30");
    expect(screen.getByRole("button", { name: "Resume Timer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Timer" })).toBeInTheDocument();
  });
});
