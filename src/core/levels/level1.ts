// src/core/levels/level1.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL1_MAP } from './maps/level1';

export const LEVEL_1: LevelDefinition = {
  config: parseMap(LEVEL1_MAP, { holeRadius: 40 }),
  meta: {
    title: '第 1 关',
    subtitle: 'Z 形走廊 · 初识镜像',
    starTargetSeconds: 20,
  },
};
