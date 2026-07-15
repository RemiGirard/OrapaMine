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
    const rubyCavity = game.toolboxCavity('red-parallelogram')
    const rubySlot = game.toolboxSlot('red-parallelogram')
    const topaz = game.toolboxPiece('yellow-triangle')

    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )
    const northBox = await visibleBox(ruby)
    const northCavityBox = await visibleBox(rubyCavity)
    const northSlotBox = await visibleBox(rubySlot)
    expect(northBox.width).toBeGreaterThan(northBox.height)

    await ruby.click({ button: 'right' })
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, front',
    )
    const eastBox = await visibleBox(ruby)
    expect(eastBox.height).toBeGreaterThan(eastBox.width)
    expect(boxesOverlap(eastBox, await visibleBox(topaz))).toBe(false)
    expect(await visibleBox(rubyCavity)).toEqual(northCavityBox)
    expect(await visibleBox(rubySlot)).toEqual(northSlotBox)
    await expect(
      rubyCavity.locator('[data-mineral-orientation="north"]'),
    ).toBeVisible()
    await expect(
      rubyCavity.locator('[data-mineral-face="front"]'),
    ).toBeVisible()

    for (const orientation of ['south', 'west', 'north']) {
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

  test('restores neutral orientation when resetting the solution', async ({
    game,
  }) => {
    const ruby = game.toolboxPiece('red-parallelogram')

    await ruby.click({ button: 'right' })
    await ruby.click({ button: 'right', modifiers: ['Shift'] })
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, back',
    )

    await game.resetSolutionButton().click()

    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )
  })

  test('restores neutral orientation when returning glass to its case', async ({
    game,
  }) => {
    const placedRuby = await game.placeFromToolbox('red-parallelogram')

    await placedRuby.click({ button: 'right' })
    await placedRuby.click({ button: 'right', modifiers: ['Shift'] })
    await expect(placedRuby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, back',
    )

    await game.returnToCaseButton('Ruby parallelogram').click()

    await expect(game.toolboxPiece('red-parallelogram')).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )
  })

  test('rotates placed glass by mouse and keyboard without changing its face', async ({
    game,
  }) => {
    const ruby = await game.placeFromToolbox('red-parallelogram')
    const northBox = await visibleBox(ruby)

    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - north, front',
    )

    await ruby.click({ button: 'right' })
    await expect(ruby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, front',
    )
    await expect(
      ruby.locator('[data-rotation-motion="clockwise"]'),
    ).toBeVisible()
    const eastBox = await visibleBox(ruby)
    expect(boxCenter(eastBox).x).toBeCloseTo(boxCenter(northBox).x, 1)
    expect(boxCenter(eastBox).y).toBeCloseTo(boxCenter(northBox).y, 1)
    await expectRigidRotation(ruby)

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

  test('keeps diamond facets rigid through a quarter turn', async ({
    game,
  }) => {
    const diamond = await game.placeFromToolbox('white-big-triangle')
    const northBox = await visibleBox(diamond)

    await diamond.click({ button: 'right' })
    await expect(diamond).toHaveAttribute(
      'title',
      'Diamond big triangle - east, front',
    )

    const eastBox = await visibleBox(diamond)
    expect(boxCenter(eastBox).x).toBeCloseTo(boxCenter(northBox).x, 1)
    expect(boxCenter(eastBox).y).toBeCloseTo(boxCenter(northBox).y, 1)
    await expectRigidRotation(diamond)
  })

  test('keeps an edge rotation and marks the outside glass as invalid', async ({
    game,
  }) => {
    const ruby = await game.placeFromToolbox('red-parallelogram', {
      x: 0.19,
      y: 0.05,
    })

    await expect(ruby).toHaveAttribute('data-placement-state', 'valid')

    await ruby.click({ button: 'right' })

    await expect(ruby).toHaveAttribute('data-placement-state', 'invalid')
    await expect(ruby).toHaveAttribute('aria-invalid', 'true')
    await expect(
      ruby.locator('[data-mineral-orientation="east"]'),
    ).toBeVisible()
    await expect(
      ruby.locator('[data-rotation-motion="clockwise"]'),
    ).toBeVisible()
  })
})

async function visibleBox(locator: Locator) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error('Expected glass piece to have a visible bounding box')
  }

  return box
}

async function expectRigidRotation(piece: Locator) {
  const shape = piece.locator('[data-rotation-motion="clockwise"]')

  await expect(shape).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet')

  const transitionDurations = await piece.evaluate((element) =>
    getComputedStyle(element)
      .transitionDuration.split(',')
      .map((duration) => duration.trim()),
  )
  expect(transitionDurations.every((duration) => duration === '0s')).toBe(true)

  const rotationScale = await shape.evaluate((element) => {
    const svg = element as SVGSVGElement
    const animation = svg.getAnimations().at(0)

    if (!animation) {
      throw new Error('Expected a quarter-turn animation')
    }

    animation.pause()
    const duration = animation.effect?.getTiming().duration
    animation.currentTime = typeof duration === 'number' ? duration / 2 : 140

    const matrix = svg.getScreenCTM()

    if (!matrix) {
      throw new Error('Expected an SVG transform matrix')
    }

    return {
      x: Math.hypot(matrix.a, matrix.b),
      y: Math.hypot(matrix.c, matrix.d),
    }
  })

  expect(rotationScale.x).toBeCloseTo(rotationScale.y, 3)
}

function boxCenter(box: Awaited<ReturnType<typeof visibleBox>>) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }
}

function boxesOverlap(
  first: Awaited<ReturnType<typeof visibleBox>>,
  second: Awaited<ReturnType<typeof visibleBox>>,
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  )
}
