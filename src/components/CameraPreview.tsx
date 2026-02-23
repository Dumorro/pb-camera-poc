import { useEffect } from 'react'
import { CameraStatus } from '../hooks/useCamera'
import { FrameMetrics } from '../hooks/useFrameAnalysis'
import { QualityOverlay } from './QualityOverlay'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  errorMessage: string | null
  metrics: FrameMetrics | null
  wasmReady: boolean
  onVideoReady: (videoEl: HTMLVideoElement) => void
}

export function CameraPreview({ videoRef, status, errorMessage, metrics, wasmReady, onVideoReady }: Props) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlaying = () => onVideoReady(video)
    video.addEventListener('playing', handlePlaying)
    return () => video.removeEventListener('playing', handlePlaying)
  }, [videoRef, onVideoReady])

  return (
    <div style={containerStyle}>
      {status === 'error' && (
        <div style={errorStyle}>
          <p>❌ {errorMessage}</p>
          <small>Verifique as permissões de câmera do browser.</small>
        </div>
      )}

      {status === 'requesting' && (
        <div style={placeholderStyle}>⏳ Solicitando câmera...</div>
      )}

      {status === 'idle' && (
        <div style={placeholderStyle}>📷 Câmera inativa</div>
      )}

      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        style={{
          ...videoStyle,
          display: status === 'active' ? 'block' : 'none',
        }}
      />

      {status === 'active' && (
        <QualityOverlay metrics={metrics} wasmReady={wasmReady} />
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '9/16',
  maxHeight: '60vh',
  background: '#111',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const videoStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const placeholderStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '1rem',
}

const errorStyle: React.CSSProperties = {
  color: '#ff4444',
  textAlign: 'center',
  padding: '16px',
}
