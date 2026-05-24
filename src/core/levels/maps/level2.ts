// src/core/levels/maps/level2.ts
//
// Grid: 9 cols × 12 rows  (cell = 80 × 80 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  X=blue  Y=yellow  Z=hole(both balls)
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   440  360  280  200  120   40  -40 -120 -200 -280 -360 -440
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  ■  ·  ·  ·  ·  ●   ← yellow (col 8, x=320, y=440)
// row 1:   ·  ·  ·  ■  ·  ·  ·  ■  ·
// row 2:   ·  ·  ·  ·  ·  ·  ·  ■  ■
// row 3:   ·  ·  ·  ·  ·  ·  ·  ■  ·
// row 4:   ·  ·  ·  ·  ·  ·  ·  ■  ·
// row 5:   ·  ·  ·  ■  ■  ■  ■  ■  ·   ← top arm of H-wall
// row 6:   ·  ·  ·  ■  ○  ·  ·  ·  ·   ← hole (col 4, x=0, y=-40), left wall
// row 7:   ·  ·  ·  ■  ■  ■  ■  ■  ·   ← bottom arm of H-wall
// row 8:   ·  ·  ·  ·  ·  ·  ·  ■  ·
// row 9:   ·  ·  ·  ·  ·  ·  ·  ■  ·
// row10:   ■  ■  ■  ■  ■  ■  ■  ■  ·   ← floor wall (cols 0-7)
// row11:   ●  ·  ·  ·  ·  ·  ·  ·  ·   ← blue  (col 0, x=-320, y=-440)
//
// Walls generated (greedy merge):
//   col3, rows0-1      → left short wall at top    center(-80, 400)  80×160
//   col7, rows1-5      → right corridor wall upper  center(240, 200)  80×400
//   col8, row2         → top-right corner block      center(320, 280)  80×80
//   cols3-6, row5      → top H-arm                  center( 40,  40) 320×80
//   col3, rows6-7      → left wall of hole room      center(-80, -80)  80×160
//   cols4-7, row7      → bottom H-arm                center(120,-120) 320×80
//   col7, rows8-10     → right corridor wall lower   center(240,-280)  80×240
//   cols0-6, row10     → floor wall                  center(-80,-360) 560×80
//
// Blue path:  col0,row11 →[right]→ col8,row11 →[up col8]→ row6 →[left]→ hole
// Yellow path: col8,row0 →[left]→ blocked by col3 at row0
//             →[down col3-area]→ blocked by row5 → must use right corridor
// Both balls enter hole-room from the right opening at row6

export const LEVEL2_MAP = `\
00000000Y
000000010
000000010
000000010
000000010
000111110
000100Z00
000111110
000000010
000000010
000000010
111111110
X00000000`;
