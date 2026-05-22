// src/ball/HoleDetector.ts
import Matter from 'matter-js';
import type { HoleConfig } from '../core/levels/types';
import { BALL_RADIUS } from '../constants';

function dist(a: Matter.Vector, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class HoleDetector {
  private dwell = 0;

  /**
   * @param cfg        洞口配置（逻辑坐标字段不被本类使用）
   * @param screenPos  洞口中心（屏幕/物理坐标，由 LevelLoader 转换后传入）
   * @param threshold  满足通关需要的最小停留时间（秒），来自 LevelConfig.holeDwellTime
   * @param blueBody   蓝球物理体
   * @param yellowBody 黄球物理体
   */
  constructor(
    private readonly cfg:        HoleConfig,
    private readonly screenPos:  { x: number; y: number },
    private readonly threshold:  number,
    private readonly blueBody:   Matter.Body,
    private readonly yellowBody: Matter.Body,
  ) {}

  update(dt: number): void {
    const blueIn   = dist(this.blueBody.position,   this.screenPos) < this.cfg.radius + BALL_RADIUS;
    const yellowIn = dist(this.yellowBody.position, this.screenPos) < this.cfg.radius + BALL_RADIUS;
    const met = (!this.cfg.requireBlue || blueIn) && (!this.cfg.requireYellow || yellowIn);
    this.dwell = met ? this.dwell + dt : 0;
  }

  get isSatisfied(): boolean {
    return this.dwell >= this.threshold;
  }

  /** 供 GameRenderer 查询洞口屏幕坐标用于绘制 */
  getScreenPos(): { x: number; y: number } {
    return this.screenPos;
  }

  reset(): void {
    this.dwell = 0;
  }
}
