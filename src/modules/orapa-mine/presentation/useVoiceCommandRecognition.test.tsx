/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  VoiceRecognitionPort,
  VoiceRecognitionRequest,
} from '../application/voiceRecognition'
import { useVoiceCommandRecognition } from './useVoiceCommandRecognition'

describe('useVoiceCommandRecognition', () => {
  it('starts an injected voice recognition port and forwards transcripts', () => {
    let capturedRequest: VoiceRecognitionRequest | null = null
    const transcripts: Array<string> = []
    const voiceRecognition: VoiceRecognitionPort = {
      startListening(request) {
        capturedRequest = request
        request.onTranscript('send ray top one')

        return 'started'
      },
    }
    const { result } = renderHook(() =>
      useVoiceCommandRecognition({
        onTranscript: (transcript) => transcripts.push(transcript),
        voiceRecognition,
      }),
    )

    expect(result.current.status).toBe('idle')

    act(() => result.current.startListening())

    expect(result.current.status).toBe('listening')
    expect(transcripts).toEqual(['send ray top one'])

    act(() => capturedRequest?.onEnd())

    expect(result.current.status).toBe('idle')
  })

  it('reports an error state when voice recognition is unavailable', () => {
    const unavailableVoiceRecognition: VoiceRecognitionPort = {
      startListening() {
        return 'unavailable'
      },
    }
    const { result } = renderHook(() =>
      useVoiceCommandRecognition({
        onTranscript: () => undefined,
        voiceRecognition: unavailableVoiceRecognition,
      }),
    )

    act(() => result.current.startListening())

    expect(result.current.status).toBe('error')
  })
})
