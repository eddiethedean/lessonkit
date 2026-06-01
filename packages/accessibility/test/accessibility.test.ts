import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRovingTabIndex,
  focusFirst,
  getFocusableElements,
  getReducedMotionPreference,
  prefersReducedMotion,
  shouldAnimate,
  trapFocus,
  visuallyHiddenStyle,
} from "../src";

describe("@lessonkit/accessibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefersReducedMotion returns false when matchMedia is missing", () => {
    vi.stubGlobal("window", {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it("prefersReducedMotion reflects matchMedia result", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    expect(prefersReducedMotion()).toBe(true);
  });

  it("getReducedMotionPreference returns unknown when matchMedia missing", () => {
    vi.stubGlobal("window", {});
    expect(getReducedMotionPreference()).toBe("unknown");
  });

  it("getReducedMotionPreference returns no-preference when motion is allowed", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
    });
    expect(getReducedMotionPreference()).toBe("no-preference");
    expect(prefersReducedMotion()).toBe(false);
    expect(shouldAnimate()).toBe(true);
  });

  it("shouldAnimate returns false when prefers reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
    });
    expect(shouldAnimate()).toBe(false);
  });

  it("shouldAnimate defaults to true when preference is unknown", () => {
    vi.stubGlobal("window", {});
    expect(shouldAnimate()).toBe(true);
    expect(shouldAnimate({ default: false })).toBe(false);
  });

  it("focusFirst returns false for null container", () => {
    expect(focusFirst(null)).toBe(false);
  });

  it("focusFirst returns false when no focusable element exists", () => {
    const container = { querySelector: () => null };
    expect(focusFirst(container)).toBe(false);
  });

  it("visuallyHiddenStyle clips content for screen readers only", () => {
    expect(visuallyHiddenStyle.position).toBe("absolute");
    expect(visuallyHiddenStyle.overflow).toBe("hidden");
  });

  it("focusFirst focuses first matching element", () => {
    const focus = vi.fn();
    const container = {
      querySelector: <T,>(_sel: string) => ({ focus }) as unknown as T,
    };
    expect(focusFirst(container)).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("getFocusableElements returns focusable descendants", () => {
    document.body.innerHTML = `
      <div id="c">
        <button id="a">A</button>
        <button id="b" disabled>B</button>
        <a id="c1" href="#x">link</a>
      </div>
    `;
    const container = document.getElementById("c")!;
    const els = getFocusableElements(container);
    expect(els.map((e) => e.id)).toEqual(["a", "c1"]);
  });

  it("trapFocus cycles Tab within container and restores focus on deactivate", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;

    outside.focus();
    expect(document.activeElement).toBe(outside);

    const trap = trapFocus(modal, { initialFocus: "first", restoreFocus: true });
    trap.activate();
    expect(document.activeElement).toBe(first);

    last.focus();
    expect(document.activeElement).toBe(last);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(first);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);

    trap.deactivate();
    expect(document.activeElement).toBe(outside);
  });

  it("trapFocus focuses an explicitly requested initialFocus element", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const b = document.getElementById("b") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: b });
    trap.activate();
    expect(document.activeElement).toBe(b);
    trap.deactivate();
  });

  it("trapFocus allows outside clicks when allowOutsideClick=true", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const trap = trapFocus(modal, { allowOutsideClick: true, initialFocus: "first" });
    trap.activate();

    const ev = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "target", { value: outside });
    outside.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    trap.deactivate();
  });

  it("trapFocus focuses container when no focusable descendants", () => {
    document.body.innerHTML = `<div id="modal" tabindex="-1"></div>`;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const focusSpy = vi.spyOn(modal, "focus");
    const trap = trapFocus(modal);
    trap.activate();
    expect(focusSpy).toHaveBeenCalled();

    // Tab with no focusables keeps focus inside container.
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);

    trap.deactivate();
  });

  it("trapFocus re-focuses inside container on focusin outside", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    outside.focus();
    // focusin should immediately redirect focus to first focusable in modal
    const ev = new FocusEvent("focusin", { bubbles: true });
    Object.defineProperty(ev, "target", { value: outside });
    document.dispatchEvent(ev);
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it("trapFocus ignores non-Tab keys and no-ops when deactivated", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    // Non-Tab key should not prevent default.
    const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(false);

    trap.deactivate();
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });

  it("trapFocus Tab cycles back to last when focus is outside container", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;

    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();
    expect(document.activeElement).toBe(first);

    outside.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);
    trap.deactivate();
  });

  it("createRovingTabIndex moves active index with arrows and home/end", () => {
    const r = createRovingTabIndex({ itemCount: 3, orientation: "both", loop: true, initialIndex: 1 });
    expect(r.getItemProps(1).tabIndex).toBe(0);
    expect(r.getItemProps(0).tabIndex).toBe(-1);

    r.getItemProps(1).onKeyDown({ key: "ArrowRight", preventDefault: () => {} });
    expect(r.activeIndex).toBe(2);

    r.getItemProps(2).onKeyDown({ key: "ArrowRight", preventDefault: () => {} });
    expect(r.activeIndex).toBe(0);

    r.getItemProps(0).onKeyDown({ key: "End", preventDefault: () => {} });
    expect(r.activeIndex).toBe(2);

    r.getItemProps(2).onKeyDown({ key: "Home", preventDefault: () => {} });
    expect(r.activeIndex).toBe(0);

    r.getItemProps(0).onKeyDown({ key: "ArrowLeft", preventDefault: () => {} });
    expect(r.activeIndex).toBe(2);

    r.getItemProps(2).onKeyDown({ key: "ArrowUp", preventDefault: () => {} });
    expect(r.activeIndex).toBe(1);
  });

  it("createRovingTabIndex respects orientation and non-looping bounds", () => {
    const r = createRovingTabIndex({ itemCount: 2, orientation: "vertical", loop: false, initialIndex: 0 });
    r.getItemProps(0).onKeyDown({ key: "ArrowRight", preventDefault: () => {} });
    expect(r.activeIndex).toBe(0);

    r.getItemProps(0).onKeyDown({ key: "ArrowDown", preventDefault: () => {} });
    expect(r.activeIndex).toBe(1);

    r.getItemProps(1).onKeyDown({ key: "ArrowDown", preventDefault: () => {} });
    expect(r.activeIndex).toBe(1);
  });

  it("createRovingTabIndex ignores arrows for disallowed orientation branches", () => {
    const horizontal = createRovingTabIndex({ itemCount: 2, orientation: "horizontal", initialIndex: 0 });
    horizontal.getItemProps(0).onKeyDown({ key: "ArrowUp", preventDefault: () => {} });
    expect(horizontal.activeIndex).toBe(0);
    horizontal.getItemProps(0).onKeyDown({ key: "ArrowDown", preventDefault: () => {} });
    expect(horizontal.activeIndex).toBe(0);

    const vertical = createRovingTabIndex({ itemCount: 2, orientation: "vertical", initialIndex: 0 });
    vertical.getItemProps(0).onKeyDown({ key: "ArrowLeft", preventDefault: () => {} });
    expect(vertical.activeIndex).toBe(0);
  });

  it("createRovingTabIndex supports getId and onFocus updates active", () => {
    const r = createRovingTabIndex({ itemCount: 2, getId: (i) => `item-${i}`, initialIndex: 0 });
    expect(r.getItemProps(0).id).toBe("item-0");
    expect(r.getItemProps(1).id).toBe("item-1");
    r.getItemProps(1).onFocus();
    expect(r.activeIndex).toBe(1);
  });

  it("createRovingTabIndex clamps initialIndex and setActiveIndex", () => {
    const r = createRovingTabIndex({ itemCount: 2, loop: false, initialIndex: 999 });
    expect(r.activeIndex).toBe(1);
    r.setActiveIndex(-5);
    expect(r.activeIndex).toBe(0);
  });

  it("createRovingTabIndex is safe when itemCount=0", () => {
    const r = createRovingTabIndex({ itemCount: 0 });
    expect(r.activeIndex).toBe(0);
    expect(() => r.getItemProps(0).onKeyDown({ key: "Home", preventDefault: () => {} })).not.toThrow();
  });

  it("trapFocus prevents outside click by default", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    const ev = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "target", { value: outside });
    outside.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    trap.deactivate();
  });

  it("trapFocus ignores inside clicks and non-element mousedown targets", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    const inside = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(inside, "target", { value: first });
    first.dispatchEvent(inside);
    expect(inside.defaultPrevented).toBe(false);

    const nonElement = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(nonElement, "target", { value: document });
    document.dispatchEvent(nonElement);
    expect(nonElement.defaultPrevented).toBe(false);

    trap.deactivate();
  });

  it("trapFocus no-ops on repeated activate/deactivate and skips restore when disabled", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;

    outside.focus();
    const trap = trapFocus(modal, { initialFocus: "first", restoreFocus: false });
    trap.activate();
    trap.activate();
    expect(document.activeElement).toBe(first);

    trap.deactivate();
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it("trapFocus Tab wraps forward when focus is outside container", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;

    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();
    outside.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it("trapFocus ignores Tab when inactive or focus is between endpoints", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const middle = document.getElementById("middle") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    middle.focus();
    const shiftTab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(false);

    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);

    trap.deactivate();
    const inactiveTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(inactiveTab);
    expect(inactiveTab.defaultPrevented).toBe(false);
  });

  it("trapFocus shift+Tab from first focusable wraps to last", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
        <button id="last">Last</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const last = document.getElementById("last") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();
    expect(document.activeElement).toBe(first);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
    expect(document.activeElement).toBe(last);
    trap.deactivate();
  });

  it("trapFocus redirects focusin to container when no focusables exist", () => {
    document.body.innerHTML = `<div id="modal" tabindex="-1"></div><button id="outside">Outside</button>`;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const focusSpy = vi.spyOn(modal, "focus");
    const trap = trapFocus(modal);
    trap.activate();

    outside.focus();
    const ev = new FocusEvent("focusin", { bubbles: true });
    Object.defineProperty(ev, "target", { value: outside });
    document.dispatchEvent(ev);
    expect(focusSpy).toHaveBeenCalled();
    trap.deactivate();
  });

  it("trapFocus ignores focusin and mousedown after deactivate", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();
    trap.deactivate();

    const focusEv = new FocusEvent("focusin", { bubbles: true });
    Object.defineProperty(focusEv, "target", { value: outside });
    document.dispatchEvent(focusEv);

    const mouseEv = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(mouseEv, "target", { value: outside });
    outside.dispatchEvent(mouseEv);
    expect(mouseEv.defaultPrevented).toBe(false);
  });

  it("trapFocus skips invalid initialFocus values", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: {} as unknown as HTMLElement });
    trap.activate();
    expect(document.activeElement).not.toBe(first);
    trap.deactivate();
  });

  it("trapFocus ignores focusin events with non-element targets", () => {
    document.body.innerHTML = `
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const first = document.getElementById("first") as HTMLButtonElement;
    const trap = trapFocus(modal, { initialFocus: "first" });
    trap.activate();

    const ev = new FocusEvent("focusin", { bubbles: true });
    Object.defineProperty(ev, "target", { value: document });
    document.dispatchEvent(ev);
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it("trapFocus handlers no-op when inactive", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="modal">
        <button id="first">First</button>
      </div>
    `;
    const outside = document.getElementById("outside") as HTMLButtonElement;
    const modal = document.getElementById("modal") as HTMLDivElement;
    const handlers = new Map<string, EventListener>();
    const addListener = document.addEventListener.bind(document);
    vi.spyOn(document, "addEventListener").mockImplementation((type, listener, options) => {
      handlers.set(type, listener as EventListener);
      addListener(type, listener as EventListener, options);
    });

    const trap = trapFocus(modal, { initialFocus: "first", allowOutsideClick: false });
    trap.activate();

    const nonTab = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.dispatchEvent(nonTab);
    expect(nonTab.defaultPrevented).toBe(false);

    trap.deactivate();

    handlers.get("keydown")?.call(document, new KeyboardEvent("keydown", { key: "Tab" }));
    const focusEv = new FocusEvent("focusin", { bubbles: true });
    Object.defineProperty(focusEv, "target", { value: outside });
    handlers.get("focusin")?.call(document, focusEv);
    const outsideClick = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    Object.defineProperty(outsideClick, "target", { value: outside });
    handlers.get("mousedown")?.call(document, outsideClick);
    expect(outsideClick.defaultPrevented).toBe(false);
  });
});
