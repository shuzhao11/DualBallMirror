import { describe, it, expect } from 'vitest';
import { calculateDirection } from '../src/input/JoystickLogic';

describe('JoystickLogic (deadzone re-mapping)', () => {
  it('returns zero when below deadzone', () => {
    const dir = calculateDirection({ x: 4, y: 4 }, 60, 0.15);
    expect(dir.x).toBe(0);
    expect(dir.y).toBe(0);
  });

  it('returns near-zero (not 0.15) just past deadzone — proves continuity', () => {
    const dir = calculateDirection({ x: 9.1, y: 0 }, 60, 0.15);
    const mag = Math.hypot(dir.x, dir.y);
    expect(mag).toBeGreaterThan(0);
    expect(mag).toBeLessThan(0.05);
  });

  it('returns 1 when delta equals radius', () => {
    const dir = calculateDirection({ x: 60, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBe(0);
  });

  it('returns midpoint (~0.5) at half-way between deadzone edge and full radius', () => {
    const dir = calculateDirection({ x: 34.5, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(0.5, 2);
  });

  it('clamps magnitude to 1 when delta exceeds radius', () => {
    const dir = calculateDirection({ x: 200, y: 0 }, 60, 0.15);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it('flips Y so upward screen drag (negative canvas Y) gives positive logic Y', () => {
    const dir = calculateDirection({ x: 0, y: -60 }, 60, 0.15);
    expect(dir.y).toBeCloseTo(1, 5);
    expect(dir.x).toBe(0);
  });

  it('diagonal direction has both components and magnitude <= 1', () => {
    const dir = calculateDirection({ x: 45, y: -45 }, 60, 0.15);
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.y).toBeGreaterThan(0);
    expect(Math.hypot(dir.x, dir.y)).toBeLessThanOrEqual(1 + 1e-9);
  });
});
