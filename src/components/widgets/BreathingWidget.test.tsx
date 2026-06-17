import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BreathingWidget } from "./BreathingWidget";

describe("BreathingWidget", () => {
  it("renders with pattern choices when idle", () => {
    render(<BreathingWidget />);
    
    // Shows title/state label
    expect(screen.getByText("Ready to Begin")).toBeInTheDocument();
    
    // Pattern choices
    expect(screen.getByRole("button", { name: /Box/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Equal/i })).toBeInTheDocument();
  });

  it("changes patterns and starts the session", () => {
    vi.useFakeTimers();
    render(<BreathingWidget />);
    
    // Switch to Calm breathing (4-7-8)
    const calmBtn = screen.getByRole("button", { name: /Calm/i });
    fireEvent.click(calmBtn);
    
    // Start session
    const startBtn = screen.getByRole("button", { name: "Start breathing exercise" });
    fireEvent.click(startBtn);
    
    // Now in "Breathe In" phase
    expect(screen.getByText(/Breathe In/i)).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument(); // 4 seconds remaining
    
    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("3")).toBeInTheDocument();

    // Advance timer to 4 seconds to trigger hold phase transition
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/Hold\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument(); // 7 seconds hold duration

    // Stop session
    const stopBtn = screen.getByRole("button", { name: "Stop breathing exercise" });
    fireEvent.click(stopBtn);
    
    expect(screen.getByText("Ready to Begin")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
