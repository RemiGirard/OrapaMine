import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  finishPieceMovement,
  movePieceMovement,
  startPieceMovement,
} from '../../application/pieceMovement'
import type {
  PieceMovementAnchor,
  PieceMovementSession,
  PieceMovementTarget,
} from '../../application/pieceMovement'
import type { Coordinate } from '../../domain/coordinates'
import type { GuessPlacement, MineralId } from '../../domain/minerals'
import {
  movementTargetFromClientPoint,
  placedDragAnchorFromClientPoint as resolvePlacedDragAnchor,
  stackDragAnchor,
} from './pieceDropTargets'

type PieceMovementInteractionOptions = Readonly<{
  boardRef: RefObject<HTMLDivElement | null>
  guess: ReadonlyArray<GuessPlacement>
  onPlace: (mineralId: MineralId, origin: Coordinate) => void
  onRemove: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
}>

type PlacedPieceMotion = Readonly<{
  mineralId: MineralId
  sequence: number
}>

export function usePieceMovementInteraction({
  boardRef,
  guess,
  onPlace,
  onRemove,
  onSelect,
}: PieceMovementInteractionOptions) {
  const [movementState, setMovementState] =
    useState<PieceMovementSession | null>(null)
  const [placedPieceMotion, setPlacedPieceMotion] =
    useState<PlacedPieceMotion | null>(null)
  const movementStateRef = useRef<PieceMovementSession | null>(null)
  const placementSequenceRef = useRef(0)
  const suppressedClickMineralIdRef = useRef<MineralId | null>(null)
  const cleanupDocumentListenersRef = useRef<(() => void) | null>(null)

  const commitMovementState = useCallback(
    (nextMovementState: PieceMovementSession | null) => {
      movementStateRef.current = nextMovementState
      setMovementState(nextMovementState)
    },
    [],
  )

  const cleanupDocumentListeners = useCallback(() => {
    cleanupDocumentListenersRef.current?.()
    cleanupDocumentListenersRef.current = null
  }, [])

  const targetFromClientPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      mineralId: MineralId,
      anchor: PieceMovementAnchor,
    ): PieceMovementTarget => {
      return movementTargetFromClientPoint({
        anchor,
        boardRect: boardRef.current?.getBoundingClientRect() ?? null,
        documentRoot: document,
        guess,
        mineralId,
        point: { x: clientX, y: clientY },
      })
    },
    [boardRef, guess],
  )

  const placedDragAnchorFromClientPoint = useCallback(
    (clientX: number, clientY: number, placement: GuessPlacement) => {
      return resolvePlacedDragAnchor(
        boardRef.current?.getBoundingClientRect() ?? null,
        { x: clientX, y: clientY },
        placement,
      )
    },
    [boardRef],
  )

  const placedPointerDragAnchor = useCallback(
    (event: ReactPointerEvent, placement: GuessPlacement) =>
      placedDragAnchorFromClientPoint(event.clientX, event.clientY, placement),
    [placedDragAnchorFromClientPoint],
  )

  const placedMouseDragAnchor = useCallback(
    (event: ReactMouseEvent, placement: GuessPlacement) =>
      placedDragAnchorFromClientPoint(event.clientX, event.clientY, placement),
    [placedDragAnchorFromClientPoint],
  )

  const suppressClickAfterDrag = useCallback((mineralId: MineralId) => {
    suppressedClickMineralIdRef.current = mineralId
    window.setTimeout(() => {
      if (suppressedClickMineralIdRef.current === mineralId) {
        suppressedClickMineralIdRef.current = null
      }
    }, 0)
  }, [])

  const shouldIgnoreClickAfterDrag = useCallback((mineralId: MineralId) => {
    if (suppressedClickMineralIdRef.current !== mineralId) {
      return false
    }

    suppressedClickMineralIdRef.current = null
    return true
  }, [])

  const movePiecePreviewFromClientPoint = useCallback(
    (clientX: number, clientY: number, mineralId: MineralId) => {
      const currentMovementState = movementStateRef.current

      if (currentMovementState?.mineralId !== mineralId) {
        return
      }

      commitMovementState(
        movePieceMovement(
          currentMovementState,
          {
            x: clientX,
            y: clientY,
          },
          targetFromClientPoint(
            clientX,
            clientY,
            mineralId,
            currentMovementState.anchor,
          ),
        ),
      )
    },
    [commitMovementState, targetFromClientPoint],
  )

  const finishMovingPieceFromClientPoint = useCallback(
    (clientX: number, clientY: number, mineralId: MineralId) => {
      const currentMovementState = movementStateRef.current

      if (currentMovementState?.mineralId !== mineralId) {
        return
      }

      const target = targetFromClientPoint(
        clientX,
        clientY,
        mineralId,
        currentMovementState.anchor,
      )
      const command = finishPieceMovement(currentMovementState, target)
      const wasPointerDrag = currentMovementState.hasMoved

      cleanupDocumentListeners()
      commitMovementState(null)

      if (wasPointerDrag) {
        suppressClickAfterDrag(mineralId)
      }

      if (command?.kind === 'place') {
        placementSequenceRef.current += 1
        setPlacedPieceMotion({
          mineralId: command.mineralId,
          sequence: placementSequenceRef.current,
        })
        onPlace(command.mineralId, command.origin)
      }

      if (command?.kind === 'return') {
        onRemove(command.mineralId)
      }
    },
    [
      cleanupDocumentListeners,
      commitMovementState,
      onPlace,
      onRemove,
      suppressClickAfterDrag,
      targetFromClientPoint,
    ],
  )

  const cancelMovement = useCallback(() => {
    cleanupDocumentListeners()
    commitMovementState(null)
  }, [cleanupDocumentListeners, commitMovementState])

  const attachDocumentListeners = useCallback(() => {
    if (cleanupDocumentListenersRef.current) {
      return
    }

    function moveActivePiece(clientX: number, clientY: number) {
      const activeMovementState = movementStateRef.current

      if (!activeMovementState) {
        return
      }

      movePiecePreviewFromClientPoint(
        clientX,
        clientY,
        activeMovementState.mineralId,
      )
    }

    function finishActivePiece(clientX: number, clientY: number) {
      const activeMovementState = movementStateRef.current

      if (!activeMovementState) {
        return
      }

      finishMovingPieceFromClientPoint(
        clientX,
        clientY,
        activeMovementState.mineralId,
      )
    }

    function handleMouseMove(event: MouseEvent) {
      moveActivePiece(event.clientX, event.clientY)
    }

    function handleMouseUp(event: MouseEvent) {
      finishActivePiece(event.clientX, event.clientY)
    }

    function handlePointerMove(event: PointerEvent) {
      moveActivePiece(event.clientX, event.clientY)
    }

    function handlePointerUp(event: PointerEvent) {
      finishActivePiece(event.clientX, event.clientY)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        cancelMovement()
      }
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('mouseup', handleMouseUp, true)
    document.addEventListener('pointermove', handlePointerMove, true)
    document.addEventListener('pointerup', handlePointerUp, true)
    document.addEventListener('keydown', handleKeyDown, true)

    cleanupDocumentListenersRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.removeEventListener('pointermove', handlePointerMove, true)
      document.removeEventListener('pointerup', handlePointerUp, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    cancelMovement,
    finishMovingPieceFromClientPoint,
    movePiecePreviewFromClientPoint,
  ])

  const startMovingPieceFromClientPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      placement: GuessPlacement,
      anchor: PieceMovementAnchor,
    ) => {
      commitMovementState(
        startPieceMovement({
          anchor,
          mineralId: placement.mineralId,
          pointer: {
            x: clientX,
            y: clientY,
          },
          target: targetFromClientPoint(
            clientX,
            clientY,
            placement.mineralId,
            anchor,
          ),
        }),
      )
      attachDocumentListeners()
      onSelect(placement.mineralId)
    },
    [
      attachDocumentListeners,
      commitMovementState,
      onSelect,
      targetFromClientPoint,
    ],
  )

  const startMovingPiece = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      placement: GuessPlacement,
      anchor: PieceMovementAnchor,
    ) => {
      if (event.button !== 0) {
        return
      }

      event.preventDefault()
      startMovingPieceFromClientPoint(
        event.clientX,
        event.clientY,
        placement,
        anchor,
      )
    },
    [startMovingPieceFromClientPoint],
  )

  const startMovingPieceWithMouse = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      placement: GuessPlacement,
      anchor: PieceMovementAnchor,
    ) => {
      if (event.button !== 0 || movementStateRef.current) {
        return
      }

      event.preventDefault()
      startMovingPieceFromClientPoint(
        event.clientX,
        event.clientY,
        placement,
        anchor,
      )
    },
    [startMovingPieceFromClientPoint],
  )

  const pickPieceFromClick = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      placement: GuessPlacement,
      anchor: PieceMovementAnchor,
    ) => {
      event.preventDefault()
      event.stopPropagation()

      if (shouldIgnoreClickAfterDrag(placement.mineralId)) {
        return
      }

      startMovingPieceFromClientPoint(
        event.clientX,
        event.clientY,
        placement,
        anchor,
      )
    },
    [shouldIgnoreClickAfterDrag, startMovingPieceFromClientPoint],
  )

  const dropPickedPiece = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const activeMovementState = movementStateRef.current

      if (!activeMovementState) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      finishMovingPieceFromClientPoint(
        event.clientX,
        event.clientY,
        activeMovementState.mineralId,
      )
    },
    [finishMovingPieceFromClientPoint],
  )

  const cancelMovingPiece = useCallback(
    (mineralId: MineralId) => {
      if (movementStateRef.current?.mineralId === mineralId) {
        cancelMovement()
      }
    },
    [cancelMovement],
  )

  useEffect(() => cleanupDocumentListeners, [cleanupDocumentListeners])

  return {
    cancelActiveMovement: cancelMovement,
    cancelMovingPiece,
    dropPickedPiece,
    movementState,
    pickPieceFromClick,
    placedPieceMotion,
    placedDragAnchorFromClientPoint,
    placedMouseDragAnchor,
    placedPointerDragAnchor,
    stackDragAnchor,
    startMovingPiece,
    startMovingPieceWithMouse,
  }
}
