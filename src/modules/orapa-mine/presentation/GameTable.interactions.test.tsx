/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  removeGuessMineral,
  rotateGuessMineral,
} from '../domain/familySolution'
import type { Puzzle } from '../domain/puzzles'
import { reverseEdgeAnswer } from '../domain/questions'
import type { Answer } from '../domain/questions'
import { GameTable } from './GameTable'

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

describe('GameTable piece interactions', () => {
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

  it('groups display and session options in one toolbar', () => {
    const onNext = vi.fn()
    const onToggleSolution = vi.fn()
    render(
      <InteractiveGameTable
        onNext={onNext}
        onToggleSolution={onToggleSolution}
      />,
    )

    const options = screen.getByRole('toolbar', { name: 'Game options' })
    const nextButton = within(options).getByRole('button', {
      name: 'New puzzle',
    })
    const revealButton = within(options).getByRole('button', {
      name: 'Reveal solution',
    })

    expect(
      within(options).getByRole('checkbox', { name: 'All rays' }),
    ).not.toBeNull()
    expect(
      within(options).getByRole('button', { name: 'Speak' }),
    ).not.toBeNull()
    expect(
      within(options).getByRole('button', { name: 'Reset solution' }),
    ).not.toBeNull()

    fireEvent.click(nextButton)
    fireEvent.click(revealButton)

    expect(onNext).toHaveBeenCalledOnce()
    expect(onToggleSolution).toHaveBeenCalledOnce()
  })

  it('moves a glass piece from tray to grid, around the grid, flips it, and returns it to the tray', () => {
    render(<InteractiveGameTable />)

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
    expect(placedPiece.querySelector('strong')).toBeNull()

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
    render(<InteractiveGameTable />)

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

  it('lifts a toolbox piece smoothly around its cursor anchor', () => {
    render(<InteractiveGameTable />)

    const panel = document.querySelector('aside')
    const stackButton = screen.getByRole('button', {
      name: 'Move Ruby parallelogram',
    })

    expect(panel).not.toBeNull()

    fireEvent.mouseDown(stackButton, { button: 0, clientX: 40, clientY: 40 })

    const preview = document.querySelector<HTMLElement>(
      '[data-glass-drag-preview="true"]',
    )

    expect(preview).not.toBeNull()
    expect(preview?.style.getPropertyValue('--drag-anchor-x')).toBe('50%')
    expect(preview?.style.getPropertyValue('--drag-anchor-y')).toBe('50%')
    expect(preview?.style.getPropertyValue('--drag-start-scale')).toBe('0.62')

    const target = boardPoint(3.5, 2.5)
    fireEvent.mouseMove(document, toMouseEventPoint(target))

    expect(
      document.querySelector('[data-placement-ghost="true"]'),
    ).not.toBeNull()

    fireEvent.mouseUp(document, toMouseEventPoint(target))
  })

  it('renders each foam cavity at exactly the held glass size', () => {
    render(<InteractiveGameTable />)

    const slot = document.querySelector<HTMLElement>(
      '[data-stack-mineral-id="red-parallelogram"]',
    )
    const cavity = slot?.querySelector(
      '[data-stack-cavity-mineral-id="red-parallelogram"] svg',
    )
    const heldPiece = slot?.querySelector('button svg')

    expect(slot?.dataset.stackWidth).toBe('3')
    expect(slot?.dataset.stackHeight).toBe('1')
    expect(slot?.style.gridColumn).toContain('span 3')
    expect(slot?.style.gridRow).toContain('span 1')
    expect(cavity?.getAttribute('viewBox')).toBe('0 0 3 1')
    expect(heldPiece?.getAttribute('viewBox')).toBe(
      cavity?.getAttribute('viewBox'),
    )
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
      <InteractiveGameTable
        currentRayPreview={currentRayPreview}
        showLightPath
      />,
    )

    const rayLayer = document.querySelector('[data-ray-layer="current"]')
    const rayPath = rayLayer?.querySelector('polyline')

    expect(rayLayer?.getAttribute('viewBox')).toBe('0 0 100 100')
    expect(rayPath).not.toBeNull()

    const pointValues = rayPath
      ?.getAttribute('points')
      ?.split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)

    expect(pointValues).toBeDefined()
    expect(pointValues?.every((point) => point >= 0 && point <= 100)).toBe(true)
  })

  it('does not draw a straight current ray for a transparent clue preview', () => {
    const transparentRayPreview: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B3',
      id: 1,
      message: 'Exit B3 - Transparent',
      mode: 'edge',
      path: [{ column: 2, row: 4 }],
      query: 'T3',
      signalColor: 'transparent',
    }

    render(
      <InteractiveGameTable
        currentRayPreview={transparentRayPreview}
        showLightPath
      />,
    )

    expect(document.querySelector('[data-ray-layer="current"]')).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Current ray' })).toBeNull()
  })

  it('renders colored placement-derived rays, hides empty ones, and lets the family hide them', () => {
    const allRayPreviews: ReadonlyArray<Extract<Answer, { mode: 'edge' }>> = [
      {
        exitLabel: 'B1',
        id: -1,
        message: 'Exit B1 - Transparent',
        mode: 'edge',
        path: [{ column: 0, row: 4 }],
        query: 'T1',
        signalColor: 'transparent',
      },
      {
        exitLabel: 'R1',
        id: -2,
        message: 'Exit R1 - Red',
        mode: 'edge',
        path: [{ column: 4, row: 0 }],
        query: 'L1',
        signalColor: 'red',
      },
    ]

    render(
      <InteractiveGameTable
        allRayPreviews={allRayPreviews}
        initiallyShowAllLightPaths
      />,
    )

    const allRaysToggle = screen.getByRole('checkbox', {
      name: 'All rays',
    })

    expect(allRaysToggle).toHaveProperty('checked', true)
    expect(
      document.querySelectorAll('[data-ray-layer="all"] polyline'),
    ).toHaveLength(2)
    expect(document.querySelector('[data-ray-query="T1"]')).toBeNull()
    expect(document.querySelector('[data-ray-query="L1"]')).not.toBeNull()

    fireEvent.click(allRaysToggle)

    expect(allRaysToggle).toHaveProperty('checked', false)
    expect(document.querySelector('[data-ray-layer="all"]')).toBeNull()
  })

  it('brightens the real output of the latest answer and previews answered labels on hover', () => {
    const latestAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 10,
      message: 'Exit B2 - Red',
      mode: 'edge',
      path: [{ column: 1, row: 4 }],
      query: 'T2',
      signalColor: 'red',
    }
    const hoveredAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'R4',
      id: 11,
      message: 'Exit R4 - Blue',
      mode: 'edge',
      path: [{ column: 4, row: 3 }],
      query: 'L4',
      signalColor: 'blue',
    }

    render(
      <InteractiveGameTable
        answers={[latestAnswer, hoveredAnswer]}
        currentAnswer={latestAnswer}
        edgeAnswers={
          new Map([
            [latestAnswer.query, latestAnswer],
            [hoveredAnswer.query, hoveredAnswer],
          ])
        }
      />,
    )

    const latestOutput = screen.getByRole('button', { name: 'Send ray B2' })
    const hoveredInput = screen.getByRole('button', { name: 'Send ray L4' })
    const hoveredOutput = screen.getByRole('button', { name: 'Send ray R4' })

    expect(latestOutput.getAttribute('data-edge-role')).toBe('receiver')
    expect(latestOutput.className).toContain('activeReceiverEdge')

    fireEvent.pointerEnter(hoveredInput)

    expect(latestOutput.getAttribute('data-edge-role')).toBeNull()
    expect(hoveredOutput.getAttribute('data-edge-role')).toBe('receiver')
    expect(hoveredOutput.className).toContain('activeReceiverEdge')

    fireEvent.pointerLeave(hoveredInput)

    expect(latestOutput.getAttribute('data-edge-role')).toBe('receiver')
  })

  it('gives a self-returning clue both the emitter and receiver signals', () => {
    const selfReturningAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'T2',
      id: 12,
      message: 'Exit T2 - Blue',
      mode: 'edge',
      path: [{ column: 1, row: 0 }],
      query: 'T2',
      signalColor: 'blue',
    }

    render(
      <InteractiveGameTable
        answers={[selfReturningAnswer]}
        currentAnswer={selfReturningAnswer}
        edgeAnswers={
          new Map([[selfReturningAnswer.query, selfReturningAnswer]])
        }
      />,
    )

    const port = screen.getByRole('button', { name: 'Send ray T2' })

    expect(port.getAttribute('data-edge-role')).toBe('both')
    expect(port.className).toContain('activeEmitterEdge')
    expect(port.className).toContain('activeReceiverEdge')
  })

  it('previews an answered edge instead of asking for the clue again', () => {
    const answer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 12,
      message: 'Exit B2 - Red',
      mode: 'edge',
      path: [{ column: 1, row: 4 }],
      query: 'T2',
      signalColor: 'red',
    }
    const onAskEdge = vi.fn()
    const reverseAnswer = reverseEdgeAnswer(answer)

    render(
      <InteractiveGameTable
        answers={[answer]}
        edgeAnswers={
          new Map([
            [answer.query, answer],
            [reverseAnswer.query, reverseAnswer],
          ])
        }
        onAskEdge={onAskEdge}
      />,
    )

    const input = screen.getByRole('button', { name: 'Send ray T2' })
    const output = screen.getByRole('button', { name: 'Send ray B2' })

    expect(input.className).toContain('answeredEdge')
    expect(output.className).toContain('answeredEdge')

    fireEvent.click(output)
    expect(onAskEdge).not.toHaveBeenCalled()
    expect(output.getAttribute('data-edge-role')).toBe('emitter')
    expect(input.getAttribute('data-edge-role')).toBe('receiver')

    fireEvent.click(screen.getByRole('button', { name: 'Send ray T3' }))
    expect(onAskEdge).toHaveBeenCalledOnce()
    expect(onAskEdge).toHaveBeenCalledWith('T3')
  })

  it('renders compact colored routes and a return arrow for self-returns', () => {
    const directAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 12,
      message: 'Exit B2 - Red',
      mode: 'edge',
      path: [{ column: 1, row: 4 }],
      query: 'T2',
      signalColor: 'red',
    }
    const returningAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'T6',
      id: 13,
      message: 'Exit T6 - Blue',
      mode: 'edge',
      path: [{ column: 5, row: 0 }],
      query: 'T6',
      signalColor: 'blue',
    }

    render(<InteractiveGameTable answers={[returningAnswer, directAnswer]} />)

    const directRoute = screen.getByLabelText('T2 to B2, Red')
    const returnRoute = screen.getByLabelText('T6 returns to itself, Blue')

    expect(directRoute.textContent).toBe('T2B2')
    expect(directRoute.getAttribute('style')).toContain('#ef4f4a')
    expect(
      returnRoute.querySelector('[data-clue-return="true"]'),
    ).not.toBeNull()
    expect(screen.queryByText('Exit B2 - Red')).toBeNull()
  })
})

