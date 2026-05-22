// src/renderer/GameRenderer.ts
import Matter from 'matter-js';
import type { LevelObjects } from '../core/LevelLoader';
import type { LevelConfig, ObstacleConfig } from '../core/levels/types';
import type { JoystickInput } from '../input/JoystickInput';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MAP_TOP, MAP_HEIGHT,
  BALL_RADIUS, JOYSTICK_RADIUS,
} from '../constants';

export class GameRenderer {
  /** 洞口旋转虚线圈的累积角度（弧度） */
  private holeAngle = 0;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(
    objects:  LevelObjects,
    cfg:      LevelConfig,
    joystick: JoystickInput,
    dt:       number,
  ): void {
    const { ctx } = this;
    this.holeAngle = (this.holeAngle + dt * 1.5) % (Math.PI * 2);  // 虚线圈每秒转 ~86 度

    // 全画布清空
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 地图背景（米白色）
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, MAP_TOP, CANVAS_WIDTH, MAP_HEIGHT);

    // 地图边框（4px 粗黑描边）
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 4;
    ctx.strokeRect(0, MAP_TOP, CANVAS_WIDTH, MAP_HEIGHT);

    // 洞口
    objects.detectors.forEach((det, i) => {
      this.drawHole(det.getScreenPos(), cfg.holes[i].radius);
    });

    // 障碍物
    cfg.obstacles.forEach((obsCfg, i) => {
      this.drawObstacle(obsCfg, objects.obstacleBodies[i]);
    });

    // 球体（黄球先画，蓝球叠在上方）
    this.drawBall(objects.yellowBody.position.x, objects.yellowBody.position.y, '#f5c518', '#c99a00');
    this.drawBall(objects.blueBody.position.x,   objects.blueBody.position.y,   '#5b9bd5', '#2a6aad');

    // 摇杆
    this.drawJoystick(joystick);
  }

  private drawBall(x: number, y: number, fill: string, stroke: string): void {
    const { ctx } = this;
    // 硬阴影（偏移 4px）
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // 填充
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // 描边（3px）
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawHole(pos: { x: number; y: number }, radius: number): void {
    const { ctx } = this;
    // 黑色填充洞
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    // 旋转虚线外圈
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -this.holeAngle * (radius + 6);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawObstacle(cfg: ObstacleConfig, body: Matter.Body | undefined): void {
    if (!body) return;
    const { ctx } = this;
    const { x, y } = body.position;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    const S = 4;  // 硬阴影偏移
    if (cfg.type === 'rect') {
      const hw = cfg.width!  / 2;
      const hh = cfg.height! / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(S - hw, S - hh, cfg.width!, cfg.height!);
      ctx.fillStyle = '#888888';
      ctx.fillRect(-hw, -hh, cfg.width!, cfg.height!);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth   = 3;
      ctx.strokeRect(-hw, -hh, cfg.width!, cfg.height!);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(S, S, cfg.radius!, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#888888';
      ctx.beginPath(); ctx.arc(0, 0, cfg.radius!, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth   = 3;
      ctx.beginPath(); ctx.arc(0, 0, cfg.radius!, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  private drawJoystick(joystick: JoystickInput): void {
    const { ctx } = this;
    const base   = joystick.getBasePos();
    const handle = joystick.getHandlePos();
    // 基座圆环
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.fillStyle   = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(base.x, base.y, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 手柄
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 28, 0, Math.PI * 2);
    ctx.fill();
  }
}
