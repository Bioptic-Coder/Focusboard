import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CalculatorWidget } from "./CalculatorWidget";

describe("CalculatorWidget", () => {
  it("renders display default to 0 and all buttons", () => {
    render(<CalculatorWidget />);
    
    // Display screen should start with "0"
    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^0$/);
    
    // Check key buttons
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear calculator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Equals" })).toBeInTheDocument();
  });

  it("handles basic addition correctly", () => {
    render(<CalculatorWidget />);
    
    const key5 = screen.getByRole("button", { name: "5" });
    const keyPlus = screen.getByRole("button", { name: "Add" });
    const key7 = screen.getByRole("button", { name: "7" });
    const keyEqual = screen.getByRole("button", { name: "Equals" });

    // 5 + 7 = 12
    fireEvent.click(key5);
    fireEvent.click(keyPlus);
    fireEvent.click(key7);
    fireEvent.click(keyEqual);

    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^12$/);
  });

  it("handles division by zero by outputting Error", () => {
    render(<CalculatorWidget />);
    
    const key8 = screen.getByRole("button", { name: "8" });
    const keyDiv = screen.getByRole("button", { name: "Divide" });
    const key0 = screen.getByRole("button", { name: "0" });
    const keyEqual = screen.getByRole("button", { name: "Equals" });

    // 8 ÷ 0 = Error
    fireEvent.click(key8);
    fireEvent.click(keyDiv);
    fireEvent.click(key0);
    fireEvent.click(keyEqual);

    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^Error$/);
  });

  it("clears input when C is clicked", () => {
    render(<CalculatorWidget />);
    
    const key9 = screen.getByRole("button", { name: "9" });
    const keyC = screen.getByRole("button", { name: "Clear calculator" });

    fireEvent.click(key9);
    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^9$/);
    
    fireEvent.click(keyC);
    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^0$/);
  });

  it("handles decimal numbers", () => {
    render(<CalculatorWidget />);
    
    const key3 = screen.getByRole("button", { name: "3" });
    const keyDot = screen.getByRole("button", { name: "Decimal point" });
    const key2 = screen.getByRole("button", { name: "2" });

    fireEvent.click(key3);
    fireEvent.click(keyDot);
    fireEvent.click(key2);

    expect(screen.getByTestId("calc-display")).toHaveTextContent(/^3.2$/);
  });
});
