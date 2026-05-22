# DualBallMirror 4 项 Bug 修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 DualBallMirror 小游戏 4 项体验问题：(1) 摇杆从固定→浮动；(2) 摇杆死区导致输入跳变；(3) UI 与涂鸦卡通设计差距大；(4) 游戏未全屏铺满设备。

**Architecture:** 引入 Viewport 模块统一处理逻辑分辨率（720×1280）到设备物理像素的缩放与触摸坐标换算；改造 JoystickInput 为浮动模式，按 touchstart 位置生成基座；JoystickLogic 死区改为重映射；GameRenderer/HUDRenderer/OverlayRenderer 统一调整为涂鸦卡通视觉规范。

**Tech Stack:** TypeScript + Matter.js + Canvas 2D + esbuild + Vitest，目标平台抖音小游戏与浏览器（开发调试用）。

---

## File Structure

**新建：**
- `src/core/Viewport.ts` — 计算逻辑→物理缩放比、触摸坐标换算、resize 监听
- `src/renderer/PaperBackground.ts` — 程序化生成纸质底纹（缓存为离屏 canvas）
- `src/renderer/DoodleStyle.ts` — 涂鸦卡通公共绘制工具（手绘抖动线、硬阴影偏移、纸质背景常量）
- `tests/viewport.test.ts` — Viewport 缩放与坐标换算单测
- `tests/joystickInput.test.ts` — 浮动摇杆行为单测（active 状态、basePos 跟随 touch、销毁清理）
- `dist/index.html` — 浏览器手测入口

**修改：**
- `src/constants.ts` — 删除 `JOYSTICK_BASE_X/Y` 常量；加入涂鸦风格调色板
- `src/input/JoystickLogic.ts` — 死区外重映射 [deadzone, 1] → [0, 1]
- `src/input/JoystickInput.ts` — 浮动基座、`visible` 状态、接受 Viewport 做坐标换算
- `src/renderer/GameRenderer.ts` — 纸质背景、手绘描边、球体歪斜、摇杆条件渲染
- `src/ui/HUDRenderer.ts` — 涂鸦风 HUD（米白+粗黑边框，替代深灰底）
- `src/ui/OverlayRenderer.ts` — 弹窗加硬阴影偏移与手绘抖动边
- `src/main.ts` — 实例化 Viewport、绑定 resize、把 Viewport 注入 JoystickInput
- `tests/joystick.test.ts` — 验证新的死区重映射行为

---

## Task 1: Viewport 模块（全屏铺满 + 坐标换算）

**Files:**
- Create: `src/core/Viewport.ts`
- Create: `tests/viewport.test.ts`
- Create: `dist/index.html`
- Modify: `src/main.ts`

**为什么先做这个：** 触摸坐标的换算贯穿所有输入逻辑，Task 2-3 依赖它。

- [ ] **Step 1: 写失败的测试**

**`tests/viewport.test.ts`:**

```ts
import { describe, it, expect } from 'vitest';
import { Viewport } from '../src/core/Viewport';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../src/constants';

describe('Viewport', () => {
  it('letterboxes a wide device (1080x1920) and centers logical canvas', () => {
    const vp = new Viewport(1080, 1920, 2);
    expect(vp.scale).toBeCloseTo(1080 / CANVAS_WIDTH, 5);
    expect(vp.offsetX).toBe(0);
    expect(vp.offsetY).toBe(0);
    expect(vp.cssWidth).toBe(1080);
    expect(vp.cssHeight).toBe(1920);
  });

  it('letterboxes a narrower device (720x1600) by fitting width and centering height', () => {
    const vp = new Viewport(720, 1600, 1);
    expect(vp.scale).toBeCloseTo(1, 5);
    const renderedH = CANVAS_HEIGHT * vp.scale;
    expect(vp.offsetY).toBeCloseTo((1600 - renderedH) / 2, 1);
    expect(vp.offsetX).toBe(0);
  });

  it('letterboxes a wider device (900x1280) by fitting height and centering width', () => {
    const vp = new Viewport(900, 1280, 1);
    expect(vp.scale).toBeCloseTo(1280 / CANVAS_HEIGHT, 5);
    const renderedW = CANVAS_WIDTH * vp.scale;
    expect(vp.offsetX).toBeCloseTo((900 - renderedW) / 2, 1);
    expect(vp.offsetY).toBe(0);
  });

  it('toLogical maps device touch point back to logical canvas coords', () => {
    const vp = new Viewport(1440, 2560, 2);
    const p = vp.toLogical(720, 1280);
    expect(p.x).toBeCloseTo(CANVAS_WIDTH / 2, 1);
    expect(p.y).toBeCloseTo(CANVAS_HEIGHT / 2, 1);
  });

  it('toLogical handles letterbox offset correctly', () => {
    const vp = new Viewport(900, 1280, 1);
    const p = vp.toLogical(50, 640);
    expect(p.x).toBeLessThan(0);
    const center = vp.toLogical(450, 640);
    expect(center.x).toBeCloseTo(CANVAS_WIDTH / 2, 1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- viewport`
