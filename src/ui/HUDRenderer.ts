import {
  CANVAS_WIDTH, MAP_TOP,
  DOODLE_INK, DOODLE_PAPER, DOODLE_STROKE_PX,
} from '../constants';
import { doodleText } from '../renderer/DoodleStyle';

export class HUDRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(levelIndex: number, elapsed: number, timeLimitSeconds: number): void {
    const { ctx } = this;
    ctx.save();

    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_TOP);

    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = DOODLE_STROKE_PX;
    ctx.beginPath();
    ctx.moveTo(0,            MAP_TOP);
    ctx.lineTo(CANVAS_WIDTH, MAP_TOP);
    ctx.stroke();

    doodleText(ctx, `关卡 ${levelIndex + 1}`, 28, 64, 36, 'left');

    if (timeLimitSeconds > 0) {
      const remaining = Math.max(0, timeLimitSeconds - elapsed);
      const secs      = Math.ceil(remaining);
      const txt       = `${secs}s`;
      ctx.font        = 'bold 36px sans-serif';
      ctx.textAlign   = 'right';
      ctx.lineWidth   = 5;
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = DOODLE_INK;
      ctx.strokeText(txt, CANVAS_WIDTH - 28, 64);
      ctx.fillStyle   = secs <= 10 ? '#e64646' : '#ffffff';
      ctx.fillText(   txt, CANVAS_WIDTH - 28, 64);
    }

    ctx.restore();
  }
}
