import { CANVAS_WIDTH, MAP_TOP } from '../constants';

export class HUDRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /**
   * @param levelIndex       当前关卡下标（0-based）
   * @param elapsed          已流逝秒数
   * @param timeLimitSeconds 时间限制（0 = 无限制）
   */
  render(levelIndex: number, elapsed: number, timeLimitSeconds: number): void {
    const { ctx } = this;

    // HUD 背景
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, MAP_TOP);

    // 关卡名（白字黑边）
    ctx.font        = 'bold 32px sans-serif';
    ctx.textAlign   = 'left';
    ctx.lineWidth   = 5;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle   = '#ffffff';
    const levelText = `关卡 ${levelIndex + 1}`;
    ctx.strokeText(levelText, 24, 52);
    ctx.fillText(  levelText, 24, 52);

    // 倒计时（仅限时关卡显示）
    if (timeLimitSeconds > 0) {
      const remaining = Math.max(0, timeLimitSeconds - elapsed);
      const secs      = Math.ceil(remaining);
      const timerText = `${secs}s`;
      ctx.textAlign   = 'right';
      ctx.strokeStyle = '#000000';
      ctx.strokeText(timerText, CANVAS_WIDTH - 24, 52);
      ctx.fillStyle = secs <= 10 ? '#ff6666' : '#ffffff';
      ctx.fillText( timerText, CANVAS_WIDTH - 24, 52);
      ctx.textAlign = 'left';
    }
  }
}