Expected: FAIL — `Viewport is not defined`

- [ ] **Step 3: 实现 Viewport**

**`src/core/Viewport.ts`:**

```ts
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

/**
 * 把逻辑分辨率（720×1280）适配到任意设备物理像素。
 * 采用 letterbox（保持宽高比、不裁剪、两侧留黑边）方式。
 */
export class Viewport {
  readonly scale:   number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly cssWidth:  number;
  readonly cssHeight: number;

  constructor(
    readonly deviceWidth:  number,
    readonly deviceHeight: number,
    readonly dpr:          number = 1,
  ) {
    const scaleX = deviceWidth  / CANVAS_WIDTH;
    const scaleY = deviceHeight / CANVAS_HEIGHT;
    this.scale = Math.min(scaleX, scaleY);

    const renderedW = CANVAS_WIDTH  * this.scale;
    const renderedH = CANVAS_HEIGHT * this.scale;
    this.offsetX = (deviceWidth  - renderedW) / 2;
    this.offsetY = (deviceHeight - renderedH) / 2;

    this.cssWidth  = deviceWidth;
    this.cssHeight = deviceHeight;
  }

  toLogical(deviceX: number, deviceY: number): { x: number; y: number } {
    return {
      x: (deviceX - this.offsetX) / this.scale,
      y: (deviceY - this.offsetY) / this.scale,
    };
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- viewport`
Expected: PASS（5 tests）

- [ ] **Step 5: 创建浏览器入口 `dist/index.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>DualBallMirror dev</title></head>
<body><script src="game.js"></script></body></html>
```

- [ ] **Step 6: 集成到 main.ts**

`src/main.ts`：

**整个替换**第 17-35 行的 canvas 创建块为：

```ts
// ── 平台 Canvas 创建 + 视口适配 ────────────────────────────────
import { Viewport } from './core/Viewport';

declare const tt: any;

function getDeviceMetrics(): { width: number; height: number; dpr: number } {
  if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
    const info = tt.getSystemInfoSync();
    return {
      width:  info.windowWidth  ?? info.screenWidth  ?? 720,
      height: info.windowHeight ?? info.screenHeight ?? 1280,
      dpr:    info.pixelRatio   ?? 1,
    };
  }
  return {
    width:  window.innerWidth,
    height: window.innerHeight,
    dpr:    window.devicePixelRatio || 1,
  };
}

const metrics = getDeviceMetrics();
const viewport = new Viewport(metrics.width, metrics.height, metrics.dpr);

const canvas: any = typeof tt !== 'undefined'
  ? tt.createCanvas()
  : (() => {
      let el = document.getElementById('game') as HTMLCanvasElement | null;
      if (!el) {
        el = document.createElement('canvas');
        el.id = 'game';
        document.body.style.margin     = '0';
        document.body.style.padding    = '0';
        document.body.style.overflow   = 'hidden';
        document.body.style.background = '#000';
        document.documentElement.style.height = '100%';
        document.body.style.height     = '100%';
        document.body.appendChild(el);
      }
      el.style.position = 'absolute';
      el.style.left     = '0';
      el.style.top      = '0';
      el.style.width    = viewport.cssWidth  + 'px';
      el.style.height   = viewport.cssHeight + 'px';
      return el;
    })();

// 物理像素 = 设备像素 × dpr，让渲染使用 720×1280 逻辑坐标
canvas.width  = metrics.width  * metrics.dpr;
canvas.height = metrics.height * metrics.dpr;

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function applyViewportTransform(): void {
  ctx.setTransform(
    viewport.scale * metrics.dpr, 0,
    0, viewport.scale * metrics.dpr,
    viewport.offsetX * metrics.dpr,
    viewport.offsetY * metrics.dpr,
  );
}
applyViewportTransform();
```

在 `gameLoop` 顶部 `if (paused || ...) return;` 之后追加一行：

