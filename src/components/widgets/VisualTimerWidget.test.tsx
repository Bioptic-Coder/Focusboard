import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { VisualTimerWidget } from "./VisualTimerWidget";

describe("VisualTimerWidget", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default 25 minute display", () => {
    render(<VisualTimerWidget />);
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("renders preset buttons", () => {
    render(<VisualTimerWidget />);
    expect(screen.getByLabelText("Set timer to 5m")).toBeInTheDocument();
    expect(screen.getByLabelText("Set timer to 10m")).toBeInTheDocument();
    expect(screen.getByLabelText("Set timer to 25m")).toBeInTheDocument();
    expect(screen.getByLabelText("Set timer to 60m")).toBeInTheDocument();
  });

  it("starts timer when preset is clicked", () => {
    render(<VisualTimerWidget />);
    const preset5m = screen.getByLabelText("Set timer to 5m");
    fireEvent.click(preset5m);

    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("counts down when running", () => {
    render(<VisualTimerWidget />);
    const preset5m = screen.getByLabelText("Set timer to 5m");
    fireEvent.click(preset5m);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("4:57")).toBeInTheDocument();
  });

  it("pauses and resumes", () => {
    render(<VisualTimerWidget />);
    const preset5m = screen.getByLabelText("Set timer to 5m");
    fireEvent.click(preset5m);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Pause
    const pauseButton = screen.getByLabelText("Pause timer");
    fireEvent.click(pauseButton);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be 4:58 (paused after 2s)
    expect(screen.getByText("4:58")).toBeInTheDocument();
  });

  it("resets to original duration", () => {
    render(<VisualTimerWidget />);
    const preset5m = screen.getByLabelText("Set timer to 5m");
    fireEvent.click(preset5m);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    const resetButton = screen.getByLabelText("Reset timer");
    fireEvent.click(resetButton);

    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("persists last-used duration to localStorage", () => {
    render(<VisualTimerWidget />);
    const preset10m = screen.getByLabelText("Set timer to 10m");
    fireEvent.click(preset10m);

    const stored = localStorage.getItem("focusboard-visualtimer-last");
    expect(stored).toBe("600"); // 10 minutes in seconds
  });

  it("renders SVG timer ring", () => {
    render(<VisualTimerWidget />);
    const svg = screen.getByRole("img", { name: /Timer/i });
    expect(svg).toBeInTheDocument();
  });

  it("dispatches completion event when timer finishes", () => {
    const handler = vi.fn();
    document.addEventListener("focusboard:timer-complete", handler);

    render(<VisualTimerWidget />);
    const preset5m = screen.getByLabelText("Set timer to 5m");
    fireEvent.click(preset5m);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
    });

    expect(handler).toHaveBeenCalled();

    document.removeEventListener("focusboard:timer-complete", handler);
  });
});
