export type VoiceRecognitionStatus = 'idle' | 'listening' | 'error'

export type VoiceRecognitionStartResult = 'started' | 'unavailable' | 'error'

export type VoiceRecognitionRequest = Readonly<{
  onEnd: () => void
  onError: () => void
  onTranscript: (transcript: string) => void
}>

export type VoiceRecognitionPort = Readonly<{
  startListening: (
    request: VoiceRecognitionRequest,
  ) => VoiceRecognitionStartResult
}>
