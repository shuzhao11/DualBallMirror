// src/obstacles/MovingObstacle.ts
import Matter from 'matter-js';

/** patrol 模式配置（已转换为屏幕坐标系偏移） */
export interface PatrolConfig {
  mode: 'patrol';
  /** 相对初始位置的起点偏移（屏幕坐标，Y 轴向下） */
  offsetA: { x: number; y: number };
  /** 相对初始位置的终点偏移（屏幕坐标，Y 轴向下） */
  offsetB: { x: number; y: number };
  /** 移动速度（屏幕像素/秒） */
  speed: number;
}

/** rotate 模式配置 */
export interface RotateConfig {
  mode: 'rotate';
  /** 旋转速度（度/秒） */
  rotateSpeed: number;
}

export type MovingObstacleConfig = PatrolConfig | RotateConfig;

export class MovingObstacle {
  /** patrol: 插值参数 0->1；rotate: 累积弧度 */
  private t   = 0;
  /** patrol 方向：1=向 B，-1=向 A */
  private dir = 1;

  /**
   * @param body    Matter.js 物理体（isStatic = true）
   * @param cfg     移动配置（屏幕坐标系）
   * @param origin  物理体初始中心位置（屏幕坐标）
   */
  constructor(
    private readonly body:   Matter.Body,
    private readonly cfg:    MovingObstacleConfig,
    private readonly origin: { x: number; y: number },
  ) {}

  update(dt: number): void {
    if (this.cfg.mode === 'patrol') {
      const { offsetA, offsetB, speed } = this.cfg;
      const dx = offsetB.x - offsetA.x;
      const dy = offsetB.y - offsetA.y;
      const totalDist = Math.hypot(dx, dy);
      if (totalDist < 0.001) return;

      // 累积插值参数
      this.t += (speed * dt / totalDist) * this.dir;
      if (this.t >= 1) { this.t = 1; this.dir = -1; }
      if (this.t <= 0) { this.t = 0; this.dir =  1; }

      const nx = this.origin.x + offsetA.x + dx * this.t;
      const ny = this.origin.y + offsetA.y + dy * this.t;
      Matter.Body.setPosition(this.body, { x: nx, y: ny });

    } else if (this.cfg.mode === 'rotate') {
      this.t += (this.cfg.rotateSpeed * Math.PI / 180) * dt;
      Matter.Body.setAngle(this.body, this.t);
    }
  }
}
