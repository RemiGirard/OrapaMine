import { expect, test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

type BasicMineralId =
  | 'red-parallelogram'
  | 'yellow-triangle'
  | 'blue-big-triangle'
  | 'white-diamond'
  | 'white-big-triangle'

export class OrapaGame {
  readonly board: Locator
  readonly currentRay: Locator
  readonly photonColorAnimation: Locator
  readonly rayPhoton: Locator
  readonly rayMotion: Locator
  readonly rayShot: Locator

  constructor(private readonly page: Page) {
    this.board = page.getByTestId('solution-board-surface')
    this.currentRay = page.locator('[data-ray-layer="current"]')
    this.rayPhoton = page.locator('[data-ray-photon="true"]')
    this.photonColorAnimation = this.rayPhoton.locator(
      'animate[attributeName="color"]',
    )
    this.rayMotion = this.rayPhoton.locator('animateMotion')
    this.rayShot = page.locator('[data-ray-layer="shot"]')
  }

  async open() {
    await this.page.goto('/')
    await expect(this.page.getByTestId('orapa-game')).toHaveAttribute(
      'data-client-ready',
      'true',
    )
    await expect(
      this.page.getByRole('heading', { name: 'Orapa Mine' }),
    ).toBeVisible()
    await expect(this.board).toBeVisible()
  }

  toolboxPiece(mineralId: BasicMineralId) {
    return this.page.getByTestId(`toolbox-piece-${mineralId}`)
  }

  toolboxCavity(mineralId: BasicMineralId) {
    return this.page.locator(`[data-stack-cavity-mineral-id="${mineralId}"]`)
  }

  toolboxSlot(mineralId: BasicMineralId) {
    return this.page.locator(`[data-stack-mineral-id="${mineralId}"]`)
  }

  placedPiece(mineralId: BasicMineralId) {
    return this.page.getByTestId(`placed-piece-${mineralId}`)
  }

  edgePort(label: string) {
    return this.page.getByRole('button', {
      exact: true,
      name: `Send ray ${label}`,
    })
  }

  async placeFromToolbox(
    mineralId: BasicMineralId,
    normalizedPosition = { x: 0.5, y: 0.5 },
  ) {
    const toolboxPiece = this.toolboxPiece(mineralId)
    await expect(toolboxPiece).toBeVisible()
    await toolboxPiece.click()

    const boardBox = await this.board.boundingBox()

    if (!boardBox) {
      throw new Error('The solution board must be visible before placing glass')
    }

    const placementPoint = {
      x: boardBox.width * normalizedPosition.x,
      y: boardBox.height * normalizedPosition.y,
    }

    await this.board.hover({ position: placementPoint })
    await expect(
      this.page.locator('[data-placement-ghost="true"]'),
    ).toBeVisible()
    await this.board.click({ position: placementPoint })

    const placedPiece = this.placedPiece(mineralId)
    await expect(placedPiece).toBeVisible()

    return placedPiece
  }
}

export const test = base.extend<{ game: OrapaGame }>({
  game: async ({ page }, use) => {
    await use(new OrapaGame(page))
  },
})

export { expect }
