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
