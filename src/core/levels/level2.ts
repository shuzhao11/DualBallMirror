// src/core/levels/level2.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL2_MAP } from './maps/level2';

export const LEVEL_2: LevelDefinition = {
  config: parseMap(LEVEL2_MAP, { holeRadius: 45 }),
  meta: {
    title: '第 2 关',
    subtitle: '双球同入 · 共振时刻',
    starTargetSeconds: 25,
  },
};
