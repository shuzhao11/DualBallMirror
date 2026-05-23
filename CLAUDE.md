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

抖音开发者工具：**`miniprogramRoot="/"`（仓库根）**（见 `project.config.json`）。每次改完代码先跑 `npm run dev` / `build`，再在开发者工具里刷新预览。构建产物是根目录的 `game.js`（`outfile=game.js`），`game.json` 是根目录的小游戏入口声明（rendererType=canvas，portrait），`dist/game.json` 是备份副本，**不要删除其中之一**。

## 架构要点

### 入口与主循环（`src/main.ts`）

- **纯抖音小游戏环境**：`main.ts` 直接调用 `tt.getSystemInfoSync()` 和 `tt.createCanvas()`，无浏览器兼容分支。浏览器调试必须在抖音开发者工具中进行。
- **视口适配**：`Viewport` 从设备尺寸和 DPR 计算 letterbox 的 scale/offset，并通过 `ctx.setTransform(scale*dpr, ...)` 应用。每帧必须先 `clearFullCanvas()`（重置 transform 再清全画布），再 `applyViewportTransform()`，否则 letterbox 边缘会残留绘制内容。
- **固定步长物理 + 可变步长渲染**：累加 `dt`，按 `PHYSICS_STEP_MS = 1000/60` 多次 `Matter.Engine.update`，避免帧率波动改变物理表现。`dt` 上限钳到 0.05 防切后台卡帧雪崩。
- **两层状态**：`inMenu`（`main.ts` 全局布尔）控制是否显示选关界面；`GameManager.getState()`（`loading | playing | levelComplete | timeout`）控制游戏内状态。仅 `!inMenu && playing` 时推进物理逻辑；所有状态都渲染（让 overlay 弹窗可见）。
- 通关后 `AUTO_ADVANCE_DELAY_MS = 1500ms` 自动进入下一关（最后一关返回主界面）；用户点击按钮会 `clearAutoAdvanceTimer()` 取消自动推进。
- 通关/超时弹窗按钮点击在 `main.ts` 的 `touchend` 监听里处理（`overlayRenderer.hitTest`），坐标先经 `viewport.toLogical()` 转换；`JoystickInput` 用 `touchId` 锁定首个触摸点，两者互不干扰。

### 视口与坐标（`src/core/Viewport.ts`）

`Viewport` 负责把设备物理像素映射到逻辑分辨率 720×1280（letterbox 保持宽高比）：

- `viewport.scale`、`offsetX/Y` 由设备尺寸和 DPR 计算。
- `viewport.toLogical(clientX, clientY)` 将触摸坐标转换为逻辑坐标，**所有触摸事件（摇杆 + 按钮 hitTest）都必须经过此转换**。

### 坐标系（重要——这是 bug 源头）

- **逻辑坐标**：原点在地图中心，x ∈ [-360, 360]，y ∈ [-480, 480]，**Y 轴向上**。所有 `LevelConfig`（出生点、洞口、障碍 position、patrol offsetA/B）都用逻辑坐标。
- **屏幕/物理坐标**：Canvas 原点左上，Y 轴向下，Matter.js 直接用屏幕坐标。
- 转换：`screenX = CENTER_X + logicX`，`screenY = CENTER_Y - logicY`（见 `src/core/LevelLoader.ts` 导出的 `logicToScreen(v: Vec2)` 函数）。
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

### 摇杆（`src/input/JoystickInput.ts`）

- 浮动摇杆：`touchstart` 位置即为摇杆基座，不固定在屏幕某处。
- **长按 1500ms（`LONG_PRESS_MS`）不移动**触发 `onReset()` 回调（即重置当前关卡）；移动超过摇杆半径的 30% 会取消长按计时。
- `JoystickInput` 接受 `Viewport` 实例，内部所有坐标通过 `viewport.toLogical()` 转换后处理。

### 平台桥（`src/platform/DouyinBridge.ts`）

所有 `tt.*` 调用必须经过 `DouyinBridge`——它对 `typeof tt === 'undefined'` 提供浏览器 stub（log 打桩），让游戏直接在浏览器跑起来无需 mock。新增平台 API 时遵循这个分支模式。

- **`adUnitId` 当前是 `'YOUR_AD_UNIT_ID'` 占位符**，发版前要替换为真实广告位。
- `DouyinBridge.addToSidebar()` / `canAddToSidebar()`：抖音平台**审核硬要求**，必须调用 `tt.navigateToScene({ scene: 'sidebar' })`，已在通关弹窗和超时弹窗中展示"加入侧边栏"按钮。

## 测试约定

- Vitest，测试文件在 `tests/`，import 用相对路径 `../src/...`。
- 单元测试聚焦纯逻辑：`JoystickLogic.calculateDirection`、`BallController` 的力对称性与 Y 翻转、`HoleDetector` 的 dwell 累积、`GameManager` 的状态机、`Viewport.toLogical`。**不**测 `LevelLoader` 整体或 Matter.Engine 联动。
- 涉及 `Matter.Body.applyForce` 的测试用 `vi.spyOn(Matter.Body, 'applyForce')`，`afterEach(() => vi.restoreAllMocks())`。

## 注意事项

- TypeScript `strict: true`，新增代码必须通过 `npx tsc --noEmit`。
- 不要在 `src/` 里写 HTML/CSS——`main.ts` 是纯小游戏入口，无 DOM。
- 构建产物 `game.js` 在项目根目录（不在 `dist/`），`dist/game.json` 与根目录 `game.json` 均为手写入口声明，**都不要删**。
- 项目曾有 Unity/Tuanjie 方案（已废弃），如在仓库中见到 `Assets/` `ProjectSettings/` 等遗留物请确认后清除，不要重新引入 Unity 工作流。
