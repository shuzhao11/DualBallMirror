import { describe, it, expect } from 'vitest';
import { Viewport } from '../src/core/Viewport';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../src/constants';

describe('Viewport', () => {
  it('letterboxes a wide device (1080x1920) and centers logical canvas', () => {
    const vp = new Viewport(1080, 1920, 2);
    expect(vp.scale).toBeCloseTo(1080 / CANVAS_WIDTH, 5);
    expect(vp.offsetX).toBe(0);
    expect(vp.offsetY).toBe(0);
    expect(vp.cssWidth).toBe(1080);
    expect(vp.cssHeight).toBe(1920);
  });

  it('letterboxes a narrower device (720x1600) by fitting width and centering height', () => {
    const vp = new Viewport(720, 1600, 1);
    expect(vp.scale).toBeCloseTo(1, 5);
    const renderedH = CANVAS_HEIGHT * vp.scale;
    expect(vp.offsetY).toBeCloseTo((1600 - renderedH) / 2, 1);
    expect(vp.offsetX).toBe(0);
  });

  it('letterboxes a wider device (900x1280) by fitting height and centering width', () => {
    const vp = new Viewport(900, 1280, 1);
    expect(vp.scale).toBeCloseTo(1280 / CANVAS_HEIGHT, 5);
    const renderedW = CANVAS_WIDTH * vp.scale;
    expect(vp.offsetX).toBeCloseTo((900 - renderedW) / 2, 1);
    expect(vp.offsetY).toBe(0);
  });

  it('toLogical maps device touch point back to logical canvas coords', () => {
    const vp = new Viewport(1440, 2560, 2);
    const p = vp.toLogical(720, 1280);
    expect(p.x).toBeCloseTo(CANVAS_WIDTH / 2, 1);
    expect(p.y).toBeCloseTo(CANVAS_HEIGHT / 2, 1);
  });

  it('toLogical handles letterbox offset correctly', () => {
    const vp = new Viewport(900, 1280, 1);
    const p = vp.toLogical(50, 640);
    expect(p.x).toBeLessThan(0);
    const center = vp.toLogical(450, 640);
    expect(center.x).toBeCloseTo(CANVAS_WIDTH / 2, 1);
  });
});
