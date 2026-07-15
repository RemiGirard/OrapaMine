import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { EdgeAnswer } from '../../domain/questions'
import { colorValue } from '../colorPalette'
import { isVisibleRay } from './lightVisibility'
import { createPhotonPlayback } from './photonPlayback'
import type { PhotonPlayback } from './photonPlayback'
import { rayPoints, toSvgPoints } from './rayPathGeometry'
import type { RayShot } from './useRayShot'
import styles from './LightPaths.module.css'

type RayAnswer = EdgeAnswer

export function LightPaths({
  allRays,
  currentRay,
  onShotComplete,
  rayShot,
  showAllRays,
  showCurrentRay,
}: Readonly<{
  allRays: ReadonlyArray<RayAnswer>
  currentRay: RayAnswer | null
  onShotComplete: (sequence: number) => void
  rayShot: RayShot | null
  showAllRays: boolean
  showCurrentRay: boolean
}>) {
  const visibleCurrentRay = isVisibleRay(currentRay) ? currentRay : null
  const shotQuery = rayShot?.answer.query
  const excludedAllRayQueries = [
    showCurrentRay ? visibleCurrentRay?.query : undefined,
    shotQuery,
  ].filter((query): query is string => Boolean(query))

  return (
    <>
      {showAllRays ? (
        <AllRaysOverlay
          answers={allRays}
          excludedQueries={excludedAllRayQueries}
        />
      ) : null}
      {visibleCurrentRay &&
      showCurrentRay &&
      visibleCurrentRay.query !== shotQuery ? (
        <RayOverlay answer={visibleCurrentRay} />
      ) : null}
      {rayShot ? (
        <RayShotOverlay
          key={rayShot.sequence}
          onComplete={onShotComplete}
          shot={rayShot}
        />
      ) : null}
    </>
  )
}

function RayShotOverlay({
  onComplete,
  shot,
}: Readonly<{
  onComplete: (sequence: number) => void
  shot: RayShot
}>) {
  const { answer, sequence } = shot
  const points = rayPoints(answer)
  const playback =
    points.length < 2 ? null : createPhotonPlayback(answer, points)
  const durationMs = playback?.durationMs ?? 0

  useEffect(() => {
    if (durationMs === 0) {
      onComplete(sequence)
      return
    }

    const timeout = window.setTimeout(() => onComplete(sequence), durationMs)

    return () => window.clearTimeout(timeout)
  }, [durationMs, onComplete, sequence])

  if (!playback) {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={`${styles.rayLayer} ${styles.rayShotLayer}`}
      data-ray-layer="shot"
      data-ray-query={answer.query}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <RayPhoton playback={playback} />
    </svg>
  )
}

function RayPhoton({ playback }: Readonly<{ playback: PhotonPlayback }>) {
  const { colorStops, durationMs, motionPath } = playback
  const duration = `${durationMs}ms`
  const colorKeyTimes = colorStops
    .map((stop) => formatAnimationNumber(stop.offset))
    .join(';')
  const colorValues = colorStops.map((stop) => colorValue(stop.color)).join(';')

  return (
    <line
      className={styles.rayPhoton}
      data-photon-colors={colorStops.map((stop) => stop.color).join(' ')}
      data-ray-photon="true"
      style={{ color: colorValue(colorStops[0].color) }}
      x1="-2.2"
      x2="2.2"
      y1="0"
      y2="0"
    >
      <animateMotion
        calcMode="paced"
        dur={duration}
        fill="freeze"
        path={motionPath}
        rotate="auto"
      />
      <animate
        attributeName="color"
        calcMode="discrete"
        dur={duration}
        fill="freeze"
        keyTimes={colorKeyTimes}
        values={colorValues}
      />
      <animate
        attributeName="opacity"
        dur={duration}
        fill="freeze"
        keyTimes="0;0.05;0.88;1"
        values="0;1;1;0"
      />
    </line>
  )
}

function RayOverlay({ answer }: Readonly<{ answer: RayAnswer }>) {
  const points = rayPoints(answer)

  if (points.length < 2) {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={styles.rayLayer}
      data-ray-layer="current"
      preserveAspectRatio="none"
      style={{ '--ray-color': colorValue(answer.signalColor) } as CSSProperties}
      viewBox="0 0 100 100"
    >
      <polyline className={styles.rayGlow} points={toSvgPoints(points)} />
      <polyline className={styles.rayCore} points={toSvgPoints(points)} />
      <circle
        className={styles.raySpark}
        cx={points[0].x}
        cy={points[0].y}
        r="1.1"
      />
      <circle
        className={styles.raySpark}
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="1.1"
      />
    </svg>
  )
}

function AllRaysOverlay({
  answers,
  excludedQueries,
}: Readonly<{
  answers: ReadonlyArray<RayAnswer>
  excludedQueries: ReadonlyArray<string>
}>) {
  const visibleAnswers = answers.filter(
    (answer) => isVisibleRay(answer) && !excludedQueries.includes(answer.query),
  )

  if (visibleAnswers.length === 0) {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={`${styles.rayLayer} ${styles.allRaysLayer}`}
      data-ray-layer="all"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {visibleAnswers.map((answer) => {
        const points = rayPoints(answer)

        if (points.length < 2) {
          return null
        }

        return (
          <g
            data-ray-query={answer.query}
            key={answer.query}
            style={
              { '--ray-color': colorValue(answer.signalColor) } as CSSProperties
            }
          >
            <polyline
              className={styles.allRayGlow}
              points={toSvgPoints(points)}
            />
            <polyline
              className={styles.allRayCore}
              points={toSvgPoints(points)}
            />
          </g>
        )
      })}
    </svg>
  )
}

function formatAnimationNumber(value: number) {
  return Number(value.toFixed(4)).toString()
}
