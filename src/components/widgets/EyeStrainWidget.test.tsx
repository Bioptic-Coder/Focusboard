import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EyeStrainWidget } from "./EyeStrainWidget";

describe("EyeStrainWidget", () => {
  it("renders with initial 20-minute countdown", () => {
    render(<EyeStrainWidget editMode={false} />);
    
    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(screen.getByText(/Eye Break Timer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause Eye Timer" })).toBeInTheDocument();
  });

  it("decrements time and pauses/resumes", () => {
    vi.useFakeTimers();
    render(<EyeStrainWidget editMode={false} />);
    
    // Initial decrement
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("19:58")).toBeInTheDocument();
    
    // Pause timer
    const pauseBtn = screen.getByRole("button", { name: "Pause Eye Timer" });
    fireEvent.click(pauseBtn);
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("19:58")).toBeInTheDocument(); // Unchanged
    
    // Resume
    const startBtn = screen.getByRole("button", { name: "Start Eye Timer" });
    fireEvent.click(startBtn);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("19:57")).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it("exposes break manual test triggers and skips in edit mode", () => {
    const { rerender } = render(<EyeStrainWidget editMode={false} />);
    
    // Test button should not be rendered in idle mode
    expect(screen.queryByTitle(/Immediately trigger the 20-second rest break to test it/i)).not.toBeInTheDocument();

    // Rerender with editMode
    rerender(<EyeStrainWidget editMode={true} />);
    
    const testBtn = screen.getByRole("button", { name: /Test 20s Break/i });
    expect(testBtn).toBeInTheDocument();

    // Trigger break
    fireEvent.click(testBtn);
    
    // Check overlay
    expect(screen.getByText("Look 20 feet away!")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument(); // 20 seconds break countdown
    
    // Skip break should be visible in editMode
    const skipBtn = screen.getByRole("button", { name: "Skip Break" });
    expect(skipBtn).toBeInTheDocument();
    
    fireEvent.click(skipBtn);
    expect(screen.queryByText("Look 20 feet away!")).not.toBeInTheDocument();
  });
});
