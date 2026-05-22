import {
  DOODLE_INK, DOODLE_STROKE_PX, DOODLE_SHADOW_PX, DOODLE_SHADOW,
} from '../constants';

export function withHardShadow(
  ctx: CanvasRenderingContext2D,
  pathFn: () => void,
  fill: string,
): void {
  // 阴影段
  ctx.save();
  ctx.translate(DOODLE_SHADOW_PX, DOODLE_SHADOW_PX);
  ctx.fillStyle = DOODLE_SHADOW;
  pathFn();
  ctx.fill();
  ctx.restore();

  // 本体 + 描边，整体用 save/restore 兜底，不污染调用方 ctx
  ctx.save();
  ctx.fillStyle = fill;
  pathFn();
  ctx.fill();
  ctx.strokeStyle = DOODLE_INK;
  ctx.lineWidth   = DOODLE_STROKE_PX;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  pathFn();
  ctx.stroke();
  ctx.restore();
}

export function doodleText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, sizePx: number,
  align: CanvasTextAlign = 'left',
  fillColor: string = '#ffffff',
): void {
  ctx.save();
  ctx.font        = `bold ${sizePx}px sans-serif`;
  ctx.textAlign   = align;
  ctx.lineWidth   = Math.max(4, sizePx / 8);
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = DOODLE_INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle   = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}
