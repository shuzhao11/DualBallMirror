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

/** 每帧施力缩放（Matter.js 力单位较小） */
export const FORCE_SCALE = 0.003;

/** 物理固定步长（毫秒） */
export const PHYSICS_STEP_MS = 1000 / 60;

/** 浮动摇杆（左下角，固定基座位置） */
export const JOYSTICK_BASE_X   = 120;
export const JOYSTICK_BASE_Y   = MAP_TOP + MAP_HEIGHT + 80; // 1200
export const JOYSTICK_RADIUS   = 60;
export const JOYSTICK_DEADZONE = 0.15;
