// src/renderer/GameRenderer.ts
import Matter from 'matter-js';
import type { LevelObjects } from '../core/LevelLoader';
import type { LevelConfig, ObstacleConfig } from '../core/levels/types';
import type { JoystickInput } from '../input/JoystickInput';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MAP_TOP, MAP_HEIGHT,
  BALL_RADIUS, JOYSTICK_RADIUS,
  DOODLE_INK, DOODLE_PAPER, DOODLE_BALL_BLUE, DOODLE_BALL_YELLOW,
  DOODLE_OBSTACLE, DOODLE_STROKE_PX, DOODLE_BALL_TILT_DEG,
} from '../constants';
import { PaperBackground } from './PaperBackground';
import { withHardShadow } from './DoodleStyle';

export class GameRenderer {
  /** 洞口旋转虚线圈的累积角度（弧度） */
  private holeAngle = 0;
  private readonly paper = new PaperBackground();

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(
    objects:  LevelObjects,
    cfg:      LevelConfig,
    joystick: JoystickInput,
    dt:       number,
  ): void {
    const { ctx } = this;
    this.holeAngle = (this.holeAngle + dt * 1.5) % (Math.PI * 2);  // 虚线圈每秒转 ~86 度

    // 全画布清空（保险：任何上一帧痕迹都被覆盖）
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 涂鸦纸质背景 + 粗黑描边
    this.paper.draw(ctx);
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = DOODLE_STROKE_PX;
    ctx.lineJoin    = 'round';
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
    this.drawBall(objects.yellowBody.position.x, objects.yellowBody.position.y, DOODLE_BALL_YELLOW,  DOODLE_BALL_TILT_DEG);
    this.drawBall(objects.blueBody.position.x,   objects.blueBody.position.y,   DOODLE_BALL_BLUE,   -DOODLE_BALL_TILT_DEG);

    // 摇杆
    if (joystick.isVisible()) this.drawJoystick(joystick);
  }

  private drawBall(x: number, y: number, fill: string, tiltDeg: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tiltDeg * Math.PI / 180);
    withHardShadow(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    }, fill);
    ctx.restore();
  }

  private drawHole(pos: { x: number; y: number }, radius: number): void {
    const { ctx } = this;
    ctx.fillStyle = DOODLE_INK;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 3;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -this.holeAngle * (radius + 8);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
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
    if (cfg.type === 'rect') {
      const hw = cfg.width!  / 2;
      const hh = cfg.height! / 2;
      withHardShadow(ctx, () => {
        ctx.beginPath();
        ctx.rect(-hw, -hh, cfg.width!, cfg.height!);
      }, DOODLE_OBSTACLE);
    } else {
      withHardShadow(ctx, () => {
        ctx.beginPath();
        ctx.arc(0, 0, cfg.radius!, 0, Math.PI * 2);
      }, DOODLE_OBSTACLE);
    }
    ctx.restore();
  }

  private drawJoystick(joystick: JoystickInput): void {
    const { ctx } = this;
    const base   = joystick.getBasePos();
    const handle = joystick.getHandlePos();
    ctx.save();
    ctx.strokeStyle = DOODLE_INK;
    ctx.fillStyle   = 'rgba(255,254,246,0.55)';
    ctx.lineWidth   = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(base.x, base.y, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    withHardShadow(ctx, () => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 32, 0, Math.PI * 2);
    }, DOODLE_BALL_BLUE);
  }
}
