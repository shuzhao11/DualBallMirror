import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface ButtonRect { x: number; y: number; w: number; h: number; }

export class OverlayRenderer {
  private nextBtn:    ButtonRect | null = null;
  private retryAdBtn: ButtonRect | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** 渲染过关弹窗 */
  renderWin(levelIndex: number, isLastLevel: boolean): void {
    const { ctx } = this;
    this.clearButtons();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 弹窗面板
    const pw = 520, ph = 300;
    const px = (CANVAS_WIDTH - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    ctx.fillStyle = '#fffbe6';
    this.roundRect(px, py, pw, ph, 20); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    this.roundRect(px, py, pw, ph, 20); ctx.stroke();

    // 标题
    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 过关！', CANVAS_WIDTH / 2, py + 88);

    // 按钮
    const bw = 220, bh = 64;
    const bx = (CANVAS_WIDTH - bw) / 2;
    const by = py + 172;
    this.nextBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = '#f5c518';
    this.roundRect(bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
    this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(isLastLevel ? '返回主界面' : '下一关', CANVAS_WIDTH / 2, by + 43);
    ctx.textAlign = 'left';
  }

  /** 渲染超时弹窗 */
  renderTimeout(): void {
    const { ctx } = this;
    this.clearButtons();

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pw = 520, ph = 340;
    const px = (CANVAS_WIDTH - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    ctx.fillStyle = '#fffbe6';
    this.roundRect(px, py, pw, ph, 20); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    this.roundRect(px, py, pw, ph, 20); ctx.stroke();

    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.fillText('⏰ 时间到！', CANVAS_WIDTH / 2, py + 88);

    const bw = 300, bh = 64;
    const bx = (CANVAS_WIDTH - bw) / 2;
    const by = py + 172;
    this.retryAdBtn = { x: bx, y: by, w: bw, h: bh };
    ctx.fillStyle = '#5b9bd5';
    this.roundRect(bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
    this.roundRect(bx, by, bw, bh, 14); ctx.stroke();
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('看广告再试', CANVAS_WIDTH / 2, by + 43);
    ctx.textAlign = 'left';
  }

  /**
   * 点击测试：返回被点击的按钮标识，无则返回 null。
   * @param x  触摸点 clientX（屏幕坐标）
   * @param y  触摸点 clientY（屏幕坐标）
   */
  hitTest(x: number, y: number): 'next' | 'retryAd' | null {
    if (this.nextBtn    && this.inside(x, y, this.nextBtn))    return 'next';
    if (this.retryAdBtn && this.inside(x, y, this.retryAdBtn)) return 'retryAd';
    return null;
  }

  /** 清空弹窗按钮区域（新关开始时调用） */
  clear(): void {
    this.clearButtons();
  }

  private clearButtons(): void {
    this.nextBtn    = null;
    this.retryAdBtn = null;
  }

  private inside(x: number, y: number, r: ButtonRect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x,     y,     x + r, y);
    ctx.closePath();
  }
}
