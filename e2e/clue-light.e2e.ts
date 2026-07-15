import { expect, test } from './support/OrapaGame'

test.describe('clue light display', () => {
  test.beforeEach(async ({ game }) => {
    await game.open()
  })

  test('does not animate a photon while the family output misses the clue', async ({
    game,
  }) => {
    const t3 = game.edgePort('T3')
    const t4 = game.edgePort('T4')

    await expect(game.currentRay).toHaveCount(0)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.rayPhoton).toHaveCount(0)

    await t4.click()
    await expect(t4).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.rayPhoton).toHaveCount(0)

    await t3.click()
    await expect(t3).toHaveAttribute('data-edge-role', 'emitter')
    await expect(game.currentRay).toHaveCount(0)
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.rayPhoton).toHaveCount(0)
  })

  test('changes the moving photon color when it reaches placed glass', async ({
    game,
  }) => {
    await game.placeFromToolbox('red-parallelogram')

    await game.edgePort('T4').click()

    await expect(game.rayShot).toHaveAttribute('data-ray-query', 'T4')
    await expect(game.rayPhoton).toHaveAttribute(
      'data-photon-colors',
      'transparent red red',
    )
    await expect(game.photonColorAnimation).toHaveAttribute(
      'calcMode',
      'discrete',
    )
    await expect(game.photonColorAnimation).toHaveAttribute(
      'values',
      /#c9edf3;#ef4f4a;#ef4f4a/,
    )
    await expect(game.currentRay).toHaveCount(0)

    await expect(game.rayShot).toHaveCount(0)
    await expect(game.currentRay).toHaveCount(1)
    await expect(game.currentRay).toHaveCSS('filter', 'none')
    await expect(game.currentRayGuide).toHaveCount(1)
    await expect(game.currentRayPhotons).toHaveCount(1)
    const firstBouncingPhoton = game.currentRayPhoton(0)
    await expect(firstBouncingPhoton).toHaveAttribute('rx', '0.72')
    await expect(firstBouncingPhoton).toHaveAttribute('ry', '0.58')
    await expect(firstBouncingPhoton).toHaveCSS('filter', /drop-shadow\(.*10px/)
    await expect(firstBouncingPhoton.locator('animateMotion')).toHaveAttribute(
      'keyPoints',
      '0;1;0',
    )
    await expect(firstBouncingPhoton.locator('animateMotion')).toHaveAttribute(
      'repeatCount',
      'indefinite',
    )
  })

  test('hides the fixed ray when the family output misses the clue output', async ({
    game,
  }) => {
    await game.placeFromToolbox('red-parallelogram', { x: 0.5, y: 0.6 })

    const t4 = game.edgePort('T4')
    const clueOutput = game.edgePort('L5')

    await t4.click()
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.currentRay).toHaveCount(0)
    await expect(t4).toHaveAttribute('data-edge-role', 'emitter')
    await expect(clueOutput).toHaveAttribute('data-edge-role', 'receiver')
  })

  test('keeps a known reverse clue selected and aligned with its family ray', async ({
    game,
    page,
  }) => {
    await game.placeFromToolbox('red-parallelogram')

    const t4 = game.edgePort('T4')
    const t3 = game.edgePort('T3')
    const l5 = game.edgePort('L5')

    await t4.click()
    await expect(t4).toHaveAttribute('data-edge-role', 'emitter')
    await expect(l5).toHaveAttribute('data-edge-role', 'receiver')
    const connectionKey = await t4.getAttribute('data-clue-connection')

    expect(connectionKey).toBeTruthy()
    await expect(l5).toHaveAttribute('data-clue-connection', connectionKey!)
    await expect(t4).toHaveAttribute('data-clue-linked-edge', 'L5')
    await expect(l5).toHaveAttribute('data-clue-linked-edge', 'T4')
    await expect(t4).toHaveAttribute(
      'data-active-light-connection',
      connectionKey!,
    )
    await expect(l5).toHaveAttribute(
      'data-active-light-connection',
      connectionKey!,
    )
    await expect(t4).toHaveAttribute(
      'style',
      /--edge-answer-color: #3277d2; --edge-active-color: #ef4f4a/,
    )
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.currentRay).toHaveAttribute('data-ray-query', 'T4')
    await expect(game.currentRay).toHaveAttribute(
      'data-edge-connection',
      connectionKey!,
    )

    await t3.click()
    await expect(game.rayShot).toHaveCount(0)
    await expect(
      page.locator(
        `[data-ray-layer="all"] [data-edge-connection="${connectionKey}"]`,
      ),
    ).toHaveCount(1)

    await l5.click()
    await page.mouse.move(20, 700)

    await expect(l5).toHaveAttribute('data-edge-role', 'emitter')
    await expect(t4).toHaveAttribute('data-edge-role', 'receiver')
    await expect(game.rayShot).toHaveCount(0)
    await expect(game.currentRay).toHaveAttribute('data-ray-query', 'L5')
  })
})
