// src/core/levels/mapParser.ts
//
// Map cell encoding:
//   0      = empty space
//   1      = solid wall
//   x / X  = blue ball spawn
//   y / Y  = yellow ball spawn
//   z      = hole for blue only   (requireBlue: true,  requireYellow: false)
//   Z / B  = hole for both balls  (requireBlue: true,  requireYellow: true)
//   2      = rotating-door cell — connect adjacent '2' cells to define one bar;
//            the bar pivots around their midpoint, rotates at rotateSpeed °/sec
//
// Grid size determines cell dimensions automatically:
//   cellW = 720 / numCols
//   cellH = 960 / numRows   (960 = logical height, y ∈ [-480, 480])
//
// Recommended grid: 9 × 12 → each cell = 80 × 80 logical units.
// Ball diameter = 56 px, so a 1-cell-wide corridor (80 px) is passable.
//
// Border walls (top/bottom/left/right) are added automatically by LevelLoader
// and must NOT be included in the map string.

import type { LevelConfig, ObstacleConfig, Vec2, HoleConfig, ReactiveBlockPairConfig } from './types';

export interface MapOptions {
  /** Dwell time (seconds) for holes — default 0.3 */
  holeDwellTime?: number;
  /** Time limit (seconds); 0 = unlimited — default 0 */
  timeLimitSeconds?: number;
  /** Radius for all holes — default 40 */
  holeRadius?: number;
  /** Rotation speed for '2' rotating-door obstacles (degrees/second) — default 45 */
  rotateSpeed?: number;
  /** Extra obstacles not expressible in the grid (e.g. moving obstacles) */
  extraObstacles?: ObstacleConfig[];
  /**
   * Per-pair overrides for '3'/'4' reactive block pairs (in declaration order).
   * maxShiftX / maxShiftY limit how many cells 3 can slide in ±X and ±Y.
   * Use this to keep 3 inside empty cells (away from walls and screen edges).
   */
  reactiveBlockOverrides?: Array<{ maxShiftX?: number; maxShiftY?: number }>;
}

export function parseMap(mapStr: string, opts: MapOptions = {}): LevelConfig {
  const rows = mapStr.trim().split('\n').map(r => r.replace(/\s+$/, ''));
  const numRows = rows.length;
  const numCols = Math.max(...rows.map(r => r.length));

  // Logical space: x ∈ [-360, 360] (720 wide), y ∈ [-480, 480] (960 tall), Y-up
  const cellW = 720 / numCols;
  const cellH = 960 / numRows;

  const toLogical = (col: number, row: number): Vec2 => ({
    x: -360 + (col + 0.5) * cellW,
    y:  480 - (row + 0.5) * cellH,
  });

  let blueSpawn: Vec2   = { x: -260, y: -350 };
  let yellowSpawn: Vec2 = { x:  260, y:  350 };
  const holes: HoleConfig[] = [];
  const wallGrid: boolean[][] = Array.from({ length: numRows }, () =>
    new Array<boolean>(numCols).fill(false),
  );
  const rotateGrid: boolean[][] = Array.from({ length: numRows }, () =>
    new Array<boolean>(numCols).fill(false),
  );
  const holeRadius = opts.holeRadius ?? 40;
  const triggerPositions: Vec2[] = [];
  const reactivePositions: Vec2[] = [];

  for (let r = 0; r < numRows; r++) {
    const row = rows[r] ?? '';
    for (let c = 0; c < row.length; c++) {
      switch (row[c]) {
        case '1': wallGrid[r][c] = true; break;
        case '2': rotateGrid[r][c] = true; break;
        case 'x': case 'X': blueSpawn   = toLogical(c, r); break;
        case 'y': case 'Y': yellowSpawn = toLogical(c, r); break;
        // lowercase z  → blue-only hole
        case 'z': holes.push({ position: toLogical(c, r), radius: holeRadius, requireBlue: true,  requireYellow: false }); break;
        // uppercase Z or B → both-balls hole
        case 'Z': case 'B': holes.push({ position: toLogical(c, r), radius: holeRadius, requireBlue: true, requireYellow: true }); break;
        // '4' = pink trigger block，'3' = brown reactive block
        case '4': triggerPositions.push(toLogical(c, r)); break;
        case '3': reactivePositions.push(toLogical(c, r)); break;
      }
    }
  }

  // 配对触发-响应方块（按出现顺序 1:1 配对）
  const reactiveBlockPairs: ReactiveBlockPairConfig[] = triggerPositions.map((tPos, i) => {
    if (i >= reactivePositions.length) {
      console.warn('[parseMap] trigger block (4) has no matching reactive block (3)');
    }
    const override = opts.reactiveBlockOverrides?.[i] ?? {};
    return {
      trigger:  { position: tPos,                    width: cellW, height: cellH },
      reactive: { position: reactivePositions[i] ?? tPos, width: cellW, height: cellH },
      cellSize:  Math.min(cellW, cellH),
      maxShiftX: override.maxShiftX ?? 3,
      maxShiftY: override.maxShiftY ?? 3,
    };
  });

  const obstacles = [
    ...mergeWallRects(wallGrid, numRows, numCols, cellW, cellH),
    ...findRotatingDoors(rotateGrid, numRows, numCols, cellW, cellH, opts.rotateSpeed ?? 45),
  ];
  if (opts.extraObstacles) obstacles.push(...opts.extraObstacles);

  const requireBothBalls =
    holes.some(h => h.requireBlue) && holes.some(h => h.requireYellow);

  return {
    requireBothBalls,
    holeDwellTime:    opts.holeDwellTime    ?? 0.3,
    timeLimitSeconds: opts.timeLimitSeconds ?? 0,
    holes,
    obstacles,
    blueSpawn,
    yellowSpawn,
    ...(reactiveBlockPairs.length > 0 ? { reactiveBlockPairs } : {}),
  };
}

