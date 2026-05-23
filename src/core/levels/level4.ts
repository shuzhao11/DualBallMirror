// src/core/levels/level4.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL4_MAP } from './maps/level4';

export const LEVEL_4: LevelDefinition = {
  config: parseMap(LEVEL4_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 70,
    // 3 在 row8 col6，左最多移 2 格到 col4（empty），右最多移 2 格到 col8（empty）
    // col3 是墙、col9 出屏幕，故 X=2；row7/row9 均有墙，禁止 Y 方向移动
    reactiveBlockOverrides: [{ maxShiftX: 2, maxShiftY: 0 }],
  }),
  meta: {
    title: '第 4 关',
    subtitle: '联动机关 · 镜像控制',
    starTargetSeconds: 45,
  },
};
