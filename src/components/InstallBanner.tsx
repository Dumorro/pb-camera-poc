import { useState, useRef } from 'react'

interface InstallBannerProps {
  canInstall: boolean
  isIOS: boolean
  isInstalled: boolean
  saveSettings: (name: string, shortName: string, iconFile: File | null) => Promise<void>
  promptInstall: () => Promise<void>
}

export function InstallBanner({ canInstall, isIOS, isInstalled, saveSettings, promptInstall }: InstallBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('PB-Cam')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (isInstalled || (!canInstall && !isIOS)) return null

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIconFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, 64, 64)
        ctx.drawImage(img, 0, 0, 64, 64)
        setIconPreview(canvas.toDataURL())
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleInstall = async () => {
    setInstalling(true)
    try {
      await saveSettings(name, name, iconFile)
      await promptInstall()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div style={bannerStyle}>
      <button style={headerBtnStyle} onClick={() => setExpanded(!expanded)}>
        <span>📲 Instalar App</span>
        <span style={chevronStyle}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={panelStyle}>
          {/* Name field */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Nome do app (tela inicial)</label>
            <div style={inputRowStyle}>
              <input
                style={inputStyle}
                type="text"
                value={name}
                maxLength={12}
                onChange={(e) => setName(e.target.value)}
                placeholder="PB-Cam"
              />
              <span style={charCountStyle}>{name.length}/12</span>
            </div>
          </div>

          {/* Icon field */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Ícone</label>
            <div style={iconRowStyle}>
              <button style={chooseIconBtnStyle} onClick={() => fileInputRef.current?.click()} type="button">
                Escolher imagem
              </button>
              {iconPreview && <img src={iconPreview} alt="Preview do ícone" style={iconPreviewStyle} />}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleIconChange}
            />
          </div>

          {/* Hidden canvas for icon processing */}
          <canvas ref={canvasRef} width={64} height={64} style={{ display: 'none' }} />

          {/* Android: install button */}
          {canInstall && (
            <button style={installBtnStyle} onClick={handleInstall} disabled={installing || !name.trim()}>
              {installing ? 'Instalando...' : '✓ Instalar App'}
            </button>
          )}

          {/* iOS: manual instructions */}
          {isIOS && (
            <div style={iosBoxStyle}>
              <p style={iosTextStyle}>
                No Safari: toque em <strong>Compartilhar</strong> (⬆) → <strong>Adicionar à Tela de Início</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const bannerStyle: React.CSSProperties = {
  border: '1px solid #2a2a2a',
  borderRadius: '10px',
  overflow: 'hidden',
  background: '#111',
}

const headerBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  color: '#f0f0f0',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
}

const chevronStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#666',
}

const panelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  borderTop: '1px solid #1e1e1e',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#888',
  marginTop: '12px',
}

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#f0f0f0',
  fontSize: '1rem',
}

const charCountStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#555',
  whiteSpace: 'nowrap',
}

const iconRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const chooseIconBtnStyle: React.CSSProperties = {
  padding: '9px 14px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#ccc',
  fontSize: '0.9rem',
  cursor: 'pointer',
}

const iconPreviewStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  objectFit: 'cover',
  border: '1px solid #333',
}

const installBtnStyle: React.CSSProperties = {
  padding: '13px',
  background: '#f0f0f0',
  color: '#000',
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const iosBoxStyle: React.CSSProperties = {
  background: '#1a1a1a',
  borderRadius: '8px',
  padding: '12px',
}

const iosTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#aaa',
  lineHeight: 1.5,
}
