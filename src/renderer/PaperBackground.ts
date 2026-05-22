import {
  CANVAS_WIDTH, MAP_TOP, MAP_HEIGHT,
  DOODLE_PAPER, DOODLE_PAPER_DARK,
} from '../constants';

export class PaperBackground {
  private offscreen: HTMLCanvasElement | OffscreenCanvas | null = null;

  ensure(): HTMLCanvasElement | OffscreenCanvas {
    if (this.offscreen) return this.offscreen;
    const off: any = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(CANVAS_WIDTH, MAP_HEIGHT)
      : (() => { const c = document.createElement('canvas');
                 c.width = CANVAS_WIDTH; c.height = MAP_HEIGHT; return c; })();
    const ctx = off.getContext('2d') as CanvasRenderingContext2D;

    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_HEIGHT);

    let s = 12345;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0xffff) / 0xffff; };
    ctx.fillStyle = DOODLE_PAPER_DARK;
    for (let i = 0; i < 800; i++) {
      const x = rand() * CANVAS_WIDTH;
      const y = rand() * MAP_HEIGHT;
      const r = 0.6 + rand() * 1.4;
      ctx.globalAlpha = 0.2 + rand() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.offscreen = off;
    return off;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const bg = this.ensure();
    ctx.drawImage(bg as any, 0, MAP_TOP);
  }
}
