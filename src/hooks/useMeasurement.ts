import { useCallback, useRef, useState } from 'react'
import { runPipeline, MeasurementResult } from '../lib/vision/pipeline'

export type MeasurementState = 'idle' | 'processing' | 'done' | 'error'

export interface UseMeasurementReturn {
  state: MeasurementState
  result: MeasurementResult | null
  errorMsg: string | null
  capture: () => Promise<void>
  reset: () => void
}

export function useMeasurement(
  videoRef: React.RefObject<HTMLVideoElement | null>,
): UseMeasurementReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [state, setState] = useState<MeasurementState>('idle')
  const [result, setResult] = useState<MeasurementResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    setState('processing')
    setResult(null)
    setErrorMsg(null)

    try {
      // Ensure hidden canvas exists (never appended to DOM)
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
      }
      const canvas = canvasRef.current
      const w = video.videoWidth || 640
      const h = video.videoHeight || 480
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas context unavailable')

      ctx.drawImage(video, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)

      const pipelineResult = await runPipeline(imageData)

      if (pipelineResult.error) {
        setState('error')
        setErrorMsg(pipelineResult.error)
      } else {
        setState('done')
        setResult(pipelineResult.measurements)
      }
    } catch (err: any) {
      setState('error')
      setErrorMsg(err?.message ?? 'Erro desconhecido ao processar imagem.')
    }
  }, [videoRef])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setErrorMsg(null)
  }, [])

  return { state, result, errorMsg, capture, reset }
}
