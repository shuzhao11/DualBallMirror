// src/obstacles/ReactiveBlockSystem.ts
//
// 触发-响应方块系统（粉色4 ↔ 褐色3）
//
// 状态机：
//   idle       — 在原点静止，无触发
//   controlled — 有球在触发区，摇杆离散驱动 3 移动（步进前检查是否与球重叠，避免强推）
//   returning  — 球离开触发区，3 沿移动历史逆序逐格返回原点；碰到球则挤推（不穿越）
//
// 方向规则（controlled 阶段）：
//   3 向球实际运动方向的反方向移动。
//   Blue  屏幕方向 = ( joystickDir.x, -joystickDir.y )
//   Yellow 屏幕方向 = (-joystickDir.x,  joystickDir.y )  （镜像）
import Matter from 'matter-js';
import { BALL_RADIUS } from '../constants';
import type { Vec2 } from '../core/levels/types';

/** 摇杆意图速度（屏幕像素/秒）：持续推杆约 0.4 秒触发一格步进 */
const STEP_SPEED   = 200;
/** 归位匀速（px/s），与 controlled 步进速度相同 */
const RETURN_SPEED = 200;
/** 到达目标格的吸附阈值 (px) */
const RETURN_SNAP  = 4;

type BlockState = 'idle' | 'controlled' | 'returning';

export class ReactiveBlockSystem {
  private readonly triggerBody:  Matter.Body;
  private readonly reactiveBody: Matter.Body;

  private readonly reactiveOrigin: { x: number; y: number };
  private readonly triggerHW: number;
  private readonly triggerHH: number;
  private readonly cellSize:  number;
  private readonly maxShiftX: number;
  private readonly maxShiftY: number;

  private state: BlockState = 'idle';
  /** 当前离散格偏移（controlled 阶段） */
  private shiftX = 0;
  private shiftY = 0;
  /** 不足一格的残余累加量（controlled 阶段） */
  private accumX = 0;
  private accumY = 0;

  /** controlled 阶段每一步的移动记录，returning 阶段逆序弹出 */
  private moveHistory: Array<{ dx: number; dy: number }> = [];
  /** returning 阶段当前正在移向的目标格位置 */
  private returnTarget: { x: number; y: number } | null = null;

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
   * @param blueBody    蓝球物理体
   * @param yellowBody  黄球物理体
   * @param joystickDir 摇杆方向（逻辑坐标，Y 轴向上）
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
    const anyIn    = blueIn || yellowIn;

    // ── 没有球在触发区 ─────────────────────────────────────────────
    if (!anyIn) {
      if (this.state === 'controlled') {
        this.state = 'returning';
        this.returnTarget = null;          // 首次 stepReturn 时弹出第一个目标
      }
      if (this.state === 'returning') {
        this.stepReturn(dt, blueBody, yellowBody);
      }
      return;
    }

    // ── 有球在触发区 ───────────────────────────────────────────────
    if (this.state === 'returning') {
      // 归位中途球重新进入触发区：就近对齐到最近整数格后切 controlled
      const pos = this.reactiveBody.position;
      this.shiftX = Math.round((pos.x - this.reactiveOrigin.x) / this.cellSize);
      this.shiftY = Math.round((pos.y - this.reactiveOrigin.y) / this.cellSize);
      Matter.Body.setVelocity(this.reactiveBody, { x: 0, y: 0 });
      Matter.Body.setPosition(this.reactiveBody, {
        x: this.reactiveOrigin.x + this.shiftX * this.cellSize,
        y: this.reactiveOrigin.y + this.shiftY * this.cellSize,
      });
      this.accumX = 0;
      this.accumY = 0;
      this.returnTarget = null;
      // 重建历史：从原点到当前 shift 的简单路径（先 X 后 Y）
      this.rebuildHistory();
      this.state = 'controlled';
    }

    if (this.state !== 'controlled') {
      // idle → controlled
      this.state  = 'controlled';
      this.shiftX = 0;
      this.shiftY = 0;
      this.accumX = 0;
      this.accumY = 0;
      this.moveHistory = [];
      this.returnTarget = null;
    }

