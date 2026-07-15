/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExperimentSetup } from './ExperimentSetup'
import { VictoryScreen } from './VictoryScreen'

describe('experiment session screens', () => {
  afterEach(cleanup)

  it('presents the three protocols as one controlled difficulty choice', () => {
    const onSelect = vi.fn()
    const onStart = vi.fn()

    render(
      <ExperimentSetup
        onSelect={onSelect}
        onStart={onStart}
        selectedDifficulty="classic"
      />,
    )

    const difficulty = screen.getByRole('radiogroup', { name: 'Difficulty' })
    const fullSpectrum = document.querySelector(
      '[data-optical-apparatus="full"]',
    )

    expect(within(difficulty).getAllByRole('radio')).toHaveLength(3)
    expect(fullSpectrum?.querySelectorAll('[data-spectrum-ray]')).toHaveLength(
      7,
    )
    expect(
      within(difficulty)
        .getByRole('radio', { name: /Classic/ })
        .getAttribute('aria-checked'),
    ).toBe('true')

    fireEvent.click(
      within(difficulty).getByRole('radio', { name: /Nearly impossible/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start experiment' }))

    expect(onSelect).toHaveBeenCalledWith('nearly-impossible')
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('reports the resolved experiment and exposes both next actions', () => {
    const onConfigure = vi.fn()
    const onRunAgain = vi.fn()

    render(
      <VictoryScreen
        clueCount={7}
        difficulty="nearly-impossible"
        onConfigure={onConfigure}
        onRunAgain={onRunAgain}
        specimenCount={7}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Spectrum resolved' }),
    ).not.toBeNull()
    expect(screen.getByText('Nearly impossible')).not.toBeNull()
    expect(screen.getByText('Clues observed').parentElement?.textContent).toBe(
      'Clues observed7',
    )
    expect(
      document
        .querySelector('[data-optical-apparatus="compact"]')
        ?.querySelectorAll('[data-spectrum-ray]'),
    ).toHaveLength(7)

    fireEvent.click(screen.getByRole('button', { name: 'Run again' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change difficulty' }))

    expect(onRunAgain).toHaveBeenCalledOnce()
    expect(onConfigure).toHaveBeenCalledOnce()
  })
})
