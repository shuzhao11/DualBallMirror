// src/core/levels/level3.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL3_MAP } from './maps/level3';

export const LEVEL_3: LevelDefinition = {
  config: parseMap(LEVEL3_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 60,
    rotateSpeed:      45,   // degrees/second
  }),
  meta: {
    title: '第 3 关',
    subtitle: '穿越机关 · 60 秒挑战',
    starTargetSeconds: 40,
  },
};
