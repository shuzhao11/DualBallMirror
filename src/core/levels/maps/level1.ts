// src/core/levels/maps/level1.ts
//
// Grid: 9 cols × 12 rows  (cell = 80 × 80 logical units)
// x ∈ [-360, 360]  y ∈ [-480, 480]  Y-up
//
// Legend:  1=wall  0=empty  x=blue  y=yellow  z=hole(blue only)
//
// Column centers (x):  -320 -240 -160  -80    0   80  160  240  320
// Row    centers (y):   440  360  280  200  120   40  -40 -120 -200 -280 -360 -440
//
//  col →   0  1  2  3  4  5  6  7  8
// row 0:   ·  ·  ·  ■  ·  ·  ·  ·  ·
// row 1:   ·  ·  ·  ■  ·  ·  ·  ●  ·   ← yellow (col 7, x=240, y=360)
// row 2:   ·  ·  ·  ■  ·  ■  ■  ■  ■   ← upper wall (cols 5-8)
// row 3:   ·  ·  ·  ■  ·  ■  ·  ·  ·
// row 4:   ·  ·  ·  ■  ·  ■  ·  ·  ·
// row 5:   ·  ·  ·  ■  ·  ■  ·  ·  ·
// row 6:   ·  ·  ·  ■  ○  ■  ·  ·  ·   ← hole   (col 4, x=0,   y=-40)
// row 7:   ·  ·  ·  ■  ·  ■  ·  ·  ·
// row 8:   ·  ·  ·  ■  ·  ■  ·  ·  ·
// row 9:   ■  ■  ■  ■  ·  ■  ·  ·  ·   ← lower wall (cols 0-3)
// row10:   ·  ●  ·  ·  ·  ■  ·  ·  ·   ← blue  (col 1, x=-240, y=-360)
// row11:   ·  ·  ·  ·  ·  ■  ·  ·  ·
//
// Walls generated:
//   Left corridor wall  — col 3, rows 0-9   → center (-80,  80), 80×800
//   Upper horizontal    — cols 5-8, row 2   → center (200, 280), 320×80
//   Right corridor wall — col 5, rows 3-11  → center ( 80,-120), 80×720
//   Lower horizontal    — cols 0-3, row 9   → center (-200,-280), 320×80
//
// Blue path:  col 1 → right along row 10 → col 4 → up through corridor → hole
// Yellow:     top-right area; upper wall (row 2) blocks downward exit

export const LEVEL1_MAP = `\
000100000
0001000y0
000101111
000101000
000101000
000101000
0001z1000
000101000
000101000
111101000
0x0001000
000001000`;
