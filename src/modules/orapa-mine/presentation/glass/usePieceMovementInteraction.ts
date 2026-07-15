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
import {
  initialKeyboardPlacementOrigin,
  moveKeyboardPlacementOrigin,
} from '../../application/keyboardPieceMovement'
import type { KeyboardMovementDirection } from '../../application/keyboardPieceMovement'
import type {
  PieceMovementAnchor,
  PieceMovementSession,
  PieceMovementTarget,
} from '../../application/pieceMovement'
import type { Coordinate } from '../../domain/coordinates'
import { boardSize } from '../../domain/coordinates'
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

type MovementInput = 'keyboard' | 'pointer'

export function usePieceMovementInteraction({
  boardRef,
  guess,
  onPlace,
  onRemove,
  onSelect,
}: PieceMovementInteractionOptions) {
  const [movementState, setMovementState] =
    useState<PieceMovementSession | null>(null)
  const [movementInput, setMovementInput] = useState<MovementInput | null>(null)
  const [placedPieceMotion, setPlacedPieceMotion] =
    useState<PlacedPieceMotion | null>(null)
  const movementStateRef = useRef<PieceMovementSession | null>(null)
  const movementInputRef = useRef<MovementInput | null>(null)
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

  const commitMovementInput = useCallback((nextInput: MovementInput | null) => {
    movementInputRef.current = nextInput
    setMovementInput(nextInput)
  }, [])

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
      commitMovementInput(null)

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
      commitMovementInput,
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
    commitMovementInput(null)
  }, [cleanupDocumentListeners, commitMovementInput, commitMovementState])

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
      commitMovementInput('pointer')
      attachDocumentListeners()
      onSelect(placement.mineralId)
    },
    [
      attachDocumentListeners,
      commitMovementInput,
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

  const pointerFromBoardOrigin = useCallback(
    (origin: Coordinate) => {
      const boardRect = boardRef.current?.getBoundingClientRect()

      if (!boardRect) {
        return { x: 0, y: 0 }
      }

      return {
        x:
          boardRect.left +
          (origin.column / boardSize.columns) * boardRect.width,
        y: boardRect.top + (origin.row / boardSize.rows) * boardRect.height,
      }
    },
    [boardRef],
  )

  const startMovingPieceWithKeyboard = useCallback(
    (placement: GuessPlacement) => {
      cleanupDocumentListeners()
      const origin = initialKeyboardPlacementOrigin(placement)
      const pointer = pointerFromBoardOrigin(origin)

      commitMovementState(
        startPieceMovement({
          anchor: { column: 0, row: 0 },
          mineralId: placement.mineralId,
          pointer,
          target: { kind: 'board', origin },
        }),
      )
      commitMovementInput('keyboard')
      onSelect(placement.mineralId)
      boardRef.current?.focus()
    },
    [
      boardRef,
      cleanupDocumentListeners,
      commitMovementInput,
      commitMovementState,
      onSelect,
      pointerFromBoardOrigin,
    ],
  )

  const movePieceWithKeyboard = useCallback(
    (direction: KeyboardMovementDirection) => {
      const activeMovement = movementStateRef.current

      if (movementInputRef.current !== 'keyboard' || !activeMovement) {
        return
      }

      const placement = guess.find(
        ({ mineralId }) => mineralId === activeMovement.mineralId,
      )

      if (!placement) {
        return
      }

      const currentOrigin =
        activeMovement.target?.kind === 'board'
          ? activeMovement.target.origin
          : initialKeyboardPlacementOrigin(placement)
      const origin = moveKeyboardPlacementOrigin(
        placement,
        currentOrigin,
        direction,
      )

      commitMovementState(
        movePieceMovement(activeMovement, pointerFromBoardOrigin(origin), {
          kind: 'board',
          origin,
        }),
      )
    },
    [commitMovementState, guess, pointerFromBoardOrigin],
  )

  const finishMovingPieceWithKeyboard = useCallback(() => {
    const activeMovement = movementStateRef.current

    if (movementInputRef.current !== 'keyboard' || !activeMovement) {
      return
    }

    const command = finishPieceMovement(activeMovement, activeMovement.target)
    commitMovementState(null)
    commitMovementInput(null)

    if (command?.kind === 'place') {
      placementSequenceRef.current += 1
      setPlacedPieceMotion({
        mineralId: command.mineralId,
        sequence: placementSequenceRef.current,
      })
      onPlace(command.mineralId, command.origin)
    }
  }, [commitMovementInput, commitMovementState, onPlace])

  const returnMovingPieceToCaseWithKeyboard = useCallback(() => {
    const activeMovement = movementStateRef.current

    if (movementInputRef.current !== 'keyboard' || !activeMovement) {
      return
    }

    commitMovementState(null)
    commitMovementInput(null)
    onRemove(activeMovement.mineralId)
  }, [commitMovementInput, commitMovementState, onRemove])

  useEffect(() => cleanupDocumentListeners, [cleanupDocumentListeners])

  return {
    cancelActiveMovement: cancelMovement,
    cancelMovingPiece,
    dropPickedPiece,
    movementState,
    movementInput,
    movePieceWithKeyboard,
    pickPieceFromClick,
    placedPieceMotion,
    placedDragAnchorFromClientPoint,
    placedMouseDragAnchor,
    placedPointerDragAnchor,
    stackDragAnchor,
    finishMovingPieceWithKeyboard,
    returnMovingPieceToCaseWithKeyboard,
    startMovingPiece,
    startMovingPieceWithMouse,
    startMovingPieceWithKeyboard,
  }
}