    // ── controlled：摇杆离散步进 ──────────────────────────────────
    const isYellow   = !blueIn && yellowIn;
    const actualDirX = isYellow ? -joystickDir.x :  joystickDir.x;
    const actualDirY = isYellow ?  joystickDir.y  : -joystickDir.y;

    const mag = Math.hypot(joystickDir.x, joystickDir.y);
    if (mag > 0.12) {
      this.accumX += -actualDirX * STEP_SPEED * dt;
      this.accumY += -actualDirY * STEP_SPEED * dt;
    }

    const clampX = (v: number) => Math.max(-this.maxShiftX, Math.min(this.maxShiftX, v));
    const clampY = (v: number) => Math.max(-this.maxShiftY, Math.min(this.maxShiftY, v));

    // 步进前检查目标格是否被球占据，被占则停步（不强推）
    while (Math.abs(this.accumX) >= this.cellSize) {
      const dir  = this.accumX > 0 ? 1 : -1;
      const next = clampX(this.shiftX + dir);
      if (next === this.shiftX) { this.accumX = 0; break; }
      const tx = this.reactiveOrigin.x + next * this.cellSize;
      const ty = this.reactiveOrigin.y + this.shiftY * this.cellSize;
      if (this.ballOccupies(blueBody, tx, ty) || this.ballOccupies(yellowBody, tx, ty)) {
        this.accumX = 0; break;
      }
      this.shiftX  = next;
      this.moveHistory.push({ dx: dir, dy: 0 });
      this.accumX -= dir * this.cellSize;
    }

    while (Math.abs(this.accumY) >= this.cellSize) {
      const dir  = this.accumY > 0 ? 1 : -1;
      const next = clampY(this.shiftY + dir);
      if (next === this.shiftY) { this.accumY = 0; break; }
      const tx = this.reactiveOrigin.x + this.shiftX * this.cellSize;
      const ty = this.reactiveOrigin.y + next * this.cellSize;
      if (this.ballOccupies(blueBody, tx, ty) || this.ballOccupies(yellowBody, tx, ty)) {
        this.accumY = 0; break;
      }
      this.shiftY  = next;
      this.moveHistory.push({ dx: 0, dy: dir });
      this.accumY -= dir * this.cellSize;
    }

