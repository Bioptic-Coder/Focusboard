import "@testing-library/jest-dom";

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

// Mock window.confirm
window.confirm = () => true;
