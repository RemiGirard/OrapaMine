import type {
  VoiceRecognitionPort,
  VoiceRecognitionRequest,
  VoiceRecognitionStartResult,
} from '../application/voiceRecognition'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult:
    | ((event: {
        results: ArrayLike<{ 0?: { transcript?: string } } | undefined>
      }) => void)
    | null
  start: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window &
  Readonly<{
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }>

export const browserVoiceRecognition: VoiceRecognitionPort = {
  startListening(request) {
    if (typeof window === 'undefined') {
      return 'unavailable'
    }

    const speechWindow = window as SpeechWindow
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!Recognition) {
      return 'unavailable'
    }

    return startBrowserRecognition(new Recognition(), request)
  },
}

function startBrowserRecognition(
  recognition: SpeechRecognitionLike,
  request: VoiceRecognitionRequest,
): VoiceRecognitionStartResult {
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = navigator.language || 'en-US'
  recognition.onend = request.onEnd
  recognition.onerror = request.onError
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript

    if (transcript) {
      request.onTranscript(transcript)
    }
  }

  try {
    recognition.start()

    return 'started'
  } catch {
    return 'error'
  }
}
