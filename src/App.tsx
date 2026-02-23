import { useCallback } from 'react'
import { CameraPreview } from './components/CameraPreview'
import { PhotoCapture } from './components/PhotoCapture'
import { VideoCapture } from './components/VideoCapture'
import { useCamera } from './hooks/useCamera'
import { useFrameAnalysis } from './hooks/useFrameAnalysis'

export default function App() {
  const { videoRef, stream, status, errorMessage, startCamera, stopCamera } = useCamera()
  const { metrics, wasmReady, startAnalysis, stopAnalysis } = useFrameAnalysis()

  const handleVideoReady = useCallback(
    (videoEl: HTMLVideoElement) => startAnalysis(videoEl),
    [startAnalysis],
  )

  const handleStop = () => {
    stopAnalysis()
    stopCamera()
  }

  const isActive = status === 'active'

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>P&amp;B Camera PoC</h1>
        <p style={subtitleStyle}>PWA · WASM · Camera 1x</p>
      </header>

      <main style={mainStyle}>
        <CameraPreview
          videoRef={videoRef}
          status={status}
          errorMessage={errorMessage}
          metrics={metrics}
          wasmReady={wasmReady}
          onVideoReady={handleVideoReady}
        />

        {/* Camera controls */}
        <div style={controlsStyle}>
          {!isActive ? (
            <button onClick={startCamera} style={primaryBtnStyle}>
              📷 Iniciar Câmera
            </button>
          ) : (
            <button onClick={handleStop} style={secondaryBtnStyle}>
              ⏏ Parar Câmera
            </button>
          )}
        </div>

        {/* Capture tools */}
        {isActive && (
          <section style={sectionStyle}>
            <PhotoCapture videoRef={videoRef} disabled={!isActive} />
            <hr style={dividerStyle} />
            <VideoCapture stream={stream} />
          </section>
        )}

        {/* WASM status badge */}
        <div style={badgeStyle}>
          <span style={{ color: wasmReady ? '#44ff88' : '#888' }}>
            {wasmReady ? '● WASM ativo' : '○ WASM carregando'}
          </span>
        </div>
      </main>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const appStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#0a0a0a',
  color: '#f0f0f0',
  fontFamily: 'system-ui, sans-serif',
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: React.CSSProperties = {
  padding: '20px 16px 8px',
  textAlign: 'center',
  borderBottom: '1px solid #1e1e1e',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.4rem',
  fontWeight: 700,
  letterSpacing: '-0.03em',
}

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '0.75rem',
  color: '#555',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  maxWidth: '480px',
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  fontSize: '1rem',
  fontWeight: 700,
  background: '#f0f0f0',
  color: '#000',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  fontSize: '1rem',
  background: 'transparent',
  color: '#888',
  border: '1px solid #333',
  borderRadius: '10px',
  cursor: 'pointer',
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #1e1e1e',
  margin: '4px 0',
}

const badgeStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '0.75rem',
  padding: '8px',
}
