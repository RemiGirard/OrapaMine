import { expect, test } from '@playwright/test'

test.describe('experiment session flow', () => {
  test('configures the expansion protocol before opening the laboratory', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByTestId('orapa-game')).toHaveAttribute(
      'data-client-ready',
      'true',
    )
    const setup = page.getByTestId('experiment-setup')
    await expect(setup).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(3)

    const nearlyImpossible = page.getByRole('radio', {
      name: /Nearly impossible/,
    })
    await nearlyImpossible.click()
    await expect(nearlyImpossible).toHaveAttribute('aria-checked', 'true')
    await expect(setup).toContainText('expert-shaft')

    await page.getByRole('button', { name: 'Start experiment' }).click()

    await expect(page.getByTestId('solution-board-surface')).toBeVisible()
    await expect(page.locator('[data-submission-state]')).toContainText(
      '0/7 placed',
    )
    await expect(
      page.getByTestId('toolbox-piece-transparent-prism'),
    ).toBeVisible()
    await expect(page.getByTestId('toolbox-piece-black-absorber')).toBeVisible()

    await page.getByRole('button', { name: 'New puzzle' }).click()

    await expect(setup).toBeVisible()
    await expect(nearlyImpossible).toHaveAttribute('aria-checked', 'true')
  })
})
