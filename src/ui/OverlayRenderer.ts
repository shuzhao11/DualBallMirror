import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  DOODLE_INK, DOODLE_PAPER, DOODLE_PAPER_DARK,
  DOODLE_BALL_YELLOW, DOODLE_BALL_BLUE, DOODLE_OBSTACLE,
  DOODLE_SHADOW_PX, DOODLE_SHADOW,
} from '../constants';
import { withHardShadow, doodleText } from '../renderer/DoodleStyle';

interface ButtonRect { x: number; y: number; w: number; h: number; }

export type OverlayHit =
  | 'next' | 'retry' | 'retryAd' | 'menu'
  | 'level1' | 'level2' | 'level3';

interface LevelMeta { title: string; subtitle: string; }
const LEVEL_META: LevelMeta[] = [
  { title: '第 1 关', subtitle: '单球入洞 · 初识镜像' },
  { title: '第 2 关', subtitle: '双球同入 · 共振时刻' },
  { title: '第 3 关', subtitle: '穿越机关 · 60 秒挑战' },
];

export class OverlayRenderer {
  private nextBtn:    ButtonRect | null = null;
  private retryBtn:   ButtonRect | null = null;
  private retryAdBtn: ButtonRect | null = null;
  private menuBtn:    ButtonRect | null = null;
  private levelBtns:  ButtonRect[] = [];  // 索引 0/1/2 对应 level1/2/3

