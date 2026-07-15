/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SolutionSubmission } from './SolutionSubmission'

afterEach(cleanup)

describe('SolutionSubmission', () => {
  it('shows placement progress until every piece is on the board', () => {
    render(
      <SolutionSubmission
        onSubmit={() => undefined}
        readiness={{
          placedPlacements: 2,
          status: 'incomplete',
          totalPlacements: 5,
        }}
        result={null}
      />,
    )

    const button = screen.getByRole('button')

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.dataset.submissionState).toBe('incomplete')
    expect(screen.getByText('Place all glass')).toBeDefined()
    expect(screen.getByText('2/5 placed')).toBeDefined()
  })

  it('distinguishes invalid placement from clue conflict', () => {
    const { rerender } = render(
      <SolutionSubmission
        onSubmit={() => undefined}
        readiness={{
          invalidPlacements: 1,
          status: 'invalid',
          totalPlacements: 5,
        }}
        result={null}
      />,
    )

    expect(screen.getByText('Adjust glass')).toBeDefined()
    expect(screen.getByText('1 invalid placement')).toBeDefined()

    rerender(
      <SolutionSubmission
        onSubmit={() => undefined}
        readiness={{
          matchedClues: 2,
          status: 'conflicting-clues',
          totalClues: 3,
        }}
        result={null}
      />,
    )

    const button = screen.getByRole('button')

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.dataset.submissionState).toBe('conflicting-clues')
    expect(screen.getByText('Clues conflict')).toBeDefined()
    expect(screen.getByText('2/3 clues match')).toBeDefined()
  })

  it('enables submission for a complete consistent map', () => {
    const onSubmit = vi.fn()

    render(
      <SolutionSubmission
        onSubmit={onSubmit}
        readiness={{ status: 'ready' }}
        result={null}
      />,
    )

    const button = screen.getByRole('button')

    expect(button.hasAttribute('disabled')).toBe(false)
    expect(button.dataset.submissionState).toBe('ready')
    expect(screen.getByText('Submit solution')).toBeDefined()

    fireEvent.click(button)

    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
