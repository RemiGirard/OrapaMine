import { expect, test } from '@playwright/test'

test.describe('keyboard-only play', () => {
  test('configures, inspects, places, edits, and returns glass without a pointer', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByTestId('orapa-game')).toHaveAttribute(
      'data-client-ready',
      'true',
    )

    await page.keyboard.press('Tab')
    const easy = page.getByRole('radio', { name: /Easy/ })
    await expect(easy).toBeFocused()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Start experiment' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')

    const board = page.getByTestId('solution-board-surface')
    const ruby = page.getByTestId('toolbox-piece-red-parallelogram')
    await expect(board).toBeVisible()

    await page.keyboard.press('g')
    await expect(ruby).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(board).toBeFocused()
    await expect(board).toHaveAttribute('data-keyboard-movement', 'true')

    const ghost = page.locator('[data-placement-ghost="true"]')
    await expect(ghost).toHaveAttribute('data-grid-column', '2')
    await expect(ghost).toHaveAttribute('data-grid-row', '4')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('r')
    await page.keyboard.press('f')
    await expect(ghost).toHaveAttribute('data-grid-column', '3')
    await expect(ghost).toHaveAttribute('data-grid-row', '5')
    await expect(ghost.locator('svg')).toHaveAttribute(
      'data-mineral-orientation',
      'east',
    )
    await expect(ghost.locator('svg')).toHaveAttribute(
      'data-mineral-face',
      'back',
    )

    await page.keyboard.press('Enter')
    const placedRuby = page.getByTestId('placed-piece-red-parallelogram')
    await expect(placedRuby).toHaveAttribute(
      'aria-label',
      'Ruby parallelogram at C4, R6',
    )
    await expect(placedRuby).toHaveAttribute(
      'title',
      'Ruby parallelogram - east, back',
    )

    await page.keyboard.press('g')
    await expect(placedRuby).toBeFocused()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')
    await expect(placedRuby).toBeVisible()

    await page.keyboard.press('g')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Delete')
    await expect(placedRuby).toHaveCount(0)
    await page.keyboard.press('g')
    await expect(ruby).toBeFocused()

    await page.keyboard.press('p')
    await expect(
      page.getByRole('button', { name: 'Send ray T1' }),
    ).toBeFocused()
    await page.keyboard.press('ArrowRight')
    const t2 = page.getByRole('button', { name: 'Send ray T2' })
    await expect(t2).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(t2).toHaveAttribute('data-edge-role', 'emitter')

    const allRays = page.getByRole('checkbox', { name: 'All rays' })
    await expect(allRays).toBeChecked()
    await page.keyboard.press('a')
    await expect(allRays).not.toBeChecked()
  })
})
