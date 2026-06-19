import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import App from "./App";
import { FocusCoordinatorProvider } from "./context/FocusCoordinatorContext";

describe("App Coordinator Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts and renders the default widgets layout", () => {
    render(
      <FocusCoordinatorProvider>
        <App />
      </FocusCoordinatorProvider>
    );

    // Header title
    expect(screen.getByText("Focusboard")).toBeInTheDocument();

    // Default widgets headers should be visible
    expect(screen.getByText("Desk Clock")).toBeInTheDocument();
    expect(screen.getByText("Calendar Date")).toBeInTheDocument();
    expect(screen.getByText("Desk Timer")).toBeInTheDocument();
    expect(screen.getByText("Stopwatch")).toBeInTheDocument();
    expect(screen.getByText("Scratchpad")).toBeInTheDocument();
  });

  it("opens the settings panel when the settings cog is clicked", () => {
    render(
      <FocusCoordinatorProvider>
        <App />
      </FocusCoordinatorProvider>
    );

    const settingsBtn = screen.getByRole("button", { name: "Open Accessibility Settings" });
    fireEvent.click(settingsBtn);

    // Settings panel should now be visible
    expect(screen.getByText("Accessibility Settings")).toBeInTheDocument();
  });

  it("toggles edit mode when clicking the edit button", () => {
    render(
      <FocusCoordinatorProvider>
        <App />
      </FocusCoordinatorProvider>
    );

    // Should not show Edit Mode bar initially
    expect(screen.queryByText(/Edit Mode: Add Widgets/i)).not.toBeInTheDocument();

    const editBtn = screen.getByRole("button", { name: /Toggle Dashboard Edit Mode/i });
    fireEvent.click(editBtn);

    // Edit bar should now be visible and display widget addition tools
    expect(screen.getByText(/Edit Mode: Add Widgets/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Clock/i })).toBeInTheDocument();
  });
});