function InteractiveGameTable({
  allRayPreviews = [],
  answers = [],
  currentAnswer = null,
  currentRayPreview = null,
  edgeAnswers = new Map(),
  initiallyShowAllLightPaths = false,
  onNext = () => undefined,
  onAskEdge = () => undefined,
  onToggleSolution = () => undefined,
  showLightPath = false,
}: Readonly<{
  allRayPreviews?: ReadonlyArray<Extract<Answer, { mode: 'edge' }>>
  answers?: ReadonlyArray<Answer>
  currentAnswer?: Answer | null
  currentRayPreview?: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers?: ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>>
  initiallyShowAllLightPaths?: boolean
  onNext?: () => void
  onAskEdge?: (edgeLabel: string) => void
  onToggleSolution?: () => void
  showLightPath?: boolean
}>) {
  const [guess, setGuess] = useState(() => createEmptyGuess(puzzle))
  const [showAllLightPaths, setShowAllLightPaths] = useState(
    initiallyShowAllLightPaths,
  )

  return (
    <GameTable
      clues={{
        answers,
        currentAnswer,
        edgeAnswers,
        onAskEdge,
      }}
      familySolution={{
        guess,
        onFlip: (mineralId) =>
          setGuess((currentGuess) => flipGuessMineral(currentGuess, mineralId)),
        onPlace: (mineralId, origin) =>
          setGuess((currentGuess) =>
            moveGuessMineral(currentGuess, mineralId, origin),
          ),
        onRemove: (mineralId) =>
          setGuess((currentGuess) =>
            removeGuessMineral(currentGuess, mineralId),
          ),
        onReset: () => setGuess(createEmptyGuess(puzzle)),
        onRotate: (mineralId) =>
          setGuess((currentGuess) =>
            rotateGuessMineral(currentGuess, mineralId),
          ),
        onSelect: () => undefined,
        onSubmit: () => undefined,
        result: null,
        selectedMineralId: 'red-parallelogram',
      }}
      light={{
        allRays: allRayPreviews,
        currentRay: currentRayPreview,
        onShowAllRaysChange: setShowAllLightPaths,
        onShowCurrentRayChange: () => undefined,
        showAllRays: showAllLightPaths,
        showCurrentRay: showLightPath,
      }}
      puzzle={{
        onNext,
        onToggleSolution,
        showSolution: false,
        solutionPlacements: puzzle.placements,
      }}
      voice={{
        onStart: () => undefined,
        status: 'idle',
      }}
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
