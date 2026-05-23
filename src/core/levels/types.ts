// src/core/levels/types.ts

export interface Vec2 { x: number; y: number; }

export interface HoleConfig {
  /** 洞口中心（逻辑坐标） */
  position: Vec2;
  radius: number;
  requireBlue: boolean;
  requireYellow: boolean;
}

export interface ObstacleConfig {
  type: 'rect' | 'circle';
  /** 中心位置（逻辑坐标） */
  position: Vec2;
  width?: number;    // rect 专用
  height?: number;   // rect 专用
  radius?: number;   // circle 专用
  moving?: {
    mode: 'patrol' | 'rotate';
    /** patrol 起点偏移（逻辑坐标，相对 position） */
    offsetA?: Vec2;
    /** patrol 终点偏移（逻辑坐标，相对 position） */
    offsetB?: Vec2;
    /** 移动速度（逻辑单位/秒） */
    speed?: number;
    /** 旋转速度（度/秒） */
    rotateSpeed?: number;
  };
}

/**
 * 触发-响应方块对（粉色 4 + 褐色 3）。
 * 球进入触发区后，响应方块按球位移的反方向以格子步长移动；
 * 球离开触发区后响应方块回到初始位置。
 */
export interface ReactiveBlockPairConfig {
  /** 粉色触发区（4），sensor 体，逻辑坐标 */
  trigger:  { position: Vec2; width: number; height: number };
  /** 褐色响应方块（3），solid 体，逻辑坐标 */
  reactive: { position: Vec2; width: number; height: number };
  /** 每步移动量（逻辑单位），默认 80（一格） */
  cellSize?: number;
  /** X 轴允许偏移的最大格数（±），默认 3 */
  maxShiftX?: number;
  /** Y 轴允许偏移的最大格数（±），默认 3 */
  maxShiftY?: number;
}

export interface LevelConfig {
  requireBothBalls: boolean;
  /** 球在洞内停留满足通关的最短时间（秒） */
  holeDwellTime: number;
  /** 时间限制（秒）；0 = 无限制 */
  timeLimitSeconds: number;
  holes: HoleConfig[];
  obstacles: ObstacleConfig[];
  blueSpawn: Vec2;
  yellowSpawn: Vec2;
  /** 触发-响应方块对（可选，用于 level4+ 的联动机关） */
  reactiveBlockPairs?: ReactiveBlockPairConfig[];
}

export interface LevelMeta {
  title: string;
  subtitle: string;
  /** 3 星评级目标用时（秒）：≤ target 得 3 星，≤ target×1.6 得 2 星，否则 1 星 */
  starTargetSeconds: number;
}

export interface LevelDefinition {
  config: LevelConfig;
  meta: LevelMeta;
}
