/* @vitest-environment jsdom */

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PieceShape } from './PieceShape'

afterEach(cleanup)

describe('PieceShape material', () => {
  it('adds clipped spectral reflections to white glass', () => {
    const { container } = render(
      <PieceShape face="front" mineralId="white-diamond" orientation="north" />,
    )

    expect(
      container.querySelectorAll('.piece-spectrum-reflections path'),
    ).toHaveLength(2)
  })

  it('keeps spectral reflections off colored glass', () => {
    const { container } = render(
      <PieceShape
        face="front"
        mineralId="red-parallelogram"
        orientation="north"
      />,
    )

    expect(container.querySelector('.piece-spectrum-reflections')).toBeNull()
  })
})
