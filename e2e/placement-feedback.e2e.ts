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
})
