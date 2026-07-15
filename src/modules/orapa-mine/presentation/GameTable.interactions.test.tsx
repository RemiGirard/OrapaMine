/* @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SolutionSubmissionReadiness } from '../application/solutionSubmission'
import {
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  removeGuessMineral,
  rotateGuessMineral,
} from '../domain/familySolution'
import type { GuessPlacement } from '../domain/minerals'
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
    {
      mineralId: 'yellow-triangle',
      origin: { column: 4, row: 4 },
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
    vi.useRealTimers()
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    document.elementFromPoint = originalElementFromPoint
  })

  it('groups display and session options in one toolbar', () => {
    const onNext = vi.fn()
    render(<InteractiveGameTable onNext={onNext} />)

    const options = screen.getByRole('toolbar', { name: 'Game options' })
    const nextButton = within(options).getByRole('button', {
      name: 'New puzzle',
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
    expect(
      within(options).queryByRole('button', { name: 'Reveal solution' }),
    ).toBeNull()

    fireEvent.click(nextButton)

    expect(onNext).toHaveBeenCalledOnce()
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
    const initialSettle = placedPiece.querySelector(
      '[data-placement-settle="true"]',
    )

    dragWithMouse(placedPiece, panel!, {
      from: boardPoint(3.5, 2.5),
      to: boardPoint(5.5, 3.5),
    })

    const movedPiece = screen.getByRole('button', {
      name: 'Ruby parallelogram at C5, R4',
    })
    const movedSettle = movedPiece.querySelector(
      '[data-placement-settle="true"]',
    )

    expect(movedSettle).not.toBe(initialSettle)

    fireEvent.contextMenu(movedPiece)

    expect(movedPiece.getAttribute('title')).toBe(
      'Ruby parallelogram - east, front',
    )
    expect(
      movedPiece.querySelector('[data-rotation-motion="clockwise"]'),
    ).not.toBeNull()
    expect(movedPiece.querySelector('[data-placement-settle="true"]')).toBe(
      movedSettle,
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

  it('puts carried glass down when resetting or starting a new puzzle', () => {
    const onNext = vi.fn()

    render(<InteractiveGameTable onNext={onNext} />)

    const ruby = screen.getByTestId('toolbox-piece-red-parallelogram')

    fireEvent.click(ruby, { clientX: 40, clientY: 40 })
    expect(
      document.querySelector('[data-glass-drag-preview="true"]'),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset solution' }))
    expect(
      document.querySelector('[data-glass-drag-preview="true"]'),
    ).toBeNull()

    fireEvent.click(ruby, { clientX: 40, clientY: 40 })
    fireEvent.click(screen.getByRole('button', { name: 'New puzzle' }))

    expect(
      document.querySelector('[data-glass-drag-preview="true"]'),
    ).toBeNull()
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('previews and keeps overlapping glass as a clear invalid placement', () => {
    render(<InteractiveGameTable />)

    const panel = document.querySelector('aside')
    const board = screen.getByTestId('solution-board-surface')

    expect(panel).not.toBeNull()

    const target = boardPoint(3.5, 3.5)
    const ruby = screen.getByTestId('toolbox-piece-red-parallelogram')

    fireEvent.click(ruby, { clientX: 40, clientY: 40 })
    fireEvent.mouseMove(panel!, toMouseEventPoint(target))
    fireEvent.click(board, toMouseEventPoint(target))

    const topaz = screen.getByTestId('toolbox-piece-yellow-triangle')

    fireEvent.click(topaz, { clientX: 40, clientY: 40 })
    fireEvent.mouseMove(panel!, toMouseEventPoint(target))

    expect(
      document
        .querySelector('[data-placement-ghost="true"]')
        ?.getAttribute('data-placement-state'),
    ).toBe('invalid')
    expect(
      document
        .querySelector('[data-glass-drag-preview="true"]')
        ?.getAttribute('data-placement-state'),
    ).toBe('invalid')
    const placedRuby = screen.getByTestId('placed-piece-red-parallelogram')

    expect(placedRuby.getAttribute('aria-invalid')).toBe('true')

    fireEvent.click(placedRuby, toMouseEventPoint(target))

    expect(
      screen
        .getByTestId('placed-piece-yellow-triangle')
        .getAttribute('data-placement-state'),
    ).toBe('invalid')
    expect(
      screen
        .getByTestId('placed-piece-red-parallelogram')
        .getAttribute('data-placement-state'),
    ).toBe('invalid')
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
    expect(preview?.querySelector('[data-glass-lift="true"]')).not.toBeNull()

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
    const cavity = slot?.querySelector<HTMLElement>(
      '[data-stack-cavity-mineral-id="red-parallelogram"]',
    )
    const cavityShape = cavity?.querySelector('svg')
    const heldPiece = slot?.querySelector<HTMLElement>('button')
    const heldPieceShape = heldPiece?.querySelector('svg')

    expect(slot?.dataset.stackWidth).toBe('3')
    expect(slot?.dataset.stackHeight).toBe('3')
    expect(slot?.style.gridColumn).toContain('span 3')
    expect(slot?.style.gridRow).toContain('span 3')
    expect(Number.parseFloat(cavity?.style.height ?? '')).toBeCloseTo(100 / 3)
    expect(cavity?.style.left).toBe('0%')
    expect(Number.parseFloat(cavity?.style.top ?? '')).toBeCloseTo(100 / 3)
    expect(cavity?.style.width).toBe('100%')
    expect(heldPiece?.style.height).toBe(cavity?.style.height)
    expect(heldPiece?.style.left).toBe(cavity?.style.left)
    expect(heldPiece?.style.top).toBe(cavity?.style.top)
    expect(heldPiece?.style.width).toBe(cavity?.style.width)
    expect(cavityShape?.getAttribute('viewBox')).toBe('0 0 3 1')
    expect(heldPieceShape?.getAttribute('viewBox')).toBe(
      cavityShape?.getAttribute('viewBox'),
    )
  })

  it('keeps ray endpoints inside the board instead of spilling over edge labels', () => {
    const currentRayPreview: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B1',
      id: 1,
      message: 'Exit B1 - Red',
      colorContacts: [],
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

  it('keeps the current ray fixed while one photon bounces along its path', () => {
    const currentRayPreview: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'R1',
      id: 1,
      message: 'Exit R1 - Red',
      colorContacts: [{ color: 'red', pathIndex: 0 }],
      mode: 'edge',
      path: [{ column: 4, row: 0 }],
      query: 'L1',
      signalColor: 'red',
    }

    render(
      <InteractiveGameTable
        currentRayPreview={currentRayPreview}
        showLightPath
      />,
    )

    const rayLayer = document.querySelector('[data-ray-layer="current"]')
    const guide = rayLayer?.querySelector('[data-current-ray-guide="true"]')
    const photons = rayLayer?.querySelectorAll(
      '[data-current-ray-photon="true"]',
    )
    const firstPhoton = rayLayer?.querySelector(
      '[data-current-ray-photon-index="0"]',
    )
    const motion = firstPhoton?.querySelector('animateMotion')
    const colorAnimation = firstPhoton?.querySelector(
      'animate[attributeName="color"]',
    )

    expect(guide).not.toBeNull()
    expect(guide?.querySelector('animate')).toBeNull()
    expect(photons).toHaveLength(1)
    expect(firstPhoton?.getAttribute('rx')).toBe('0.72')
    expect(firstPhoton?.getAttribute('ry')).toBe('0.58')
    expect(motion?.getAttribute('keyPoints')).toBe('0;1;0')
    expect(motion?.getAttribute('keyTimes')).toBe('0;0.5;1')
    expect(motion?.getAttribute('repeatCount')).toBe('indefinite')
    expect(colorAnimation?.getAttribute('repeatCount')).toBe('indefinite')
    expect(firstPhoton?.getAttribute('data-photon-colors')).toBe(
      'transparent red red transparent red red',
    )
  })

  it('does not draw a straight current ray for a transparent clue preview', () => {
    const transparentRayPreview: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B3',
      id: 1,
      message: 'Exit B3 - Transparent',
      colorContacts: [],
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

  it('fires one continuous photon and changes its color at a mineral contact', () => {
    vi.useFakeTimers()
    const coloredRay: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'R1',
      id: -2,
      message: 'Exit R1 - Red',
      colorContacts: [{ color: 'red', pathIndex: 0 }],
      mode: 'edge',
      path: [{ column: 4, row: 0 }],
      query: 'L1',
      signalColor: 'red',
    }

    render(
      <InteractiveGameTable
        allRayPreviews={[coloredRay, reverseEdgeAnswer(coloredRay)]}
        answers={[coloredRay]}
        currentAnswer={coloredRay}
        currentRayPreview={coloredRay}
        showLightPath
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Send ray R1' }))

    const rayShot = document.querySelector('[data-ray-layer="shot"]')
    const photon = rayShot?.querySelector('[data-ray-photon="true"]')

    expect(rayShot?.getAttribute('data-ray-query')).toBe('R1')
    expect(rayShot?.querySelectorAll('[data-ray-photon="true"]')).toHaveLength(
      1,
    )
    expect(photon?.tagName).toBe('line')
    expect(photon?.querySelectorAll('animateMotion')).toHaveLength(1)
    expect(
      photon?.querySelector('animateMotion')?.getAttribute('path'),
    ).toContain('L 56.25 5')
    const colorAnimation = photon?.querySelector(
      'animate[attributeName="color"]',
    )

    expect(photon?.getAttribute('data-photon-colors')).toBe(
      'transparent red red',
    )
    expect(colorAnimation?.getAttribute('calcMode')).toBe('discrete')
    expect(colorAnimation?.getAttribute('values')).toContain('#ef4f4a')
    expect(document.querySelector('[data-ray-layer="current"]')).toBeNull()

    act(() => vi.advanceTimersByTime(2200))

    expect(document.querySelector('[data-ray-layer="shot"]')).toBeNull()
    expect(document.querySelector('[data-ray-layer="current"]')).not.toBeNull()
  })

  it('renders colored placement-derived rays, hides empty ones, and lets the family hide them', () => {
    const allRayPreviews: ReadonlyArray<Extract<Answer, { mode: 'edge' }>> = [
      {
        exitLabel: 'B1',
        id: -1,
        message: 'Exit B1 - Transparent',
        colorContacts: [],
        mode: 'edge',
        path: [{ column: 0, row: 4 }],
        query: 'T1',
        signalColor: 'transparent',
      },
      {
        exitLabel: 'R1',
        id: -2,
        message: 'Exit R1 - Red',
        colorContacts: [],
        mode: 'edge',
        path: [{ column: 4, row: 0 }],
        query: 'L1',
        signalColor: 'red',
      },
    ]

    render(
      <InteractiveGameTable
        allRayPreviews={[
          ...allRayPreviews,
          reverseEdgeAnswer(allRayPreviews[1]),
        ]}
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
    expect(
      document.querySelectorAll('[data-edge-connection="L1::R1"]'),
    ).toHaveLength(1)

    fireEvent.click(allRaysToggle)

    expect(allRaysToggle).toHaveProperty('checked', false)
    expect(document.querySelector('[data-ray-layer="all"]')).toBeNull()
  })

  it('brightens the real output of the latest answer and previews answered labels on hover', () => {
    const latestAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 10,
      message: 'Exit B2 - Red',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 1, row: 4 }],
      query: 'T2',
      signalColor: 'red',
    }
    const hoveredAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'R4',
      id: 11,
      message: 'Exit R4 - Blue',
      colorContacts: [],
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
      colorContacts: [],
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

  it('selects an answered edge instead of asking for the clue again', () => {
    const answer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 12,
      message: 'Exit B2 - Red',
      colorContacts: [],
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

    fireEvent.pointerLeave(output)

    expect(output.getAttribute('data-edge-role')).toBe('emitter')
    expect(input.getAttribute('data-edge-role')).toBe('receiver')

    fireEvent.click(screen.getByRole('button', { name: 'Send ray T3' }))
    expect(onAskEdge).toHaveBeenCalledOnce()
    expect(onAskEdge).toHaveBeenCalledWith('T3')
  })

  it('keeps the selected query aligned across active labels and the current family ray', () => {
    vi.useFakeTimers()
    const latestClue: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'L5',
      id: 14,
      message: 'Exit L5 - Blue',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 3, row: 4 }],
      query: 'T4',
      signalColor: 'blue',
    }
    const selectedClue: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'L6',
      id: 13,
      message: 'Exit L6 - Blue',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 2, row: 5 }],
      query: 'T3',
      signalColor: 'blue',
    }
    const latestFamilyRay: Extract<Answer, { mode: 'edge' }> = {
      ...latestClue,
      id: -4,
      message: 'Exit L5 - Red',
      signalColor: 'red',
    }
    const selectedFamilyRay: Extract<Answer, { mode: 'edge' }> = {
      ...selectedClue,
      id: -3,
      message: 'Exit L6 - Red',
      signalColor: 'red',
    }
    const reverseLatestClue = reverseEdgeAnswer(latestClue)
    const reverseSelectedClue = reverseEdgeAnswer(selectedClue)

    render(
      <InteractiveGameTable
        allRayPreviews={[latestFamilyRay, selectedFamilyRay]}
        answers={[latestClue, selectedClue]}
        currentAnswer={latestClue}
        currentRayPreview={latestFamilyRay}
        edgeAnswers={
          new Map([
            [latestClue.query, latestClue],
            [reverseLatestClue.query, reverseLatestClue],
            [selectedClue.query, selectedClue],
            [reverseSelectedClue.query, reverseSelectedClue],
          ])
        }
        showLightPath
      />,
    )

    expect(
      document
        .querySelector('[data-ray-layer="current"]')
        ?.getAttribute('data-ray-query'),
    ).toBe('T4')

    const selectedInput = screen.getByRole('button', { name: 'Send ray T3' })
    const linkedOutput = screen.getByRole('button', { name: 'Send ray L6' })

    fireEvent.click(selectedInput)
    fireEvent.pointerLeave(selectedInput)

    expect(selectedInput.getAttribute('data-edge-role')).toBe('emitter')
    expect(linkedOutput.getAttribute('data-edge-role')).toBe('receiver')
    expect(selectedInput.style.getPropertyValue('--edge-answer-color')).toBe(
      '#3277d2',
    )
    expect(selectedInput.style.getPropertyValue('--edge-active-color')).toBe(
      '#ef4f4a',
    )
    expect(linkedOutput.style.getPropertyValue('--edge-active-color')).toBe(
      '#ef4f4a',
    )
    expect(
      document
        .querySelector('[data-ray-layer="shot"]')
        ?.getAttribute('data-ray-query'),
    ).toBe('T3')

    act(() => vi.runAllTimers())

    expect(
      document
        .querySelector('[data-ray-layer="current"]')
        ?.getAttribute('data-ray-query'),
    ).toBe('T3')
    expect(selectedInput.getAttribute('data-edge-role')).toBe('emitter')
    expect(linkedOutput.getAttribute('data-edge-role')).toBe('receiver')
  })

  it('hides the fixed ray when the family output does not match the clue', () => {
    vi.useFakeTimers()
    const clue: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'L5',
      id: 14,
      message: 'Exit L5 - Blue',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 3, row: 4 }],
      query: 'T4',
      signalColor: 'blue',
    }
    const familyRay: Extract<Answer, { mode: 'edge' }> = {
      ...clue,
      exitLabel: 'B4',
      id: -4,
      message: 'Exit B4 - Red',
      signalColor: 'red',
    }

    render(
      <InteractiveGameTable
        allRayPreviews={[familyRay]}
        answers={[clue]}
        currentAnswer={clue}
        currentRayPreview={familyRay}
        showLightPath
      />,
    )

    const input = screen.getByRole('button', { name: 'Send ray T4' })
    const clueOutput = screen.getByRole('button', { name: 'Send ray L5' })
    const familyOutput = screen.getByRole('button', { name: 'Send ray B4' })

    expect(document.querySelector('[data-ray-layer="current"]')).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Current ray' })).toBeNull()
    expect(input.getAttribute('data-edge-role')).toBe('emitter')
    expect(clueOutput.getAttribute('data-edge-role')).toBe('receiver')
    expect(familyOutput.getAttribute('data-edge-role')).toBeNull()

    fireEvent.click(input)

    expect(document.querySelector('[data-ray-layer="shot"]')).toBeNull()
    expect(familyOutput.getAttribute('data-edge-role')).toBeNull()

    act(() => vi.runAllTimers())

    expect(document.querySelector('[data-ray-layer="current"]')).toBeNull()
    expect(clueOutput.getAttribute('data-edge-role')).toBe('receiver')
    expect(familyOutput.getAttribute('data-edge-role')).toBeNull()
  })

  it('renders compact colored routes and a return arrow for self-returns', () => {
    const directAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'B2',
      id: 12,
      message: 'Exit B2 - Red',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 1, row: 4 }],
      query: 'T2',
      signalColor: 'red',
    }
    const returningAnswer: Extract<Answer, { mode: 'edge' }> = {
      exitLabel: 'T6',
      id: 13,
      message: 'Exit T6 - Blue',
      colorContacts: [],
      mode: 'edge',
      path: [{ column: 5, row: 0 }],
      query: 'T6',
      signalColor: 'blue',
    }

    render(<InteractiveGameTable answers={[returningAnswer, directAnswer]} />)

    const directRoute = screen.getByLabelText(
      'T2 linked with B2, Red, reversible',
    )
    const returnRoute = screen.getByLabelText('T6 returns to itself, Blue')

    expect(directRoute.textContent).toBe('T2B2')
    expect(directRoute.getAttribute('style')).toContain('#ef4f4a')
    const reversibleArrow = directRoute.querySelector(
      '[data-clue-reversible="true"]',
    )

    expect(reversibleArrow).not.toBeNull()
    expect(reversibleArrow?.classList.contains('lucide-move-horizontal')).toBe(
      true,
    )
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
        readiness: testSubmissionReadiness(guess),
        result: null,
        selectedMineralId: 'red-parallelogram',
      }}
      light={{
        currentRay: currentRayPreview,
        onShowAllRaysChange: setShowAllLightPaths,
        onShowCurrentRayChange: () => undefined,
        raysByPort: new Map(
          allRayPreviews.map((preview) => [preview.query, preview]),
        ),
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

function testSubmissionReadiness(
  guess: ReadonlyArray<GuessPlacement>,
): SolutionSubmissionReadiness {
  const placedPlacements = guess.filter(
    (placement) => placement.origin !== null,
  ).length

  return placedPlacements === guess.length
    ? { status: 'ready' }
    : {
        placedPlacements,
        status: 'incomplete',
        totalPlacements: guess.length,
      }
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