```ts
applyViewportTransform();
```

- [ ] **Step 7: 浏览器手测全屏铺满**

Run: `npm run dev`（一个终端）+ `npx http-server dist -p 8080`（另一终端），浏览器打开 `http://localhost:8080`。
Expected: 浏览器窗口（无论尺寸）下，游戏画布铺满，宽高比保持 9:16，多余区域为黑边；resize 窗口后刷新页面也能铺满。

- [ ] **Step 8: Commit**

```bash
git add src/core/Viewport.ts tests/viewport.test.ts src/main.ts dist/index.html
git commit -m "feat(viewport): add Viewport for letterbox scaling + full-screen canvas"
```

---

## Task 2: 浮动摇杆

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/input/JoystickInput.ts`
- Modify: `src/main.ts`
- Modify: `src/renderer/GameRenderer.ts`
- Create: `tests/joystickInput.test.ts`

- [ ] **Step 1: 写失败的测试**

**`tests/joystickInput.test.ts`:**

```ts
import { describe, it, expect, vi } from 'vitest';
import { JoystickInput } from '../src/input/JoystickInput';
import { Viewport } from '../src/core/Viewport';

const vp = new Viewport(720, 1280, 1);   // 1:1 同分辨率

function makeFakeCanvas() {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  return {
    addEventListener:    (t: string, h: any) => { (listeners[t] ??= []).push(h); },
    removeEventListener: (t: string, h: any) => {
      listeners[t] = (listeners[t] || []).filter(x => x !== h);
    },
    fire(type: string, e: any) { (listeners[type] || []).forEach(h => h(e)); },
    listenerCount(type: string) { return (listeners[type] || []).length; },
  };
}

