// src/core/levels/maps/level6.ts
//
// Grid: 9 cols × 11 rows  (cellW = 80, cellH = 960/11 ≈ 87 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  X=blue  Y=yellow  Z=hole(both)
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   436  349  262  175   87    0  -87 -175 -262 -349 -436
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  ■  ■  ■  ·  ·  ·   ← top center wall (cols3-5)
// row 1:   ·  ■  ·  ·  ·  ·  ·  ■  ·
// row 2:   ·  ■  ·  ·  ○  ·  ·  ■  ·   ← hole-both (col4, x=0, y=262)
// row 3:   ·  ■  ·  ·  ·  ·  ·  ■  ·
// row 4:   ·  ■  ·  ·  ·  ·  ·  ■  ·
// row 5:   ·  ■  ■  ■  ■  ■  ■  ■  ·   ← chamber floor (cols1-7)
// row 6:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 7:   ■  ■  ■  ■  ·  ■  ■  ■  ■   ← near-solid barrier, gap at col4 only
// row 8:   ·  ·  ·  ·  ·  ·  ·  ·  ·
// row 9:   ·  ■  ■  ■  ■  ■  ■  ■  ·   ← lower floor (cols1-7)
// row10:   ○  ●  ·  ·  ·  ·  ·  ·  ·   ← blue(col0,-320,-436)  yellow(col1,-240,-436)
//
// ── 关卡结构 ─────────────────────────────────────────────────────────
//   上方密室（rows 1-4）：左墙 col1、右墙 col7、顶墙 col3-5/row0、底墙 cols1-7/row5。
//   密室入口：row0 处 col2 和 col6 缝隙（左右各一）可从上方进入。
//   洞口位于密室中央 col4,row2 (x=0, y≈262)，两球均须进洞通关。
//
//   关键卡口（row7）：整行几乎全是墙，仅 col4 (x=0) 一格留空。
//   两球从下方出发，必须都挤过 col4 的唯一通道才能进入中段（row6）。
//
//   下方区域：两球同生于 row10（col0=蓝，col1=黄），
//   col0 可直通 row8（col0 在 row9 无墙），col1 被 row9 封死须向左/右绕行。
//
// ── Static walls (greedy merge) ─────────────────────────────────────
//   cols3-5, row0      → top center wall   center(  0, 436) 240×87
//   col1,  rows1-5     → left wall         center(-240, 174)  80×436
//   col7,  rows1-5     → right wall        center( 240, 174)  80×436
//   cols2-6, row5      → chamber floor     center(  0,   0) 400×87
//   cols0-3, row7      → left barrier      center(-160,-175) 320×87
//   cols5-8, row7      → right barrier     center( 160,-175) 320×87
//   cols1-7, row9      → lower floor       center(  0,-349) 560×87

export const LEVEL6_MAP = `\
000111000
010000010
0100Z0010
010000010
010000010
011111110
000000000
111101111
000000000
011111110
XY0000000`;
