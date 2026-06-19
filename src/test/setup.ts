import "@testing-library/jest-dom";

// Mock localStorage for jsdom testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock Web Audio API for jsdom testing
class MockAudioContext {
  currentTime = 0;
  destination = {};
  
  createOscillator() {
    return {
      connect: () => {},
      frequency: {
        setValueAtTime: () => {},
      },
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    };
  }

  close() {
    return Promise.resolve();
  }
}

window.AudioContext = MockAudioContext as any;
(window as any).webkitAudioContext = MockAudioContext;

window.confirm = () => true;

import { vi, beforeEach } from "vitest";

const mockQueueAlert = vi.fn();
const mockQueueSpeak = vi.fn();
const mockPlayChime = vi.fn();
const mockDismissActiveAlert = vi.fn();

beforeEach(() => {
  mockQueueAlert.mockReset();
  mockQueueSpeak.mockReset();
  mockPlayChime.mockReset();
  mockDismissActiveAlert.mockReset();
});

// Mock FocusCoordinatorContext globally for unit tests
vi.mock("../context/FocusCoordinatorContext", () => {
  return {
    useFocusCoordinator: () => ({
      queueAlert: mockQueueAlert,
      activeAlert: null,
      queueSpeak: mockQueueSpeak,
      playChime: mockPlayChime,
      dismissActiveAlert: mockDismissActiveAlert,
    }),
    FocusCoordinatorProvider: ({ children }: any) => children,
  };
});