describe('JoystickInput (floating)', () => {
  it('is invisible and inactive before any touch', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    expect(js.isActive()).toBe(false);
    expect(js.isVisible()).toBe(false);
    expect(js.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('touchstart at (200, 900) makes base appear at (200, 900) and becomes active+visible', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    expect(js.isActive()).toBe(true);
    expect(js.isVisible()).toBe(true);
    const base = js.getBasePos();
    expect(base.x).toBeCloseTo(200, 1);
    expect(base.y).toBeCloseTo(900, 1);
  });

  it('touchend hides joystick and zeros direction', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    canvas.fire('touchmove',  { changedTouches: [{ identifier: 1, clientX: 260, clientY: 900 }] });
    canvas.fire('touchend',   { changedTouches: [{ identifier: 1 }] });
    expect(js.isActive()).toBe(false);
    expect(js.isVisible()).toBe(false);
    expect(js.getDirection()).toEqual({ x: 0, y: 0 });
  });

  it('second touch is ignored while first is active (single-finger joystick)', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    const base1 = js.getBasePos();
    canvas.fire('touchstart', { changedTouches: [{ identifier: 2, clientX: 500, clientY: 500 }] });
    const base2 = js.getBasePos();
    expect(base2.x).toBe(base1.x);
    expect(base2.y).toBe(base1.y);
  });

  it('long-press 1.5s without significant move triggers reset', () => {
    vi.useFakeTimers();
    const onReset = vi.fn();
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, onReset);
    canvas.fire('touchstart', { changedTouches: [{ identifier: 1, clientX: 200, clientY: 900 }] });
    vi.advanceTimersByTime(1500);
    expect(onReset).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('destroy removes all listeners', () => {
    const canvas = makeFakeCanvas();
    const js = new JoystickInput(canvas as any, vp, () => {});
    js.destroy();
    expect(canvas.listenerCount('touchstart')).toBe(0);
    expect(canvas.listenerCount('touchmove')).toBe(0);
    expect(canvas.listenerCount('touchend')).toBe(0);
    expect(canvas.listenerCount('touchcancel')).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- joystickInput`
Expected: FAIL — `isVisible is not a function` / 构造签名不接受 Viewport

- [ ] **Step 3: 修改 constants.ts**

删除第 24-26 行的 `JOYSTICK_BASE_X` / `JOYSTICK_BASE_Y`，**替换**为：

```ts
/** 浮动摇杆 —— 基座位置由 touchstart 决定 */
export const JOYSTICK_RADIUS   = 60;
export const JOYSTICK_DEADZONE = 0.15;
```

- [ ] **Step 4: 重写 JoystickInput**

**整个替换** `src/input/JoystickInput.ts`：

```ts
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
    if (this.touchId !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
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
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- joystickInput`
Expected: PASS（6 tests）

- [ ] **Step 6: 更新 main.ts 注入 viewport**

`src/main.ts` 中 `loadLevel` 内：

```ts
// 旧: joystick = new JoystickInput(canvas, () => resetLevel());
joystick = new JoystickInput(canvas, viewport, () => resetLevel());
```

同样在 `canvas.addEventListener('touchend', ...)` 弹窗按钮 hit-test 中改成：

```ts
const lp = viewport.toLogical(touch.clientX, touch.clientY);
const hit = overlayRenderer.hitTest(lp.x, lp.y);
```

- [ ] **Step 7: 修改 GameRenderer 条件渲染摇杆**

`src/renderer/GameRenderer.ts` 中 `render` 末尾的 `this.drawJoystick(joystick)` 改成：

```ts
if (joystick.isVisible()) this.drawJoystick(joystick);
```

- [ ] **Step 8: 运行全部测试**

Run: `npm test`
Expected: 全部 PASS

- [ ] **Step 9: 浏览器手测**

Run: `npm run dev` & 刷新 `http://localhost:8080`
Expected:
- 加载后摇杆不可见
- 在画布任意位置按下，基座出现在按下位置
- 拖动可控制双球
- 抬起手指摇杆消失，双球停下

- [ ] **Step 10: Commit**

```bash
git add src/constants.ts src/input/JoystickInput.ts tests/joystickInput.test.ts src/main.ts src/renderer/GameRenderer.ts
git commit -m "feat(input): convert fixed joystick to floating (appears at touchstart)"
```

---

## Task 3: 死区平滑（消除输入跳变 bug）

**Files:**
- Modify: `src/input/JoystickLogic.ts`
- Modify: `tests/joystick.test.ts`

**当前 bug：** 死区比例 0.15，touch 偏移 mag = 9.1px 时（刚出死区），输出方向幅度直接 = 0.15。从 0 到 0.15 的瞬间跳变让球突然加速。

**修复方法：** 死区外重映射 [deadzone, 1] → [0, 1]，让输入连续。

- [ ] **Step 1: 改测试，加入死区平滑断言**

**整个替换** `tests/joystick.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { calculateDirection } from '../src/input/JoystickLogic';

describe('JoystickLogic (deadzone re-mapping)', () => {
  it('returns zero when below deadzone', () => {
    const dir = calculateDirection({ x: 4, y: 4 }, 60, 0.15);
    expect(dir.x).toBe(0);
    expect(dir.y).toBe(0);
  });

  it('returns near-zero (not 0.15) just past deadzone — proves continuity', () => {
    const dir = calculateDirection({ x: 9.1, y: 0 }, 60, 0.15);
    const mag = Math.hypot(dir.x, dir.y);
    expect(mag).toBeGreaterThan(0);
    expect(mag).toBeLessThan(0.05);
  });

  it('returns 1 when delta equals radius', () => {
    const dir = calculateDirection({ x: 60, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBe(0);
  });

  it('returns midpoint (~0.5) at half-way between deadzone edge and full radius', () => {
    const dir = calculateDirection({ x: 34.5, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(0.5, 2);
  });

  it('clamps magnitude to 1 when delta exceeds radius', () => {
    const dir = calculateDirection({ x: 200, y: 0 }, 60, 0.15);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it('flips Y so upward screen drag (negative canvas Y) gives positive logic Y', () => {
    const dir = calculateDirection({ x: 0, y: -60 }, 60, 0.15);
    expect(dir.y).toBeCloseTo(1, 5);
    expect(dir.x).toBe(0);
  });

  it('diagonal direction has both components and magnitude <= 1', () => {
    const dir = calculateDirection({ x: 45, y: -45 }, 60, 0.15);
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.y).toBeGreaterThan(0);
    expect(Math.hypot(dir.x, dir.y)).toBeLessThanOrEqual(1 + 1e-9);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- joystick.test`
Expected: 第 2 个 ("returns near-zero just past deadzone") 与第 4 个 ("midpoint ~0.5") FAIL（旧实现分别返回 ~0.15 和 ~0.57）。

- [ ] **Step 3: 实现死区重映射**

**整个替换** `src/input/JoystickLogic.ts`：

```ts
import type { Vec2 } from '../core/levels/types';

/**
 * 偏移量 < radius*deadzone 返回零；超过死区后将 [deadzone, 1] 区间
 * 线性重映射到 [0, 1]，保证输入幅度连续，避免刚出死区跳到 deadzone 比例。
 */
export function calculateDirection(delta: Vec2, radius: number, deadzone: number): Vec2 {
  const mag = Math.hypot(delta.x, delta.y);
  const deadPx = radius * deadzone;
  if (mag < deadPx) return { x: 0, y: 0 };

  const clamped = Math.min(mag, radius);
  const remapped = (clamped - deadPx) / (radius - deadPx);

  return {
    x:  (delta.x / mag) * remapped,
    y: -(delta.y / mag) * remapped || 0,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- joystick`
Expected: 全部 PASS

- [ ] **Step 5: 浏览器手测**

Run: `npm run dev`
Expected: 摇杆稍微偏移出死区时，球缓慢启动而不是瞬间跳一下；推到边缘加速平滑无突变。

- [ ] **Step 6: Commit**

```bash
git add src/input/JoystickLogic.ts tests/joystick.test.ts
git commit -m "fix(joystick): remap deadzone output to [0,1] to eliminate input jump"
```

---

## Task 4: 涂鸦卡通视觉风格

**Files:**
- Modify: `src/constants.ts`
- Create: `src/renderer/PaperBackground.ts`
- Create: `src/renderer/DoodleStyle.ts`
- Modify: `src/renderer/GameRenderer.ts`
- Modify: `src/ui/HUDRenderer.ts`
- Modify: `src/ui/OverlayRenderer.ts`

**参考方案：** `.superpowers/brainstorm/2278-1779420493/content/visual-style.html` C 卡片：
- 米白纸质背景（带噪点斑驳）
- 元素 3-4px `#1a1a1a` 描边
- 硬阴影偏移（4px，无模糊）
- 球体轻微歪斜（±3°）
- 弹窗按钮加硬阴影偏移

不写单测；用浏览器手测+截图对比。

- [ ] **Step 1: 扩充 constants 调色板**

`src/constants.ts` **末尾追加**：

```ts
/** 涂鸦卡通调色板（visual-style.html C 卡片规范） */
export const DOODLE_INK         = '#1a1a1a';
export const DOODLE_PAPER       = '#fffef6';
export const DOODLE_PAPER_DARK  = '#f2ecd8';
export const DOODLE_BALL_BLUE   = '#4a90e2';
export const DOODLE_BALL_YELLOW = '#f5c518';
export const DOODLE_OBSTACLE    = '#e8d9b0';
export const DOODLE_SHADOW      = 'rgba(26,26,26,0.85)';
export const DOODLE_STROKE_PX   = 4;
export const DOODLE_SHADOW_PX   = 4;
```

- [ ] **Step 2: 写 PaperBackground（缓存离屏 canvas）**

**`src/renderer/PaperBackground.ts`:**

```ts
import {
  CANVAS_WIDTH, MAP_TOP, MAP_HEIGHT,
  DOODLE_PAPER, DOODLE_PAPER_DARK,
} from '../constants';

export class PaperBackground {
  private offscreen: HTMLCanvasElement | OffscreenCanvas | null = null;

  ensure(): HTMLCanvasElement | OffscreenCanvas {
    if (this.offscreen) return this.offscreen;
    const off: any = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(CANVAS_WIDTH, MAP_HEIGHT)
      : (() => { const c = document.createElement('canvas');
                 c.width = CANVAS_WIDTH; c.height = MAP_HEIGHT; return c; })();
    const ctx = off.getContext('2d') as CanvasRenderingContext2D;

    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_HEIGHT);

    let s = 12345;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0xffff) / 0xffff; };
    ctx.fillStyle = DOODLE_PAPER_DARK;
    for (let i = 0; i < 800; i++) {
      const x = rand() * CANVAS_WIDTH;
      const y = rand() * MAP_HEIGHT;
      const r = 0.6 + rand() * 1.4;
      ctx.globalAlpha = 0.2 + rand() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.offscreen = off;
    return off;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const bg = this.ensure();
    ctx.drawImage(bg as any, 0, MAP_TOP);
  }
}
```

- [ ] **Step 3: 写 DoodleStyle 工具**

**`src/renderer/DoodleStyle.ts`:**

```ts
import {
  DOODLE_INK, DOODLE_STROKE_PX, DOODLE_SHADOW_PX, DOODLE_SHADOW,
} from '../constants';

export function withHardShadow(
  ctx: CanvasRenderingContext2D,
  pathFn: () => void,
  fill: string,
): void {
  ctx.save();
  ctx.translate(DOODLE_SHADOW_PX, DOODLE_SHADOW_PX);
  ctx.fillStyle = DOODLE_SHADOW;
  pathFn();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = fill;
  pathFn();
  ctx.fill();
  ctx.strokeStyle = DOODLE_INK;
  ctx.lineWidth   = DOODLE_STROKE_PX;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  pathFn();
  ctx.stroke();
}

export function doodleText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, sizePx: number,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font        = `bold ${sizePx}px sans-serif`;
  ctx.textAlign   = align;
  ctx.lineWidth   = Math.max(4, sizePx / 8);
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = DOODLE_INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(text, x, y);
}
```

- [ ] **Step 4: 改造 GameRenderer**

`src/renderer/GameRenderer.ts`：

1. 顶部 imports 追加：
   ```ts
   import { PaperBackground } from './PaperBackground';
   import { withHardShadow } from './DoodleStyle';
   import {
     DOODLE_INK, DOODLE_BALL_BLUE, DOODLE_BALL_YELLOW,
     DOODLE_OBSTACLE, DOODLE_STROKE_PX,
   } from '../constants';
   ```

2. class 顶部加：
   ```ts
   private readonly paper = new PaperBackground();
   ```

3. **整个替换** `render` 中"地图背景/边框"部分（原 `// 地图背景(米白色)` 到 `ctx.strokeRect(...)` 四行）：
   ```ts
   ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
   this.paper.draw(ctx);
   ctx.strokeStyle = DOODLE_INK;
   ctx.lineWidth   = DOODLE_STROKE_PX;
   ctx.lineJoin    = 'round';
   ctx.strokeRect(0, MAP_TOP, CANVAS_WIDTH, MAP_HEIGHT);
   ```

4. **整个替换** `drawBall`：
   ```ts
   private drawBall(x: number, y: number, fill: string): void {
     const { ctx } = this;
     ctx.save();
     ctx.translate(x, y);
     ctx.rotate((fill === DOODLE_BALL_BLUE ? -3 : 3) * Math.PI / 180);
     withHardShadow(ctx, () => {
       ctx.beginPath();
       ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
     }, fill);
     ctx.restore();
   }
   ```
   并把 `render` 中两次 drawBall 调用改成：
   ```ts
   this.drawBall(objects.yellowBody.position.x, objects.yellowBody.position.y, DOODLE_BALL_YELLOW);
   this.drawBall(objects.blueBody.position.x,   objects.blueBody.position.y,   DOODLE_BALL_BLUE);
   ```

5. **整个替换** `drawHole`：
   ```ts
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
   ```

6. **整个替换** `drawObstacle` 内部 rect/circle 分支：
   ```ts
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
   ```

7. **整个替换** `drawJoystick`：
   ```ts
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
   ```

- [ ] **Step 5: 改造 HUDRenderer**

**整个替换** `src/ui/HUDRenderer.ts`：

```ts
import {
  CANVAS_WIDTH, MAP_TOP,
  DOODLE_INK, DOODLE_PAPER, DOODLE_STROKE_PX,
} from '../constants';
import { doodleText } from '../renderer/DoodleStyle';

export class HUDRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(levelIndex: number, elapsed: number, timeLimitSeconds: number): void {
    const { ctx } = this;
    ctx.save();

    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_TOP);

    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = DOODLE_STROKE_PX;
    ctx.beginPath();
    ctx.moveTo(0,            MAP_TOP);
    ctx.lineTo(CANVAS_WIDTH, MAP_TOP);
    ctx.stroke();

    doodleText(ctx, `关卡 ${levelIndex + 1}`, 28, 64, 36, 'left');

    if (timeLimitSeconds > 0) {
      const remaining = Math.max(0, timeLimitSeconds - elapsed);
      const secs      = Math.ceil(remaining);
      const txt       = `${secs}s`;
      ctx.font        = 'bold 36px sans-serif';
      ctx.textAlign   = 'right';
      ctx.lineWidth   = 5;
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = DOODLE_INK;
      ctx.strokeText(txt, CANVAS_WIDTH - 28, 64);
      ctx.fillStyle   = secs <= 10 ? '#e64646' : '#ffffff';
      ctx.fillText(   txt, CANVAS_WIDTH - 28, 64);
    }

    ctx.restore();
  }
}
```

- [ ] **Step 6: 改造 OverlayRenderer 弹窗**

`src/ui/OverlayRenderer.ts`：

1. 顶部 imports 改为：
   ```ts
   import {
     CANVAS_WIDTH, CANVAS_HEIGHT,
     DOODLE_INK, DOODLE_PAPER,
     DOODLE_BALL_YELLOW, DOODLE_BALL_BLUE,
     DOODLE_SHADOW_PX, DOODLE_SHADOW,
   } from '../constants';
   ```

2. **整个替换** `renderWin`（保留 nextBtn 记录）：
   ```ts
   renderWin(isLastLevel: boolean): void {
     const { ctx } = this;
     this.clearButtons();
     ctx.save();

     ctx.fillStyle = 'rgba(0,0,0,0.55)';
     ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

     const pw = 540, ph = 320;
     const px = (CANVAS_WIDTH  - pw) / 2;
     const py = (CANVAS_HEIGHT - ph) / 2;

     ctx.fillStyle = DOODLE_SHADOW;
     this.roundRect(px + DOODLE_SHADOW_PX, py + DOODLE_SHADOW_PX, pw, ph, 22); ctx.fill();
     ctx.fillStyle = DOODLE_PAPER;
     this.roundRect(px, py, pw, ph, 22); ctx.fill();
     ctx.strokeStyle = DOODLE_INK;
     ctx.lineWidth   = 4;
     ctx.lineJoin    = 'round';
     this.roundRect(px, py, pw, ph, 22); ctx.stroke();

     ctx.font      = 'bold 54px sans-serif';
     ctx.fillStyle = DOODLE_INK;
     ctx.textAlign = 'center';
     ctx.fillText('🎉 过关！', CANVAS_WIDTH / 2, py + 96);

     const bw = 240, bh = 70;
     const bx = (CANVAS_WIDTH - bw) / 2;
     const by = py + 188;
     this.nextBtn = { x: bx, y: by, w: bw, h: bh };
     ctx.fillStyle = DOODLE_SHADOW;
     this.roundRect(bx + DOODLE_SHADOW_PX, by + DOODLE_SHADOW_PX, bw, bh, 14); ctx.fill();
     ctx.fillStyle = DOODLE_BALL_YELLOW;
     this.roundRect(bx, by, bw, bh, 14); ctx.fill();
     ctx.strokeStyle = DOODLE_INK;
     ctx.lineWidth   = 4;
     this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
     ctx.font      = 'bold 30px sans-serif';
     ctx.fillStyle = DOODLE_INK;
     ctx.fillText(isLastLevel ? '返回主界面' : '下一关', CANVAS_WIDTH / 2, by + 46);
     ctx.textAlign = 'left';
     ctx.restore();
   }
   ```

3. **整个替换** `renderTimeout`：
   ```ts
   renderTimeout(): void {
     const { ctx } = this;
     this.clearButtons();
     ctx.save();

     ctx.fillStyle = 'rgba(0,0,0,0.55)';
     ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

     const pw = 540, ph = 340;
     const px = (CANVAS_WIDTH  - pw) / 2;
     const py = (CANVAS_HEIGHT - ph) / 2;

     ctx.fillStyle = DOODLE_SHADOW;
     this.roundRect(px + DOODLE_SHADOW_PX, py + DOODLE_SHADOW_PX, pw, ph, 22); ctx.fill();
     ctx.fillStyle = DOODLE_PAPER;
     this.roundRect(px, py, pw, ph, 22); ctx.fill();
     ctx.strokeStyle = DOODLE_INK;
     ctx.lineWidth   = 4;
     ctx.lineJoin    = 'round';
     this.roundRect(px, py, pw, ph, 22); ctx.stroke();

     ctx.font      = 'bold 54px sans-serif';
     ctx.fillStyle = DOODLE_INK;
     ctx.textAlign = 'center';
     ctx.fillText('⏰ 时间到！', CANVAS_WIDTH / 2, py + 96);

     const bw = 320, bh = 70;
     const bx = (CANVAS_WIDTH - bw) / 2;
     const by = py + 188;
     this.retryAdBtn = { x: bx, y: by, w: bw, h: bh };
     ctx.fillStyle = DOODLE_SHADOW;
     this.roundRect(bx + DOODLE_SHADOW_PX, by + DOODLE_SHADOW_PX, bw, bh, 14); ctx.fill();
     ctx.fillStyle = DOODLE_BALL_BLUE;
     this.roundRect(bx, by, bw, bh, 14); ctx.fill();
     ctx.strokeStyle = DOODLE_INK;
     ctx.lineWidth   = 4;
     this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
     ctx.font      = 'bold 28px sans-serif';
     ctx.fillStyle = '#ffffff';
     ctx.lineWidth = 4;
     ctx.lineJoin  = 'round';
     ctx.strokeStyle = DOODLE_INK;
     ctx.strokeText('看广告再试', CANVAS_WIDTH / 2, by + 46);
     ctx.fillText(  '看广告再试', CANVAS_WIDTH / 2, by + 46);
     ctx.textAlign = 'left';
     ctx.restore();
   }
   ```

- [ ] **Step 7: 跑全部测试**

Run: `npm test`
Expected: 全部 PASS

- [ ] **Step 8: 浏览器手测对比 visual-style.html C 卡片**

Run: `npm run dev` + 浏览器 + 同时打开 `.superpowers/brainstorm/2278-1779420493/content/visual-style.html`（独立查看 C 卡片预览）。
Expected:
- 背景米白 + 噪点斑驳
- 球体粗黑描边 + 硬阴影 + 轻微歪斜
- 障碍木色 + 粗黑描边 + 硬阴影
- HUD 米白底 + 关卡名粗黑描边白填充
- 弹窗带粗黑边框 + 4px 硬阴影偏移
- 整体感受接近 visual-style.html C 卡片

如效果有出入，调整 `DOODLE_*` 常量（描边粗细、阴影偏移、颜色亮度），不需要改动结构。

- [ ] **Step 9: Commit**

```bash
git add src/constants.ts src/renderer/PaperBackground.ts src/renderer/DoodleStyle.ts src/renderer/GameRenderer.ts src/ui/HUDRenderer.ts src/ui/OverlayRenderer.ts
git commit -m "feat(ui): apply doodle cartoon style (paper bg, ink strokes, hard shadows)"
```

---

## Task 5: 集成回归验证

**Files:** 无新增，仅清单

- [ ] **Step 1: 跑完整测试套件**

Run: `npm test`
Expected: 全部 PASS（Viewport 5 + JoystickInput 6 + Joystick 7 + 原有 ballController/gameManager/holeDetector）

- [ ] **Step 2: 浏览器手测清单**

按下列清单逐项验证：

- [ ] 窗口宽 1280 / 高 720 时铺满，左右黑边
- [ ] 窗口宽 600 / 高 1200 时铺满，上下黑边
- [ ] 加载完毕摇杆不可见
- [ ] 在右上角按下，基座出现在右上角
- [ ] 在左下角按下，基座出现在左下角
- [ ] 抬起手指摇杆消失
- [ ] 微小拖动（<9px）球不动；超过 9px 后球缓慢启动（没有跳变）
- [ ] 拖到摇杆边缘球以最大速度移动
- [ ] L1 通关弹窗外观符合涂鸦风（粗黑边 + 硬阴影 + 米白底）
- [ ] L3 倒计时数字在 HUD 右侧、有粗黑描边
- [ ] 球体能看到轻微歪斜
- [ ] 背景能看到米白底 + 细小噪点

如全部通过 → ship。如有失败 → 回到对应 Task 修复。

- [ ] **Step 3: 抖音开发者工具真机预览（可选，需 SDK）**

Run: `npm run build`
打开抖音开发者工具加载 `dist/`，真机扫码：
- 摇杆触摸响应位置正确（坐标换算未错位）
- 全屏铺满与状态栏不冲突

- [ ] **Step 4: 最终 commit**

```bash
git add -A
git commit -m "chore: integration verification passed for 4 bug fixes"
```

---

## Self-Review

**Spec 覆盖：**
- ✅ 浮动摇杆 → Task 2
- ✅ 死区跳变 → Task 3
- ✅ 涂鸦卡通风格 → Task 4
- ✅ 全屏铺满 → Task 1

**Placeholder 扫描：** 无 TBD / TODO / "类似 Task N"；每步均有完整代码或命令。

**Type 一致性：**
- `Viewport.toLogical` 返回 `{x, y}`，JoystickInput 调用一致
- `JoystickInput` 构造签名（canvas, viewport, onReset）在测试与 main.ts 注入一致
- `JoystickInput.isVisible()` 在测试与 GameRenderer 条件分支均使用
- `withHardShadow(ctx, pathFn, fill)` 在 GameRenderer 多处用法一致
- `doodleText(ctx, text, x, y, sizePx, align?)` 在 HUDRenderer 用法一致
