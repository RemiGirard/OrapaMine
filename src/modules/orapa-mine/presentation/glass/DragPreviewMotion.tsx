import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type Point = Readonly<{ x: number; y: number }>
type Motion = { position: Point; velocityX: number }

export function DragPreviewMotion({
  children,
  style,
  target,
  ...attributes
}: Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> & {
    children: ReactNode
    style: CSSProperties
    target: Point
  }
>) {
  const elementRef = useRef<HTMLDivElement>(null)
  const motionRef = useRef<Motion | null>(null)
  const targetRef = useRef(target)

  useLayoutEffect(() => {
    targetRef.current = target

    if (!motionRef.current || prefersReducedMotion()) {
      motionRef.current = { position: target, velocityX: 0 }
      applyMotion(elementRef.current, motionRef.current)
    }
  }, [target])

  useEffect(() => {
    if (
      prefersReducedMotion() ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      return
    }

    let animationFrame = 0

    const animate = () => {
      const motion = motionRef.current

      if (!motion) {
        return
      }

      const nextPosition = {
        x: approach(motion.position.x, targetRef.current.x),
        y: approach(motion.position.y, targetRef.current.y),
      }
      const horizontalStep = nextPosition.x - motion.position.x
      const nextMotion = {
        position: nextPosition,
        velocityX: motion.velocityX * 0.74 + horizontalStep * 0.26,
      }

      motionRef.current = nextMotion
      applyMotion(elementRef.current, nextMotion)
      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <div {...attributes} ref={elementRef} style={style}>
      {children}
    </div>
  )
}

function approach(current: number, target: number) {
  const distance = target - current

  return Math.abs(distance) < 0.05 ? target : current + distance * 0.48
}

function applyMotion(element: HTMLElement | null, motion: Motion) {
  if (!element) {
    return
  }

  const tilt = Math.max(-4, Math.min(4, motion.velocityX * 0.68))

  element.style.transform = `translate3d(${motion.position.x}px, ${motion.position.y}px, 0) rotate(${tilt}deg)`
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
