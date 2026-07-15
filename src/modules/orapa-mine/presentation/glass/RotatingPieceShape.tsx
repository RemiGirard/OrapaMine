import { useEffect, useRef } from 'react'
import type { MineralFace, MineralId, Orientation } from '../../domain/minerals'
import { PieceShape } from '../PieceShape'
import styles from './Glass.module.css'

export function RotatingPieceShape({
  className,
  face,
  mineralId,
  orientation,
}: Readonly<{
  className: string
  face: MineralFace
  mineralId: MineralId
  orientation: Orientation
}>) {
  const previousOrientation = useRef(orientation)
  const isClockwiseRotation = previousOrientation.current !== orientation

  useEffect(() => {
    previousOrientation.current = orientation
  }, [orientation])

  return (
    <PieceShape
      className={[
        className,
        isClockwiseRotation ? styles.rotatingPieceShape : '',
      ].join(' ')}
      face={face}
      key={`${orientation}:${face}`}
      mineralId={mineralId}
      orientation={orientation}
      rotationMotion={isClockwiseRotation ? 'clockwise' : undefined}
    />
  )
}
