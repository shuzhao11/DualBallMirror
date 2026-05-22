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
