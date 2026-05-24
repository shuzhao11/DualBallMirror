// src/core/levels/maps/level5.ts
//
// Grid: 9 cols × 13 rows  (cell = 80 × 80 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  X=blue  Y=yellow  Z=hole(both)
//          4=pink trigger block  3=brown reactive block
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   440  360  280  200  120   40  -40 -120 -200 -280 -360 -440
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  · [4] ■  ■  ■  ●   ← yellow(col8, 320,440), trigger(col4, 0,440)
// row 1:   ·  ■  ·  ■  ■  ■  ■  ■  ·
// row 2:   ·  ■  ·  ■  ■  ■  ■  ■  ·
// row 3:   ·  ■  ·  ·  ·  ·  ·  ■  ·
// row 4:   ·  ■  ■  ■  ■  ■  ·  ■  ·
// row 5:   ○  ■  ·  ·  ·  ·  ·  ■  ·   ← hole(col0, -320,40) — both balls
// row 6:   ·  ■  ·  ■  ■  ■  ■  ■  ·
// row 7:   ·  ■  ·  ·  ·  ·  ·  ·  ·
// row 8:   ·  ■  ■  ■  ■  ■  ■  ■  ■
// row 9:   ·  ■  ■  ■  ·  · [3] ·  ·   ← reactive brown(col6, 160,-280)
// row10:   ·  ·  ·  ·  ·  ·  ■  ■  ·
// row11:   ■  ■  ■  ■  ■  ■  ■  ■  ·   ← floor wall (cols0-7)
// row12:   ●  ·  ·  ·  ·  ·  ·  ·  ·   ← blue(col0, -320,-440)
//
// ── 触发-响应机关 ────────────────────────────────────────────────────
//   4 (trigger, pink)  @ col4 row0  →  (  0, 440)  80×80  sensor
//   3 (reactive, brown)@ col6 row9  →  (160,-280)  80×80  solid
//
//   规则：球进入 4 的范围后，按球相对于入场点的位移反方向，
//         将 3 以 80px（1 格）为步长在 row9 水平滑动。
//         球离开 4 后，3 立即回到 col6 原位。
//
// ── Static walls (greedy merge) ──────────────────────────────────────
//   cols5-7, row0        → top-right wall       center(160, 440) 240×80
//   col1, rows1-8        → left corridor wall   center(-240, 80) 80×640
//   cols3-7, row1-2      → upper block          center( 80, 320) 400×160
//   col7, rows3-6        → right wall segment   center(240, 80)  80×320
//   cols2-5, row4        → mid bar              center(-40, 120) 320×80
//   cols3-8, row8        → lower horizontal     center(200,-120) 480×80
//   cols1-3, row9        → left stub row9       center(-160,-280) 240×80
//   cols6-7, row10       → floor stub           center(200,-360) 160×80
//   cols0-7, row11       → floor wall           center(-40,-440) 640×80

export const LEVEL5_MAP = `\
00004111Y
010111110
010111110
010000010
011111010
Z10000010
010111110
010000000
011111111
011100300
000000110
111111110
X00000000`;
