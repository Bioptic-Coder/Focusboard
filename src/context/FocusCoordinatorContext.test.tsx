import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FocusCoordinatorProvider,
  useFocusCoordinator,
  CHIME_DESCRIPTIONS
} from "./FocusCoordinatorContext";

// Unmock context for this unit test file
vi.mock("./FocusCoordinatorContext", async (importOriginal) => {
  return await importOriginal<typeof import("./FocusCoordinatorContext")>();
});

const TestComponent: React.FC = () => {
  const { caption, queueSpeak, playChime, queueAlert, activeAlert, dismissActiveAlert, skipActiveAlert } = useFocusCoordinator();
  return (
    <div>
      <div data-testid="caption-val">{caption || "no-caption"}</div>
      <button onClick={() => queueSpeak("Test speech announcement")} data-testid="btn-speak">Speak</button>
      <button onClick={() => playChime("cue")} data-testid="btn-play-cue">Play Cue</button>
      <button onClick={() => playChime("timerAlarm")} data-testid="btn-play-timer">Play Timer</button>
      <button
        onClick={() =>
          queueAlert({
            type: "timer",
            duration: 10,
            speakText: "Alert is active",
            chimeType: "timerAlarm"
          })
        }
        data-testid="btn-queue-alert"
      >
        Queue Alert
      </button>
      {activeAlert && (
        <div>
          <span data-testid="active-alert-title">{activeAlert.type}</span>
          <button onClick={dismissActiveAlert} data-testid="btn-dismiss">Dismiss</button>
          <button onClick={skipActiveAlert} data-testid="btn-skip">Skip</button>
        </div>
      )}
    </div>
  );
};

describe("FocusCoordinator Caption System", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates caption when queueSpeak is called and renders the high-contrast toast", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    // Initial state
    expect(screen.getByTestId("caption-val")).toHaveTextContent("no-caption");
    expect(screen.queryByTestId("visual-caption-toast")).not.toBeInTheDocument();

    // Trigger speak
    act(() => {
      screen.getByTestId("btn-speak").click();
    });

    expect(screen.getByTestId("caption-val")).toHaveTextContent("Test speech announcement");
    expect(screen.getByTestId("visual-caption-toast")).toBeInTheDocument();
    expect(screen.getByTestId("visual-caption-toast")).toHaveTextContent("Test speech announcement");
  });

  it("updates caption to friendly readable text when playChime is called", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    act(() => {
      screen.getByTestId("btn-play-cue").click();
    });

    const expectedDescription = CHIME_DESCRIPTIONS["cue"];
    expect(screen.getByTestId("caption-val")).toHaveTextContent(expectedDescription);
    expect(screen.getByTestId("visual-caption-toast")).toHaveTextContent(expectedDescription);
  });

  it("combines chime description and spoken text if triggered back-to-back", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    // Trigger chime first, then immediately speak
    act(() => {
      screen.getByTestId("btn-play-cue").click();
    });
    act(() => {
      screen.getByTestId("btn-speak").click();
    });

    const expectedDescription = CHIME_DESCRIPTIONS["cue"];
    expect(screen.getByTestId("caption-val")).toHaveTextContent(
      `${expectedDescription} Test speech announcement`
    );
  });

  it("clears the caption toast automatically after 3.5 seconds", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    act(() => {
      screen.getByTestId("btn-speak").click();
    });
    expect(screen.getByTestId("visual-caption-toast")).toBeInTheDocument();

    // Advance 3.4 seconds (should still be visible)
    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(screen.getByTestId("visual-caption-toast")).toBeInTheDocument();

    // Advance to 3.5 seconds (should be cleared)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId("visual-caption-toast")).not.toBeInTheDocument();
  });

  it("clears caption when the alert is dismissed", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    // Queue alert
    act(() => {
      screen.getByTestId("btn-queue-alert").click();
    });

    // Flush pending hooks/renders
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("active-alert-title")).toHaveTextContent("timer");
    expect(screen.getByTestId("visual-caption-toast")).toBeInTheDocument();

    // Dismiss alert
    act(() => {
      screen.getByTestId("btn-dismiss").click();
    });

    // Flush pending hooks/renders
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByTestId("visual-caption-toast")).not.toBeInTheDocument();
    expect(screen.queryByTestId("active-alert-title")).not.toBeInTheDocument();
  });

  it("clears caption when the alert is skipped", () => {
    render(
      <FocusCoordinatorProvider>
        <TestComponent />
      </FocusCoordinatorProvider>
    );

    // Queue alert
    act(() => {
      screen.getByTestId("btn-queue-alert").click();
    });

    // Flush pending hooks/renders
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("visual-caption-toast")).toBeInTheDocument();

    // Skip alert
    act(() => {
      screen.getByTestId("btn-skip").click();
    });

    // Flush pending hooks/renders
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByTestId("visual-caption-toast")).not.toBeInTheDocument();
  });
});
