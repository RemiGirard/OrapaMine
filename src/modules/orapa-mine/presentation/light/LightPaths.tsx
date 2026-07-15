import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { edgeConnectionFrom } from '../../domain/edgeConnections'
import type { EdgeConnection } from '../../domain/edgeConnections'
import type { EdgeAnswer } from '../../domain/questions'
import { colorValue } from '../colorPalette'
import { isVisibleRay } from './lightVisibility'
import {
  createBouncingPhotonPlayback,
  createPhotonPlayback,
} from './photonPlayback'
import type { PhotonPlayback } from './photonPlayback'
import { rayPoints, toSvgPoints } from './rayPathGeometry'
import type { RayShot } from './useRayShot'
import styles from './LightPaths.module.css'

type RayAnswer = EdgeAnswer

export function LightPaths({
  connections,
  currentRay,
  onShotComplete,
  rayShot,
  showAllRays,
  showCurrentRay,
}: Readonly<{
  connections: ReadonlyArray<EdgeConnection>
  currentRay: RayAnswer | null
  onShotComplete: (sequence: number) => void
  rayShot: RayShot | null
  showAllRays: boolean
  showCurrentRay: boolean
}>) {
  const visibleCurrentRay = isVisibleRay(currentRay) ? currentRay : null
  const currentRayIdentity = visibleCurrentRay
    ? rayIdentity(visibleCurrentRay)
    : null
  const shotRayIdentity = rayShot ? rayIdentity(rayShot.answer) : null
  const excludedConnectionKeys = [
    showCurrentRay && visibleCurrentRay
      ? edgeConnectionFrom(visibleCurrentRay)?.key
      : undefined,
    rayShot ? edgeConnectionFrom(rayShot.answer)?.key : undefined,
  ].filter((key): key is string => Boolean(key))

  return (
    <>
      {showAllRays ? (
        <AllRaysOverlay
          connections={connections}
          excludedConnectionKeys={excludedConnectionKeys}
        />
      ) : null}
      {visibleCurrentRay &&
      showCurrentRay &&
      currentRayIdentity !== shotRayIdentity ? (
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

function rayIdentity(answer: RayAnswer) {
  return edgeConnectionFrom(answer)?.key ?? `port:${answer.query}`
}

function RayShotOverlay({
  onComplete,
  shot,
}: Readonly<{
  onComplete: (sequence: number) => void
  shot: RayShot
}>) {
  const { answer, sequence } = shot
  const connection = edgeConnectionFrom(answer)
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
      data-edge-connection={connection?.key}
      data-ray-layer="shot"
      data-ray-output={answer.exitLabel}
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
  const connection = edgeConnectionFrom(answer)

  if (points.length < 2) {
    return null
  }

  const playback = createBouncingPhotonPlayback(answer, points)

  return (
    <svg
      aria-hidden="true"
      className={styles.rayLayer}
      data-edge-connection={connection?.key}
      data-ray-layer="current"
      data-ray-output={answer.exitLabel}
      data-ray-query={answer.query}
      preserveAspectRatio="none"
      style={{ '--ray-color': colorValue(answer.signalColor) } as CSSProperties}
      viewBox="0 0 100 100"
    >
      <polyline
        className={styles.currentRayGuide}
        data-current-ray-guide="true"
        points={toSvgPoints(points)}
      />
      <polyline
        className={styles.currentRayCore}
        points={toSvgPoints(points)}
      />
      <BouncingRayPhoton playback={playback} />
      <circle
        className={styles.rayEndpoint}
        cx={points[0].x}
        cy={points[0].y}
        r="0.62"
      />
      <circle
        className={styles.rayEndpoint}
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="0.62"
      />
    </svg>
  )
}

function BouncingRayPhoton({
  playback,
}: Readonly<{
  playback: PhotonPlayback
}>) {
  const { colorStops, durationMs, motionPath } = playback
  const duration = `${durationMs}ms`
  const colorKeyTimes = colorStops
    .map((stop) => formatAnimationNumber(stop.offset))
    .join(';')
  const colorValues = colorStops.map((stop) => colorValue(stop.color)).join(';')

  return (
    <ellipse
      className={styles.currentRayPhoton}
      data-current-ray-photon="true"
      data-current-ray-photon-index="0"
      data-photon-colors={colorStops.map((stop) => stop.color).join(' ')}
      rx="0.72"
      ry="0.58"
      style={{ color: colorValue(colorStops[0].color) }}
    >
      <animateMotion
        calcMode="linear"
        dur={duration}
        keyPoints="0;1;0"
        keyTimes="0;0.5;1"
        path={motionPath}
        repeatCount="indefinite"
      />
      <animate
        attributeName="color"
        calcMode="discrete"
        dur={duration}
        keyTimes={colorKeyTimes}
        repeatCount="indefinite"
        values={colorValues}
      />
    </ellipse>
  )
}

function AllRaysOverlay({
  connections,
  excludedConnectionKeys,
}: Readonly<{
  connections: ReadonlyArray<EdgeConnection>
  excludedConnectionKeys: ReadonlyArray<string>
}>) {
  const visibleConnections = connections.filter(
    (connection) =>
      isVisibleRay(connection.rayFromFirstPort) &&
      !excludedConnectionKeys.includes(connection.key),
  )

  if (visibleConnections.length === 0) {
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
      {visibleConnections.map((connection) => {
        const answer = connection.rayFromFirstPort
        const points = rayPoints(answer)

        if (points.length < 2) {
          return null
        }

        return (
          <g
            data-edge-connection={connection.key}
            data-ray-output={connection.secondPort}
            data-ray-query={answer.query}
            key={connection.key}
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
