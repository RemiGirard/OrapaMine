# Orapa Mine Rules Notes

## Sources Checked

- Official Playte product page: https://www.playte.com/91
- Official English rulebook downloaded from the Playte page: `tmp/pdfs/OrapaMine_EN04.pdf`
- Official color reference downloaded from the Playte page: `tmp/pdfs/OrapaMine_ColorRef_A4.pdf`
- French retailer summary: https://www.philibertnet.com/fr/miraludo/171341-orapa-mine-3770027812227.html
- Taiwanese rules overview: https://www.punchboardgame.com/blog/posts/orapa-mine

## Confirmed Rules

- The printed solution sheet is a 10 by 8 grid.
- The reference web app displays the same board rotated as 8 columns by 10 rows, with
  perimeter emitters `T1`-`T8`, `B1`-`B8`, `L1`-`L10`, and `R1`-`R10`.
- A hunter launches an ultrasonic wave from one edge label.
- The quiz master answers with the wave exit edge point and the resulting color.
- A hunter may instead ask what is located at a coordinate such as `(4, E)`.
- The basic game uses five gemstones: one red, one yellow, one blue, and two white.
- The seven-piece set also includes a transparent gemstone and a black gemstone as expansions.
- Gemstones are physical polygon pieces, not single-cell tokens. They are placed with
  visible grid lines facing up, their corners aligned to grid points, and without
  arbitrary angled placement.
- The family solution must identify both the position and the configuration/orientation
  of each gemstone.
- Transparent reflects ultrasound like other gemstones but does not change the signal color.
- Black absorbs the ultrasound; the quiz master answers that the signal was absorbed.
- Only the first interaction with each color counts for the response.
- Color reference:
  - red + yellow = orange
  - red + blue = purple
  - yellow + blue = green
  - red + white = pink
  - yellow + white = lemon
  - blue + white = sky blue
  - red + yellow + white = light orange
  - red + blue + white = light purple
  - yellow + blue + white = light green
  - red + yellow + blue = black
  - red + yellow + blue + white = gray

## Implementation Assumptions

- The official rulebook gives diagrams for wave reflection/refraction but not a machine-readable geometric algorithm.
- The app models each gemstone as a grid-pattern optical piece: full cells, right
  triangles, and absorber cells. Display and wave tracing use the same pattern.
- The current wave tracer is isolated in `domain/waves.ts` so its geometry can keep
  being refined against official diagrams and the reference implementation.
- The domain keeps transparent and black as first-class concepts, even though the first puzzles can stay basic.
