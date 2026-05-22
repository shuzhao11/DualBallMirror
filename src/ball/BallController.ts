// src/ball/BallController.ts
import Matter from 'matter-js';
import type { Vec2 } from '../core/levels/types';
import { FORCE_SCALE } from '../constants';

export class BallController {
  constructor(
    private readonly blueBody:   Matter.Body,
    private readonly yellowBody: Matter.Body,
  ) {}

  /**
   * 根据摇杆方向对双球施加力镜像。
   * @param dir 逻辑方向向量（Y 轴向上），来自 JoystickLogic.calculateDirection
   */
  update(dir: Vec2): void {
    if (Math.hypot(dir.x, dir.y) < 0.01) return;

    // 逻辑 Y 向上 -> 翻转 Y 以适配 Matter.js（Canvas 坐标 Y 向下）
    const f: Vec2 = {
      x:  dir.x * FORCE_SCALE,
      y: -dir.y * FORCE_SCALE,
    };
    Matter.Body.applyForce(this.blueBody,   this.blueBody.position,    f);
    Matter.Body.applyForce(this.yellowBody, this.yellowBody.position, { x: -f.x, y: -f.y });
  }
}
