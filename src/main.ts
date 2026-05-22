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
  if (joystick) joystick.destroy();
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
  overlayRenderer.renderWin(currentLevelIndex >= LEVELS.length - 1);
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
  if (!touch) return;
  const hit = overlayRenderer.hitTest(touch.clientX, touch.clientY);
  if (hit === 'next') {
    if (currentLevelIndex >= LEVELS.length - 1) {
      // 最后一关通关：从第 1 关重新开始
      currentLevelIndex = 0;
    } else {
      currentLevelIndex++;
    }
    loadLevel(currentLevelIndex);
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
