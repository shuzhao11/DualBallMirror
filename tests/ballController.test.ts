// tests/ballController.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import Matter from 'matter-js';
import { BallController } from '../src/ball/BallController';

describe('BallController', () => {
  afterEach(() => vi.restoreAllMocks());

  it('applies +F to blue and -F to yellow on x-direction input', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 1, y: 0 });

    expect(spy).toHaveBeenCalledTimes(2);
    const blueForce   = spy.mock.calls[0][2] as Matter.Vector;
    const yellowForce = spy.mock.calls[1][2] as Matter.Vector;

    // Blue force is positive X, yellow force is negative X
    expect(blueForce.x).toBeGreaterThan(0);
    expect(yellowForce.x).toBeLessThan(0);
    // Magnitudes are equal
    expect(blueForce.x).toBeCloseTo(-yellowForce.x, 8);
  });

  it('flips Y: upward logic input (positive y) gives negative screen force for blue', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 0, y: 1 });  // Logic Y-up = positive

    const blueForce = spy.mock.calls[0][2] as Matter.Vector;
    // Matter.js Y-down: upward force = negative Y
    expect(blueForce.y).toBeLessThan(0);
  });

  it('does nothing when direction magnitude is near-zero', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 0.005, y: 0 });

    expect(spy).not.toHaveBeenCalled();
  });
});
