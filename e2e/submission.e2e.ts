import type { Locator } from '@playwright/test'
import { expect, test } from './support/OrapaGame'
import type { OrapaGame } from './support/OrapaGame'

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

    const sapphire = await placeSolvedMap(game)

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

  test('scores an incorrect map and compares it with the solution on demand', async ({
    game,
    page,
  }) => {
    await game.open()
    const sapphire = await placeSolvedMap(game)

    await sapphire.click({ button: 'right' })

    await expect(game.submission).toHaveAttribute(
      'data-submission-state',
      'ready',
    )
    await game.submission.click()

    await expect(game.submission).toHaveAttribute(
      'data-submission-state',
      'incorrect',
    )
    await expect(game.submission).toContainText('4/5 pieces correct')

    const seeSolution = page.getByRole('button', { name: 'See solution' })
    await seeSolution.click()

    await expect(
      page.getByRole('button', { name: 'Hide solution' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.locator('[data-solution-display="comparison"]'),
    ).toHaveCount(5)
    await expect(
      page.locator('[data-submitted-guess-backdrop="true"]'),
    ).toHaveCount(5)
    await expect(page.locator('[data-testid^="placed-piece-"]')).toHaveCount(0)

    const solutionZIndex = await page
      .getByTestId('solution-piece-blue-big-triangle')
      .evaluate((element) => getComputedStyle(element).zIndex)
    const submittedZIndex = await page
      .getByTestId('submitted-guess-blue-big-triangle')
      .evaluate((element) => getComputedStyle(element).zIndex)

    expect(Number(solutionZIndex)).toBeGreaterThan(Number(submittedZIndex))

    await page.getByRole('button', { name: 'Hide solution' }).click()

    await expect(
      page.locator('[data-solution-display="comparison"]'),
    ).toHaveCount(0)
    await expect(
      page.locator('[data-submitted-guess-backdrop="true"]'),
    ).toHaveCount(0)
    await expect(page.locator('[data-testid^="placed-piece-"]')).toHaveCount(5)
  })

  test('finishes a solved experiment with a replayable spectrum result', async ({
    game,
    page,
  }) => {
    await game.open()
    await placeSolvedMap(game)

    await game.submission.click()

    await expect(page.getByTestId('victory-screen')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Spectrum resolved' }),
    ).toBeVisible()
    await expect(page.getByText('Easy calibration')).toBeVisible()
    await expect(page.getByText('Specimens aligned')).toBeVisible()

    await page.getByRole('button', { name: 'Run again' }).click()

    await expect(game.board).toBeVisible()
    await expect(game.submission).toContainText('0/5 placed')
  })
})

async function placeSolvedMap(game: OrapaGame) {
  await game.placeFromToolbox('red-parallelogram', { x: 0.6875, y: 0.05 })
  await game.placeFromToolbox('yellow-triangle', { x: 0.125, y: 0.1 })
  const sapphire = await game.placeFromToolbox('blue-big-triangle', {
    x: 0.5,
    y: 0.5,
  })
  await game.placeFromToolbox('white-diamond', { x: 0.875, y: 0.4 })
  await game.placeFromToolbox('white-big-triangle', { x: 0.375, y: 0.8 })

  return sapphire
}

async function visibleBox(locator: Locator) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error('Expected submission control to have a visible box')
  }

  return box
}
