# 《双球镜像·同步挑战》设计文档 v2（TypeScript + Matter.js）

**日期**：2026-05-22
**平台**：抖音小游戏（竖屏）
**技术栈**：原生抖音小游戏 + TypeScript + Matter.js + esbuild
**MVP 范围**：3 关
**替代原因**：原 Unity/Tuanjie 方案需要 Editor GUI 手动操作（Prefab、Inspector 连线），本方案全部用代码完成，无任何 GUI 操作依赖。

---

## 1. 核心玩法（保持不变）

### 1.1 镜像机制

**力镜像**：玩家输入方向向量 F，每个物理帧：

```
blueBody.applyForce(+F * speed)
yellowBody.applyForce(-F * speed)
```

两球各自独立受 Matter.js 物理约束（碰撞、摩擦、边界）。蓝球被障碍阻挡时速度被物理引擎清零，`-F` 仍作用于黄球 —— 这是 L2 牺牲卡位机制的底层原理，无需额外代码。

### 1.2 通关条件

| 关卡 | 条件 |
|---|---|
| L1 | 蓝球在目标洞内停留 ≥ 0.3s（力镜像下黄球自动同步） |
| L2 / L3 | 蓝球**且**黄球均在目标洞内停留 ≥ 0.3s |

### 1.3 失败与重置

- **长按任意位置 1.5s** → 重置本关
- **点击"看广告再试"** → 激励视频，看完后重置

---

## 2. 技术架构

### 2.1 屏幕与坐标

- 方向：竖屏固定（720 × 1280）
- 地图区域：720 × 960（上留 160px HUD，下留 160px 摇杆区）
- **逻辑坐标**：原点在地图中心，x ∈ [-360, 360]，y ∈ [-480, 480]，Y 轴向上
- **Canvas 坐标**：原点在左上角，Y 轴向下；渲染时统一转换：
  ```ts
  screenX = centerX + logicX
  screenY = centerY - logicY
  ```

### 2.2 项目结构

```
DualBallMirror-ts/
├── dist/                    ← esbuild 输出，抖音开发者工具指向此目录
│   ├── game.js              ← 打包产物（单文件）
│   └── game.json            ← 小游戏入口声明
├── src/
│   ├── main.ts              ← 入口：tt.createCanvas + 启动游戏循环
│   ├── core/
│   │   ├── GameManager.ts   ← 状态机（Loading/Playing/LevelComplete）
│   │   ├── LevelLoader.ts   ← 从 LevelConfig 创建/销毁 Matter.js 物理体
│   │   └── levels/
│   │       ├── types.ts     ← LevelConfig / HoleConfig / ObstacleConfig 类型定义
│   │       ├── level1.ts    ← L1 配置对象
│   │       ├── level2.ts    ← L2 配置对象
│   │       └── level3.ts    ← L3 配置对象
│   ├── ball/
│   │   ├── BallController.ts  ← 力镜像：applyForce ±F
│   │   └── HoleDetector.ts    ← 距离检测 + 停留计时
│   ├── input/
│   │   ├── JoystickLogic.ts   ← 纯函数：calculate(delta, radius, deadzone)
│   │   └── JoystickInput.ts   ← 触摸事件处理 + 长按检测
│   ├── obstacles/
│   │   └── MovingObstacle.ts  ← 往返/旋转障碍（L3）
│   ├── renderer/
│   │   └── GameRenderer.ts    ← Canvas 2D 绘制所有游戏元素
│   ├── ui/
│   │   ├── HUDRenderer.ts     ← 关卡名、倒计时
│   │   └── OverlayRenderer.ts ← 过关/超时弹窗 + 按钮点击判断
│   └── platform/
│       └── DouyinBridge.ts    ← tt.* API 封装，浏览器环境自动降级
├── tests/
│   ├── joystick.test.ts
│   ├── ballController.test.ts
│   ├── holeDetector.test.ts
│   └── gameManager.test.ts
├── package.json
├── tsconfig.json
└── project.config.json      ← 抖音小游戏配置（appid、竖屏）
```

### 2.3 核心模块职责

