import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StopwatchWidget } from "./StopwatchWidget";

describe("StopwatchWidget", () => {
  let originalNow: () => number;
  let mockTime: number;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNow = Date.now;
    mockTime = 100000; // Mock starting timestamp
    Date.now = vi.fn(() => mockTime);
  });

  afterEach(() => {
    Date.now = originalNow;
    vi.useRealTimers();
  });

  it("renders with initial zero state", () => {
    render(<StopwatchWidget />);

    expect(screen.getByRole("timer")).toHaveTextContent("00:00.00");
    expect(screen.getByRole("button", { name: "Start Stopwatch" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset Stopwatch" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause Stopwatch" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Lap" })).not.toBeInTheDocument();
  });

  it("starts the stopwatch and counts up", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<StopwatchWidget announce={mockAnnounce} />);

    // Click Start
    const startBtn = screen.getByRole("button", { name: "Start Stopwatch" });
    fireEvent.click(startBtn);

    expect(mockAnnounce).toHaveBeenCalledWith("Stopwatch started.");
    expect(screen.queryByRole("button", { name: "Start Stopwatch" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause Stopwatch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Lap" })).toBeInTheDocument();

    // Advance time by 12 seconds and 340 milliseconds
    mockTime += 12340;
    act(() => {
      vi.advanceTimersByTime(12340);
    });

    // Min: 00, Sec: 12, Centiseconds: 34
    // Checking individual spans or layout
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("handles pausing and resuming correctly", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<StopwatchWidget announce={mockAnnounce} />);

    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start Stopwatch" }));

    // Advance 5.5s
    mockTime += 5500;
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    // Pause
    const pauseBtn = screen.getByRole("button", { name: "Pause Stopwatch" });
    fireEvent.click(pauseBtn);

    expect(mockAnnounce).toHaveBeenCalledWith("Stopwatch paused at 00 minutes, 05.50 seconds.");
    expect(screen.getByRole("button", { name: "Start Stopwatch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Stopwatch" })).toBeInTheDocument();

    // Advance time while paused (should not increment)
    mockTime += 3000;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("05")).toBeInTheDocument(); // still 5 seconds

    // Resume
    fireEvent.click(screen.getByRole("button", { name: "Start Stopwatch" }));

    // Advance 2s more (total 7.5s elapsed)
    mockTime += 2000;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("07")).toBeInTheDocument();
  });

  it("records laps and displays them in a list", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<StopwatchWidget announce={mockAnnounce} />);

    // Start
    fireEvent.click(screen.getByRole("button", { name: "Start Stopwatch" }));

    // Advance 10s and record lap 1
    mockTime += 10000;
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    const lapBtn = screen.getByRole("button", { name: "Record Lap" });
    fireEvent.click(lapBtn);

    expect(mockAnnounce).toHaveBeenCalledWith("Lap 1 recorded at 00 minutes, 10.00 seconds.");
    expect(screen.getByText("Laps (1)")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("00:10.00")).toBeInTheDocument();

    // Advance 5s and record lap 2
    mockTime += 5000;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(lapBtn);

    expect(mockAnnounce).toHaveBeenCalledWith("Lap 2 recorded at 00 minutes, 15.00 seconds.");
    expect(screen.getByText("Laps (2)")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("00:15.00")).toBeInTheDocument();
  });

  it("resets stopwatch and clears laps", () => {
    vi.useFakeTimers();
    const mockAnnounce = vi.fn();
    render(<StopwatchWidget announce={mockAnnounce} />);

    // Start -> Record Lap -> Pause -> Reset
    fireEvent.click(screen.getByRole("button", { name: "Start Stopwatch" }));
    
    mockTime += 2000;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Record Lap" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause Stopwatch" }));

    const resetBtn = screen.getByRole("button", { name: "Reset Stopwatch" });
    fireEvent.click(resetBtn);

    expect(mockAnnounce).toHaveBeenCalledWith("Stopwatch reset to zero.");
    expect(screen.queryByText("Laps (1)")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00.00");
    expect(screen.queryByRole("button", { name: "Reset Stopwatch" })).not.toBeInTheDocument();
  });
});
