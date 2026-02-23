import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  status: CameraStatus
  errorMessage: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
}

/**
 * Manages getUserMedia lifecycle.
 * Priority: environment (rear/1x) → user (front) → any video.
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  const startCamera = useCallback(async () => {
    stopCamera()
    setStatus('requesting')
    setErrorMessage(null)

    const constraints: MediaStreamConstraints[] = [
      // 1. Rear camera (1x on mobile)
      {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      // 2. Front camera fallback
      {
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      },
      // 3. Any camera
      { video: true, audio: false },
    ]

    for (const constraint of constraints) {
      try {
        const s = await navigator.mediaDevices.getUserMedia(constraint)
        streamRef.current = s
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play()
        }
        setStatus('active')
        return
      } catch {
        // Try next constraint
      }
    }

    setStatus('error')
    setErrorMessage('Camera access denied or unavailable.')
  }, [stopCamera])

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, stream, status, errorMessage, startCamera, stopCamera }
}
