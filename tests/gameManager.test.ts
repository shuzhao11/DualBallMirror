// tests/gameManager.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import Matter from 'matter-js';
import { GameManager } from '../src/core/GameManager';
import { HoleDetector } from '../src/ball/HoleDetector';
import type { LevelConfig, HoleConfig } from '../src/core/levels/types';

/** 辅助：创建一个可通过预灌 dwell 来控制是否满足的 HoleDetector */
function makeDetector(prefilledDwell: boolean): HoleDetector {
  const holePos = { x: 360, y: 640 };
  const cfg: HoleConfig = {
    position: { x: 0, y: 0 }, radius: 40,
    requireBlue: true, requireYellow: false,
  };
  const blue   = Matter.Bodies.circle(holePos.x, holePos.y, 28);  // 在洞内
  const yellow = Matter.Bodies.circle(0, 0, 28);
  const det = new HoleDetector(cfg, holePos, 0.3, blue, yellow);
  if (prefilledDwell) det.update(0.3);  // 预灌满足条件
  return det;
}

const BASE_CFG: LevelConfig = {
  requireBothBalls: false,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [],
  obstacles: [],
  blueSpawn:   { x: 0, y: 0 },
  yellowSpawn: { x: 0, y: 0 },
};

describe('GameManager', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts in "loading" state', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    expect(gm.getState()).toBe('loading');
  });

  it('transitions to "playing" after start()', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    gm.start();
    expect(gm.getState()).toBe('playing');
  });

  it('does not call onComplete while in loading state', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    // 不调用 start()
    gm.update(0.016);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('calls onComplete and enters "levelComplete" when all detectors satisfied', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    gm.start();
    gm.update(0.016);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(gm.getState()).toBe('levelComplete');
  });

  it('calls onTimeout and enters "timeout" when time limit exceeded', () => {
    const onTimeout = vi.fn();
    const cfg = { ...BASE_CFG, timeLimitSeconds: 1 };
    const gm = new GameManager(cfg, [], () => {}, onTimeout);
    gm.start();
    gm.update(1.01);  // 超过 1s 限制
    expect(onTimeout).toHaveBeenCalledOnce();
    expect(gm.getState()).toBe('timeout');
  });

  it('getElapsed() tracks time in playing state', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    gm.start();
    gm.update(0.5);
    expect(gm.getElapsed()).toBeCloseTo(0.5, 5);
  });

  it('reset() returns to playing and resets elapsed', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    gm.start();
    gm.update(0.016);
    expect(gm.getState()).toBe('levelComplete');

    gm.reset([makeDetector(false)]);  // 重置用未满足的 detector
    expect(gm.getState()).toBe('playing');
    expect(gm.getElapsed()).toBe(0);
  });
});
