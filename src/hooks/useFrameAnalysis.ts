import { useCallback, useEffect, useRef, useState } from 'react'
import { analyze_frame, initWasm } from '../lib/wasm'

export interface FrameMetrics {
  brightness: number
  sharpness: number
}

interface UseFrameAnalysisReturn {
  metrics: FrameMetrics | null
  wasmReady: boolean
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  startAnalysis: (videoEl: HTMLVideoElement) => void
  stopAnalysis: () => void
}

const ANALYSIS_WIDTH = 320
const ANALYSIS_HEIGHT = 240
const FRAME_SKIP = 10 // analyse every 10th frame (~3x/sec at 30fps)

export function useFrameAnalysis(): UseFrameAnalysisReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const [metrics, setMetrics] = useState<FrameMetrics | null>(null)
  const [wasmReady, setWasmReady] = useState(false)

  useEffect(() => {
    initWasm()
      .then(() => setWasmReady(true))
      .catch(() => setWasmReady(false))
  }, [])

  const stopAnalysis = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startAnalysis = useCallback((videoEl: HTMLVideoElement) => {
    stopAnalysis()

    // Ensure hidden canvas exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    canvas.width = ANALYSIS_WIDTH
    canvas.height = ANALYSIS_HEIGHT
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const loop = () => {
      if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameCountRef.current++
        if (frameCountRef.current % FRAME_SKIP === 0) {
          ctx.drawImage(videoEl, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)
          const imageData = ctx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)
          const result = analyze_frame(imageData.data, ANALYSIS_WIDTH, ANALYSIS_HEIGHT)
          if (result) {
            setMetrics({ brightness: result.brightness, sharpness: result.sharpness })
            result.free() // release wasm memory
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [stopAnalysis])

  // Cleanup on unmount
  useEffect(() => () => stopAnalysis(), [stopAnalysis])

  return { metrics, wasmReady, canvasRef, startAnalysis, stopAnalysis }
}
