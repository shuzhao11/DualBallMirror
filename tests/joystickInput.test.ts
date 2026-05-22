import { describe, it, expect, vi } from 'vitest';
import { JoystickInput } from '../src/input/JoystickInput';
import { Viewport } from '../src/core/Viewport';

const vp = new Viewport(720, 1280, 1);   // 1:1 同分辨率

function makeFakeCanvas() {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  return {
    addEventListener:    (t: string, h: any) => { (listeners[t] ??= []).push(h); },
    removeEventListener: (t: string, h: any) => {
      listeners[t] = (listeners[t] || []).filter(x => x !== h);
    },
    fire(type: string, e: any) { (listeners[type] || []).forEach(h => h(e)); },
    listenerCount(type: string) { return (listeners[type] || []).length; },
  };
}

describe('JoystickInput (floating)', () => {
  it('is invisible and inactive before any touch', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    expect(js.isActive()).toBe(false);
    expect(js.isVisible()).toBe(false);
    expect(js.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('touchstart at (200, 900) makes base appear at (200, 900) and becomes active+visible', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    expect(js.isActive()).toBe(true);
    expect(js.isVisible()).toBe(true);
    const base = js.getBasePos();
    expect(base.x).toBeCloseTo(200, 1);
    expect(base.y).toBeCloseTo(900, 1);
  });

  it('touchend hides joystick and zeros direction', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    canvas.fire('touchmove',  { changedTouches: [{ identifier: 1, clientX: 260, clientY: 900 }] });
    canvas.fire('touchend',   { changedTouches: [{ identifier: 1 }] });
    expect(js.isActive()).toBe(false);
    expect(js.isVisible()).toBe(false);
    expect(js.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('second touch is ignored while first is active (single-finger joystick)', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    const base1 = js.getBasePos();
    canvas.fire('touchstart', { changedTouches: [{ identifier: 2, clientX: 500, clientY: 500 }] });
    const base2 = js.getBasePos();
    expect(base2.x).toBe(base1.x);
    expect(base2.y).toBe(base1.y);
  });

  it('long-press 1.5s without significant move triggers reset', () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, onReset);
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    vi.advanceTimersByTime(1500);
    expect(onReset).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('destroy removes all listeners', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    js.destroy();
    expect(canvas.listenerCount('touchstart')).toBe(0);
    expect(canvas.listenerCount('touchmove')).toBe(0);
    expect(canvas.listenerCount('touchend')).toBe(0);
    expect(canvas.listenerCount('touchcancel')).toBe(0);
  });
});
