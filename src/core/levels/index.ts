// src/core/levels/index.ts
import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';
import { LEVEL_3 } from './level3';
import type { LevelDefinition } from './types';

export const ALL_LEVELS: LevelDefinition[] = [LEVEL_1, LEVEL_2, LEVEL_3];

export type { LevelDefinition };
export * from './types';
