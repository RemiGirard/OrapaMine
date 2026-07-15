# Reference App Use Cases

Source inspected interactively in Chrome: https://theapo.github.io/orapa/

## Reference Behaviors

- A single 8 by 10 board represents the family's proposed solution.
- The 36 perimeter labels are clickable ray emitters.
- Sending a ray records its entry, exit or absorption, and resulting color.
- Training mode can draw the current light path on the same board.
- The logbook retains recent ray and coordinate answers.
- Pieces are whole polygonal shapes. Their grid position, orientation, and face matter.
- The white diamond occupies a 2 by 2 area and is not a square token.
- The reference supports coordinate queries, but its piece manipulation is less direct than the
  physical glass-case interaction required here.

## Cooperative Session Use Cases

### Ask for a clue

1. A player clicks any top, right, bottom, or left edge label.
2. The actual puzzle answers with an exit/absorption and color.
3. The clicked emitter and resulting receiver become the brightest labels.
4. The answer is added to the notebook and can be previewed again by hovering it.

The same use case can start from a spoken command such as `top four` or `right six`.

### Inspect the current family optics

1. Every colored ray for the current family placement is visible by default as a dark, static
   background path.
2. Clicking any edge emits one diagnostic photon along the route produced by the family placement,
   whether or not that route matches a clue. Hovering or focusing a known edge or logbook clue
   repeats that diagnostic shot without recording another clue.
3. A selected clue becomes a verified light link only when the family ray has the same input,
   output, and final color. Verified links use the brighter fixed path and one continuously bouncing
   photon; unmatched clues identify their expected endpoints without that passing-light treatment.
4. The family may independently hide all background rays or the verified selected ray.
5. Moving, rotating, flipping, or returning a glass piece recomputes the live rays from derived
   state; no light result is stored separately.
6. Each notebook ray shows whether the current family map produces the same exit and color, while
   a compact meter counts the distinct clues currently matched.

Actual clue colors remain puzzle answers. Live-ray previews show what the current family placement
would produce and never overwrite the clue notebook. Consistency feedback compares only information
the family has already discovered; it does not inspect undiscovered rays or reveal piece positions.

### Build the family solution

1. Pick a glass piece directly from its fitted foam slot.
2. Move it with the cursor; the piece follows the grabbed point and a grey ghost marks an exact,
   valid board placement.
3. Release on the board to place it. Invalid or overlapping positions are not targets.
4. Drag a placed piece to move it again.
5. Right-click to rotate 90 degrees. Double-click or Shift-right-click flips the piece face.
6. Drag a placed piece back to its matching foam slot, or use the reset control revealed in the
   empty slot, to return it.
7. Submit only when the family wants an exact position/orientation/face comparison.

### Manage the puzzle session

- Reset clears only the family solution for the current puzzle.
- Reveal overlays the prepared solution without replacing the family placement.
- New advances to another prepared puzzle and resets clues, family solution, reveal state, and
  light-display preferences as one session transition.

## Deliberate Differences

- This app uses a dark science-and-light table with glass reflections and animated rays.
- Voice entry supports a family gathered around one landscape display.
- Coordinate query is intentionally absent from the current UI so direct row/column play stays
  primary. The domain still supports it for a later feature.