| 模块 | 文件 | 职责 |
|---|---|---|
| `GameManager` | `core/GameManager.ts` | 状态机、通关判定、切后台暂停 |
| `LevelLoader` | `core/LevelLoader.ts` | 从 LevelConfig 创建/销毁 Matter.js 物理体 |
| `BallController` | `ball/BallController.ts` | 读摇杆方向，对双球施加 ±F |
| `HoleDetector` | `ball/HoleDetector.ts` | 距离检测球在洞内，累积停留时间 |
| `JoystickLogic` | `input/JoystickLogic.ts` | 纯函数，计算方向向量（可单元测试） |
| `JoystickInput` | `input/JoystickInput.ts` | 触摸事件 → 调用 JoystickLogic，长按重置 |
| `MovingObstacle` | `obstacles/MovingObstacle.ts` | 往返 / 旋转两种模式（L3）|
| `GameRenderer` | `renderer/GameRenderer.ts` | Canvas 2D 绘制球、洞、障碍物、边界 |
| `HUDRenderer` | `ui/HUDRenderer.ts` | Canvas 2D 绘制 HUD |
| `OverlayRenderer` | `ui/OverlayRenderer.ts` | Canvas 2D 绘制弹窗，坐标判断按钮点击 |
| `DouyinBridge` | `platform/DouyinBridge.ts` | 震动/分享/激励视频，浏览器环境降级 |

### 2.4 数据流

```
触摸输入
  └→ JoystickInput（触摸事件）
       └→ JoystickLogic.calculate() → Direction (Vector2)
            └→ BallController.update()
                 ├→ Matter.Body.applyForce(blue,  +F)
                 └→ Matter.Body.applyForce(yellow, -F)
                      └→ Matter.Engine.update()（物理步进）
                           └→ HoleDetector.update()（距离检测）
                                └→ GameManager.update()（轮询通关条件）
                                     └→ 条件满足 → onLevelComplete()
                                          ├→ DouyinBridge.vibrate()
                                          ├→ OverlayRenderer.showWin()
                                          └→ DouyinBridge.showShare()
```

---

## 3. 关卡数据结构

### 3.1 类型定义

```ts
// src/core/levels/types.ts

export interface Vec2 { x: number; y: number; }

export interface HoleConfig {
  position: Vec2;
  radius: number;
  requireBlue: boolean;
  requireYellow: boolean;
}

export interface ObstacleConfig {
  type: 'rect' | 'circle';
  position: Vec2;
  width?: number;    // rect 专用
  height?: number;   // rect 专用
  radius?: number;   // circle 专用
  moving?: {
    mode: 'patrol' | 'rotate';
    offsetA?: Vec2;       // patrol 端点 A（相对 position）
    offsetB?: Vec2;       // patrol 端点 B
    speed?: number;       // 单位/秒
    rotateSpeed?: number; // 度/秒
  };
}

export interface LevelConfig {
  requireBothBalls: boolean;
  holeDwellTime: number;      // 默认 0.3
  timeLimitSeconds: number;   // 0 = 无限制
  holes: HoleConfig[];
  obstacles: ObstacleConfig[];
  blueSpawn: Vec2;
  yellowSpawn: Vec2;
}
```

### 3.2 三关配置（替代 Unity Prefab）

**L1 对称入门**

