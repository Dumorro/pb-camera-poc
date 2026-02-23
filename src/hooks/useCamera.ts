import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'
export type FacingMode = 'environment' | 'user'

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  status: CameraStatus
  facingMode: FacingMode
  errorMessage: string | null
  startCamera: (facing?: FacingMode) => Promise<void>
  stopCamera: () => void
  switchCamera: () => void
}

/**
 * Manages getUserMedia lifecycle.
 * Default: environment (rear/1x). Falls back to user (front) then any camera.
 */
export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
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

  const startCamera = useCallback(async (facing: FacingMode = 'environment') => {
    stopCamera()
    setStatus('requesting')
    setFacingMode(facing)
    setErrorMessage(null)

    const constraints: MediaStreamConstraints[] = [
      // Preferred: exact facing mode requested
      {
        video: {
          facingMode: { exact: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      // Non-exact fallback (some desktop browsers ignore facingMode)
      {
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      },
      // Any camera
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

  const switchCamera = useCallback(() => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment'
    startCamera(next)
  }, [facingMode, startCamera])

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, stream, status, facingMode, errorMessage, startCamera, stopCamera, switchCamera }
}
