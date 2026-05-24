// src/core/levels/index.ts
import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';
import { LEVEL_3 } from './level3';
import { LEVEL_4 } from './level4';
import { LEVEL_5 } from './level5';
import { LEVEL_6 } from './level6';
import { LEVEL_7 } from './level7';
import type { LevelDefinition } from './types';

export const ALL_LEVELS: LevelDefinition[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7];

export type { LevelDefinition };
export * from './types';