  // 每帧自增的"涂鸦呼吸"相位，让主界面卡片轻微浮动
  private breathPhase = 0;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** 渲染选关主界面（启动时 & 通关返回时显示） */
  renderLevelSelect(): void {
    const { ctx } = this;
    this.clearButtons();
    this.breathPhase += 0.03;
    ctx.save();

    // 整屏纸色 + 暗格纹（模拟笔记本格线）
    this.drawPaperBackdrop();

    // 顶部双球 logo
    this.drawDualBallLogo(CANVAS_WIDTH / 2, 220, 56);

    // 主标题（蓝色填充 + 黑描边）
    doodleText(ctx, '双球镜像', CANVAS_WIDTH / 2, 360, 72, 'center', DOODLE_BALL_BLUE);
    // 副标题（小灰字）
    ctx.font      = '500 22px sans-serif';
    ctx.fillStyle = '#7a7a7a';
    ctx.textAlign = 'center';
    ctx.fillText('DUAL BALL MIRROR', CANVAS_WIDTH / 2, 392);

    // 章节标签
    this.drawChapterRibbon(CANVAS_WIDTH / 2, 460, '选 择 关 卡');

    // 3 张关卡卡片
    const cardW = 540, cardH = 130;
    const cardX = (CANVAS_WIDTH - cardW) / 2;
    const startY = 510;
    const gap    = 160;

    this.levelBtns = [];
    for (let i = 0; i < 3; i++) {
      const breathOffset = Math.sin(this.breathPhase + i * 1.3) * 1.5;
      const by = startY + i * gap + breathOffset;
      this.levelBtns.push({ x: cardX, y: by, w: cardW, h: cardH });
      this.drawLevelCard(cardX, by, cardW, cardH, i);
    }

    // 底部签名
    ctx.font      = '500 20px sans-serif';
    ctx.fillStyle = '#9a9a9a';
    ctx.textAlign = 'center';
    ctx.fillText('v1.1 · doodle physics', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 36);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** 渲染过关弹窗 */
  renderWin(isLastLevel: boolean, elapsedSeconds: number, levelIndex: number): void {
    const { ctx } = this;
    this.clearButtons();
    ctx.save();

    // 半透明暗色背景
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 庆祝彩屑（覆盖整屏，纸面色块）
    this.drawConfetti(0x5A11);

    // 卡片
    const pw = 580, ph = 460;
    const px = (CANVAS_WIDTH  - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    this.drawDoodleCard(px, py, pw, ph, DOODLE_PAPER);

    // 顶部缎带
    this.drawChapterRibbon(CANVAS_WIDTH / 2, py + 60, '🎉  通  关  🎉');

    // 关卡数 + 大字
    doodleText(ctx, `第 ${levelIndex + 1} 关 完 成`, CANVAS_WIDTH / 2, py + 150, 44, 'center', DOODLE_INK);

    // 三星 + 用时
    this.drawStars(CANVAS_WIDTH / 2, py + 210, this.starsForTime(elapsedSeconds, levelIndex));

    ctx.font      = '600 28px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(`用时 ${elapsedSeconds.toFixed(1)} 秒`, CANVAS_WIDTH / 2, py + 290);

    // 按钮区：双行
    const btnY = py + 326;
    // 主行：再玩一次 + 下一关/返回主界面
    const smallBw = 220, smallBh = 64;
    const gap     = 24;
    const totalW  = smallBw * 2 + gap;
    const startX  = (CANVAS_WIDTH - totalW) / 2;

    this.retryBtn = { x: startX, y: btnY, w: smallBw, h: smallBh };
    this.drawButton(this.retryBtn, '再玩一次', DOODLE_PAPER_DARK, DOODLE_INK);

    this.nextBtn = { x: startX + smallBw + gap, y: btnY, w: smallBw, h: smallBh };
    this.drawButton(
      this.nextBtn,
      isLastLevel ? '返回主界面' : '下一关 →',
      isLastLevel ? DOODLE_BALL_BLUE : DOODLE_BALL_YELLOW,
      DOODLE_INK,
    );

    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** 渲染超时弹窗 */
  renderTimeout(): void {
    const { ctx } = this;
    this.clearButtons();
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pw = 580, ph = 420;
    const px = (CANVAS_WIDTH  - pw) / 2;
    const py = (CANVAS_HEIGHT - ph) / 2;
    this.drawDoodleCard(px, py, pw, ph, DOODLE_PAPER);

    // 沙漏图标（涂鸦风）
    this.drawHourglass(CANVAS_WIDTH / 2, py + 100, 40);

    doodleText(ctx, '时 间 到', CANVAS_WIDTH / 2, py + 210, 52, 'center', '#e64646');

    ctx.font      = '500 22px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('看个广告再试一次？', CANVAS_WIDTH / 2, py + 250);

    // 按钮：看广告再试（主） + 返回主界面（次）
    const mainBw = 320, mainBh = 64;
    const mainBx = (CANVAS_WIDTH - mainBw) / 2;
    const mainBy = py + 280;
    this.retryAdBtn = { x: mainBx, y: mainBy, w: mainBw, h: mainBh };
    this.drawButton(this.retryAdBtn, '▶ 看广告再试', DOODLE_BALL_BLUE, '#ffffff');

    const subBw = 200, subBh = 52;
    const subBx = (CANVAS_WIDTH - subBw) / 2;
    const subBy = mainBy + mainBh + 16;
    this.menuBtn = { x: subBx, y: subBy, w: subBw, h: subBh };
    this.drawButton(this.menuBtn, '返回主界面', DOODLE_PAPER_DARK, DOODLE_INK);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ─── hit test ────────────────────────────────────────────────────
  hitTest(x: number, y: number): OverlayHit | null {
    if (this.nextBtn    && this.inside(x, y, this.nextBtn))    return 'next';
    if (this.retryBtn   && this.inside(x, y, this.retryBtn))   return 'retry';
    if (this.retryAdBtn && this.inside(x, y, this.retryAdBtn)) return 'retryAd';
    if (this.menuBtn    && this.inside(x, y, this.menuBtn))    return 'menu';
    for (let i = 0; i < this.levelBtns.length; i++) {
      if (this.inside(x, y, this.levelBtns[i])) return (`level${i + 1}` as OverlayHit);
    }
    return null;
  }

  clear(): void { this.clearButtons(); }

  private clearButtons(): void {
    this.nextBtn    = null;
    this.retryBtn   = null;
    this.retryAdBtn = null;
    this.menuBtn    = null;
    this.levelBtns  = [];
  }

  private inside(x: number, y: number, r: ButtonRect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // ─── 绘制工具 ────────────────────────────────────────────────────

  /** 纸色 + 浅格线背景（笔记本风） */
  private drawPaperBackdrop(): void {
    const { ctx } = this;
    ctx.fillStyle = DOODLE_PAPER;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // 横向格线
    ctx.strokeStyle = 'rgba(180,170,140,0.18)';
    ctx.lineWidth   = 1;
    for (let y = 60; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(CANVAS_WIDTH - 40, y);
      ctx.stroke();
    }
    // 左侧装订红线
    ctx.strokeStyle = 'rgba(220,80,80,0.25)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, CANVAS_HEIGHT);
    ctx.stroke();
  }

  /** 双球涂鸦 logo：蓝黄两球相切叠加 */
  private drawDualBallLogo(cx: number, cy: number, r: number): void {
    const { ctx } = this;
    // 黄球（左下）
    withHardShadow(ctx, () => {
      ctx.beginPath();
      ctx.arc(cx - r * 0.55, cy + r * 0.15, r, 0, Math.PI * 2);
    }, DOODLE_BALL_YELLOW);
    // 蓝球（右上）
    withHardShadow(ctx, () => {
      ctx.beginPath();
      ctx.arc(cx + r * 0.55, cy - r * 0.15, r, 0, Math.PI * 2);
    }, DOODLE_BALL_BLUE);
    // 中央装饰：连接虚线
    ctx.save();
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.6, cy);
    ctx.lineTo(cx + r * 1.6, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /** 顶部缎带式章节标签 */
  private drawChapterRibbon(cx: number, cy: number, text: string): void {
    const { ctx } = this;
    const w = 280, h = 52;
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.save();
    // 阴影
    ctx.fillStyle = DOODLE_SHADOW;
    this.roundRect(x + DOODLE_SHADOW_PX, y + DOODLE_SHADOW_PX, w, h, h / 2); ctx.fill();
    // 本体
    ctx.fillStyle = DOODLE_INK;
    this.roundRect(x, y, w, h, h / 2); ctx.fill();
    // 文字
    ctx.font      = 'bold 26px sans-serif';
    ctx.fillStyle = DOODLE_PAPER;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  /** 单张关卡卡片（带小预览图 + 标题 + 副标） */
  private drawLevelCard(x: number, y: number, w: number, h: number, idx: number): void {
    const { ctx } = this;
    const meta = LEVEL_META[idx];
    const accent = idx % 2 === 0 ? DOODLE_BALL_BLUE : DOODLE_BALL_YELLOW;

    // 阴影
    ctx.fillStyle = DOODLE_SHADOW;
    this.roundRect(x + DOODLE_SHADOW_PX, y + DOODLE_SHADOW_PX, w, h, 20); ctx.fill();
    // 卡片背景（纸色）
    ctx.fillStyle = DOODLE_PAPER;
    this.roundRect(x, y, w, h, 20); ctx.fill();
    // 描边
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 4;
    ctx.lineJoin    = 'round';
    this.roundRect(x, y, w, h, 20); ctx.stroke();
    // 左侧色条（彩色 accent）
    ctx.fillStyle = accent;
    this.roundRect(x + 6, y + 6, 14, h - 12, 6); ctx.fill();
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 2;
    this.roundRect(x + 6, y + 6, 14, h - 12, 6); ctx.stroke();

    // 预览图标：缩小版双球
    this.drawDualBallLogo(x + 80, y + h / 2, 22);

    // 标题
    ctx.font      = 'bold 38px sans-serif';
    ctx.fillStyle = DOODLE_INK;
    ctx.textAlign = 'left';
    ctx.fillText(meta.title, x + 140, y + h / 2 - 4);
    // 副标题
    ctx.font      = '500 20px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(meta.subtitle, x + 140, y + h / 2 + 28);

    // 右侧 GO 圆形箭头
    const arrowCx = x + w - 50;
    const arrowCy = y + h / 2;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(arrowCx, arrowCy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 3;
    ctx.stroke();
    // 箭头
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(arrowCx - 7, arrowCy - 8);
    ctx.lineTo(arrowCx + 7, arrowCy);
    ctx.lineTo(arrowCx - 7, arrowCy + 8);
    ctx.stroke();
  }

  /** 通用 doodle 卡片（弹窗用） */
  private drawDoodleCard(x: number, y: number, w: number, h: number, fill: string): void {
    const { ctx } = this;
    ctx.fillStyle = DOODLE_SHADOW;
    this.roundRect(x + DOODLE_SHADOW_PX, y + DOODLE_SHADOW_PX, w, h, 24); ctx.fill();
    ctx.fillStyle = fill;
    this.roundRect(x, y, w, h, 24); ctx.fill();
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 5;
    ctx.lineJoin    = 'round';
    this.roundRect(x, y, w, h, 24); ctx.stroke();
  }

  /** 通用按钮（带阴影描边） */
  private drawButton(r: ButtonRect, label: string, fill: string, textColor: string): void {
    const { ctx } = this;
    ctx.fillStyle = DOODLE_SHADOW;
    this.roundRect(r.x + DOODLE_SHADOW_PX, r.y + DOODLE_SHADOW_PX, r.w, r.h, 16); ctx.fill();
    ctx.fillStyle = fill;
    this.roundRect(r.x, r.y, r.w, r.h, 16); ctx.fill();
    ctx.strokeStyle = DOODLE_INK;
    ctx.lineWidth   = 4;
    ctx.lineJoin    = 'round';
    this.roundRect(r.x, r.y, r.w, r.h, 16); ctx.stroke();

    ctx.font      = 'bold 26px sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.textBaseline = 'alphabetic';
  }

  /** 三星评级（涂鸦风五角星） */
  private drawStars(cx: number, cy: number, filled: number): void {
    const { ctx } = this;
    const r = 22;
    const gap = 60;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * gap;
      const fill = i < filled ? DOODLE_BALL_YELLOW : '#e0dac6';
      ctx.fillStyle = DOODLE_SHADOW;
      this.starPath(x + DOODLE_SHADOW_PX, cy + DOODLE_SHADOW_PX, r); ctx.fill();
      ctx.fillStyle = fill;
      this.starPath(x, cy, r); ctx.fill();
      ctx.strokeStyle = DOODLE_INK;
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      this.starPath(x, cy, r); ctx.stroke();
    }
  }

  private starPath(cx: number, cy: number, r: number): void {
    const { ctx } = this;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /** 沙漏图标 */
  private drawHourglass(cx: number, cy: number, h: number): void {
    const { ctx } = this;
    const w = h * 0.7;
    ctx.save();
    ctx.strokeStyle = DOODLE_INK;
    ctx.fillStyle   = DOODLE_OBSTACLE;
    ctx.lineWidth   = 4;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - w, cy - h);
    ctx.lineTo(cx + w, cy - h);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + w, cy + h);
    ctx.lineTo(cx - w, cy + h);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 沙粒
    ctx.fillStyle = DOODLE_BALL_YELLOW;
    ctx.beginPath();
    ctx.arc(cx, cy + h * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** 庆祝彩屑：用 LCG 种子保证位置稳定，避免每帧抖动 */
  private drawConfetti(seed: number): void {
    const { ctx } = this;
    let s = seed >>> 0;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0xffff) / 0xffff; };
    const colors = [DOODLE_BALL_BLUE, DOODLE_BALL_YELLOW, '#e64646', '#5cb85c', '#9b6dd4'];
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const x = rand() * CANVAS_WIDTH;
      const y = rand() * CANVAS_HEIGHT * 0.85;
      const c = colors[Math.floor(rand() * colors.length)];
      const rotDeg = (rand() - 0.5) * 60;
      const sz = 8 + rand() * 8;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotDeg * Math.PI / 180);
      ctx.fillStyle = c;
      ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2);
      ctx.restore();
    }
    ctx.restore();
  }

  /** 按完成时间和关卡分配星级（无目标时间则恒 3 星） */
  private starsForTime(elapsed: number, levelIndex: number): number {
    const targets = [15, 25, 40];  // 每关 3 星目标用时
    const t = targets[levelIndex] ?? 30;
    if (elapsed <= t)         return 3;
    if (elapsed <= t * 1.6)   return 2;
    return 1;
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
