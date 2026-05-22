// src/core/LevelLoader.ts
import Matter from 'matter-js';
import type { LevelConfig, Vec2 } from './levels/types';
import { HoleDetector } from '../ball/HoleDetector';
import { BallController } from '../ball/BallController';
import { MovingObstacle } from '../obstacles/MovingObstacle';
import type { MovingObstacleConfig } from '../obstacles/MovingObstacle';
import {
  CANVAS_WIDTH,
  MAP_TOP, MAP_HEIGHT, CENTER_X, CENTER_Y, BALL_RADIUS,
} from '../constants';

/** 逻辑坐标（Y 轴向上）-> 屏幕坐标（Y 轴向下） */
export function logicToScreen(v: Vec2): { x: number; y: number } {
  return { x: CENTER_X + v.x, y: CENTER_Y - v.y };
}

export interface LevelObjects {
  engine:          Matter.Engine;
  blueBody:        Matter.Body;
  yellowBody:      Matter.Body;
  wallBodies:      Matter.Body[];
  obstacleBodies:  Matter.Body[];
  detectors:       HoleDetector[];
  movingObstacles: MovingObstacle[];
  ballController:  BallController;
}

const WALL_T = 20;  // 边界墙厚度（px）

export class LevelLoader {
  load(cfg: LevelConfig): LevelObjects {
    // 坐标越界警告
    for (const [label, pos] of [
      ['blueSpawn',   cfg.blueSpawn  ] as const,
      ['yellowSpawn', cfg.yellowSpawn] as const,
    ]) {
      if (Math.abs(pos.x) > 360 || Math.abs(pos.y) > 480) {
        console.warn(`[LevelLoader] ${label} out of bounds: (${pos.x}, ${pos.y})`);
      }
    }

    // 物理引擎（无重力，启用高精度碰撞）
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      positionIterations: 10,
    });

    // 双球
    const blueScreen   = logicToScreen(cfg.blueSpawn);
    const yellowScreen = logicToScreen(cfg.yellowSpawn);

    const blueBody = Matter.Bodies.circle(
      blueScreen.x, blueScreen.y, BALL_RADIUS,
      { frictionAir: 0.08, restitution: 0.2, label: 'blue' },
    );
    const yellowBody = Matter.Bodies.circle(
      yellowScreen.x, yellowScreen.y, BALL_RADIUS,
      { frictionAir: 0.08, restitution: 0.2, label: 'yellow' },
    );

    // 地图边界墙（4 面，isStatic）
    const mapBottom = MAP_TOP + MAP_HEIGHT;
    const wallBodies: Matter.Body[] = [
      Matter.Bodies.rectangle(CENTER_X,                MAP_TOP     - WALL_T / 2, CANVAS_WIDTH,            WALL_T, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(CENTER_X,                mapBottom   + WALL_T / 2, CANVAS_WIDTH,            WALL_T, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(-WALL_T / 2,             CENTER_Y,   WALL_T, MAP_HEIGHT + 2 * WALL_T,              { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(CANVAS_WIDTH + WALL_T / 2, CENTER_Y, WALL_T, MAP_HEIGHT + 2 * WALL_T,              { isStatic: true, label: 'wall' }),
    ];

    // 障碍物
    const obstacleBodies:  Matter.Body[]     = [];
    const movingObstacles: MovingObstacle[]  = [];

    for (const obs of cfg.obstacles) {
      if (Math.abs(obs.position.x) > 360 || Math.abs(obs.position.y) > 480) {
        console.warn(`[LevelLoader] obstacle out of bounds: (${obs.position.x}, ${obs.position.y})`);
      }
      const sp = logicToScreen(obs.position);
      let body: Matter.Body;
      if (obs.type === 'rect') {
        if (obs.width == null || obs.height == null) {
          console.error(`[LevelLoader] rect obstacle missing width/height at (${obs.position.x}, ${obs.position.y})`);
          continue;
        }
        body = Matter.Bodies.rectangle(sp.x, sp.y, obs.width, obs.height, { isStatic: true, label: 'obstacle' });
      } else {
        if (obs.radius == null) {
          console.error(`[LevelLoader] circle obstacle missing radius at (${obs.position.x}, ${obs.position.y})`);
          continue;
        }
        body = Matter.Bodies.circle(sp.x, sp.y, obs.radius, { isStatic: true, label: 'obstacle' });
      }
      obstacleBodies.push(body);

      if (obs.moving) {
        // 将逻辑坐标 offsetA/B 转为屏幕坐标偏移（翻转 Y 分量）
        let moveCfg: MovingObstacleConfig;
        if (obs.moving.mode === 'patrol') {
          const oA = obs.moving.offsetA ?? { x: 0, y: 0 };
          const oB = obs.moving.offsetB ?? { x: 0, y: 0 };
          moveCfg = {
            mode:    'patrol',
            offsetA: { x: oA.x, y: -oA.y },
            offsetB: { x: oB.x, y: -oB.y },
            speed:   obs.moving.speed ?? 100,
          };
        } else {
          moveCfg = {
            mode:        'rotate',
            rotateSpeed: obs.moving.rotateSpeed ?? 30,
          };
        }
        movingObstacles.push(new MovingObstacle(body, moveCfg, sp));
      }
    }

    // 将所有物理体加入世界
    Matter.Composite.add(engine.world, [
      blueBody, yellowBody,
      ...wallBodies,
      ...obstacleBodies,
    ]);

    // 洞口检测器（LevelConfig 逻辑坐标 -> 屏幕坐标）
    const detectors = cfg.holes.map(hole =>
      new HoleDetector(
        hole,
        logicToScreen(hole.position),
        cfg.holeDwellTime,
        blueBody,
        yellowBody,
      ),
    );

    const ballController = new BallController(blueBody, yellowBody);

    return { engine, blueBody, yellowBody, wallBodies, obstacleBodies, detectors, movingObstacles, ballController };
  }

  /**
   * 销毁物理引擎和世界。调用后不得再使用 objects 中的任何方法或引用。
   */
  unload(objects: LevelObjects): void {
    Matter.Composite.clear(objects.engine.world, false);
    Matter.Engine.clear(objects.engine);
  }
}
