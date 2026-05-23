// src/core/levels/maps/level4.ts
//
// Grid: 9 cols × 12 rows  (cell = 80 × 80 logical units)
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
// row 1:   ·  ■  ·  ■  ■  ■  ·  ■  ·
// row 2:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 3:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 4:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 5:   ○  ■  ·  ■  ■  ■  ■  ■  ·   ← hole(col0, -320,40) — both balls
// row 6:   ·  ■  ·  ·  ·  ·  ·  ·  ·
// row 7:   ·  ■  ■  ■  ■  ■  ■  ■  ·
// row 8:   ·  ■  ■  ■  ·  · [3] ·  ·   ← reactive brown(col6, 160,-200)
// row 9:   ·  ·  ·  ·  ·  ·  ■  ■  ·
// row10:   ■  ■  ■  ■  ■  ■  ■  ■  ·   ← floor wall (cols0-7)
// row11:   ●  ·  ·  ·  ·  ·  ·  ·  ·   ← blue(col0, -320,-440)
//
// ── 触发-响应机关 ────────────────────────────────────────────────
//   4 (trigger, pink)  @ col4 row0  →  (  0, 440)  80×80  sensor
//   3 (reactive, brown)@ col6 row8  →  (160,-200)  80×80  solid
//
//   规则：球进入 4 的范围后，按球相对于入场点的位移反方向，
//         将 3 以 80px（1 格）为步长在 row8 水平滑动。
//         球离开 4 后，3 立即回到 (col6) 原位。
//
//   若 Yellow 从 col3 向右进入触发区并向右移动
//     → 3 向左（col6→col5→…），打开 col6 通道
//   若 Yellow 在触发区向左移动
//     → 3 向右（col6→col7），封堵 col7
//
// ── 通关路径提示 ─────────────────────────────────────────────────
//   Blue:   col0,row11 → [right] row11 → col8 → [up] col8
//           → [left] row6 → col2 → [up] col2
//           → [left] row0 → col0 → [down] col0 → HOLE(col0,row5)
//
//   Yellow: col8,row0 → [down] col8 → [left] row6 → col2
//           → [up] col2 → [left] row0 → col0 → [down] col0 → HOLE
//
//   触发机关是额外的挑战维度：当 Yellow 在触发区移动时
//   col6 附近的 3 方块会移动，干扰或辅助球在 row8 区域的通过。
//
// ── Static walls (greedy merge) ──────────────────────────────────
//   cols5-7, row0        → top-right wall       center(160, 440) 240×80
//   col1, rows1-8        → left corridor wall   center(-240, 80) 80×640
//   col3, rows1-5        → mid-left wall upper  center(-80, 200) 80×400
//   cols4-5, row1        → mid-top block        center(40,  360) 160×80
//   cols3-7, row5        → mid barrier          center(40,   40) 400×80   [shares col3 with above]
//   col7, rows1-5        → right corridor wall  center(240, 200) 80×400
//   cols1-7, row7        → horizontal bar       center(0,  -40)  560×80
//   cols1-3, row8        → left stub row8       center(-160,-200) 240×80
//   cols6-7, row9        → floor stub           center(200,-280) 160×80
//   cols0-7, row10       → floor wall           center(-40,-360) 640×80

export const LEVEL4_MAP = `\
00004111Y
010111010
010100010
010100010
010100010
Z10111110
010000000
011111111
011100300
000000110
111111110
X00000000`;
