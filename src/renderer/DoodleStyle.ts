import {
  DOODLE_INK, DOODLE_STROKE_PX, DOODLE_SHADOW_PX, DOODLE_SHADOW,
} from '../constants';

export function withHardShadow(
  ctx: CanvasRenderingContext2D,
  pathFn: () => void,
  fill: string,
): void {
  ctx.save();
  ctx.translate(DOODLE_SHADOW_PX, DOODLE_SHADOW_PX);
  ctx.fillStyle = DOODLE_SHADOW;
  pathFn();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = fill;
  pathFn();
  ctx.fill();
  ctx.strokeStyle = DOODLE_INK;
  ctx.lineWidth   = DOODLE_STROKE_PX;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  pathFn();
  ctx.stroke();
}

export function doodleText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, sizePx: number,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font        = `bold ${sizePx}px sans-serif`;
  ctx.textAlign   = align;
  ctx.lineWidth   = Math.max(4, sizePx / 8);
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = DOODLE_INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(text, x, y);
}
