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
