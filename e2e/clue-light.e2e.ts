import { expect, test } from './support/OrapaGame'

test.describe('clue light display', () => {
  test.beforeEach(async ({ game }) => {
    await game.open()
  })

  test('fires one photon without exposing a straight ray for new and reopened clues', async ({
    game,
  }) => {
    const t3 = game.edgePort('T3')
    const t4 = game.edgePort('T4')

    await expect(game.currentRay).toHaveCount(0)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveAttribute('data-ray-query', 'T3')
    await expect(game.rayPhoton).toHaveCount(1)

    await t4.click()
    await expect(t4).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveAttribute('data-ray-query', 'T4')
    await expect(game.rayPhoton).toHaveCount(1)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveAttribute('data-ray-query', 'T3')
    await expect(game.rayPhoton).toHaveCount(1)
  })
})
