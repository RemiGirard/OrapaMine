# Reference App Use Cases

Source inspected in Chrome: https://theapo.github.io/orapa/

## Observed Reference Behaviors

- The playable surface uses one board for the family answer.
- Edge labels around the board are clickable ray emitters.
- `Send Ray` mode records an entry such as `T1 -> T1` with the resulting color.
- `Query Cell` mode lets the player click a board cell and records whether it is empty
  or which gem color is present.
- Training mode can show the current light path on the same board.
- The logbook keeps the recent ray and cell answers.
- Pieces are whole shapes from a toolbar. Position and orientation both matter.
- The white diamond is a 2 by 2 faceted piece, not a square token.
- Clicking a placed piece rotates it 90 degrees; pieces can be dragged from the toolbar.

## Use Cases For This App

- A player clicks an edge label on the answer grid and immediately gets a ray answer.
- The latest edge ray draws a visible light path on the answer grid.
- A player can hide or show the current light path without losing the logbook entry.
- A player selects a gemstone, rotates it, and clicks the answer grid to place the whole
  oriented piece.
- A player clicks a placed piece to rotate it directly on the board.
- A player can reveal the solution as a ghost overlay on the same answer grid.
- A player can speak a short ray question, such as `top four` or `right six`.

## Deliberate Differences

- The reference app is useful but visually close to a utility board. This app keeps a
  darker science/light theme with animated ambient beams.
- Voice entry is added here because the cooperative family workflow needs spoken tries.
- Cell query exists in the reference app, but this app currently keeps clicks focused on
  row and column rays; coordinate query can be reintroduced after the base clone is solid.