/**
 * Greedy rectangle merge: for each unprocessed wall cell, extend right as far
 * as possible, then expand down as long as every column in the row-span is wall.
 * Produces a minimal set of non-overlapping rects covering all wall cells.
 */
function mergeWallRects(
  grid: boolean[][],
  numRows: number,
  numCols: number,
  cellW: number,
  cellH: number,
): ObstacleConfig[] {
  const used = Array.from({ length: numRows }, () => new Array<boolean>(numCols).fill(false));
  const result: ObstacleConfig[] = [];

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (!grid[r][c] || used[r][c]) continue;

      // Extend right
      let endC = c;
      while (endC + 1 < numCols && grid[r][endC + 1] && !used[r][endC + 1]) endC++;

      // Extend down — entire column span [c .. endC] must be wall and unused
      let endR = r;
      expand: while (endR + 1 < numRows) {
        for (let cc = c; cc <= endC; cc++) {
          if (!grid[endR + 1][cc] || used[endR + 1][cc]) break expand;
        }
        endR++;
      }

      for (let rr = r; rr <= endR; rr++)
        for (let cc = c; cc <= endC; cc++)
          used[rr][cc] = true;

      const left  = -360 + c        * cellW;
      const right = -360 + (endC + 1) * cellW;
      const top   =  480 - r        * cellH;
      const bot   =  480 - (endR + 1) * cellH;

      result.push({
        type: 'rect',
        position: { x: (left + right) / 2, y: (top + bot) / 2 },
        width:  right - left,
        height: top   - bot,
      });
    }
  }

  return result;
}

/**
 * BFS-groups connected '2' cells into rotating-door obstacles.
 * Each group becomes one thin rect that spins around the midpoint of its cells.
 * Vertical group  → width = THIN, height = span
 * Horizontal group → width = span, height = THIN
 */
function findRotatingDoors(
  grid: boolean[][],
  numRows: number,
  numCols: number,
  cellW: number,
  cellH: number,
  rotateSpeed: number,
): ObstacleConfig[] {
  const used = Array.from({ length: numRows }, () => new Array<boolean>(numCols).fill(false));
  const result: ObstacleConfig[] = [];
  const dirs: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (!grid[r][c] || used[r][c]) continue;

      // BFS — collect all connected '2' cells
      const cells: Array<[number, number]> = [];
      const queue: Array<[number, number]> = [[r, c]];
      used[r][c] = true;
      while (queue.length > 0) {
        const [qr, qc] = queue.shift()!;
        cells.push([qr, qc]);
        for (const [dr, dc] of dirs) {
          const nr = qr + dr, nc = qc + dc;
          if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols
              && grid[nr][nc] && !used[nr][nc]) {
            used[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }

      // Bounding box of the group
      const minR = Math.min(...cells.map(([rr]) => rr));
      const maxR = Math.max(...cells.map(([rr]) => rr));
      const minC = Math.min(...cells.map(([, cc]) => cc));
      const maxC = Math.max(...cells.map(([, cc]) => cc));

      // Pivot = logical center of bounding box
      const cx = -360 + (minC + maxC + 1) * cellW / 2;
      const cy =  480 - (minR + maxR + 1) * cellH / 2;

      // Bar length = longer dimension; thin in the other
      const spanH = (maxC - minC + 1) * cellW;
      const spanV = (maxR - minR + 1) * cellH;
      const THIN  = Math.min(cellW, cellH) / 4;   // 20 px for 80-px cells

      result.push({
        type: 'rect',
        position: { x: cx, y: cy },
        width:  spanH >= spanV ? spanH : THIN,
        height: spanV >  spanH ? spanV : THIN,
        moving: { mode: 'rotate', rotateSpeed },
      });
    }
  }

  return result;
}
