import { useEffect, useRef, useState } from 'react'
import { checkContrast, heuristicCardPresent } from '../lib/vision/qualityCheck'

export type ValidationStatus = 'idle' | 'card_missing' | 'low_contrast' | 'ready'

export interface ValidationResult {
  status: ValidationStatus
  message: string
  cardDetected: boolean
  contrastOk: boolean
}

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 240
const INTERVAL_MS = 800

export function useLiveValidation(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
): ValidationResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [result, setResult] = useState<ValidationResult>({
    status: 'idle',
    message: 'Aguardando câmera…',
    cardDetected: false,
    contrastOk: false,
  })

  useEffect(() => {
    if (!active) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setResult({ status: 'idle', message: 'Aguardando câmera…', cardDetected: false, contrastOk: false })
      return
    }

    // Ensure detached canvas exists (never appended to DOM)
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const check = () => {
      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

      ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const contrastOk = checkContrast(imageData)
      const cardDetected = heuristicCardPresent(imageData)

      let status: ValidationStatus
      let message: string

      if (!cardDetected) {
        status = 'card_missing'
        message = 'Posicione o cartão na área indicada'
      } else if (!contrastOk) {
        status = 'low_contrast'
        message = 'Melhore a iluminação para continuar'
      } else {
        status = 'ready'
        message = 'Pronto para fotografar'
      }

      setResult({ status, message, cardDetected, contrastOk })
    }

    check() // run immediately
    intervalRef.current = setInterval(check, INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [active, videoRef])

  return result
}
