/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  removeGuessMineral,
  rotateGuessMineral,
} from '../domain/puzzles'
import type { Puzzle } from '../domain/puzzles'
import type { Answer } from '../domain/questions'
import { GuessBoard } from './GuessBoard'

const puzzle: Puzzle = {
  id: 'interaction-test',
  placements: [
    {
      mineralId: 'red-parallelogram',
      origin: { column: 0, row: 0 },
    },
  ],
  ruleset: 'basic',
  title: 'Interaction Test',
}

const boardRect = {
  bottom: 1100,
  height: 1000,
  left: 100,
  right: 900,
  top: 100,
  width: 800,
  x: 100,
  y: 100,
} as DOMRect

const stackSlotRect = {
  bottom: 130,
  height: 110,
  left: 20,
  right: 140,
  top: 20,
  width: 120,
  x: 20,
  y: 20,
} as DOMRect

describe('GuessBoard piece interactions', () => {
  const originalGetBoundingClientRect =
    HTMLElement.prototype.getBoundingClientRect
  const originalElementFromPoint = document.elementFromPoint

  beforeEach(() => {
    HTMLElement.prototype.getBoundingClientRect = vi
      .fn()
      .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
        if (this.className.toString().includes('boardSurface')) {
          return boardRect
        }

        if (this.dataset.stackMineralId) {
          return stackSlotRect
        }

        return originalGetBoundingClientRect.call(this)
      })
  })

  afterEach(() => {
    cleanup()
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    document.elementFromPoint = originalElementFromPoint
  })

  it('moves a glass piece from tray to grid, around the grid, flips it, and returns it to the tray', () => {
    render(<InteractiveGuessBoard />)

    const panel = document.querySelector('aside')
    const stackButton = screen.getByRole('button', {
      name: 'Move Ruby parallelogram',
    })

    expect(panel).not.toBeNull()

    dragWithMouse(stackButton, panel!, {
      from: { x: 40, y: 40 },
      to: boardPoint(3.5, 2.5),
    })

    const placedPiece = screen.getByRole('button', {
      name: 'Ruby parallelogram at C3, R3',
    })

    expect(placedPiece.getAttribute('title')).toBe(
      'Ruby parallelogram - north, front',
    )

    dragWithMouse(placedPiece, panel!, {
      from: boardPoint(3.5, 2.5),
      to: boardPoint(5.5, 3.5),
    })

    const movedPiece = screen.getByRole('button', {
      name: 'Ruby parallelogram at C5, R4',
    })

    fireEvent.contextMenu(movedPiece)

    expect(movedPiece.getAttribute('title')).toBe(
      'Ruby parallelogram - east, front',
    )

    fireEvent.doubleClick(movedPiece)

    expect(movedPiece.getAttribute('title')).toBe(
      'Ruby parallelogram - east, back',
    )

    const stackSlot = document.querySelector(
      '[data-stack-mineral-id="red-parallelogram"]',
    )

    expect(stackSlot).not.toBeNull()

    document.elementFromPoint = vi.fn(() => null)

    dragWithMouse(movedPiece, panel!, {
      from: boardPoint(5.5, 4.5),
      to: {
        x: stackSlotRect.left + stackSlotRect.width / 2,
        y: stackSlotRect.top + stackSlotRect.height / 2,
      },
    })

    expect(
      screen.queryByRole('button', {
        name: 'Ruby parallelogram at C5, R4',
      }),
    ).toBeNull()
    expect(
      screen
        .getByRole('button', {
          name: 'Move Ruby parallelogram',
        })
        .getAttribute('title'),
    ).toBe('Ruby parallelogram - east, back')
  })

  it('places a picked glass piece on a board click', () => {
    render(<InteractiveGuessBoard />)

    const panel = document.querySelector('aside')
    const board = document.querySelector('[class*="boardSurface"]')
    const stackButton = screen.getByRole('button', {
      name: 'Move Ruby parallelogram',
    })

    expect(panel).not.toBeNull()
    expect(board).not.toBeNull()

    fireEvent.click(stackButton, { clientX: 40, clientY: 40 })
    fireEvent.mouseMove(panel!, toMouseEventPoint(boardPoint(2.5, 2.5)))
    fireEvent.click(board!, toMouseEventPoint(boardPoint(2.5, 2.5)))

    expect(
      screen.getByRole('button', {
        name: 'Ruby parallelogram at C2, R3',
      }),
    ).not.toBeNull()
  })

  it('keeps ray endpoints inside the board instead of spilling over edge labels', () => {
    const currentRayPreview: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B1',
      id: 1,
      message: 'Exit B1 - Red',
      mode: 'edge',
      path: [{ column: 0, row: 4 }],
      query: 'T1',
      signalColor: 'red',
    }

    render(
      <InteractiveGuessBoard
        currentRayPreview={currentRayPreview}
        showLightPath
      />,
    )

    const rayLayer = document.querySelector('[class*="rayLayer"]')
    const rayPath = rayLayer?.querySelector('polyline')

    expect(rayLayer?.getAttribute('viewBox')).toBe('0 0 100 100')
    expect(rayPath).not.toBeNull()

    const pointValues = rayPath
      ?.getAttribute('points')
      ?.split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)

    expect(pointValues).toBeDefined()
    expect(pointValues?.every((point) => point >= 0 && point <= 100)).toBe(
      true,
    )
  })
})

function InteractiveGuessBoard({
  currentRayPreview = null,
  showLightPath = false,
}: Readonly<{
  currentRayPreview?: Extract<Answer, { mode: 'edge' }> | null
  showLightPath?: boolean
}>) {
  const [guess, setGuess] = useState(() => createEmptyGuess(puzzle))

  return (
    <GuessBoard
      answers={[]}
      currentAnswer={null}
      currentRayPreview={currentRayPreview}
      edgeAnswers={new Map()}
      guess={guess}
      onAskEdge={() => undefined}
      onFlip={(mineralId) =>
        setGuess((currentGuess) => flipGuessMineral(currentGuess, mineralId))
      }
      onPlace={(mineralId, origin) =>
        setGuess((currentGuess) =>
          moveGuessMineral(currentGuess, mineralId, origin),
        )
      }
      onRemove={(mineralId) =>
        setGuess((currentGuess) => removeGuessMineral(currentGuess, mineralId))
      }
      onReset={() => setGuess(createEmptyGuess(puzzle))}
      onRotate={(mineralId) =>
        setGuess((currentGuess) => rotateGuessMineral(currentGuess, mineralId))
      }
      onSelect={() => undefined}
      onStartVoiceCommand={() => undefined}
      onSubmit={() => undefined}
      onToggleLightPath={() => undefined}
      result={null}
      selectedMineralId="red-parallelogram"
      showLightPath={showLightPath}
      showSolution={false}
      solutionPlacements={puzzle.placements}
      voiceStatus="idle"
    />
  )
}

function dragWithMouse(
  source: Element,
  target: Element,
  {
    from,
    to,
  }: Readonly<{
    from: { x: number; y: number }
    to: { x: number; y: number }
  }>,
) {
  fireEvent.mouseDown(source, { button: 0, clientX: from.x, clientY: from.y })
  fireEvent.mouseMove(target, { clientX: to.x, clientY: to.y })
  fireEvent.mouseUp(target, { clientX: to.x, clientY: to.y })
}

function boardPoint(column: number, row: number) {
  return {
    x: boardRect.left + (column / 8) * boardRect.width,
    y: boardRect.top + (row / 10) * boardRect.height,
  }
}

function toMouseEventPoint(point: { x: number; y: number }) {
  return {
    clientX: point.x,
    clientY: point.y,
  }
}
