import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsPanel, type AppSettings } from "./SettingsPanel";

const mockSettings: AppSettings = {
  theme: "glass",
  zoom: 120,
  focusWidth: 3,
  focusStyle: "dashed",
  focusColor: "#f59e0b",
  einkMode: false,
};

describe("SettingsPanel Integration", () => {
  it("renders settings sections when open", () => {
    const mockOnClose = vi.fn();
    render(
      <SettingsPanel
        settings={mockSettings}
        onChange={vi.fn()}
        isOpen={true}
        onClose={mockOnClose}
        editMode={false}
        onToggleEditMode={vi.fn()}
        onResetLayout={vi.fn()}
        onImportLayout={vi.fn()}
        currentLayoutJson="[]"
      />
    );

    expect(screen.getByText("Accessibility Settings")).toBeInTheDocument();
    expect(screen.getByText("Interface Sizing")).toBeInTheDocument();
    expect(screen.getByText("Contrast Theme")).toBeInTheDocument();
    expect(screen.getByText("Focus Ring Thickness")).toBeInTheDocument();
  });

  it("triggers onChange with updated theme when a contrast button is clicked", () => {
    const mockOnChange = vi.fn();
    render(
      <SettingsPanel
        settings={mockSettings}
        onChange={mockOnChange}
        isOpen={true}
        onClose={vi.fn()}
        editMode={false}
        onToggleEditMode={vi.fn()}
        onResetLayout={vi.fn()}
        onImportLayout={vi.fn()}
        currentLayoutJson="[]"
      />
    );

    const hcDarkBtn = screen.getByRole("button", { name: /High Contrast Dark/i });
    fireEvent.click(hcDarkBtn);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      theme: "hc-dark",
    });
  });

  it("triggers onChange with updated zoom when increase/decrease buttons are clicked", () => {
    const mockOnChange = vi.fn();
    render(
      <SettingsPanel
        settings={mockSettings}
        onChange={mockOnChange}
        isOpen={true}
        onClose={vi.fn()}
        editMode={false}
        onToggleEditMode={vi.fn()}
        onResetLayout={vi.fn()}
        onImportLayout={vi.fn()}
        currentLayoutJson="[]"
      />
    );

    const zoomUpBtn = screen.getByRole("button", { name: "Increase Zoom Size" });
    fireEvent.click(zoomUpBtn);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      zoom: 130, // 120 + 10
    });
  });

  it("triggers onChange with updated einkMode when the eink button is clicked", () => {
    const mockOnChange = vi.fn();
    render(
      <SettingsPanel
        settings={mockSettings}
        onChange={mockOnChange}
        isOpen={true}
        onClose={vi.fn()}
        editMode={false}
        onToggleEditMode={vi.fn()}
        onResetLayout={vi.fn()}
        onImportLayout={vi.fn()}
        currentLayoutJson="[]"
      />
    );

    const einkBtn = screen.getByRole("button", { name: /E-ink Screen Friendly Mode/i });
    fireEvent.click(einkBtn);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockSettings,
      einkMode: true,
    });
  });
});
