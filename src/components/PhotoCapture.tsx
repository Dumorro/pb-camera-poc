import { useRef, useState } from 'react'
import { analyze_frame } from '../lib/wasm'
import { FrameMetrics } from '../hooks/useFrameAnalysis'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  disabled: boolean
}

interface Snapshot {
  dataUrl: string
  metrics: FrameMetrics | null
}

export function PhotoCapture({ videoRef, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    const imageData = ctx.getImageData(0, 0, w, h)
    const result = analyze_frame(imageData.data, w, h)
    let metrics: FrameMetrics | null = null
    if (result) {
      metrics = { brightness: result.brightness, sharpness: result.sharpness }
      result.free()
    }

    setSnapshot({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), metrics })
  }

  return (
    <div style={containerStyle}>
      <button onClick={capture} disabled={disabled} style={buttonStyle}>
        📸 Capturar Foto
      </button>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {snapshot && (
        <div style={resultStyle}>
          <img src={snapshot.dataUrl} alt="Snapshot" style={imgStyle} />
          {snapshot.metrics && (
            <div style={metricsStyle}>
              <span>Brilho: {(snapshot.metrics.brightness * 100).toFixed(1)}%</span>
              <span>Nitidez: {snapshot.metrics.sharpness.toFixed(0)}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={snapshot.dataUrl} download="pb-capture.jpg" style={linkStyle}>
              ⬇️ Salvar
            </a>
            <button onClick={() => setSnapshot(null)} style={clearBtnStyle}>
              ✕ Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' }

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: '1rem',
  background: '#fff',
  color: '#000',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
}

const resultStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'flex-start',
}

const imgStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '320px',
  borderRadius: '8px',
  border: '2px solid #333',
}

const metricsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  fontSize: '0.8rem',
  color: '#aaa',
}

const linkStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#333',
  color: '#fff',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.85rem',
}

const clearBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#888',
  border: '1px solid #444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
}
