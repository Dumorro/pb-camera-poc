import { useEffect } from 'react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'

interface Props {
  stream: MediaStream | null
}

export function VideoCapture({ stream }: Props) {
  const { recordingStatus, blobUrl, startRecording, stopRecording, clearRecording } =
    useMediaRecorder()

  // Auto-stop if stream goes away
  useEffect(() => {
    if (!stream && recordingStatus === 'recording') stopRecording()
  }, [stream, recordingStatus, stopRecording])

  const handleRecord = () => {
    if (!stream) return
    if (recordingStatus === 'recording') {
      stopRecording()
    } else {
      clearRecording()
      startRecording(stream)
    }
  }

  const isRecording = recordingStatus === 'recording'
  const isDone = recordingStatus === 'done'

  return (
    <div style={containerStyle}>
      <button
        onClick={handleRecord}
        disabled={!stream}
        style={{ ...buttonStyle, background: isRecording ? '#cc0000' : '#222', color: '#fff' }}
      >
        {isRecording ? '⏹ Parar Gravação' : '🔴 Gravar Vídeo'}
      </button>

      {isDone && blobUrl && (
        <div style={resultStyle}>
          <video src={blobUrl} controls style={videoStyle} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={blobUrl} download="pb-video.webm" style={linkStyle}>
              ⬇️ Baixar vídeo
            </a>
            <button onClick={clearRecording} style={clearBtnStyle}>
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
  border: '1px solid #444',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
}

const resultStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const videoStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '320px',
  borderRadius: '8px',
  border: '2px solid #333',
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
