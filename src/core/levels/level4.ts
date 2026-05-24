// src/core/levels/level4.ts
import type { LevelDefinition } from './types';
import { parseMap } from './mapParser';
import { LEVEL4_MAP } from './maps/level4';

export const LEVEL_4: LevelDefinition = {
  config: parseMap(LEVEL4_MAP, {
    holeRadius:       40,
    timeLimitSeconds: 75,
    // reactive block (3) at col7,row0: wall at col6 blocks left, border blocks up,
    // hole at col7,row1 blocks down → only allow 1-cell rightward slide to col8
    reactiveBlockOverrides: [{ maxShiftX: 1, maxShiftY: 0 }],
  }),
  meta: {
    title: '第 4 关',
    subtitle: '触发机关 · 开路入洞',
    starTargetSeconds: 45,
  },
};
