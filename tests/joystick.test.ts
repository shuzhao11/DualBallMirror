// tests/joystick.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDirection } from '../src/input/JoystickLogic';

describe('JoystickLogic', () => {
  it('returns zero vector when below deadzone', () => {
    // radius=60, deadzone=0.15 → threshold=9px; magnitude ~5.8 < 9
    const dir = calculateDirection({ x: 4, y: 4 }, 60, 0.15);
    expect(dir.x).toBe(0);
    expect(dir.y).toBe(0);
  });

  it('returns normalized x-direction when dragged right', () => {
    const dir = calculateDirection({ x: 60, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBe(0);
  });

  it('clamps magnitude to 1 when delta exceeds radius', () => {
    const dir = calculateDirection({ x: 200, y: 0 }, 60, 0.15);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it('flips Y so upward screen drag (negative canvas Y) gives positive logic Y', () => {
    // User drags up on screen → delta.y is negative in canvas coordinates
    const dir = calculateDirection({ x: 0, y: -60 }, 60, 0.15);
    expect(dir.y).toBeCloseTo(1, 5);   // Logic Y-up = positive
    expect(dir.x).toBe(0);
  });

  it('diagonal direction has both components and magnitude <= 1', () => {
    const dir = calculateDirection({ x: 45, y: -45 }, 60, 0.15);
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.y).toBeGreaterThan(0);  // Y flipped -> positive
    expect(Math.hypot(dir.x, dir.y)).toBeLessThanOrEqual(1 + 1e-9);
  });
});