    // controlled 阶段方块离散跳格，速度归零避免残留推力
    Matter.Body.setVelocity(this.reactiveBody, { x: 0, y: 0 });
    Matter.Body.setPosition(this.reactiveBody, {
      x: this.reactiveOrigin.x + this.shiftX * this.cellSize,
      y: this.reactiveOrigin.y + this.shiftY * this.cellSize,
    });
  }

  // ── 归位阶段：沿移动历史逆序逐格返回，碰到球则挤推 ──────────────
  private stepReturn(dt: number, blueBody: Matter.Body, yellowBody: Matter.Body): void {
    // 若没有当前目标格，从历史弹出下一个
    if (!this.returnTarget) {
      if (this.moveHistory.length === 0) {
        this.finishReturn(blueBody, yellowBody);
        return;
      }
      this.popReturnTarget();
    }

    const pos  = this.reactiveBody.position;
    const dx   = this.returnTarget!.x - pos.x;
    const dy   = this.returnTarget!.y - pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= RETURN_SNAP) {
      // 到达当前目标格
      Matter.Body.setVelocity(this.reactiveBody, { x: 0, y: 0 });
      Matter.Body.setPosition(this.reactiveBody, { ...this.returnTarget! });
      this.pushBallIfOverlapping(blueBody);
      this.pushBallIfOverlapping(yellowBody);
      this.returnTarget = null;

      // 若历史耗尽则完成归位
      if (this.moveHistory.length === 0) {
        this.finishReturn(blueBody, yellowBody);
      }
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const step = Math.min(RETURN_SPEED * dt, dist);   // 不超过目标距离
    const newX = pos.x + nx * step;
    const newY = pos.y + ny * step;

    // ① 设置运动速度 —— 让 Engine.update 碰撞求解器产生正确推力
    Matter.Body.setVelocity(this.reactiveBody, {
      x: nx * RETURN_SPEED / 60,
      y: ny * RETURN_SPEED / 60,
    });
    // ② 移动方块
    Matter.Body.setPosition(this.reactiveBody, { x: newX, y: newY });
    // ③ 手动推出重叠球
    this.pushBallIfOverlapping(blueBody);
    this.pushBallIfOverlapping(yellowBody);
  }

  /** 从历史栈弹出最后一步，计算回退目标格位置 */
  private popReturnTarget(): void {
    const last = this.moveHistory.pop()!;
    // 回退 shift（逆向）
    this.shiftX -= last.dx;
    this.shiftY -= last.dy;
    this.returnTarget = {
      x: this.reactiveOrigin.x + this.shiftX * this.cellSize,
      y: this.reactiveOrigin.y + this.shiftY * this.cellSize,
    };
  }

  /** 归位完成，恢复 idle */
  private finishReturn(blueBody: Matter.Body, yellowBody: Matter.Body): void {
    this.state  = 'idle';
    this.shiftX = 0;
    this.shiftY = 0;
    this.accumX = 0;
    this.accumY = 0;
    this.returnTarget = null;
    this.moveHistory  = [];
    Matter.Body.setVelocity(this.reactiveBody, { x: 0, y: 0 });
    Matter.Body.setPosition(this.reactiveBody, { ...this.reactiveOrigin });
    this.pushBallIfOverlapping(blueBody);
    this.pushBallIfOverlapping(yellowBody);
  }

  /** 从当前 shiftX/Y 重建简单移动历史（先 X 步再 Y 步） */
  private rebuildHistory(): void {
    this.moveHistory = [];
    const sx = this.shiftX > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(this.shiftX); i++) {
      this.moveHistory.push({ dx: sx, dy: 0 });
    }
    const sy = this.shiftY > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(this.shiftY); i++) {
      this.moveHistory.push({ dx: 0, dy: sy });
    }
  }

  /**
   * 若球与 reactiveBody 当前位置重叠，沿最小穿透轴将球推出，
   * 并赋予推出方向的速度使后续物理帧自然运动。
   */
  private pushBallIfOverlapping(ball: Matter.Body): void {
    const bp = this.reactiveBody.position;
    const hw = this.cellSize / 2;
    const hh = this.cellSize / 2;
    const bx = ball.position.x;
    const by = ball.position.y;

    // 膨胀 AABB 穿透量（矩形 + 球半径）
    const penX = (hw + BALL_RADIUS) - Math.abs(bx - bp.x);
    const penY = (hh + BALL_RADIUS) - Math.abs(by - bp.y);

    if (penX <= 0 || penY <= 0) return; // 无重叠

    // 沿穿透深度更小的轴推出（最小分离方向）
    let resolveX = 0;
    let resolveY = 0;
    if (penX < penY) {
      resolveX = bx >= bp.x ? penX : -penX;
    } else {
      resolveY = by >= bp.y ? penY : -penY;
    }

    Matter.Body.setPosition(ball, { x: bx + resolveX, y: by + resolveY });
    // 赋予推出方向的速度（px / 物理步），使球被"挤动"
    const pushSpeed = RETURN_SPEED / 60;
    Matter.Body.setVelocity(ball, {
      x: resolveX !== 0 ? Math.sign(resolveX) * pushSpeed : ball.velocity.x,
      y: resolveY !== 0 ? Math.sign(resolveY) * pushSpeed : ball.velocity.y,
    });
  }

  /** 球圆心在触发区内（含 0.5 半径容差） */
  private inTrigger(ball: Matter.Body): boolean {
    return (
      Math.abs(ball.position.x - this.triggerBody.position.x) < this.triggerHW + BALL_RADIUS * 0.5
      && Math.abs(ball.position.y - this.triggerBody.position.y) < this.triggerHH + BALL_RADIUS * 0.5
    );
  }

  /** 球是否会与目标位置的 reactive block 重叠 */
  private ballOccupies(ball: Matter.Body, tx: number, ty: number): boolean {
    const hw = this.cellSize / 2;
    const hh = this.cellSize / 2;
    return (
      Math.abs(ball.position.x - tx) < hw + BALL_RADIUS
      && Math.abs(ball.position.y - ty) < hh + BALL_RADIUS
    );
  }
}
