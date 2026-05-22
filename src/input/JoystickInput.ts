import { calculateDirection } from './JoystickLogic';
import type { Vec2 } from '../core/levels/types';
import type { Viewport } from '../core/Viewport';
import { JOYSTICK_RADIUS, JOYSTICK_DEADZONE } from '../constants';

const LONG_PRESS_MS         = 1500;
const LONG_PRESS_MOVE_RATIO = 0.3;

export class JoystickInput {
  private active    = false;
  private visible   = false;
  private touchId: number | null = null;
  private basePos:   Vec2 = { x: 0, y: 0 };
  private handlePos: Vec2 = { x: 0, y: 0 };
  private direction: Vec2 = { x: 0, y: 0 };
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly boundStart: (e: any) => void = this.onTouchStart.bind(this);
  private readonly boundMove:  (e: any) => void = this.onTouchMove.bind(this);
  private readonly boundEnd:   (e: any) => void = this.onTouchEnd.bind(this);

  constructor(
    private readonly canvas: {
      addEventListener:    (type: string, handler: (e: any) => void) => void;
      removeEventListener: (type: string, handler: (e: any) => void) => void;
    },
    private readonly viewport: Viewport,
    private readonly onReset: () => void,
  ) {
    canvas.addEventListener('touchstart',  this.boundStart);
    canvas.addEventListener('touchmove',   this.boundMove);
    canvas.addEventListener('touchend',    this.boundEnd);
    canvas.addEventListener('touchcancel', this.boundEnd);
  }

  private onTouchStart(e: { changedTouches: { identifier: number; clientX: number; clientY: number }[] }): void {
    const touch = e.changedTouches[0];
    if (!touch) return;
    // 抢占式：即使已有触摸在追踪也强制重置到新位置，避免"旧摇杆位置残留"
    this.clearLongPress();
    const logical = this.viewport.toLogical(touch.clientX, touch.clientY);
    this.touchId   = touch.identifier;
    this.active    = true;
    this.visible   = true;
    this.basePos   = { x: logical.x, y: logical.y };
    this.handlePos = { x: logical.x, y: logical.y };
    this.direction = { x: 0, y: 0 };
    this.longPressTimer = setTimeout(() => this.onReset(), LONG_PRESS_MS);
  }

  private onTouchMove(e: { changedTouches: { identifier: number; clientX: number; clientY: number }[] }): void {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      const logical = this.viewport.toLogical(touch.clientX, touch.clientY);
      this.updateHandle(logical.x, logical.y);
      const dx = logical.x - this.basePos.x;
      const dy = logical.y - this.basePos.y;
      if (Math.hypot(dx, dy) > JOYSTICK_RADIUS * LONG_PRESS_MOVE_RATIO) this.clearLongPress();
      break;
    }
  }

  private onTouchEnd(e: { changedTouches: { identifier: number }[] }): void {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      this.touchId   = null;
      this.active    = false;
      this.visible   = false;
      this.direction = { x: 0, y: 0 };
      this.clearLongPress();
      break;
    }
  }

  private updateHandle(logicalX: number, logicalY: number): void {
    const delta: Vec2 = { x: logicalX - this.basePos.x, y: logicalY - this.basePos.y };
    const mag   = Math.hypot(delta.x, delta.y);
    const clamp = Math.min(mag, JOYSTICK_RADIUS);
    this.handlePos = mag > 0
      ? { x: this.basePos.x + (delta.x / mag) * clamp, y: this.basePos.y + (delta.y / mag) * clamp }
      : { x: this.basePos.x, y: this.basePos.y };
    this.direction = calculateDirection(delta, JOYSTICK_RADIUS, JOYSTICK_DEADZONE);
  }

  private clearLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('touchstart',  this.boundStart);
    this.canvas.removeEventListener('touchmove',   this.boundMove);
    this.canvas.removeEventListener('touchend',    this.boundEnd);
    this.canvas.removeEventListener('touchcancel', this.boundEnd);
    this.clearLongPress();
  }

  getDirection(): Vec2                       { return { x: this.direction.x, y: this.direction.y }; }
  getHandlePos(): { x: number; y: number }   { return { x: this.handlePos.x, y: this.handlePos.y }; }
  getBasePos():   { x: number; y: number }   { return { x: this.basePos.x,   y: this.basePos.y   }; }
  isActive():  boolean { return this.active;  }
  isVisible(): boolean { return this.visible; }
}
