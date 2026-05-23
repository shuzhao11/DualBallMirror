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
