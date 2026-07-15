import type { Locator } from '@playwright/test'
import { expect, test } from './support/OrapaGame'

test.describe('solution submission', () => {
  test('stays fixed while clues are added and reports missing glass', async ({
    game,
  }) => {
    await game.open()

    await expect(game.submission).toHaveAttribute(
      'data-submission-state',
      'incomplete',
    )
    await expect(game.submission).toBeDisabled()
    await expect(game.submission).toContainText('0/5 placed')
    const initialBox = await visibleBox(game.submission)

    await game.edgePort('T3').click()
    await expect(game.submission).toContainText('0/5 placed')

    const withClueBox = await visibleBox(game.submission)
    expect(withClueBox.x).toBeCloseTo(initialBox.x, 1)
    expect(withClueBox.y).toBeCloseTo(initialBox.y, 1)
  })

  test('enables a complete matching map and flags a later clue conflict', async ({
    game,
  }) => {
    await game.open()
    await game.edgePort('T3').click()

    await game.placeFromToolbox('red-parallelogram', { x: 0.6875, y: 0.05 })
    await game.placeFromToolbox('yellow-triangle', { x: 0.125, y: 0.1 })
    const sapphire = await game.placeFromToolbox('blue-big-triangle', {
      x: 0.5,
      y: 0.5,
    })
    await game.placeFromToolbox('white-diamond', { x: 0.875, y: 0.4 })
    await game.placeFromToolbox('white-big-triangle', { x: 0.375, y: 0.8 })

    await expect(game.submission).toHaveAttribute(
      'data-submission-state',
      'ready',
    )
    await expect(game.submission).toBeEnabled()

    await sapphire.click({ button: 'right' })

    await expect(game.submission).toHaveAttribute(
      'data-submission-state',
      'conflicting-clues',
    )
    await expect(game.submission).toBeDisabled()
    await expect(game.submission).toContainText('0/1 clues match')
  })
})

async function visibleBox(locator: Locator) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error('Expected submission control to have a visible box')
  }

  return box
}
