import { useCallback, useState } from 'react'
import type {
  VoiceRecognitionPort,
  VoiceRecognitionStatus,
} from '../application/voiceRecognition'
import { browserVoiceRecognition } from '../infrastructure/browserVoiceRecognition'

type UseVoiceCommandRecognitionParameters = Readonly<{
  onTranscript: (transcript: string) => void
  voiceRecognition?: VoiceRecognitionPort
}>

export function useVoiceCommandRecognition({
  onTranscript,
  voiceRecognition = browserVoiceRecognition,
}: UseVoiceCommandRecognitionParameters) {
  const [status, setStatus] = useState<VoiceRecognitionStatus>('idle')

  const startListening = useCallback(() => {
    const result = voiceRecognition.startListening({
      onEnd: () => setStatus('idle'),
      onError: () => setStatus('error'),
      onTranscript,
    })

    setStatus(result === 'started' ? 'listening' : 'error')
  }, [onTranscript, voiceRecognition])

  return {
    startListening,
    status,
  }
}
