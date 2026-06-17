import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WorldClockWidget } from "./WorldClockWidget";

describe("WorldClockWidget", () => {
  it("renders Local Time and default configured zones", () => {
    render(<WorldClockWidget editMode={false} />);
    
    expect(screen.getByText("Local Time")).toBeInTheDocument();
    expect(screen.getByText("System Local")).toBeInTheDocument();
    
    // Default zones are New York and London
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("renders offset comparison slider and allows adjustment", () => {
    render(<WorldClockWidget editMode={false} />);
    
    const slider = screen.getByLabelText("Time Comparison Offset Slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue("0");

    // Change slider offset value
    fireEvent.change(slider, { target: { value: "3" } });
    expect(slider).toHaveValue("3");
    
    // Check for resetting state
    const resetBtn = screen.getByRole("button", { name: "Reset timezone comparison to current time" });
    expect(resetBtn).toBeInTheDocument();
    
    fireEvent.click(resetBtn);
    expect(slider).toHaveValue("0");
  });

  it("exposes timezone selection dropdowns only in editMode", () => {
    const { rerender } = render(<WorldClockWidget editMode={false} />);
    
    // Should NOT show select dropdowns
    expect(screen.queryByLabelText("Select Timezone A")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select Timezone B")).not.toBeInTheDocument();

    // Enable edit mode
    rerender(<WorldClockWidget editMode={true} />);

    // Should now show select dropdowns
    expect(screen.getByLabelText("Select Timezone A")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Timezone B")).toBeInTheDocument();
  });
});
