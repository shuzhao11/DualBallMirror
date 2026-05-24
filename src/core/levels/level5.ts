// src/core/levels/level5.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL5_MAP } from './maps/level5';

export const LEVEL_5: LevelDefinition = {
  config: parseMap(LEVEL5_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 70,
    // 3 在 row9 col6，左最多移 2 格到 col4（empty），右最多移 2 格到 col8（empty）
    // col3 是墙、col9 出屏幕，故 X=2；row8/row10 均有墙，禁止 Y 方向移动
    reactiveBlockOverrides: [{ maxShiftX: 2, maxShiftY: 0 }],
  }),
  meta: {
    title: '第 5 关',
    subtitle: '联动机关 · 镜像控制',
    starTargetSeconds: 45,
  },
};
