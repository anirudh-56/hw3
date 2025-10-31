// tests/setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// ---- Force emulator mode for tests (matches firebase.ts logic) ----
process.env.VITE_FB_USE_EMULATORS = "1";

// ---- <dialog> polyfill ----
if (typeof HTMLDialogElement !== "undefined") {
  const p = HTMLDialogElement.prototype as any;
  p.show ??= function () {
    this.open = true;
  };
  p.showModal ??= function () {
    this.open = true;
  };
  p.close ??= function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

// ---- Stub window.location.assign so tests can assert redirects ----
Object.defineProperty(window, "location", {
  value: { ...window.location, assign: vi.fn() },
});

// ---- Quiet a common JSDOM warning ----
const origErr = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Not implemented: navigation")
  )
    return;
  origErr(...args);
};

// ---- Polyfill ResizeObserver (react-window relies on it) ----
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || RO;

// ---- Give elements a stable size in JSDOM so virtualization doesn't bail ----
const gbcr = HTMLElement.prototype.getBoundingClientRect;
HTMLElement.prototype.getBoundingClientRect = function () {
  const rect = gbcr ? gbcr.call(this) : ({} as DOMRect);
  const w = (rect && rect.width) || 800;
  const h = (rect && rect.height) || 600;
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: w,
    bottom: h,
    width: w,
    height: h,
    toJSON() {
      return this as any;
    },
  } as DOMRect;
};
