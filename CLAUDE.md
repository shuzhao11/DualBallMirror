# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

《双球镜像·同步挑战》——抖音小游戏（竖屏 720×1280），纯 TypeScript + Matter.js + esbuild 实现，**无 Unity / Tuanjie 依赖**。MVP 3 关。设计/实现说明见 `docs/superpowers/specs/2026-05-22-dual-ball-mirror-ts-design.md` 与 `docs/superpowers/plans/2026-05-22-dual-ball-mirror-ts-impl.md`。

## 常用命令

```bash
npm run dev      # esbuild watch 模式，输出到 dist/game.js
npm run build    # 生产构建（minify, target=es2017）
npm test         # 运行全部 vitest 用例（vitest run）
npx vitest run tests/ballController.test.ts   # 跑单个测试文件
npx vitest run -t "applies +F to blue"        # 按用例名过滤
npx tsc --noEmit                              # 仅类型检查（不产物）
```

抖音开发者工具：**项目根目录指向仓库根，`miniprogramRoot=dist/`**（见 `project.config.json`）。每次改完代码先跑 `npm run dev` / `build`，再在开发者工具里刷新预览。`dist/game.js` 是 esbuild 唯一产物，`dist/game.json` 是小游戏入口声明（rendererType=canvas，portrait）。

## 架构要点

### 入口与主循环（`src/main.ts`）

- 用 `tt.createCanvas()`（小游戏环境）或浏览器 `<canvas id="game">`（开发调试）二选一创建画布；在浏览器无 `tt` 时自动注入 canvas，无需 HTML 模板。
- **固定步长物理 + 可变步长渲染**：累加 `dt`，按 `PHYSICS_STEP_MS = 1000/60` 多次 `Matter.Engine.update`，避免帧率波动改变物理表现。`dt` 上限钳到 0.05 防切后台卡帧雪崩。
- 状态机由 `GameManager.getState()` 驱动：`loading | playing | levelComplete | timeout`。仅 `playing` 推进物理与逻辑；所有状态都渲染（让 overlay 弹窗可见）。
- 通关/超时弹窗的按钮点击在 `main.ts` 的 `touchend` 监听里处理（`overlayRenderer.hitTest`），与 `JoystickInput` 的触摸事件共存——`JoystickInput` 用 `touchId` 锁定首个触摸点，弹窗逻辑读 `changedTouches`，互不干扰。

### 坐标系（重要——这是 bug 源头）

- **逻辑坐标**：原点在地图中心，x ∈ [-360, 360]，y ∈ [-480, 480]，**Y 轴向上**。所有 `LevelConfig`（出生点、洞口、障碍 position、patrol offsetA/B）都用逻辑坐标。
- **屏幕/物理坐标**：Canvas 原点左上，Y 轴向下，Matter.js 直接用屏幕坐标。
- 转换：`screenX = CENTER_X + logicX`，`screenY = CENTER_Y - logicY`（见 `LevelLoader.logicToScreen`）。
- `BallController.update` 对摇杆 dir 做 `y: -dir.y` 翻转，把"逻辑 Y 向上"转回 Matter.js 的"屏幕 Y 向下"。`JoystickLogic.calculateDirection` 同样翻转一次。**新增任何坐标输入/力计算时，先确认在哪个坐标系，再决定是否翻 Y**。

### 关卡加载（`src/core/LevelLoader.ts`）

- `LevelConfig` 是纯数据（见 `src/core/levels/types.ts` 与 `level1/2/3.ts`），`LevelLoader.load(cfg)` 一次性建出 `engine, blueBody, yellowBody, wallBodies, obstacleBodies, detectors, movingObstacles, ballController`，打包成 `LevelObjects` 返回。
- 切关时 `main.ts` 必须先 `loader.unload(oldObjects)`（清世界 + `Engine.clear`）再 `load` 新关卡，并 `joystick.destroy()` 重建——否则 Matter 体和 touch 监听都会泄漏。
- 障碍 `moving` 字段在 load 时就把逻辑坐标 offset 转成屏幕坐标 offset（翻 Y），`MovingObstacle` 内部完全在屏幕坐标系工作。
- 出生点 / 障碍坐标越界（|x|>360 或 |y|>480）只 `console.warn`，不抛错，方便调试。

### 力镜像玩法（核心机制）

`BallController.update(dir)`：对 blueBody 施 `+F`，对 yellowBody 施 `-F`。蓝球被障碍卡住时 Matter 会清零它的速度，**`-F` 仍作用在黄球**——这就是"牺牲卡位"机制的底层原理，无需额外代码。修改 `BallController` 时务必保留这条对称性。

### 通关判定（`HoleDetector`）

每个 `HoleDetector` 持有 `requireBlue / requireYellow` 标志和累积 `dwell` 时间；条件不满足时 `dwell` 立即清零（不容错）。`GameManager` 用 `detectors.every(d => d.isSatisfied)` 判通关。配置 `holeDwellTime` 在 `LevelConfig` 上是全局阈值。

### 平台桥（`src/platform/DouyinBridge.ts`）

所有 `tt.*` 调用必须经过 `DouyinBridge`——它对 `typeof tt === 'undefined'` 提供浏览器 stub（log 打桩），让游戏直接在浏览器跑起来无需 mock。新增平台 API 时遵循这个分支模式。**`adUnitId` 当前是 `'YOUR_AD_UNIT_ID'` 占位符**，发版前要替换为真实广告位。

## 测试约定

- Vitest，测试文件在 `tests/`，import 用相对路径 `../src/...`。
- 单元测试聚焦纯逻辑：`JoystickLogic.calculateDirection`、`BallController` 的力对称性与 Y 翻转、`HoleDetector` 的 dwell 累积、`GameManager` 的状态机。**不**测 `LevelLoader` 整体或 Matter.Engine 联动。
- 涉及 `Matter.Body.applyForce` 的测试用 `vi.spyOn(Matter.Body, 'applyForce')`，`afterEach(() => vi.restoreAllMocks())`。

## 注意事项

- TypeScript `strict: true`，新增代码必须通过 `npx tsc --noEmit`。
- 不要在 `src/` 里写 HTML/CSS——浏览器调试入口由 `main.ts` 动态注入。
- `dist/` 是构建产物，已被 `.gitignore` 排除部分内容，但 `dist/game.json` 是手写的入口文件，**不要删**。
- 项目曾有 Unity/Tuanjie 方案（已废弃），如在仓库中见到 `Assets/` `ProjectSettings/` 等遗留物请确认后清除，不要重新引入 Unity 工作流。
