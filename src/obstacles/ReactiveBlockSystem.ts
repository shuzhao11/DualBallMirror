// src/obstacles/ReactiveBlockSystem.ts
//
// 触发-响应方块系统（粉色4 ↔ 褐色3）
//
// 方向规则：
//   "球从4的某方向来触碰 → 3 向同一方向移动"
//   （即 3 跟随球的实际运动方向，而非反向）
//
//   注意：joystickDir 控制蓝球，黄球方向与之相反（镜像力学）。
//   系统内部根据是哪只球进入触发区来选取正确的方向系数。
//
// 边界限制：
//   maxShiftX / maxShiftY 分别限制 3 在 ±X / ±Y 方向最多移动的格数，
//   防止 3 进入墙体（tile 1）或越出画面。
import Matter from 'matter-js';
import { BALL_RADIUS } from '../constants';
import type { Vec2 } from '../core/levels/types';

/** 摇杆意图速度（屏幕像素/秒）：持续推杆约 0.4 秒触发一格步进 */
const STEP_SPEED = 200;

export class ReactiveBlockSystem {
  private readonly triggerBody:  Matter.Body;
  private readonly reactiveBody: Matter.Body;

  private readonly reactiveOrigin: { x: number; y: number };
  private readonly triggerHW: number;
  private readonly triggerHH: number;
  private readonly cellSize:  number;
  private readonly maxShiftX: number;
  private readonly maxShiftY: number;

  private isControlled = false;
  /** 当前离散格偏移（屏幕坐标系，X 右正，Y 下正） */
  private shiftX = 0;
  private shiftY = 0;
  /** 不足一格的残余累加量 */
  private accumX = 0;
  private accumY = 0;

  constructor(
    triggerPos:  { x: number; y: number }, triggerW:  number, triggerH:  number,
    reactivePos: { x: number; y: number }, reactiveW: number, reactiveH: number,
    cellSize:  number,
    maxShiftX: number,
    maxShiftY: number,
  ) {
    this.cellSize       = cellSize;
    this.maxShiftX      = maxShiftX;
    this.maxShiftY      = maxShiftY;
    this.reactiveOrigin = { ...reactivePos };
    this.triggerHW      = triggerW  / 2;
    this.triggerHH      = triggerH  / 2;

    this.triggerBody = Matter.Bodies.rectangle(
      triggerPos.x, triggerPos.y, triggerW, triggerH,
      { isStatic: true, isSensor: true, label: 'trigger4' },
    );

    this.reactiveBody = Matter.Bodies.rectangle(
      reactivePos.x, reactivePos.y, reactiveW, reactiveH,
      { isStatic: true, label: 'reactive3' },
    );
  }

  getTriggerBody():  Matter.Body { return this.triggerBody;  }
  getReactiveBody(): Matter.Body { return this.reactiveBody; }

  /**
   * @param blueBody    蓝球物理体（Blue 跟随摇杆方向）
   * @param yellowBody  黄球物理体（Yellow 与摇杆方向相反——镜像力学）
   * @param joystickDir 摇杆方向（逻辑坐标，Y 轴向上），来自 JoystickInput.getDirection()
   * @param dt          帧间隔（秒）
   */
  update(
    blueBody:    Matter.Body,
    yellowBody:  Matter.Body,
    joystickDir: Vec2,
    dt:          number,
  ): void {
    const blueIn   = this.inTrigger(blueBody);
    const yellowIn = this.inTrigger(yellowBody);

    if (!blueIn && !yellowIn) {
      if (this.isControlled) {
        // 所有球离开触发区 → 归位 + 清零
        this.isControlled = false;
        this.shiftX = this.shiftY = 0;
        this.accumX = this.accumY = 0;
        Matter.Body.setPosition(this.reactiveBody, { ...this.reactiveOrigin });
      }
      return;
    }

    if (!this.isControlled) {
      this.isControlled = true;
      this.shiftX = this.shiftY = 0;
      this.accumX = this.accumY = 0;
    }

    // ── 计算触发球的实际运动方向（屏幕坐标：X 右正，Y 下正）──────────
    // Blue  的屏幕方向 = ( joystickDir.x,  -joystickDir.y )
    // Yellow 的屏幕方向 = (-joystickDir.x,   joystickDir.y )  （镜像）
    // 优先取 Blue；若仅 Yellow 在触发区则取 Yellow。
    const isYellow = !blueIn && yellowIn;
    const actualDirX = isYellow ? -joystickDir.x :  joystickDir.x;
    const actualDirY = isYellow ?  joystickDir.y  : -joystickDir.y;

    const mag = Math.hypot(joystickDir.x, joystickDir.y);
    if (mag > 0.12) {
      // 3 跟随球的实际方向（即使球被墙挡住，摇杆输入仍累加）
      this.accumX += actualDirX * STEP_SPEED * dt;
      this.accumY += actualDirY * STEP_SPEED * dt;
    }

    // ── 离散步进：累加量每满一格，3 跟随球移动一格 ─────────────────
    const clampX = (v: number) => Math.max(-this.maxShiftX, Math.min(this.maxShiftX, v));
    const clampY = (v: number) => Math.max(-this.maxShiftY, Math.min(this.maxShiftY, v));

    while (Math.abs(this.accumX) >= this.cellSize) {
      const dir  = this.accumX > 0 ? 1 : -1;
      const next = clampX(this.shiftX + dir);   // 跟随球方向（同向）
      if (next === this.shiftX) {                // 已到边界，清空累加器
        this.accumX = 0;
        break;
      }
      this.shiftX  = next;
      this.accumX -= dir * this.cellSize;
    }

    while (Math.abs(this.accumY) >= this.cellSize) {
      const dir  = this.accumY > 0 ? 1 : -1;
      const next = clampY(this.shiftY + dir);
      if (next === this.shiftY) {
        this.accumY = 0;
        break;
      }
      this.shiftY  = next;
      this.accumY -= dir * this.cellSize;
    }

    Matter.Body.setPosition(this.reactiveBody, {
      x: this.reactiveOrigin.x + this.shiftX * this.cellSize,
      y: this.reactiveOrigin.y + this.shiftY * this.cellSize,
    });
  }

  /** 球圆心在触发区内（含 0.5 半径容差） */
  private inTrigger(ball: Matter.Body): boolean {
    return (
      Math.abs(ball.position.x - this.triggerBody.position.x) < this.triggerHW + BALL_RADIUS * 0.5
      && Math.abs(ball.position.y - this.triggerBody.position.y) < this.triggerHH + BALL_RADIUS * 0.5
    );
  }
}
