import { FrameMetrics } from '../hooks/useFrameAnalysis'

interface Props {
  metrics: FrameMetrics | null
  wasmReady: boolean
}

const BRIGHTNESS_THRESHOLD = 0.15
const SHARPNESS_THRESHOLD = 50

export function QualityOverlay({ metrics, wasmReady }: Props) {
  if (!wasmReady) {
    return (
      <div style={overlayStyle}>
        <span style={{ color: '#aaa' }}>⏳ Carregando análise...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div style={overlayStyle}>
        <span style={{ color: '#aaa' }}>📡 Aguardando frames...</span>
      </div>
    )
  }

  const tooDark = metrics.brightness < BRIGHTNESS_THRESHOLD
  const blurry = metrics.sharpness < SHARPNESS_THRESHOLD

  let message: string
  let color: string

  if (tooDark && blurry) {
    message = '🌑 Ambiente muito escuro e câmera tremendo'
    color = '#ff4444'
  } else if (tooDark) {
    message = '🌑 Ambiente muito escuro'
    color = '#ff8800'
  } else if (blurry) {
    message = '📷 Câmera tremendo – firme mais'
    color = '#ffcc00'
  } else {
    message = '✅ Boa qualidade'
    color = '#44ff88'
  }

  return (
    <div style={overlayStyle}>
      <span style={{ color, fontWeight: 'bold', fontSize: '0.95rem' }}>{message}</span>
      <div style={metricsStyle}>
        <span>Brilho: {(metrics.brightness * 100).toFixed(1)}%</span>
        <span>Nitidez: {metrics.sharpness.toFixed(0)}</span>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '12px 16px',
  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const metricsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  fontSize: '0.75rem',
  color: '#ccc',
}
