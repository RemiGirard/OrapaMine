import type { MineralPlacement } from './minerals'

export type Puzzle = Readonly<{
  id: string
  title: string
  ruleset: 'basic' | 'expansion'
  placements: ReadonlyArray<MineralPlacement>
}>

export const preparedPuzzles: ReadonlyArray<Puzzle> = [
  {
    id: 'resting-place',
    title: 'Resting Place',
    ruleset: 'basic',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'north',
        origin: { column: 4, row: 0 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'north',
        origin: { column: 0, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'north',
        origin: { column: 2, row: 4 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 6, row: 3 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'north',
        origin: { column: 1, row: 7 },
      },
    ],
  },
  {
    id: 'deep-vein',
    title: 'Deep Vein',
    ruleset: 'basic',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'east',
        origin: { column: 0, row: 2 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'west',
        origin: { column: 6, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'south',
        origin: { column: 2, row: 0 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 5, row: 4 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'east',
        origin: { column: 1, row: 6 },
      },
    ],
  },
  {
    id: 'expert-shaft',
    title: 'Expert Shaft',
    ruleset: 'expansion',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'south',
        origin: { column: 0, row: 1 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'south',
        origin: { column: 6, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'west',
        origin: { column: 4, row: 3 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 2, row: 4 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'east',
        origin: { column: 0, row: 6 },
      },
      {
        mineralId: 'transparent-prism',
        orientation: 'north',
        origin: { column: 3, row: 0 },
      },
      {
        mineralId: 'black-absorber',
        orientation: 'north',
        origin: { column: 6, row: 8 },
      },
    ],
  },
]
