import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

/**
 * 把逻辑分辨率（720×1280）适配到任意设备物理像素。
 * 采用 letterbox（保持宽高比、不裁剪、两侧留黑边）方式。
 */
export class Viewport {
  readonly scale:   number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly cssWidth:  number;
  readonly cssHeight: number;

  constructor(
    readonly deviceWidth:  number,
    readonly deviceHeight: number,
    readonly dpr:          number = 1,
  ) {
    const scaleX = deviceWidth  / CANVAS_WIDTH;
    const scaleY = deviceHeight / CANVAS_HEIGHT;
    this.scale = Math.min(scaleX, scaleY);

    const renderedW = CANVAS_WIDTH  * this.scale;
    const renderedH = CANVAS_HEIGHT * this.scale;
    this.offsetX = (deviceWidth  - renderedW) / 2;
    this.offsetY = (deviceHeight - renderedH) / 2;

    this.cssWidth  = deviceWidth;
    this.cssHeight = deviceHeight;
  }

  toLogical(deviceX: number, deviceY: number): { x: number; y: number } {
    return {
      x: (deviceX - this.offsetX) / this.scale,
      y: (deviceY - this.offsetY) / this.scale,
    };
  }
}
