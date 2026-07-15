import type { Locator } from '@playwright/test'
import { expect, test } from './support/OrapaGame'

test.describe('glass rotation', () => {
  test.beforeEach(async ({ game }) => {
    await game.open()
  })

  test('rotates a toolbox piece clockwise through every orientation', async ({
    game,
  }) => {
    const ruby = game.toolboxPiece('red-parallelogram')

    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )
    const northBox = await visibleBox(ruby)
    expect(northBox.width).toBeGreaterThan(northBox.height)

    for (const orientation of ['east', 'south', 'west', 'north']) {
      await ruby.click({ button: 'right' })
      await expect(ruby).toHaveAttribute(
        'title',
        `Ruby parallelogram - ${orientation}, front`,
      )
    }

    const restoredNorthBox = await visibleBox(ruby)
    expect(restoredNorthBox.width).toBeCloseTo(northBox.width, 1)
    expect(restoredNorthBox.height).toBeCloseTo(northBox.height, 1)
  })

  test('rotates placed glass by mouse and keyboard without changing its face', async ({
    game,
  }) => {
    const ruby = await game.placeFromToolbox('red-parallelogram')

    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )

    await ruby.click({ button: 'right' })
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, front',
    )

    await ruby.press('r')
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - south, front',
    )

    await ruby.click({ button: 'right', modifiers: ['Shift'] })
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - south, back',
    )
  })
})

async function visibleBox(locator: Locator) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error('Expected glass piece to have a visible bounding box')
  }

  return box
}
