import { expect, test } from './support/OrapaGame'

test.describe('placement feedback', () => {
  test.beforeEach(async ({ game }) => {
    await game.open()
  })

  test('keeps overlapping pieces on the board and marks both as invalid', async ({
    game,
  }) => {
    const ruby = await game.placeFromToolbox('red-parallelogram')
    const topaz = await game.placeFromToolbox('yellow-triangle')

    await expect(ruby).toHaveAttribute('data-placement-state', 'invalid')
    await expect(topaz).toHaveAttribute('data-placement-state', 'invalid')
    await expect(ruby).toHaveAttribute('aria-invalid', 'true')
    await expect(topaz).toHaveAttribute('aria-invalid', 'true')
  })

  test('carries glass with inertial motion and settles it after placement', async ({
    game,
    page,
  }) => {
    await game.toolboxPiece('red-parallelogram').click()
    const boardBox = await game.board.boundingBox()

    if (!boardBox) {
      throw new Error('The solution board must be visible before moving glass')
    }

    const target = { x: boardBox.width * 0.5, y: boardBox.height * 0.5 }
    await game.board.hover({ position: target })

    const preview = page.locator('[data-glass-drag-preview="true"]')

    await expect(preview).toHaveCSS('will-change', 'transform')
    await expect(preview.locator('[data-glass-lift="true"]')).toHaveCount(1)
    await expect(preview).not.toHaveCSS('transform', 'none')

    await game.board.click({ position: target })

    await expect(
      game
        .placedPiece('red-parallelogram')
        .locator('[data-placement-settle="true"]'),
    ).toHaveCSS('animation-name', /glassSettle/)
  })
})
