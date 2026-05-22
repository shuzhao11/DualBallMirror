import {
  CANVAS_WIDTH, MAP_TOP, MAP_HEIGHT,
  DOODLE_PAPER, DOODLE_PAPER_DARK,
} from '../constants';

export class PaperBackground {
  private offscreen: HTMLCanvasElement | OffscreenCanvas | null = null;

  ensure(): HTMLCanvasElement | OffscreenCanvas | null {
    if (this.offscreen) return this.offscreen;

    const off = (() => {
      // 1. 优先 OffscreenCanvas（浏览器 + 部分新版抖音）
      try {
        if (typeof OffscreenCanvas !== 'undefined') {
          return new OffscreenCanvas(CANVAS_WIDTH, MAP_HEIGHT);
        }
      } catch { /* OffscreenCanvas 构造失败，继续 fallback */ }

      // 2. 浏览器：document.createElement
      if (typeof document !== 'undefined' && document.createElement) {
        const c = document.createElement('canvas');
        c.width = CANVAS_WIDTH; c.height = MAP_HEIGHT;
        return c;
      }

      // 3. 抖音小游戏：tt.createCanvas（typed any）
      const ttGlobal = (globalThis as any).tt;
      if (ttGlobal && typeof ttGlobal.createCanvas === 'function') {
        const c = ttGlobal.createCanvas();
        c.width = CANVAS_WIDTH; c.height = MAP_HEIGHT;
        return c;
      }

      return null;
    })();

    if (!off) { this.offscreen = null; return null; }

    const ctx = (off as any).getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) { this.offscreen = null; return null; }

    // 米白底
    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_HEIGHT);

    // 固定种子：保证每次启动噪点位置一致，避免页面刷新时纸面"闪烁"
    // 公式 (s*1664525 + 1013904223) >>> 0 是 Numerical Recipes 经典 LCG 常数
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
    if (bg) {
      ctx.drawImage(bg as any, 0, MAP_TOP);
    } else {
      // 全失败降级：纯色米白填充
      ctx.fillStyle = DOODLE_PAPER;
      ctx.fillRect(0, MAP_TOP, CANVAS_WIDTH, MAP_HEIGHT);
    }
  }
}
