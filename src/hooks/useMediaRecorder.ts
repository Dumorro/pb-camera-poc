import { useCallback, useRef, useState } from 'react'

export type RecordingStatus = 'idle' | 'recording' | 'done'

interface UseMediaRecorderReturn {
  recordingStatus: RecordingStatus
  blobUrl: string | null
  startRecording: (stream: MediaStream) => void
  stopRecording: () => void
  clearRecording: () => void
}

/** Pick the best supported mimeType for the current browser. */
function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const clearRecording = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    setRecordingStatus('idle')
    chunksRef.current = []
  }, [blobUrl])

  const startRecording = useCallback((stream: MediaStream) => {
    clearRecording()
    const mimeType = getSupportedMimeType()
    const options = mimeType ? { mimeType } : {}
    const recorder = new MediaRecorder(stream, options)
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      setRecordingStatus('done')
    }

    recorder.start(100) // collect in 100ms chunks
    recorderRef.current = recorder
    setRecordingStatus('recording')
  }, [clearRecording])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  return { recordingStatus, blobUrl, startRecording, stopRecording, clearRecording }
}
