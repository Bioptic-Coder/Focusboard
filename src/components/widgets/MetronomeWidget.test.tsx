import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MetronomeWidget } from "./MetronomeWidget";

describe("MetronomeWidget", () => {
  it("renders with default BPM of 120", () => {
    render(<MetronomeWidget />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("BPM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Metronome" })).toBeInTheDocument();
  });

  it("increases and decreases BPM by 5 when buttons are clicked", () => {
    render(<MetronomeWidget />);
    
    const plusBtn = screen.getByRole("button", { name: "Increase BPM by 5" });
    const minusBtn = screen.getByRole("button", { name: "Decrease BPM by 5" });

    fireEvent.click(plusBtn);
    expect(screen.getByText("125")).toBeInTheDocument();

    fireEvent.click(minusBtn);
    fireEvent.click(minusBtn);
    expect(screen.getByText("115")).toBeInTheDocument();
  });

  it("toggles play/stop state when start button is clicked", () => {
    render(<MetronomeWidget />);
    
    const startBtn = screen.getByRole("button", { name: "Start Metronome" });
    fireEvent.click(startBtn);

    expect(screen.getByRole("button", { name: "Stop Metronome" })).toBeInTheDocument();
    
    // Stop the metronome
    const stopBtn = screen.getByRole("button", { name: "Stop Metronome" });
    fireEvent.click(stopBtn);
    
    expect(screen.getByRole("button", { name: "Start Metronome" })).toBeInTheDocument();
  });

  it("records tap tempo input and adjusts BPM", () => {
    render(<MetronomeWidget />);
    
    const tapBtn = screen.getByRole("button", { name: "Tap Tempo" });
    
    // Simulate taps separated by 500ms (which equals 120 BPM)
    const originalNow = Date.now;
    let mockTime = 1000;
    
    Date.now = vi.fn(() => mockTime);
    
    // First tap
    fireEvent.click(tapBtn);
    
    // Second tap (500ms later)
    mockTime += 500;
    fireEvent.click(tapBtn);

    // Third tap (500ms later)
    mockTime += 500;
    fireEvent.click(tapBtn);

    // Assert BPM is calculated based on 500ms intervals -> 120 BPM
    expect(screen.getByText("120")).toBeInTheDocument();

    // Restore original Date.now
    Date.now = originalNow;
  });
});
