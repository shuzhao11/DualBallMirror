// src/core/levels/maps/level4.ts
//
// Grid: 9 cols × 13 rows  (cellW = 80, cellH = 960/13 ≈ 73.8 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  X=blue  Y=yellow  Z=hole(both)
//          4=pink trigger block  3=brown reactive block
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   443  369  295  222  148   74    0  -74 -148 -222 -295 -369 -443
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  ·  ·  ·  ■ [3]  ●   ← yellow(col8,  320, 443)  reactive(col7, 240, 443)
// row 1:   ·  ·  ·  ·  ·  ·  ■  ○  ·   ← hole-both(col7, 240, 369)
// row 2:   ·  ·  ·  ·  ·  ·  ■  ■ [4]  ← trigger(col8,  320, 295)
// row 3:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 4:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 5:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 6:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 7:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 8:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 9:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row10:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row11:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row12:   ●  ·  ·  ·  ·  ·  ·  ·  ·   ← blue(col0, -320,-443)
//
// ── 触发-响应机关 ────────────────────────────────────────────────────
//   4 (trigger, pink)   @ col8 row2  →  (320, 295)  80×74  sensor
//   3 (reactive, brown) @ col7 row0  →  (240, 443)  80×74  solid
//
//   reactive block 紧贴左侧墙壁（col6），只能向右滑动至 col8（x=320）。
//   maxShiftX=1 maxShiftY=0（Y 方向：上方是边界，下方是洞口，禁止滑动）。
//
//   规则：球进入 col8,row2 触发区后，按球偏移的反方向推动 3：
//     · 球在触发区向左移动 → 3 向右（col7 → col8），清空 col7,row0 通道
//     · 球离开触发区        → 3 回到 col7,row0 原位
//
// ── 通关路径提示 ──────────────────────────────────────────────────────
//   核心难点：洞口在 col7,row1，reactive block 初始堵在 col7,row0 正上方。
//   Yellow 从 col8,row0 可沿 col8 向下到 col8,row1，再向左进洞（col7,row1）。
//   Blue   从 col0,row12 沿开阔区域向右向上移动，配合镜像力到达 col7,row1。
//   当任意球进入 col8,row2 触发区并向左偏移时，reactive block 右移至 col8，
//   col7,row0 净空，Yellow 也可从 row0 高度直接下落进洞——提供第二条入洞路线。
//
// ── Static walls (greedy merge) ─────────────────────────────────────
//   col6, rows0-2  → right-cluster wall  center(160, 369) 80×221
//   col7, row2     → floor stub          center(240, 295) 80×74

export const LEVEL4_MAP = `\
00000100Y
0000010Z0
000001400
000001113
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
X00000000`;
