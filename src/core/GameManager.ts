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

    // 始终追踪已用时间
    this.elapsed += dt;

    // 时间限制检测
    if (this.cfg.timeLimitSeconds > 0 && this.elapsed >= this.cfg.timeLimitSeconds) {
      this.state = 'timeout';
      this.onTimeout();
      return;
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
