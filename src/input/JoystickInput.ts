// src/input/JoystickInput.ts
import { calculateDirection } from './JoystickLogic';
import type { Vec2 } from '../core/levels/types';
import {
  JOYSTICK_BASE_X, JOYSTICK_BASE_Y,
  JOYSTICK_RADIUS, JOYSTICK_DEADZONE,
} from '../constants';

const LONG_PRESS_MS = 1500;

export class JoystickInput {
  private active    = false;
  private touchId: number | null = null;
  /** 摇杆手柄当前屏幕坐标 */
  private handlePos: Vec2 = { x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y };
  /** 当前方向向量（逻辑坐标，Y 轴向上），由 JoystickLogic 计算 */
  private direction: Vec2 = { x: 0, y: 0 };
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @param canvas   tt.createCanvas() 返回的 Canvas 对象（或 HTMLCanvasElement）
   * @param onReset  长按 1.5s 触发的重置回调
   */
  constructor(
    private readonly canvas: { addEventListener: (type: string, handler: (e: any) => void) => void },
    private readonly onReset: () => void,
  ) {
    canvas.addEventListener('touchstart',  this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove',   this.onTouchMove.bind(this));
    canvas.addEventListener('touchend',    this.onTouchEnd.bind(this));
    canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
  }

  private onTouchStart(e: { changedTouches: { identifier: number; clientX: number; clientY: number }[] }): void {
    if (this.touchId !== null) return;  // 已有摇杆触摸点，忽略多指
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.active  = true;
    this.updateHandle(touch.clientX, touch.clientY);
    this.longPressTimer = setTimeout(() => this.onReset(), LONG_PRESS_MS);
  }

  private onTouchMove(e: { changedTouches: { identifier: number; clientX: number; clientY: number }[] }): void {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      this.updateHandle(touch.clientX, touch.clientY);
      // 移动超过死区 30% 就取消长按（防误触）
      const dx = touch.clientX - JOYSTICK_BASE_X;
      const dy = touch.clientY - JOYSTICK_BASE_Y;
      if (Math.hypot(dx, dy) > JOYSTICK_RADIUS * 0.3) this.clearLongPress();
      break;
    }
  }

  private onTouchEnd(e: { changedTouches: { identifier: number }[] }): void {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      this.touchId   = null;
      this.active    = false;
      this.handlePos = { x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y };
      this.direction = { x: 0, y: 0 };
      this.clearLongPress();
      break;
    }
  }

  private updateHandle(touchX: number, touchY: number): void {
    const delta: Vec2 = { x: touchX - JOYSTICK_BASE_X, y: touchY - JOYSTICK_BASE_Y };
    const mag   = Math.hypot(delta.x, delta.y);
    const clamp = Math.min(mag, JOYSTICK_RADIUS);
    this.handlePos = mag > 0
      ? { x: JOYSTICK_BASE_X + (delta.x / mag) * clamp, y: JOYSTICK_BASE_Y + (delta.y / mag) * clamp }
      : { x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y };
    this.direction = calculateDirection(delta, JOYSTICK_RADIUS, JOYSTICK_DEADZONE);
  }

  private clearLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /** 当前方向向量（逻辑坐标 Y 向上），零向量表示无输入 */
  getDirection(): Vec2                     { return this.direction; }
  /** 手柄当前屏幕坐标（用于渲染） */
  getHandlePos(): { x: number; y: number } { return this.handlePos; }
  /** 摇杆基座屏幕坐标（用于渲染） */
  getBasePos():   { x: number; y: number } { return { x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y }; }
  isActive(): boolean { return this.active; }
}
