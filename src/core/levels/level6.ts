// src/core/levels/level6.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL6_MAP } from './maps/level6';

export const LEVEL_6: LevelDefinition = {
  config: parseMap(LEVEL6_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 80,
  }),
  meta: {
    title: '第 6 关',
    subtitle: '迷宫穿越 · 同挤窄道',
    starTargetSeconds: 50,
  },
};
