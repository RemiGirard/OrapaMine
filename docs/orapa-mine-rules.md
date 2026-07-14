# Orapa Mine Rules Notes

## Sources Checked

- Official Playte product page: https://www.playte.com/91
- Official English rulebook downloaded from the Playte page: `tmp/pdfs/OrapaMine_EN04.pdf`
- Official color reference downloaded from the Playte page: `tmp/pdfs/OrapaMine_ColorRef_A4.pdf`
- French retailer summary: https://www.philibertnet.com/fr/miraludo/171341-orapa-mine-3770027812227.html
- Taiwanese rules overview: https://www.punchboardgame.com/blog/posts/orapa-mine

## Confirmed Rules

- The solution sheet is a 10 by 8 grid.
- A hunter launches an ultrasonic wave from one edge label: numbers `1` through `18` or letters `A` through `R`.
- The quiz master answers with the wave exit edge point and the resulting color.
- A hunter may instead ask what is located at a coordinate such as `(4, E)`.
- The basic game uses five gemstones: one red, one yellow, one blue, and two white.
- The seven-piece set also includes a transparent gemstone and a black gemstone as expansions.
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
- This first app models each gemstone as grid-aligned occupied cells with simple reflectors. That keeps the family workflow playable while isolating the reflection model in `domain/waves.ts`.
- The domain keeps transparent and black as first-class concepts, even though the first puzzles can stay basic.
