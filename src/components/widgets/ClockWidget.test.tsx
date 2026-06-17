import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ClockWidget } from "./ClockWidget";

describe("ClockWidget", () => {
  it("renders the current time", () => {
    render(<ClockWidget editMode={false} />);
    
    // Time digits should exist (hours and minutes separated by colon)
    const colons = screen.getAllByText(":");
    expect(colons[0]).toBeInTheDocument();
  });

  it("hides configuration toggles when editMode is false", () => {
    render(<ClockWidget editMode={false} />);
    
    expect(screen.queryByRole("button", { name: /12H Mode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /24H Mode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show Sec/i })).not.toBeInTheDocument();
  });

  it("shows configuration toggles when editMode is true", () => {
    render(<ClockWidget editMode={true} />);
    
    expect(screen.getByRole("button", { name: /Mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sec/i })).toBeInTheDocument();
  });

  it("toggles between 12-hour and 24-hour modes", () => {
    // Clear storage before test
    localStorage.clear();
    
    render(<ClockWidget editMode={true} />);
    
    const modeBtn = screen.getByRole("button", { name: /Mode/i });
    
    // Toggle to 24h
    fireEvent.click(modeBtn);
    expect(localStorage.getItem("clock-is24h")).toBe("true");

    // Toggle back to 12h
    fireEvent.click(modeBtn);
    expect(localStorage.getItem("clock-is24h")).toBe("false");
  });
});
