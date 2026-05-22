// src/input/JoystickLogic.ts
import type { Vec2 } from '../core/levels/types';

/**
 * 根据触摸偏移量计算摇杆方向向量（逻辑坐标，Y 轴向上）。
 *
 * @param delta    触摸点相对摇杆基座的偏移（Canvas 坐标，Y 轴向下）
 * @param radius   摇杆物理半径（px）
 * @param deadzone 死区比例（0~1，低于此比例返回零向量）
 * @returns 归一化方向向量，分量 ∈ [-1, 1]，零向量表示无输入
 */
export function calculateDirection(delta: Vec2, radius: number, deadzone: number): Vec2 {
  const mag = Math.hypot(delta.x, delta.y);
  if (mag < radius * deadzone) return { x: 0, y: 0 };

  // 超出摇杆半径时截断为 1
  const scale = Math.min(mag, radius) / radius;
  return {
    x:  (delta.x / mag) * scale,
    y: -(delta.y / mag) * scale || 0,  // 翻转 Y：Canvas Y 向下 -> 逻辑 Y 向上；避免 -0
  };
}
