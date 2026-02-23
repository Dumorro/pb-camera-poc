import { ValidationResult } from '../hooks/useLiveValidation'

interface Props {
  validation: ValidationResult
}

export function MeasurementOverlay({ validation }: Props) {
  const { cardDetected, contrastOk, message, status } = validation
  const isReady = status === 'ready'

  return (
    <div style={overlayStyle}>
      {/* Subject guide — left-center, ~35% wide × 75% tall */}
      <div style={subjectGuideStyle}>
        <span style={guideLabelStyle}>Objeto</span>
      </div>

      {/* Card guide — right side, ~18% wide × 11% tall, credit card aspect */}
      <div style={cardGuideStyle}>
        <span style={guideLabelStyle}>Cartão</span>
      </div>

      {/* Status dots — top-right */}
      <div style={statusDotsStyle}>
        <div style={dotRowStyle}>
          <span style={{ ...dotStyle, background: cardDetected ? '#44ff88' : '#ff4444' }} />
          <span style={dotLabelStyle}>Referência</span>
        </div>
        <div style={dotRowStyle}>
          <span style={{ ...dotStyle, background: contrastOk ? '#44ff88' : '#ff4444' }} />
          <span style={dotLabelStyle}>Iluminação</span>
        </div>
      </div>

      {/* Feedback bar — bottom */}
      <div style={{ ...feedbackBarStyle, background: isReady ? 'rgba(68,255,136,0.18)' : 'rgba(0,0,0,0.55)' }}>
        <span style={{ ...feedbackTextStyle, color: isReady ? '#44ff88' : '#f0f0f0' }}>
          {message}
        </span>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
}

const subjectGuideStyle: React.CSSProperties = {
  position: 'absolute',
  left: '5%',
  top: '8%',
  width: '40%',
  height: '78%',
  border: '2.5px dashed rgba(255,255,255,0.95)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '6px',
  filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))',
}

const cardGuideStyle: React.CSSProperties = {
  position: 'absolute',
  right: '4%',
  top: '38%',
  width: '34%',
  // credit card aspect ratio ~1.585 → height ≈ width / 1.585
  aspectRatio: '1.585',
  border: '2.5px dashed rgba(255,220,50,0.95)',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '4px',
  filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))',
}

const guideLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  userSelect: 'none',
  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
}

const statusDotsStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const dotRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
}

const dotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
}

const dotLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#f0f0f0',
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
}

const feedbackBarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '10px 16px',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  textAlign: 'center',
  transition: 'background 0.3s',
}

const feedbackTextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  transition: 'color 0.3s',
}
