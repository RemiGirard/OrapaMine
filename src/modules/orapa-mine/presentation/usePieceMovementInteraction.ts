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
} from '../application/pieceMovement'
import type {
  PieceMovementAnchor,
  PieceMovementSession,
  PieceMovementTarget,
} from '../application/pieceMovement'
import { boardSize } from '../domain/coordinates'
import type { Coordinate } from '../domain/coordinates'
import {
  canPlaceMineralWithOrientation,
  getMineralShape,
  placementsOverlap,
} from '../domain/minerals'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../domain/minerals'

type PieceMovementInteractionOptions = Readonly<{
  boardRef: RefObject<HTMLDivElement | null>
  guess: ReadonlyArray<GuessPlacement>
  onPlace: (mineralId: MineralId, origin: Coordinate) => void
  onRemove: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
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
  const movementStateRef = useRef<PieceMovementSession | null>(null)
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

  const boardPointFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const boardRect = boardRef.current?.getBoundingClientRect()

      if (!boardRect) {
        return null
      }

      const column =
        ((clientX - boardRect.left) / boardRect.width) * boardSize.columns
      const row =
        ((clientY - boardRect.top) / boardRect.height) * boardSize.rows

      if (
        column < 0 ||
        column > boardSize.columns ||
        row < 0 ||
        row > boardSize.rows
      ) {
        return null
      }

      return { column, row }
    },
    [boardRef],
  )

  const canDropMineral = useCallback(
    (mineralId: MineralId, origin: Coordinate) => {
      const targetPlacement = guess.find(
        (placement) => placement.mineralId === mineralId,
      )

      if (!targetPlacement) {
        return false
      }

      if (
        !canPlaceMineralWithOrientation(
          mineralId,
          origin,
          targetPlacement.orientation,
          targetPlacement.face,
        )
      ) {
        return false
      }

      const nextPlacements = guess.flatMap<MineralPlacement>((placement) => {
        if (placement.mineralId === mineralId) {
          return [
            {
              face: targetPlacement.face,
              mineralId,
              orientation: targetPlacement.orientation,
              origin,
            },
          ]
        }

        return placement.origin
          ? [
              {
                face: placement.face,
                mineralId: placement.mineralId,
                orientation: placement.orientation,
                origin: placement.origin,
              },
            ]
          : []
      })

      return !placementsOverlap(nextPlacements)
    },
    [guess],
  )

  const targetOriginFromClientPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      mineralId: MineralId,
      anchor: PieceMovementAnchor,
    ) => {
      const boardPoint = boardPointFromClientPoint(clientX, clientY)

      if (!boardPoint) {
        return null
      }

      const origin = {
        column: Math.round(boardPoint.column - anchor.column),
        row: Math.round(boardPoint.row - anchor.row),
      }

      return canDropMineral(mineralId, origin) ? origin : null
    },
    [boardPointFromClientPoint, canDropMineral],
  )

  const isPointerOverStackSlot = useCallback(
    (clientX: number, clientY: number, mineralId: MineralId) => {
      const stackSlots = document.querySelectorAll('[data-stack-mineral-id]')

      for (const stackSlot of stackSlots) {
        if (!(stackSlot instanceof HTMLElement)) {
          continue
        }

        if (stackSlot.dataset.stackMineralId !== mineralId) {
          continue
        }

        const stackSlotRect = stackSlot.getBoundingClientRect()

        if (
          clientX >= stackSlotRect.left &&
          clientX <= stackSlotRect.right &&
          clientY >= stackSlotRect.top &&
          clientY <= stackSlotRect.bottom
        ) {
          return true
        }
      }

      let currentElement = document.elementFromPoint(clientX, clientY)

      while (currentElement instanceof HTMLElement) {
        if (currentElement.dataset.stackMineralId === mineralId) {
          return true
        }

        currentElement = currentElement.parentElement
      }

      return false
    },
    [],
  )

  const targetFromClientPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      mineralId: MineralId,
      anchor: PieceMovementAnchor,
    ): PieceMovementTarget => {
      const boardOrigin = targetOriginFromClientPoint(
        clientX,
        clientY,
        mineralId,
        anchor,
      )

      if (boardOrigin) {
        return {
          kind: 'board',
          origin: boardOrigin,
        }
      }

      const placement = guess.find(
        (guessPlacement) => guessPlacement.mineralId === mineralId,
      )

      if (
        placement?.origin &&
        isPointerOverStackSlot(clientX, clientY, mineralId)
      ) {
        return { kind: 'stack' }
      }

      return null
    },
    [guess, isPointerOverStackSlot, targetOriginFromClientPoint],
  )

  const stackDragAnchor = useCallback((placement: GuessPlacement) => {
    const shape = getMineralShape(
      placement.mineralId,
      placement.orientation,
      placement.face,
    )

    return {
      column: shape.width / 2,
      row: shape.height / 2,
    }
  }, [])

  const placedDragAnchorFromClientPoint = useCallback(
    (clientX: number, clientY: number, placement: GuessPlacement) => {
      const boardPoint = boardPointFromClientPoint(clientX, clientY)

      if (!boardPoint || !placement.origin) {
        return stackDragAnchor(placement)
      }

      return {
        column: boardPoint.column - placement.origin.column,
        row: boardPoint.row - placement.origin.row,
      }
    },
    [boardPointFromClientPoint, stackDragAnchor],
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
    placedDragAnchorFromClientPoint,
    placedMouseDragAnchor,
    placedPointerDragAnchor,
    stackDragAnchor,
    startMovingPiece,
    startMovingPieceWithMouse,
  }
}
