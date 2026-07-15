import { expect, test } from './support/OrapaGame'

test.describe('clue light display', () => {
  test.beforeEach(async ({ game }) => {
    await game.open()
  })

  test('keeps transparent straight rays hidden for new and reopened clues', async ({
    game,
  }) => {
    const t3 = game.edgePort('T3')
    const t4 = game.edgePort('T4')

    await expect(game.currentRay).toHaveCount(0)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)

    await t4.click()
    await expect(t4).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
  })
})
