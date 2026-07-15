import { useHotkeys } from '@tanstack/react-hotkeys'
import type { UseHotkeyDefinition } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'
import type { SolutionSubmissionReadiness } from '../../application/solutionSubmission'
import type { MineralId } from '../../domain/minerals'
import type { usePieceMovementInteraction } from '../glass/usePieceMovementInteraction'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>

type GameKeyboardControlsOptions = Readonly<{
  boardRef: RefObject<HTMLDivElement | null>
  hasCurrentRay: boolean
  movement: MovementInteraction
  onFlip: (mineralId: MineralId) => void
  onRotate: (mineralId: MineralId) => void
  onShowAllRaysChange: (visible: boolean) => void
  onShowCurrentRayChange: (visible: boolean) => void
  onSubmit: () => void
  readiness: SolutionSubmissionReadiness
  showAllRays: boolean
  showCurrentRay: boolean
}>

function focusFirst(selector: string) {
  document.querySelector<HTMLElement>(selector)?.focus()
}

export function useGameKeyboardControls({
  boardRef,
  hasCurrentRay,
  movement,
  onFlip,
  onRotate,
  onShowAllRaysChange,
  onShowCurrentRayChange,
  onSubmit,
  readiness,
  showAllRays,
  showCurrentRay,
}: GameKeyboardControlsOptions) {
  const isMovingWithKeyboard = movement.movementInput === 'keyboard'
  const activeMineralId = movement.movementState?.mineralId
  const movementOptions = {
    enabled: isMovingWithKeyboard,
    requireReset: true,
  } as const
  const hotkeys: Array<UseHotkeyDefinition> = [
    {
      callback: () => movement.movePieceWithKeyboard('up'),
      hotkey: 'ArrowUp',
      options: { enabled: isMovingWithKeyboard },
    },
    {
      callback: () => movement.movePieceWithKeyboard('right'),
      hotkey: 'ArrowRight',
      options: { enabled: isMovingWithKeyboard },
    },
    {
      callback: () => movement.movePieceWithKeyboard('down'),
      hotkey: 'ArrowDown',
      options: { enabled: isMovingWithKeyboard },
    },
    {
      callback: () => movement.movePieceWithKeyboard('left'),
      hotkey: 'ArrowLeft',
      options: { enabled: isMovingWithKeyboard },
    },
    {
      callback: movement.finishMovingPieceWithKeyboard,
      hotkey: 'Enter',
      options: movementOptions,
    },
    {
      callback: movement.finishMovingPieceWithKeyboard,
      hotkey: 'Space',
      options: movementOptions,
    },
    {
      callback: movement.cancelActiveMovement,
      hotkey: 'Escape',
      options: movementOptions,
    },
    {
      callback: () => {
        if (activeMineralId) onRotate(activeMineralId)
      },
      hotkey: 'R',
      options: movementOptions,
    },
    {
      callback: () => {
        if (activeMineralId) onFlip(activeMineralId)
      },
      hotkey: 'F',
      options: movementOptions,
    },
    {
      callback: movement.returnMovingPieceToCaseWithKeyboard,
      hotkey: 'Delete',
      options: movementOptions,
    },
    {
      callback: movement.returnMovingPieceToCaseWithKeyboard,
      hotkey: 'Backspace',
      options: movementOptions,
    },
    {
      callback: () => focusFirst('[data-edge-port="true"]'),
      hotkey: 'P',
      options: { enabled: !isMovingWithKeyboard, requireReset: true },
    },
    {
      callback: () =>
        focusFirst(
          '[data-glass-control][data-selected="true"], [data-glass-control]',
        ),
      hotkey: 'G',
      options: { enabled: !isMovingWithKeyboard, requireReset: true },
    },
    {
      callback: () => boardRef.current?.focus(),
      hotkey: 'B',
      options: { enabled: !isMovingWithKeyboard, requireReset: true },
    },
    {
      callback: () => onShowAllRaysChange(!showAllRays),
      hotkey: 'A',
      options: { enabled: !isMovingWithKeyboard, requireReset: true },
    },
    {
      callback: () => onShowCurrentRayChange(!showCurrentRay),
      hotkey: 'C',
      options: {
        enabled: !isMovingWithKeyboard && hasCurrentRay,
        requireReset: true,
      },
    },
    {
      callback: onSubmit,
      hotkey: 'Mod+Enter',
      options: {
        enabled: !isMovingWithKeyboard && readiness.status === 'ready',
        requireReset: true,
      },
    },
  ]

  useHotkeys(hotkeys, {
    ignoreInputs: true,
    preventDefault: true,
    stopPropagation: true,
  })
}
