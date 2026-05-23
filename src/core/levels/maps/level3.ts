// src/core/levels/maps/level3.ts
//
// Grid: 9 cols × 12 rows  (cell = 80 × 80 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  X=blue  Y=yellow  Z=hole(both)  2=rotating door
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   440  360  280  200  120   40  -40 -120 -200 -280 -360 -440
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  ■  ■  ■  ·  ·  ●   ← yellow (col8, x=320, y=440)
// row 1:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 2:   ·  ■  ·  ■  ·  ·  ·  ■  ■   ← top-right corner
// row 3:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 4:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 5:   ·  ■  ·  ■  ·  ○  ·  ■  ·   ← hole  (col5, x=80,  y=40)
// row 6:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 7:   ·  ■  ·  ■  ·  ·  ·  ■  ·
// row 8:   ·  ■  ·  ⊕  ·  ·  ·  ■  ·   ← rotating door cell (col3)
// row 9:   ·  ■  ·  ⊕  ·  ·  ·  ■  ·   ← rotating door cell (col3)
// row10:   ·  ■  ·  ■  ■  ■  ■  ■  ·   ← floor wall (cols3-7)
// row11:   ●  ■  ·  ■  ·  ·  ·  ·  ·   ← blue (col0, x=-320, y=-440)
//
// Static walls (greedy merge):
//   cols3-5, row0    → top wall          center(  0, 440) 240×80
//   col1,  rows1-11  → left wall         center(-240, -40)  80×880
//   col3,  rows1-7   → mid wall upper    center( -80, 120)  80×560
//   col7,  rows1-10  → right wall        center( 240,  40)  80×720
//   col8,  row2      → corner block      center( 320, 280)  80×80
//   cols3-6, row10   → floor wall        center(  40,-360) 320×80
//   col3,  row11     → bottom stub       center( -80,-440)  80×80
//
// Rotating door (BFS group: col3 rows8-9):
//   center (-80, -240), width=20, height=160, rotateSpeed °/sec
//   Pivot sits in the gap between the mid-wall upper and floor wall.
//   Blue path: col0 up → row0 right to col2 → col2 down → time the door →
//              cross to col4 → up to row5 → right to hole col5
//   Yellow path: col8 down to col6 area → left into hole from right

export const LEVEL3_MAP = `\
00011100Y
010100010
010100010
010100010
010100010
01010Z010
010100010
010100010
010200010
010200010
010111110
X10100000`;
