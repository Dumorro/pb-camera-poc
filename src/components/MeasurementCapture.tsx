import { useLiveValidation } from '../hooks/useLiveValidation'
import { useMeasurement } from '../hooks/useMeasurement'
import { MeasurementOverlay } from './MeasurementOverlay'
import { MeasurementResult } from './MeasurementResult'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
}

export function MeasurementCapture({ videoRef, isActive }: Props) {
  const validation = useLiveValidation(videoRef, isActive && true)
  const { state, result, errorMsg, capture, reset } = useMeasurement(videoRef)

  const canCapture = validation.status === 'ready' && state === 'idle'
  const isProcessing = state === 'processing'

  if (state === 'done' && result) {
    return <MeasurementResult result={result} onReset={reset} />
  }

  return (
    <div style={wrapperStyle}>
      {/* Measurement overlay rendered on top of the camera preview */}
      {isActive && <MeasurementOverlay validation={validation} />}

      {/* Processing spinner overlay */}
      {isProcessing && (
        <div style={processingOverlayStyle}>
          <div style={spinnerStyle} />
          <span style={processingTextStyle}>Analisando…</span>
        </div>
      )}

      {/* Error message */}
      {state === 'error' && errorMsg && (
        <div style={errorBarStyle}>
          <span style={errorTextStyle}>{errorMsg}</span>
          <button onClick={reset} style={retryBtnStyle}>Tentar novamente</button>
        </div>
      )}

      {/* Capture button */}
      {isActive && state !== 'processing' && (
        <button
          onClick={capture}
          disabled={!canCapture}
          style={{ ...captureBtnStyle, opacity: canCapture ? 1 : 0.4 }}
        >
          📏 Fotografar
        </button>
      )}
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  pointerEvents: 'none',
  zIndex: 10,
  WebkitTransform: 'translateZ(0)',
  transform: 'translateZ(0)',
}

const processingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  pointerEvents: 'all',
  zIndex: 10,
}

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255,255,255,0.15)',
  borderTop: '3px solid #f0f0f0',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}

const processingTextStyle: React.CSSProperties = {
  color: '#f0f0f0',
  fontSize: '0.95rem',
  fontWeight: 600,
}

const errorBarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '60px',
  left: '12px',
  right: '12px',
  background: 'rgba(180,30,30,0.9)',
  borderRadius: '8px',
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  pointerEvents: 'all',
  zIndex: 10,
}

const errorTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#fff',
  lineHeight: 1.4,
}

const retryBtnStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '6px 12px',
  fontSize: '0.8rem',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '6px',
  cursor: 'pointer',
}

const captureBtnStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '14px 36px',
  fontSize: '1rem',
  fontWeight: 700,
  background: '#f0f0f0',
  color: '#000',
  border: 'none',
  borderRadius: '50px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  pointerEvents: 'all',
  zIndex: 5,
  transition: 'opacity 0.2s',
}
