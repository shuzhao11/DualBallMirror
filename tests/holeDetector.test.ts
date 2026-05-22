// tests/holeDetector.test.ts
import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { HoleDetector } from '../src/ball/HoleDetector';
import type { HoleConfig } from '../src/core/levels/types';

// 洞口中心（屏幕坐标）
const HOLE_SCREEN = { x: 360, y: 640 };

// 只要求蓝球的洞配置
const CFG_BLUE_ONLY: HoleConfig = {
  position: { x: 0, y: 0 },  // 逻辑坐标（HoleDetector 内部不使用此字段）
  radius: 40,
  requireBlue: true,
  requireYellow: false,
};

describe('HoleDetector', () => {
  it('isSatisfied is false initially', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);
    expect(det.isSatisfied).toBe(false);
  });

  it('isSatisfied becomes true after dwell >= threshold', () => {
    // blue body placed exactly at hole center -> inside hole
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);  // not required
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);

    det.update(0.1);
    det.update(0.1);
    det.update(0.1);  // 0.3s dwell reached

    expect(det.isSatisfied).toBe(true);
  });

  it('resets dwell timer when required ball exits hole', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);

    det.update(0.2);  // 0.2s accumulated
    expect(det.isSatisfied).toBe(false);

    // 将蓝球移到洞外
    Matter.Body.setPosition(blue, { x: 0, y: 0 });
    det.update(0.2);  // dwell 归零
    expect(det.isSatisfied).toBe(false);
  });

  it('reset() clears accumulated dwell', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);
    det.update(0.3);
    expect(det.isSatisfied).toBe(true);

    det.reset();
    expect(det.isSatisfied).toBe(false);
  });

  it('both-balls config: not satisfied unless both inside', () => {
    const cfg: HoleConfig = {
      position: { x: 0, y: 0 },
      radius: 40,
      requireBlue: true,
      requireYellow: true,
    };
    // Only blue inside
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(cfg, HOLE_SCREEN, 0.3, blue, yellow);
    det.update(0.3);
    expect(det.isSatisfied).toBe(false);  // yellow not inside
  });
});
