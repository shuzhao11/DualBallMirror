// src/core/levels/level7.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL7_MAP } from './maps/level7';

export const LEVEL_7: LevelDefinition = {
  config: parseMap(LEVEL7_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 70,
  }),
  meta: {
    title: '第 7 关',
    subtitle: '镜像聚焦 · 精准入洞',
    starTargetSeconds: 40,
  },
};