```ts
// src/core/levels/level1.ts
export const LEVEL_1: LevelConfig = {
  requireBothBalls: false,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [
    { position: { x: 0, y: 0 }, radius: 40,
      requireBlue: true, requireYellow: false }
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

**L2 牺牲卡位**

```ts
// src/core/levels/level2.ts
export const LEVEL_2: LevelConfig = {
  requireBothBalls: true,
  holeDwellTime: 0.3,
  timeLimitSeconds: 0,
  holes: [
    { position: { x: 0, y: 240 }, radius: 55,
      requireBlue: true, requireYellow: true }
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

**L3 移动障碍**

```ts
// src/core/levels/level3.ts
export const LEVEL_3: LevelConfig = {
  requireBothBalls: true,
  holeDwellTime: 0.3,
  timeLimitSeconds: 60,
  holes: [
    { position: { x: -180, y:  300 }, radius: 40,
      requireBlue: false, requireYellow: true },
    { position: { x:  180, y: -300 }, radius: 40,
      requireBlue: true,  requireYellow: false },
  ],
  obstacles: [
    { type: 'rect', position: { x: 0, y:  150 }, width: 150, height: 25,
      moving: { mode: 'patrol', offsetA: { x: -200, y: 0 }, offsetB: { x: 200, y: 0 }, speed: 2 } },
    { type: 'rect', position: { x: 0, y: -150 }, width: 150, height: 25,
      moving: { mode: 'patrol', offsetA: { x: 200, y: 0 }, offsetB: { x: -200, y: 0 }, speed: 2.5 } },
    { type: 'rect', position: { x: 0, y:    0 }, width: 250, height: 20,
      moving: { mode: 'rotate', rotateSpeed: 30 } },
  ],
  blueSpawn:   { x: -240, y: -320 },
  yellowSpawn: { x:  240, y:  320 },
};
```

---

## 4. 物理实现

### 4.1 Matter.js 配置

```ts
const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });

const blueBody = Matter.Bodies.circle(sx, sy, BALL_RADIUS, {
  frictionAir: 0.08,
  restitution: 0.2,
  label: 'blue',
});
```

### 4.2 力镜像核心

```ts
// src/ball/BallController.ts
update(dir: Vec2) {
  if (Math.hypot(dir.x, dir.y) < 0.01) return;
  // 逻辑Y向上，Canvas Y向下，施力时翻转Y
  const f = { x: dir.x * FORCE_SCALE, y: -dir.y * FORCE_SCALE };
  Matter.Body.applyForce(this.blueBody,   this.blueBody.position,   f);
  Matter.Body.applyForce(this.yellowBody, this.yellowBody.position,
                         { x: -f.x, y: -f.y });
}
```

### 4.3 HoleDetector

```ts
// src/ball/HoleDetector.ts
// 构造：new HoleDetector(cfg: HoleConfig, threshold: number, blueBody, yellowBody, screenPos)
// threshold 来自 LevelConfig.holeDwellTime

update(dt: number) {
  const blueIn   = dist(this.blueBody.position,   this.screenPos) < this.cfg.radius + BALL_RADIUS;
  const yellowIn = dist(this.yellowBody.position, this.screenPos) < this.cfg.radius + BALL_RADIUS;
  const met = (!this.cfg.requireBlue || blueIn) && (!this.cfg.requireYellow || yellowIn);
  this.dwell = met ? this.dwell + dt : 0;
}
get isSatisfied() { return this.dwell >= this.threshold; }  // threshold 独立传入
hasBlue()         { return dist(this.blueBody.position,   this.screenPos) < this.cfg.radius + BALL_RADIUS; }
hasYellow()       { return dist(this.yellowBody.position, this.screenPos) < this.cfg.radius + BALL_RADIUS; }
```

---

## 5. 渲染：Canvas 2D 涂鸦风格

无图片资源，全程序化绘制：

| 元素 | 绘制方式 |
|---|---|
| 球体 | `arc` + 硬阴影偏移(4px) + 粗黑描边(3px) |
| 圆洞 | `arc` 填充黑色 + 虚线旋转外圈（每帧更新角度）|
| 矩形障碍 | `fillRect` + `strokeRect`(3px) + 硬阴影 |
| 边界 | `strokeRect` 整体地图边框 |
| HUD 文字 | `fillText` + `strokeText`（白底黑边效果）|
| 弹窗 | 半透明黑 + 圆角矩形 + 按钮区域 |

---

## 6. 构建 & 开发流程

### 6.1 工具链

```json
{
  "scripts": {
    "dev":   "esbuild src/main.ts --bundle --outfile=dist/game.js --watch --sourcemap",
    "build": "esbuild src/main.ts --bundle --minify --outfile=dist/game.js",
    "test":  "vitest run"
  },
  "dependencies":    { "matter-js": "^0.19.0" },
  "devDependencies": {
    "typescript": "^5.4.0",
    "esbuild": "^0.21.0",
    "vitest": "^1.6.0",
    "@types/matter-js": "^0.19.0"
  }
}
```

### 6.2 抖音小游戏配置

```json
// project.config.json
{
  "appid": "tt02c1747c9ca60e4e07",
  "projectname": "DualBallMirror",
  "setting": { "orientation": "portrait" },
  "miniprogramRoot": "dist/"
}
```

### 6.3 dist/game.json

```json
{ "deviceOrientation": "portrait", "rendererType": "canvas" }
```

### 6.4 开发步骤（全命令行，无 GUI）

```
1. npm install
2. npm run dev          ← esbuild 监听，自动重新打包
3. 抖音开发者工具打开 dist/  ← 唯一一次 GUI（新建项目/打开目录）
4. 改代码 → 自动刷新
5. npm run test
6. npm run build → 上传
```

---

## 7. 测试策略（Vitest，纯 TypeScript）

| 测试 | 验证点 |
|---|---|
| `JoystickLogic_ExceedsDeadzone` | 超过死区返回归一化向量 |
| `JoystickLogic_BelowDeadzone` | 低于死区返回零向量 |
| `BallController_MirrorForce` | 蓝球力 +F，黄球力 -F（符号相反） |
| `HoleDetector_DwellSatisfied` | 停留 ≥ 0.3s 时 isSatisfied = true |
| `HoleDetector_ExitResetsDwell` | 球离开后停留时间归零 |
| `GameManager_StateTransitions` | Loading→Playing→LevelComplete→Playing |

---

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| 球高速穿透障碍 | `Matter.Engine.create({ positionIterations: 10 })` |
| 切后台 | `tt.onHide` → 暂停游戏循环；`tt.onShow` → 恢复 |
| 激励视频加载失败 | `onError` 回调降级为直接重置 |
| dt 过大（卡帧） | `dt = Math.min(dt, 0.05)` 上限 50ms |
| LevelConfig 坐标越界 | LevelLoader 加载时 console.warn 提示 |
