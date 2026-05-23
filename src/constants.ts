// src/constants.ts

/** 画布尺寸（竖屏固定 720×1280） */
export const CANVAS_WIDTH  = 720;
export const CANVAS_HEIGHT = 1280;

/** 地图区域（上 160px HUD，下 160px 摇杆区） */
export const MAP_TOP    = 160;
export const MAP_HEIGHT = 960;

/** 地图中心（屏幕坐标） */
export const CENTER_X = CANVAS_WIDTH / 2;           // 360
export const CENTER_Y = MAP_TOP + MAP_HEIGHT / 2;   // 640

/** 球体半径（物理 & 渲染用同一值） */
export const BALL_RADIUS = 28;

/** 每帧施力缩放（Matter.js 力单位较小）。速度与摇杆 magnitude 成正比，此值控制满杆速度。 */
export const FORCE_SCALE = 0.006;

/** 物理固定步长（毫秒） */
export const PHYSICS_STEP_MS = 1000 / 60;

/** 浮动摇杆 —— 基座位置由 touchstart 决定 */
export const JOYSTICK_RADIUS   = 60;
export const JOYSTICK_DEADZONE = 0.15;

/** 涂鸦卡通调色板（visual-style.html C 卡片规范） */
export const DOODLE_INK         = '#1a1a1a';
export const DOODLE_PAPER       = '#fffef6';
export const DOODLE_PAPER_DARK  = '#f2ecd8';
export const DOODLE_BALL_BLUE   = '#4a90e2';
export const DOODLE_BALL_YELLOW = '#f5c518';
export const DOODLE_OBSTACLE    = '#d4a96a';
export const DOODLE_SHADOW      = 'rgba(26,26,26,0.85)';
export const DOODLE_STROKE_PX   = 4;
export const DOODLE_SHADOW_PX   = 4;

/** 球体涂鸦风歪斜角（度） */
export const DOODLE_BALL_TILT_DEG = 3;
