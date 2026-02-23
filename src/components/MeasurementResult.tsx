import { MeasurementResult as Result } from '../lib/vision/pipeline'

interface Props {
  result: Result
  onReset: () => void
}

export function MeasurementResult({ result, onReset }: Props) {
  const { lengthCm, widthCm, marginOfErrorMm } = result

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Resultado</h2>

      <div style={cardsRowStyle}>
        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>Comprimento</span>
          <span style={metricValueStyle}>{lengthCm} <small style={unitStyle}>cm</small></span>
        </div>
        <div style={metricCardStyle}>
          <span style={metricLabelStyle}>Diâmetro</span>
          <span style={metricValueStyle}>{widthCm} <small style={unitStyle}>cm</small></span>
        </div>
      </div>

      <p style={disclaimerStyle}>
        Margem de erro estimada: ±{marginOfErrorMm} mm.
        Resultados são aproximados — iluminação, ângulo e segmentação afetam a precisão.
      </p>
      <p style={debugStyle}>
        Escala do cartão: {result.pxPerMm} px/mm · Esperado: 8–15 px/mm para fotos normais
      </p>

      <button onClick={onReset} style={resetBtnStyle}>
        Nova medição
      </button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '20px 16px',
  background: '#111',
  borderRadius: '12px',
  border: '1px solid #222',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 700,
  textAlign: 'center',
  color: '#f0f0f0',
}

const cardsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
}

const metricCardStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '16px',
  background: '#1a1a1a',
  borderRadius: '10px',
  border: '1px solid #2a2a2a',
  alignItems: 'center',
}

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const metricValueStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#f0f0f0',
  lineHeight: 1,
}

const unitStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 400,
  color: '#aaa',
}

const disclaimerStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.72rem',
  color: '#666',
  textAlign: 'center',
  lineHeight: 1.5,
}

const debugStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.65rem',
  color: '#444',
  textAlign: 'center',
}

const resetBtnStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  background: 'transparent',
  color: '#f0f0f0',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer',
}
