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

// ── 平台 Canvas 创建 + 视口适配（抖音小游戏唯一入口） ──────────
import { Viewport } from './core/Viewport';

declare const tt: any;

const info = tt.getSystemInfoSync();
const metrics = {
  width:  info.windowWidth  || info.screenWidth  || 720,
  height: info.windowHeight || info.screenHeight || 1280,
  dpr:    info.pixelRatio   || 1,
};
const viewport = new Viewport(metrics.width, metrics.height, metrics.dpr);

const canvas: any = tt.createCanvas();

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

// letterbox 区域（逻辑坐标外的物理黑边）每帧必须强制清除，
// 否则摇杆等绘制在边界外的内容会永久残留。
function clearFullCanvas(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
applyViewportTransform();

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
let inMenu    = true;   // 启动即处于选关界面，loadLevel 时置 false
let paused    = false;
let lastTime  = 0;
let physAccum = 0;
let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

// 通关后展示弹窗的延时（毫秒），到时自动进入下一关。
const AUTO_ADVANCE_DELAY_MS = 1500;

function clearAutoAdvanceTimer(): void {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

// ── 关卡控制 ────────────────────────────────────────────────────
function loadLevel(index: number): void {
  clearAutoAdvanceTimer();
  if (levelObjects) loader.unload(levelObjects);
  overlayRenderer.clear();

  currentLevelIndex = index;
  inMenu = false;
  const cfg  = LEVELS[index];
  levelObjects = loader.load(cfg);
  if (joystick) joystick.destroy();
  joystick     = new JoystickInput(canvas, viewport, () => resetLevel());
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

function goToMenu(): void {
  clearAutoAdvanceTimer();
  if (levelObjects) { loader.unload(levelObjects); levelObjects = null; }
  if (joystick)     { joystick.destroy();          joystick     = null; }
  gameManager = null;
  inMenu      = true;
  overlayRenderer.clear();
}

function resetLevel(): void {
  loadLevel(currentLevelIndex);
}

function onLevelComplete(): void {
  DouyinBridge.vibrate();
  DouyinBridge.showShare(`我通过了第 ${currentLevelIndex + 1} 关！`);
  const isLastLevel = currentLevelIndex >= LEVELS.length - 1;

  // 通关后自动推进：非最后一关延时进入下一关；最后一关延时返回主界面。
  // gameLoop 会持续重绘 win 弹窗，用户在延时内点击按钮也会触发 clearAutoAdvanceTimer。
  clearAutoAdvanceTimer();
  autoAdvanceTimer = setTimeout(() => {
    autoAdvanceTimer = null;
    if (isLastLevel) goToMenu();
    else             loadLevel(currentLevelIndex + 1);
  }, AUTO_ADVANCE_DELAY_MS);
}

function onTimeout(): void {
  overlayRenderer.renderTimeout();
}

// ── 弹窗按钮点击处理 ────────────────────────────────────────────
canvas.addEventListener('touchend', (e: any) => {
  const touch = e.changedTouches[0];
  if (!touch) return;
  const lp = viewport.toLogical(touch.clientX, touch.clientY);
  const hit = overlayRenderer.hitTest(lp.x, lp.y);

  // 选关界面
  if (inMenu) {
    if (hit === 'level1' || hit === 'level2' || hit === 'level3') {
      loadLevel(Number(hit.slice(5)) - 1);
    }
    return;
  }

  // 通关/超时弹窗
  if (!gameManager) return;
  const state = gameManager.getState();
  if (state !== 'levelComplete' && state !== 'timeout') return;
  if (hit === 'next') {
    if (currentLevelIndex >= LEVELS.length - 1) {
      // 最后一关：返回选关主界面
      goToMenu();
    } else {
      loadLevel(currentLevelIndex + 1);
    }
  } else if (hit === 'retry') {
    // 通关后再玩一次本关
    resetLevel();
  } else if (hit === 'menu') {
    // 超时后返回主界面
    goToMenu();
  } else if (hit === 'retryAd') {
    DouyinBridge.showRewardedAd(
      () => resetLevel(),
      () => overlayRenderer.renderTimeout(),  // 提前关闭广告：重新显示弹窗
    );
  }
});

// ── 切后台暂停 ─────────────────────────────────────────────────
DouyinBridge.onHide(() => { paused = true; });
DouyinBridge.onShow(() => { paused = false; lastTime = 0; });

// ── 游戏主循环 ─────────────────────────────────────────────────
function gameLoop(now: number): void {
  requestAnimationFrame(gameLoop);

  if (paused) return;
  clearFullCanvas();
  applyViewportTransform();

  // 选关界面：每帧重绘（保留按钮 hit 区域）
  if (inMenu) {
    overlayRenderer.renderLevelSelect();
    return;
  }

  if (!levelObjects || !gameManager || !joystick) return;

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

  // 通关 / 超时弹窗需要每帧重绘，否则会被 gameRenderer 的 clearRect 立刻擦掉
  const state = gameManager.getState();
  if (state === 'levelComplete') {
    overlayRenderer.renderWin(
      currentLevelIndex >= LEVELS.length - 1,
      gameManager.getElapsed(),
      currentLevelIndex,
    );
  } else if (state === 'timeout') {
    overlayRenderer.renderTimeout();
  }
}

// ── 启动 ────────────────────────────────────────────────────────
// 启动即停在选关界面（inMenu=true），gameLoop 每帧重绘 renderLevelSelect()
requestAnimationFrame(gameLoop);
