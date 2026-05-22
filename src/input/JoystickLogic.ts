// src/input/JoystickLogic.ts
import type { Vec2 } from '../core/levels/types';

/**
 * 根据触摸偏移量计算摇杆方向向量（逻辑坐标，Y 轴向上）。
 *
 * 偏移量 < radius*deadzone 返回零；超过死区后将 [deadzone, 1] 区间
 * 线性重映射到 [0, 1]，保证输入幅度连续，避免刚出死区跳到 deadzone 比例。
 *
 * @param delta    触摸点相对摇杆基座的偏移（Canvas 坐标，Y 轴向下）
 * @param radius   摇杆物理半径（px）
 * @param deadzone 死区比例（0~1，低于此比例返回零向量）
 * @returns 归一化方向向量，分量 ∈ [-1, 1]，零向量表示无输入
 */
export function calculateDirection(delta: Vec2, radius: number, deadzone: number): Vec2 {
  const mag = Math.hypot(delta.x, delta.y);
  const deadPx = radius * deadzone;
  if (mag < deadPx) return { x: 0, y: 0 };

  // 截断到 [deadPx, radius]，再线性重映射到 [0, 1]
  const clamped = Math.min(mag, radius);
  const remapped = (clamped - deadPx) / (radius - deadPx);

  return {
    x:  (delta.x / mag) * remapped,
    y: -(delta.y / mag) * remapped || 0,  // 翻转 Y：Canvas Y 向下 -> 逻辑 Y 向上；避免 -0
  };
}
