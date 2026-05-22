# 《双球镜像·同步挑战》TypeScript 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 TypeScript + Matter.js + esbuild 实现一款抖音小游戏——两球受力镜像，玩家操控摇杆引导两球同时落洞，共 3 关，全程命令行开发，无需任何 GUI 编辑器操作。

**Architecture:** 无引擎框架，纯原生抖音小游戏 JS 运行时。Matter.js 负责物理，esbuild 打包为单文件 `dist/game.js`。`LevelConfig` TypeScript 对象替代 Unity Prefab，`LevelLoader` 将配置转化为 Matter.js 物理体。游戏主循环在 `main.ts` 中通过 `requestAnimationFrame` 驱动。

**Tech Stack:** TypeScript 5.4, Matter.js 0.19, esbuild 0.21, Vitest 1.6, Canvas 2D API, 抖音小游戏 `tt.*` API

---

## 文件结构一览

| 文件 | 职责 |
|---|---|
| `src/constants.ts` | 全局共享常量（画布尺寸、球半径、力缩放等） |
| `src/core/levels/types.ts` | `Vec2` / `HoleConfig` / `ObstacleConfig` / `LevelConfig` 类型 |
| `src/core/levels/level1.ts` | L1「对称入门」关卡配置对象 |
| `src/core/levels/level2.ts` | L2「牺牲卡位」关卡配置对象 |
| `src/core/levels/level3.ts` | L3「移动障碍」关卡配置对象 |
| `src/input/JoystickLogic.ts` | 纯函数 `calculateDirection(delta, radius, deadzone)` |
| `src/input/JoystickInput.ts` | 触摸事件处理 + 长按重置检测 |
| `src/ball/BallController.ts` | `update(dir)` 对双球施加 ±F 力镜像 |
| `src/ball/HoleDetector.ts` | 距离检测球在洞内 + 停留计时 |
| `src/core/GameManager.ts` | 状态机（loading→playing→levelComplete/timeout） |
| `src/platform/DouyinBridge.ts` | `tt.*` API 封装，浏览器环境自动降级 |
| `src/obstacles/MovingObstacle.ts` | 往返 / 旋转两种移动障碍（L3） |
| `src/core/LevelLoader.ts` | 从 `LevelConfig` 创建/销毁 Matter.js 物理体 |
| `src/renderer/GameRenderer.ts` | Canvas 2D 绘制球、洞、障碍物、摇杆 |
| `src/ui/HUDRenderer.ts` | Canvas 2D 绘制 HUD（关卡名、倒计时） |
| `src/ui/OverlayRenderer.ts` | Canvas 2D 绘制弹窗 + 按钮点击判断 |
| `src/main.ts` | 入口：创建 Canvas、组装所有模块、游戏主循环 |
| `tests/joystick.test.ts` | JoystickLogic 单元测试 |
| `tests/ballController.test.ts` | BallController 单元测试 |
| `tests/holeDetector.test.ts` | HoleDetector 单元测试 |
| `tests/gameManager.test.ts` | GameManager 状态机测试 |
| `package.json` | npm 脚本 + 依赖声明 |
| `tsconfig.json` | TypeScript 编译配置 |
| `vitest.config.ts` | Vitest 测试配置 |
| `project.config.json` | 抖音小游戏项目配置（appid、竖屏） |
| `dist/game.json` | 小游戏入口声明（deviceOrientation、rendererType） |

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `project.config.json`
- Create: `dist/game.json`

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "dual-ball-mirror",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":   "esbuild src/main.ts --bundle --outfile=dist/game.js --watch --sourcemap",
    "build": "esbuild src/main.ts --bundle --minify --outfile=dist/game.js",
    "test":  "vitest run"
  },
  "dependencies": {
    "matter-js": "^0.19.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "esbuild": "^0.21.0",
    "vitest": "^1.6.0",
    "@types/matter-js": "^0.19.0"
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist_types"
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: 创建 `project.config.json`**

```json
{
  "appid": "tt02c1747c9ca60e4e07",
  "projectname": "DualBallMirror",
  "setting": { "orientation": "portrait" },
  "miniprogramRoot": "dist/"
}
```

- [ ] **Step 5: 创建 `dist/game.json`**（小游戏入口声明）

先创建 dist 目录：
```bash
mkdir dist
```

然后创建 `dist/game.json`：
```json
{
  "deviceOrientation": "portrait",
  "rendererType": "canvas"
}
```

- [ ] **Step 6: 安装依赖**

```bash
npm install
```

期望输出：`node_modules/` 目录生成，无 npm 错误。

- [ ] **Step 7: 验证 esbuild 可用**

```bash
npx esbuild --version
```

期望输出：`0.21.x`（具体子版本号不限）

- [ ] **Step 8: 提交**

```bash
git add package.json tsconfig.json vitest.config.ts project.config.json dist/game.json
git commit -m "chore: project scaffold (package.json, tsconfig, vitest, dist/game.json)"
```

---

## Task 2: 共享常量 + 类型定义 + 三关配置

**Files:**
- Create: `src/constants.ts`
- Create: `src/core/levels/types.ts`
- Create: `src/core/levels/level1.ts`
- Create: `src/core/levels/level2.ts`
- Create: `src/core/levels/level3.ts`

- [ ] **Step 1: 创建 `src/constants.ts`**

```ts
// src/constants.ts

/** 画布尺寸（竖屏固定 720×1280） */
export const CANVAS_WIDTH  = 720;
export const CANVAS_HEIGHT = 1280;

/** 地图区域（上 160px HUD，下 160px 摇杆区） */
export const MAP_TOP    = 160;
export const MAP_HEIGHT = 960;

/** 地图中心（屏幕坐标） */
export const CENTER_X = CANVAS_WIDTH / 2;           // 360
export const CENTER_Y = MAP_TOP + MAP_HEIGHT / 2;   // 640

/** 球体半径（物理 & 渲染用同一值） */
export const BALL_RADIUS = 28;

/** 每帧施力缩放（Matter.js 力单位较小） */
export const FORCE_SCALE = 0.003;

/** 物理固定步长（毫秒） */
export const PHYSICS_STEP_MS = 1000 / 60;

/** 浮动摇杆（左下角，固定基座位置） */
export const JOYSTICK_BASE_X   = 120;
export const JOYSTICK_BASE_Y   = MAP_TOP + MAP_HEIGHT + 80; // 1200
export const JOYSTICK_RADIUS   = 60;
export const JOYSTICK_DEADZONE = 0.15;
```

- [ ] **Step 2: 创建 `src/core/levels/types.ts`**

```ts
// src/core/levels/types.ts

export interface Vec2 { x: number; y: number; }

export interface HoleConfig {
  /** 洞口中心（逻辑坐标） */
  position: Vec2;
  radius: number;
  requireBlue: boolean;
  requireYellow: boolean;
}

export interface ObstacleConfig {
  type: 'rect' | 'circle';
  /** 中心位置（逻辑坐标） */
  position: Vec2;
  width?: number;    // rect 专用
  height?: number;   // rect 专用
  radius?: number;   // circle 专用
  moving?: {
    mode: 'patrol' | 'rotate';
    /** patrol 起点偏移（逻辑坐标，相对 position） */
    offsetA?: Vec2;
    /** patrol 终点偏移（逻辑坐标，相对 position） */
    offsetB?: Vec2;
    /** 移动速度（逻辑单位/秒） */
    speed?: number;
    /** 旋转速度（度/秒） */
    rotateSpeed?: number;
  };
}

export interface LevelConfig {
  requireBothBalls: boolean;
  /** 球在洞内停留满足通关的最短时间（秒） */
  holeDwellTime: number;
  /** 时间限制（秒）；0 = 无限制 */
  timeLimitSeconds: number;
  holes: HoleConfig[];
  obstacles: ObstacleConfig[];
  blueSpawn: Vec2;
  yellowSpawn: Vec2;
}
```

- [ ] **Step 3: 创建 `src/core/levels/level1.ts`（L1 对称入门）**

```ts
// src/core/levels/level1.ts
import type { LevelConfig } from './types';

export const LEVEL_1: LevelConfig = {
  requireBothBalls: false,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [
    { position: { x: 0, y: 0 }, radius: 40, requireBlue: true, requireYellow: false },
  ],
  obstacles: [
    { type: 'rect',   position: { x:  200, y:  100 }, width: 80, height: 30 },
    { type: 'rect',   position: { x: -200, y: -100 }, width: 80, height: 30 },
    { type: 'circle', position: { x: -100, y: -150 }, radius: 25 },
    { type: 'circle', position: { x:  100, y:  150 }, radius: 25 },
  ],
  blueSpawn:   { x: -240, y: -320 },
  yellowSpawn: { x:  240, y:  320 },
};
```

- [ ] **Step 4: 创建 `src/core/levels/level2.ts`（L2 牺牲卡位）**

```ts
// src/core/levels/level2.ts
import type { LevelConfig } from './types';

export const LEVEL_2: LevelConfig = {
  requireBothBalls: true,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [
    { position: { x: 0, y: 240 }, radius: 55, requireBlue: true, requireYellow: true },
  ],
  obstacles: [
    { type: 'rect', position: { x: -180, y: -120 }, width: 240, height: 25 },
    { type: 'rect', position: { x:  -50, y:  100 }, width:  25, height: 150 },
    { type: 'rect', position: { x:   50, y:  100 }, width:  25, height: 150 },
    { type: 'rect', position: { x:  220, y:  -50 }, width: 150, height:  25 },
  ],
  blueSpawn:   { x: -240, y: -320 },
  yellowSpawn: { x:  240, y:  320 },
};
```

- [ ] **Step 5: 创建 `src/core/levels/level3.ts`（L3 移动障碍）**

```ts
// src/core/levels/level3.ts
import type { LevelConfig } from './types';

export const LEVEL_3: LevelConfig = {
  requireBothBalls: true,
  holeDwellTime: 0.3,
  timeLimitSeconds: 60,
  holes: [
    { position: { x: -180, y:  300 }, radius: 40, requireBlue: false, requireYellow: true },
    { position: { x:  180, y: -300 }, radius: 40, requireBlue: true,  requireYellow: false },
  ],
  obstacles: [
    {
      type: 'rect', position: { x: 0, y:  150 }, width: 150, height: 25,
      moving: { mode: 'patrol', offsetA: { x: -200, y: 0 }, offsetB: { x: 200, y: 0 }, speed: 120 },
    },
    {
      type: 'rect', position: { x: 0, y: -150 }, width: 150, height: 25,
      moving: { mode: 'patrol', offsetA: { x: 200, y: 0 }, offsetB: { x: -200, y: 0 }, speed: 150 },
    },
    {
      type: 'rect', position: { x: 0, y: 0 }, width: 250, height: 20,
      moving: { mode: 'rotate', rotateSpeed: 30 },
    },
  ],
  blueSpawn:   { x: -240, y: -320 },
  yellowSpawn: { x:  240, y:  320 },
};
```

> 注：`speed` 单位为逻辑坐标/秒，120/150 表示障碍每秒移动 120–150px，往返路程约 400px，约 2.7–3.3 秒一个来回，游戏感合适；如需调整直接改此数值即可。

- [ ] **Step 6: 验证 TypeScript 类型检查通过**

```bash
npx tsc --noEmit
```

期望输出：无报错（仅可能有 `main.ts` 不存在的警告，可忽略）

- [ ] **Step 7: 提交**

```bash
git add src/constants.ts src/core/levels/
git commit -m "feat: shared constants, LevelConfig types, and 3-level data"
```

---

## Task 3: JoystickLogic（纯函数 TDD）

**Files:**
- Create: `src/input/JoystickLogic.ts`
- Create: `tests/joystick.test.ts`

- [ ] **Step 1: 写失败测试 `tests/joystick.test.ts`**

```ts
// tests/joystick.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDirection } from '../src/input/JoystickLogic';

describe('JoystickLogic', () => {
  it('returns zero vector when below deadzone', () => {
    // radius=60, deadzone=0.15 → threshold=9px; magnitude ~5.8 < 9
    const dir = calculateDirection({ x: 4, y: 4 }, 60, 0.15);
    expect(dir.x).toBe(0);
    expect(dir.y).toBe(0);
  });

  it('returns normalized x-direction when dragged right', () => {
    const dir = calculateDirection({ x: 60, y: 0 }, 60, 0.15);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBe(0);
  });

  it('clamps magnitude to 1 when delta exceeds radius', () => {
    const dir = calculateDirection({ x: 200, y: 0 }, 60, 0.15);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it('flips Y so upward screen drag (negative canvas Y) gives positive logic Y', () => {
    // User drags up on screen → delta.y is negative in canvas coordinates
    const dir = calculateDirection({ x: 0, y: -60 }, 60, 0.15);
    expect(dir.y).toBeCloseTo(1, 5);   // Logic Y-up = positive
    expect(dir.x).toBe(0);
  });

  it('diagonal direction has both components and magnitude <= 1', () => {
    const dir = calculateDirection({ x: 45, y: -45 }, 60, 0.15);
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.y).toBeGreaterThan(0);  // Y flipped -> positive
    expect(Math.hypot(dir.x, dir.y)).toBeLessThanOrEqual(1 + 1e-9);
  });
});
```

- [ ] **Step 2: 运行测试——确认失败**

```bash
npm test
```

期望：FAIL，提示 `Cannot find module '../src/input/JoystickLogic'`

- [ ] **Step 3: 实现 `src/input/JoystickLogic.ts`**

```ts
// src/input/JoystickLogic.ts
import type { Vec2 } from '../core/levels/types';

/**
 * 根据触摸偏移量计算摇杆方向向量（逻辑坐标，Y 轴向上）。
 *
 * @param delta    触摸点相对摇杆基座的偏移（Canvas 坐标，Y 轴向下）
 * @param radius   摇杆物理半径（px）
 * @param deadzone 死区比例（0~1，低于此比例返回零向量）
 * @returns 归一化方向向量，分量 ∈ [-1, 1]，零向量表示无输入
 */
export function calculateDirection(delta: Vec2, radius: number, deadzone: number): Vec2 {
  const mag = Math.hypot(delta.x, delta.y);
  if (mag < radius * deadzone) return { x: 0, y: 0 };

  // 超出摇杆半径时截断为 1
  const scale = Math.min(mag, radius) / radius;
  return {
    x:  (delta.x / mag) * scale,
    y: -(delta.y / mag) * scale,  // 翻转 Y：Canvas Y 向下 -> 逻辑 Y 向上
  };
}
```

- [ ] **Step 4: 运行测试——确认通过**

```bash
npm test
```

期望：PASS，5 个测试全绿

- [ ] **Step 5: 提交**

```bash
git add src/input/JoystickLogic.ts tests/joystick.test.ts
git commit -m "feat: JoystickLogic calculateDirection with TDD (5 tests)"
```

---

## Task 4: BallController（力镜像 TDD）

**Files:**
- Create: `src/ball/BallController.ts`
- Create: `tests/ballController.test.ts`

- [ ] **Step 1: 写失败测试 `tests/ballController.test.ts`**

```ts
// tests/ballController.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import Matter from 'matter-js';
import { BallController } from '../src/ball/BallController';

describe('BallController', () => {
  afterEach(() => vi.restoreAllMocks());

  it('applies +F to blue and -F to yellow on x-direction input', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 1, y: 0 });

    expect(spy).toHaveBeenCalledTimes(2);
    const blueForce   = spy.mock.calls[0][2] as Matter.Vector;
    const yellowForce = spy.mock.calls[1][2] as Matter.Vector;

    // Blue force is positive X, yellow force is negative X
    expect(blueForce.x).toBeGreaterThan(0);
    expect(yellowForce.x).toBeLessThan(0);
    // Magnitudes are equal
    expect(blueForce.x).toBeCloseTo(-yellowForce.x, 8);
  });

  it('flips Y: upward logic input (positive y) gives negative screen force for blue', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 0, y: 1 });  // Logic Y-up = positive

    const blueForce = spy.mock.calls[0][2] as Matter.Vector;
    // Matter.js Y-down: upward force = negative Y
    expect(blueForce.y).toBeLessThan(0);
  });

  it('does nothing when direction magnitude is near-zero', () => {
    const blue   = Matter.Bodies.circle(0, 0, 28);
    const yellow = Matter.Bodies.circle(100, 100, 28);
    const spy = vi.spyOn(Matter.Body, 'applyForce');

    const ctrl = new BallController(blue, yellow);
    ctrl.update({ x: 0.005, y: 0 });

    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试——确认失败**

```bash
npm test
```

期望：FAIL，提示 `Cannot find module '../src/ball/BallController'`

- [ ] **Step 3: 实现 `src/ball/BallController.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试——确认通过**

```bash
npm test
```

期望：PASS，3 个 BallController 测试 + 5 个 JoystickLogic 测试全绿

- [ ] **Step 5: 提交**

```bash
git add src/ball/BallController.ts tests/ballController.test.ts
git commit -m "feat: BallController force-mirror with TDD (3 tests)"
```

---

## Task 5: HoleDetector（距离检测 TDD）

**Files:**
- Create: `src/ball/HoleDetector.ts`
- Create: `tests/holeDetector.test.ts`

- [ ] **Step 1: 写失败测试 `tests/holeDetector.test.ts`**

```ts
// tests/holeDetector.test.ts
import { describe, it, expect } from 'vitest';
import Matter from 'matter-js';
import { HoleDetector } from '../src/ball/HoleDetector';
import type { HoleConfig } from '../src/core/levels/types';

// 洞口中心（屏幕坐标）
const HOLE_SCREEN = { x: 360, y: 640 };

// 只要求蓝球的洞配置
const CFG_BLUE_ONLY: HoleConfig = {
  position: { x: 0, y: 0 },  // 逻辑坐标（HoleDetector 内部不使用此字段）
  radius: 40,
  requireBlue: true,
  requireYellow: false,
};

describe('HoleDetector', () => {
  it('isSatisfied is false initially', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);
    expect(det.isSatisfied).toBe(false);
  });

  it('isSatisfied becomes true after dwell >= threshold', () => {
    // blue body placed exactly at hole center -> inside hole
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);  // not required
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);

    det.update(0.1);
    det.update(0.1);
    det.update(0.1);  // 0.3s dwell reached

    expect(det.isSatisfied).toBe(true);
  });

  it('resets dwell timer when required ball exits hole', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);

    det.update(0.2);  // 0.2s accumulated
    expect(det.isSatisfied).toBe(false);

    // 将蓝球移到洞外
    Matter.Body.setPosition(blue, { x: 0, y: 0 });
    det.update(0.2);  // dwell 归零
    expect(det.isSatisfied).toBe(false);
  });

  it('reset() clears accumulated dwell', () => {
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(CFG_BLUE_ONLY, HOLE_SCREEN, 0.3, blue, yellow);
    det.update(0.3);
    expect(det.isSatisfied).toBe(true);

    det.reset();
    expect(det.isSatisfied).toBe(false);
  });

  it('both-balls config: not satisfied unless both inside', () => {
    const cfg: HoleConfig = {
      position: { x: 0, y: 0 },
      radius: 40,
      requireBlue: true,
      requireYellow: true,
    };
    // Only blue inside
    const blue   = Matter.Bodies.circle(HOLE_SCREEN.x, HOLE_SCREEN.y, 28);
    const yellow = Matter.Bodies.circle(0, 0, 28);
    const det = new HoleDetector(cfg, HOLE_SCREEN, 0.3, blue, yellow);
    det.update(0.3);
    expect(det.isSatisfied).toBe(false);  // yellow not inside
  });
});
```

- [ ] **Step 2: 运行测试——确认失败**

```bash
npm test
```

期望：FAIL，提示 `Cannot find module '../src/ball/HoleDetector'`

- [ ] **Step 3: 实现 `src/ball/HoleDetector.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试——确认通过**

```bash
npm test
```

期望：全部测试通过（含之前 8 个 + 本次 5 个 = 13 个）

- [ ] **Step 5: 提交**

```bash
git add src/ball/HoleDetector.ts tests/holeDetector.test.ts
git commit -m "feat: HoleDetector dwell-timer with TDD (5 tests)"
```

---

## Task 6: GameManager 状态机（TDD）

**Files:**
- Create: `src/core/GameManager.ts`
- Create: `tests/gameManager.test.ts`

- [ ] **Step 1: 写失败测试 `tests/gameManager.test.ts`**

```ts
// tests/gameManager.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import Matter from 'matter-js';
import { GameManager } from '../src/core/GameManager';
import { HoleDetector } from '../src/ball/HoleDetector';
import type { LevelConfig, HoleConfig } from '../src/core/levels/types';

/** 辅助：创建一个可通过预灌 dwell 来控制是否满足的 HoleDetector */
function makeDetector(prefilledDwell: boolean): HoleDetector {
  const holePos = { x: 360, y: 640 };
  const cfg: HoleConfig = {
    position: { x: 0, y: 0 }, radius: 40,
    requireBlue: true, requireYellow: false,
  };
  const blue   = Matter.Bodies.circle(holePos.x, holePos.y, 28);  // 在洞内
  const yellow = Matter.Bodies.circle(0, 0, 28);
  const det = new HoleDetector(cfg, holePos, 0.3, blue, yellow);
  if (prefilledDwell) det.update(0.3);  // 预灌满足条件
  return det;
}

const BASE_CFG: LevelConfig = {
  requireBothBalls: false,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [],
  obstacles: [],
  blueSpawn:   { x: 0, y: 0 },
  yellowSpawn: { x: 0, y: 0 },
};

describe('GameManager', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts in "loading" state', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    expect(gm.getState()).toBe('loading');
  });

  it('transitions to "playing" after start()', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    gm.start();
    expect(gm.getState()).toBe('playing');
  });

  it('does not call onComplete while in loading state', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    // 不调用 start()
    gm.update(0.016);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('calls onComplete and enters "levelComplete" when all detectors satisfied', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    gm.start();
    gm.update(0.016);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(gm.getState()).toBe('levelComplete');
  });

  it('calls onTimeout and enters "timeout" when time limit exceeded', () => {
    const onTimeout = vi.fn();
    const cfg = { ...BASE_CFG, timeLimitSeconds: 1 };
    const gm = new GameManager(cfg, [], () => {}, onTimeout);
    gm.start();
    gm.update(1.01);  // 超过 1s 限制
    expect(onTimeout).toHaveBeenCalledOnce();
    expect(gm.getState()).toBe('timeout');
  });

  it('getElapsed() tracks time in playing state', () => {
    const gm = new GameManager(BASE_CFG, [], () => {}, () => {});
    gm.start();
    gm.update(0.5);
    expect(gm.getElapsed()).toBeCloseTo(0.5, 5);
  });

  it('reset() returns to playing and resets elapsed', () => {
    const onComplete = vi.fn();
    const det = makeDetector(true);
    const gm = new GameManager(BASE_CFG, [det], onComplete, () => {});
    gm.start();
    gm.update(0.016);
    expect(gm.getState()).toBe('levelComplete');

    gm.reset([makeDetector(false)]);  // 重置用未满足的 detector
    expect(gm.getState()).toBe('playing');
    expect(gm.getElapsed()).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试——确认失败**

```bash
npm test
```

期望：FAIL，提示 `Cannot find module '../src/core/GameManager'`

- [ ] **Step 3: 实现 `src/core/GameManager.ts`**

```ts
// src/core/GameManager.ts
import type { LevelConfig } from './levels/types';
import type { HoleDetector } from '../ball/HoleDetector';

export type GameState = 'loading' | 'playing' | 'levelComplete' | 'timeout';

export class GameManager {
  private state:   GameState = 'loading';
  private elapsed  = 0;

  constructor(
    private readonly cfg:        LevelConfig,
    private detectors:           HoleDetector[],
    private readonly onComplete: () => void,
    private readonly onTimeout:  () => void,
  ) {}

  start(): void {
    this.state   = 'playing';
    this.elapsed = 0;
  }

  update(dt: number): void {
    if (this.state !== 'playing') return;

    // 时间限制检测
    if (this.cfg.timeLimitSeconds > 0) {
      this.elapsed += dt;
      if (this.elapsed >= this.cfg.timeLimitSeconds) {
        this.state = 'timeout';
        this.onTimeout();
        return;
      }
    }

    // 通关检测：所有洞口 detector 都满足
    if (this.detectors.every(d => d.isSatisfied)) {
      this.state = 'levelComplete';
      this.onComplete();
    }
  }

  getState():   GameState { return this.state; }
  getElapsed(): number    { return this.elapsed; }

  /**
   * 重置游戏（重开本关）。
   * @param freshDetectors 新一组 HoleDetector 实例（由 main.ts 在重建关卡后传入）
   */
  reset(freshDetectors: HoleDetector[]): void {
    this.state     = 'playing';
    this.elapsed   = 0;
    this.detectors = freshDetectors;
  }
}
```

- [ ] **Step 4: 运行测试——确认通过**

```bash
npm test
```

期望：全部测试通过（7 个 GameManager + 之前 13 个 = 20 个）

- [ ] **Step 5: 提交**

```bash
git add src/core/GameManager.ts tests/gameManager.test.ts
git commit -m "feat: GameManager state machine with TDD (7 tests)"
```

---

## Task 7: DouyinBridge（平台 API 封装）

**Files:**
- Create: `src/platform/DouyinBridge.ts`

（DouyinBridge 封装的是外部平台 API，不做单元测试；浏览器环境会通过 `typeof tt !== 'undefined'` 自动降级为 console.log stub。）

- [ ] **Step 1: 创建 `src/platform/DouyinBridge.ts`**

```ts
// src/platform/DouyinBridge.ts

// 抖音小游戏全局对象类型声明
declare const tt: {
  vibrateShort(opts: { type: 'light' | 'medium' | 'heavy' }): void;
  shareAppMessage(opts: { title: string }): void;
  createRewardedVideoAd(opts: { adUnitId: string }): {
    onClose(cb: (res: { isEnded: boolean }) => void): void;
    onError(cb: (err: unknown) => void): void;
    show(): void;
  };
  onHide(cb: () => void): void;
  onShow(cb: () => void): void;
};

const isTT = typeof tt !== 'undefined';

export const DouyinBridge = {
  /** 短震动反馈（通关、碰撞等） */
  vibrate(): void {
    if (isTT) {
      tt.vibrateShort({ type: 'light' });
    } else {
      console.log('[Bridge] vibrate stub');
    }
  },

  /** 分享当前关卡成绩 */
  showShare(title: string): void {
    if (isTT) {
      tt.shareAppMessage({ title });
    } else {
      console.log('[Bridge] share stub:', title);
    }
  },

  /**
   * 播放激励视频广告。
   * 看完后调用 onSuccess；加载失败或提前关闭调用 onFail。
   * 开发环境（非抖音）直接调用 onSuccess。
   */
  showRewardedAd(onSuccess: () => void, onFail?: () => void): void {
    if (!isTT) {
      onSuccess();
      return;
    }
    // 替换为在抖音开发者后台申请的广告单元 ID
    const ad = tt.createRewardedVideoAd({ adUnitId: 'YOUR_AD_UNIT_ID' });
    ad.onClose(res => {
      if (res.isEnded) {
        onSuccess();
      } else {
        onFail?.();
      }
    });
    ad.onError(() => onFail?.());
    ad.show();
  },

  /** 切后台事件（用于暂停游戏循环） */
  onHide(cb: () => void): void {
    if (isTT) tt.onHide(cb);
  },

  /** 切回前台事件（用于恢复游戏循环） */
  onShow(cb: () => void): void {
    if (isTT) tt.onShow(cb);
  },
};
```

- [ ] **Step 2: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 3: 提交**

```bash
git add src/platform/DouyinBridge.ts
git commit -m "feat: DouyinBridge (vibrate/share/ad/lifecycle) with tt stub"
```

---

## Task 8: MovingObstacle（L3 移动障碍）

**Files:**
- Create: `src/obstacles/MovingObstacle.ts`

- [ ] **Step 1: 创建 `src/obstacles/MovingObstacle.ts`**

```ts
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
```

- [ ] **Step 2: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 3: 提交**

```bash
git add src/obstacles/MovingObstacle.ts
git commit -m "feat: MovingObstacle (patrol/rotate) for L3"
```

---

## Task 9: LevelLoader（Matter.js 物理体组装）

**Files:**
- Create: `src/core/LevelLoader.ts`

- [ ] **Step 1: 创建 `src/core/LevelLoader.ts`**

```ts
// src/core/LevelLoader.ts
import Matter from 'matter-js';
import type { LevelConfig, Vec2 } from './levels/types';
import { HoleDetector } from '../ball/HoleDetector';
import { BallController } from '../ball/BallController';
import { MovingObstacle } from '../obstacles/MovingObstacle';
import type { MovingObstacleConfig } from '../obstacles/MovingObstacle';
import {
  CANVAS_WIDTH,
  MAP_TOP, MAP_HEIGHT, CENTER_X, CENTER_Y, BALL_RADIUS,
} from '../constants';

/** 逻辑坐标（Y 轴向上）-> 屏幕坐标（Y 轴向下） */
export function logicToScreen(v: Vec2): { x: number; y: number } {
  return { x: CENTER_X + v.x, y: CENTER_Y - v.y };
}

export interface LevelObjects {
  engine:          Matter.Engine;
  blueBody:        Matter.Body;
  yellowBody:      Matter.Body;
  wallBodies:      Matter.Body[];
  obstacleBodies:  Matter.Body[];
  detectors:       HoleDetector[];
  movingObstacles: MovingObstacle[];
  ballController:  BallController;
}

const WALL_T = 20;  // 边界墙厚度（px）

export class LevelLoader {
  load(cfg: LevelConfig): LevelObjects {
    // 坐标越界警告
    for (const [label, pos] of [
      ['blueSpawn',   cfg.blueSpawn  ] as const,
      ['yellowSpawn', cfg.yellowSpawn] as const,
    ]) {
      if (Math.abs(pos.x) > 360 || Math.abs(pos.y) > 480) {
        console.warn(`[LevelLoader] ${label} out of bounds: (${pos.x}, ${pos.y})`);
      }
    }

    // 物理引擎（无重力，启用高精度碰撞）
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      positionIterations: 10,
    });

    // 双球
    const blueScreen   = logicToScreen(cfg.blueSpawn);
    const yellowScreen = logicToScreen(cfg.yellowSpawn);

    const blueBody = Matter.Bodies.circle(
      blueScreen.x, blueScreen.y, BALL_RADIUS,
      { frictionAir: 0.08, restitution: 0.2, label: 'blue' },
    );
    const yellowBody = Matter.Bodies.circle(
      yellowScreen.x, yellowScreen.y, BALL_RADIUS,
      { frictionAir: 0.08, restitution: 0.2, label: 'yellow' },
    );

    // 地图边界墙（4 面，isStatic）
    const mapBottom = MAP_TOP + MAP_HEIGHT;
    const wallBodies: Matter.Body[] = [
      Matter.Bodies.rectangle(CENTER_X,                MAP_TOP     - WALL_T / 2, CANVAS_WIDTH,            WALL_T, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(CENTER_X,                mapBottom   + WALL_T / 2, CANVAS_WIDTH,            WALL_T, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(-WALL_T / 2,             CENTER_Y,   WALL_T, MAP_HEIGHT + 2 * WALL_T,              { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(CANVAS_WIDTH + WALL_T / 2, CENTER_Y, WALL_T, MAP_HEIGHT + 2 * WALL_T,              { isStatic: true, label: 'wall' }),
    ];

    // 障碍物
    const obstacleBodies:  Matter.Body[]     = [];
    const movingObstacles: MovingObstacle[]  = [];

    for (const obs of cfg.obstacles) {
      if (Math.abs(obs.position.x) > 360 || Math.abs(obs.position.y) > 480) {
        console.warn(`[LevelLoader] obstacle out of bounds: (${obs.position.x}, ${obs.position.y})`);
      }
      const sp = logicToScreen(obs.position);
      const body = obs.type === 'rect'
        ? Matter.Bodies.rectangle(sp.x, sp.y, obs.width!,  obs.height!, { isStatic: true, label: 'obstacle' })
        : Matter.Bodies.circle(   sp.x, sp.y, obs.radius!,               { isStatic: true, label: 'obstacle' });
      obstacleBodies.push(body);

      if (obs.moving) {
        // 将逻辑坐标 offsetA/B 转为屏幕坐标偏移（翻转 Y 分量）
        let moveCfg: MovingObstacleConfig;
        if (obs.moving.mode === 'patrol') {
          const oA = obs.moving.offsetA ?? { x: 0, y: 0 };
          const oB = obs.moving.offsetB ?? { x: 0, y: 0 };
          moveCfg = {
            mode:    'patrol',
            offsetA: { x: oA.x, y: -oA.y },
            offsetB: { x: oB.x, y: -oB.y },
            speed:   obs.moving.speed ?? 100,
          };
        } else {
          moveCfg = {
            mode:        'rotate',
            rotateSpeed: obs.moving.rotateSpeed ?? 30,
          };
        }
        movingObstacles.push(new MovingObstacle(body, moveCfg, sp));
      }
    }

    // 将所有物理体加入世界
    Matter.Composite.add(engine.world, [
      blueBody, yellowBody,
      ...wallBodies,
      ...obstacleBodies,
    ]);

    // 洞口检测器（LevelConfig 逻辑坐标 -> 屏幕坐标）
    const detectors = cfg.holes.map(hole =>
      new HoleDetector(
        hole,
        logicToScreen(hole.position),
        cfg.holeDwellTime,
        blueBody,
        yellowBody,
      ),
    );

    const ballController = new BallController(blueBody, yellowBody);

    return { engine, blueBody, yellowBody, wallBodies, obstacleBodies, detectors, movingObstacles, ballController };
  }

  unload(objects: LevelObjects): void {
    Matter.Composite.clear(objects.engine.world, false);
    Matter.Engine.clear(objects.engine);
  }
}
```

- [ ] **Step 2: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 3: 运行全量测试确认未破坏已通过的测试**

```bash
npm test
```

期望：20 个测试全部通过

- [ ] **Step 4: 提交**

```bash
git add src/core/LevelLoader.ts
git commit -m "feat: LevelLoader (Matter.js body assembly from LevelConfig)"
```

---

## Task 10: JoystickInput（触摸事件 + 长按重置）

**Files:**
- Create: `src/input/JoystickInput.ts`

- [ ] **Step 1: 创建 `src/input/JoystickInput.ts`**

```ts
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
```

- [ ] **Step 2: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 3: 提交**

```bash
git add src/input/JoystickInput.ts
git commit -m "feat: JoystickInput (touch events, long-press reset)"
```

---

## Task 11: GameRenderer（Canvas 2D 涂鸦风格渲染）

**Files:**
- Create: `src/renderer/GameRenderer.ts`

- [ ] **Step 1: 创建 `src/renderer/GameRenderer.ts`**

```ts
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
    this.holeAngle += dt * 1.5;  // 虚线圈每秒转 ~86 度

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
    ctx.rotate(this.holeAngle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawObstacle(cfg: ObstacleConfig, body: Matter.Body): void {
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
```

- [ ] **Step 2: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 3: 提交**

```bash
git add src/renderer/GameRenderer.ts
git commit -m "feat: GameRenderer Canvas 2D doodle-style rendering"
```

---

## Task 12: HUDRenderer + OverlayRenderer

**Files:**
- Create: `src/ui/HUDRenderer.ts`
- Create: `src/ui/OverlayRenderer.ts`

- [ ] **Step 1: 创建 `src/ui/HUDRenderer.ts`**

```ts
// src/ui/HUDRenderer.ts
import { CANVAS_WIDTH, MAP_TOP } from '../constants';

export class HUDRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /**
   * @param levelIndex       当前关卡下标（0-based）
   * @param elapsed          已流逝秒数
   * @param timeLimitSeconds 时间限制（0 = 无限制）
   */
  render(levelIndex: number, elapsed: number, timeLimitSeconds: number): void {
    const { ctx } = this;

    // HUD 背景
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_TOP);

    // 关卡名（白字黑边）
    ctx.font        = 'bold 32px sans-serif';
    ctx.textAlign   = 'left';
    ctx.lineWidth   = 5;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle   = '#ffffff';
    const levelText = `关卡 ${levelIndex + 1}`;
    ctx.strokeText(levelText, 24, 52);
    ctx.fillText(  levelText, 24, 52);

    // 倒计时（仅限时关卡显示）
    if (timeLimitSeconds > 0) {
      const remaining = Math.max(0, timeLimitSeconds - elapsed);
      const secs      = Math.ceil(remaining);
      const timerText = `${secs}s`;
      ctx.textAlign   = 'right';
      ctx.strokeStyle = '#000000';
      ctx.strokeText(timerText, CANVAS_WIDTH - 24, 52);
      ctx.fillStyle = secs <= 10 ? '#ff6666' : '#ffffff';
      ctx.fillText( timerText, CANVAS_WIDTH - 24, 52);
      ctx.textAlign = 'left';
    }
  }
}
```

- [ ] **Step 2: 创建 `src/ui/OverlayRenderer.ts`**

```ts
// src/ui/OverlayRenderer.ts
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface ButtonRect { x: number; y: number; w: number; h: number; }

export class OverlayRenderer {
  private nextBtn:    ButtonRect | null = null;
  private retryAdBtn: ButtonRect | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** 渲染过关弹窗 */
  renderWin(levelIndex: number, isLastLevel: boolean): void {
    const { ctx } = this;
    this.clearButtons();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 弹窗面板
    const pw = 520, ph = 300;
    const px = (CANVAS_WIDTH - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    ctx.fillStyle = '#fffbe6';
    this.roundRect(px, py, pw, ph, 20); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    this.roundRect(px, py, pw, ph, 20); ctx.stroke();

    // 标题
    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 过关！', CANVAS_WIDTH / 2, py + 88);

    // 按钮
    const bw = 220, bh = 64;
    const bx = (CANVAS_WIDTH - bw) / 2;
    const by = py + 172;
    this.nextBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = '#f5c518';
    this.roundRect(bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
    this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(isLastLevel ? '返回主界面' : '下一关', CANVAS_WIDTH / 2, by + 43);
    ctx.textAlign = 'left';
  }

  /** 渲染超时弹窗 */
  renderTimeout(): void {
    const { ctx } = this;
    this.clearButtons();

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pw = 520, ph = 340;
    const px = (CANVAS_WIDTH - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    ctx.fillStyle = '#fffbe6';
    this.roundRect(px, py, pw, ph, 20); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    this.roundRect(px, py, pw, ph, 20); ctx.stroke();

    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.fillText('⏰ 时间到！', CANVAS_WIDTH / 2, py + 88);

    const bw = 300, bh = 64;
    const bx = (CANVAS_WIDTH - bw) / 2;
    const by = py + 172;
    this.retryAdBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = '#5b9bd5';
    this.roundRect(bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
    this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('看广告再试', CANVAS_WIDTH / 2, by + 43);
    ctx.textAlign = 'left';
  }

  /**
   * 点击测试：返回被点击的按钮标识，无则返回 null。
   * @param x  触摸点 clientX（屏幕坐标）
   * @param y  触摸点 clientY（屏幕坐标）
   */
  hitTest(x: number, y: number): 'next' | 'retryAd' | null {
    if (this.nextBtn    && this.inside(x, y, this.nextBtn))    return 'next';
    if (this.retryAdBtn && this.inside(x, y, this.retryAdBtn)) return 'retryAd';
    return null;
  }

  /** 清空弹窗按钮区域（新关开始时调用） */
  clear(): void {
    this.clearButtons();
  }

  private clearButtons(): void {
    this.nextBtn    = null;
    this.retryAdBtn = null;
  }

  private inside(x: number, y: number, r: ButtonRect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x,     y,     x + r, y);
    ctx.closePath();
  }
}
```

- [ ] **Step 3: 确认类型检查**

```bash
npx tsc --noEmit
```

期望：无报错

- [ ] **Step 4: 提交**

```bash
git add src/ui/HUDRenderer.ts src/ui/OverlayRenderer.ts
git commit -m "feat: HUDRenderer and OverlayRenderer (win/timeout overlays)"
```

---

## Task 13: main.ts（入口组装 + 游戏主循环）

**Files:**
- Create: `src/main.ts`

- [ ] **Step 1: 创建 `src/main.ts`**

```ts
// src/main.ts
import Matter from 'matter-js';
import { LEVEL_1 } from './core/levels/level1';
import { LEVEL_2 } from './core/levels/level2';
import { LEVEL_3 } from './core/levels/level3';
import type { LevelConfig } from './core/levels/types';
import { LevelLoader } from './core/LevelLoader';
import type { LevelObjects } from './core/LevelLoader';
import { GameManager } from './core/GameManager';
import { JoystickInput } from './input/JoystickInput';
import { GameRenderer } from './renderer/GameRenderer';
import { HUDRenderer } from './ui/HUDRenderer';
import { OverlayRenderer } from './ui/OverlayRenderer';
import { DouyinBridge } from './platform/DouyinBridge';
import { PHYSICS_STEP_MS } from './constants';

// ── 平台 Canvas 创建 ────────────────────────────────────────────
declare const tt: any;
const canvas: any = typeof tt !== 'undefined'
  ? tt.createCanvas()
  : (() => {
      // 浏览器调试：查找 id="game" 的 canvas，或自动创建
      let el = document.getElementById('game') as HTMLCanvasElement | null;
      if (!el) {
        el = document.createElement('canvas');
        el.id = 'game';
        document.body.style.margin = '0';
        document.body.style.background = '#222';
        document.body.appendChild(el);
      }
      return el;
    })();

canvas.width  = 720;
canvas.height = 1280;

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// ── 模块实例 ────────────────────────────────────────────────────
const LEVELS: LevelConfig[]   = [LEVEL_1, LEVEL_2, LEVEL_3];
const loader          = new LevelLoader();
const gameRenderer    = new GameRenderer(ctx);
const hudRenderer     = new HUDRenderer(ctx);
const overlayRenderer = new OverlayRenderer(ctx);

// ── 游戏状态 ────────────────────────────────────────────────────
let currentLevelIndex = 0;
let levelObjects: LevelObjects  | null = null;
let gameManager:  GameManager   | null = null;
let joystick:     JoystickInput | null = null;
let paused    = false;
let lastTime  = 0;
let physAccum = 0;

// ── 关卡控制 ────────────────────────────────────────────────────
function loadLevel(index: number): void {
  if (levelObjects) loader.unload(levelObjects);
  overlayRenderer.clear();

  const cfg  = LEVELS[index];
  levelObjects = loader.load(cfg);
  joystick     = new JoystickInput(canvas, () => resetLevel());
  gameManager  = new GameManager(
    cfg,
    levelObjects.detectors,
    () => onLevelComplete(),
    () => onTimeout(),
  );
  gameManager.start();
  lastTime  = 0;
  physAccum = 0;
}

function resetLevel(): void {
  loadLevel(currentLevelIndex);
}

function onLevelComplete(): void {
  DouyinBridge.vibrate();
  DouyinBridge.showShare(`我通过了第 ${currentLevelIndex + 1} 关！`);
  overlayRenderer.renderWin(currentLevelIndex, currentLevelIndex >= LEVELS.length - 1);
}

function onTimeout(): void {
  overlayRenderer.renderTimeout();
}

// ── 弹窗按钮点击处理 ────────────────────────────────────────────
canvas.addEventListener('touchend', (e: any) => {
  if (!gameManager) return;
  const state = gameManager.getState();
  if (state !== 'levelComplete' && state !== 'timeout') return;

  const touch = e.changedTouches[0];
  const hit = overlayRenderer.hitTest(touch.clientX, touch.clientY);
  if (hit === 'next') {
    currentLevelIndex = Math.min(currentLevelIndex + 1, LEVELS.length - 1);
    loadLevel(currentLevelIndex);
  } else if (hit === 'retryAd') {
    DouyinBridge.showRewardedAd(() => resetLevel());
  }
});

// ── 切后台暂停 ─────────────────────────────────────────────────
DouyinBridge.onHide(() => { paused = true; });
DouyinBridge.onShow(() => { paused = false; lastTime = 0; });

// ── 游戏主循环 ─────────────────────────────────────────────────
function gameLoop(now: number): void {
  requestAnimationFrame(gameLoop);

  if (paused || !levelObjects || !gameManager || !joystick) return;

  // 首帧跳过（lastTime=0 时 dt 会异常大）
  if (lastTime === 0) { lastTime = now; return; }
  const rawDt  = (now - lastTime) / 1000;
  lastTime = now;
  // 限制 dt 上限：防止切回前台后卡帧雪崩
  const dt = Math.min(rawDt, 0.05);

  if (gameManager.getState() === 'playing') {
    // 1. 施力（力镜像）
    levelObjects.ballController.update(joystick.getDirection());

    // 2. 固定步长物理推进
    physAccum += dt * 1000;
    while (physAccum >= PHYSICS_STEP_MS) {
      Matter.Engine.update(levelObjects.engine, PHYSICS_STEP_MS);
      physAccum -= PHYSICS_STEP_MS;
    }

    // 3. 移动障碍 + 洞口检测 + 通关判定
    levelObjects.movingObstacles.forEach(mo => mo.update(dt));
    levelObjects.detectors.forEach(d => d.update(dt));
    gameManager.update(dt);
  }

  // 4. 渲染（playing/levelComplete/timeout 都渲染，让弹窗可见）
  gameRenderer.render(levelObjects, LEVELS[currentLevelIndex], joystick, dt);
  hudRenderer.render(currentLevelIndex, gameManager.getElapsed(), LEVELS[currentLevelIndex].timeLimitSeconds);
}

// ── 启动 ────────────────────────────────────────────────────────
loadLevel(0);
requestAnimationFrame(gameLoop);
```

- [ ] **Step 2: 运行全量测试**

```bash
npm test
```

期望：**20 个测试全部通过**，无警告。

- [ ] **Step 3: 执行正式构建**

```bash
npm run build
```

期望输出（esbuild）：

```
  dist/game.js  XXX kb

Done in XXms
```

无任何 TypeScript 报错，`dist/game.js` 生成成功。

- [ ] **Step 4: 验证产物文件**

```bash
ls dist/
```

期望：`game.js` 和 `game.json` 两个文件均存在。

- [ ] **Step 5: 最终提交**

```bash
git add src/main.ts
git commit -m "feat: main.ts game loop, level loading, overlay tap handling"
```

---

## Task 14: 全量验证

- [ ] **Step 1: 最终全量测试**

```bash
npm test
```

期望：**20 个测试全部通过**，无任何 skipped 或 failed。

- [ ] **Step 2: 最终正式构建**

```bash
npm run build && ls -lh dist/game.js
```

期望：`dist/game.js` 存在，文件大小在 300–600 KB 之间（主要来自 matter-js）。

- [ ] **Step 3: （可选）启动开发模式**

```bash
npm run dev
```

esbuild 开始监听，每次保存 `src/` 下的文件都会自动重新打包。

在**抖音开发者工具**中：
1. 选择「小游戏」→「导入项目」
2. 目录指向 `C:/Projects/DualBallMirror/dist/`
3. AppID 填写 `tt02c1747c9ca60e4e07`
4. 点击「运行」即可预览

之后修改代码 → esbuild 自动重打包 → 开发者工具自动刷新，无需任何 GUI 编辑器操作。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete MVP - 3 levels, force mirror, 20 tests passing"
```

---

## 附：常见问题排查

| 问题 | 原因 | 解决 |
|---|---|---|
| `npm test` 报 `Cannot find module 'matter-js'` | 未运行 `npm install` | 先运行 `npm install` |
| `npm run build` 报 `No such file: src/main.ts` | Task 13 未执行 | 按 Task 13 创建 `src/main.ts` |
| 两球移动方向相同（非镜像） | BallController 力符号错误 | 检查 `{ x: -f.x, y: -f.y }` 是否传给 yellowBody |
| 推杆上球向下移动 | Y 轴翻转丢失 | 检查 JoystickLogic `y: -(delta.y/mag)*scale` 和 BallController `y: -dir.y*FORCE_SCALE` |
| 球高速穿透障碍 | 物理精度不足 | 确认 LevelLoader 中 `positionIterations: 10` 已设置 |
| L3 移动障碍不动 | speed 值未填 | 确认 level3.ts 中 speed 为 120/150（不是 2） |
| 弹窗按钮点击无反应 | hitTest 坐标系错误 | 检查 `touch.clientX/Y` 是否与 Canvas 坐标系一致 |
