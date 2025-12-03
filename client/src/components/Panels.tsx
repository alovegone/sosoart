// client/src/components/Panels.tsx
import { useEffect, useState } from 'react'
import { useEditor, track } from 'tldraw'
import { Minus, Plus, RotateCcw } from 'lucide-react'

type ZoomControlProps = {
  isSidebarOpen: boolean
}

export const ZoomControl = track(({ isSidebarOpen }: ZoomControlProps) => {
  const editor = useEditor()

  const zoom = Math.round(editor.getZoomLevel() * 100)

  const [inputValue, setInputValue] = useState(String(zoom))
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(zoom))
    }
  }, [zoom, isEditing])

  const clampZoomPercent = (value: number) => {
    return Math.min(800, Math.max(10, value))
  }

  const setZoomPercent = (percent: number) => {
    const clamped = clampZoomPercent(percent)
    const camera = editor.getCamera()
    editor.setCamera({ ...camera, z: clamped / 100 })
  }

  const applyZoomFromInput = () => {
    const raw = parseFloat(inputValue)
    if (Number.isNaN(raw)) {
      setInputValue(String(zoom))
      return
    }
    setZoomPercent(raw)
  }

  const handleZoomOut = () => {
    const camera = editor.getCamera()
    setZoomPercent((camera.z * 100) * 0.9)
  }

  const handleZoomIn = () => {
    const camera = editor.getCamera()
    setZoomPercent((camera.z * 100) * 1.1)
  }

  const handleResetZoom = () => {
    const camera = editor.getCamera()
    editor.setCamera({ ...camera, z: 1 })
  }

  const iconButtonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    color: '#0f172a',
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: isSidebarOpen ? 260 : 80,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'white',
        padding: '6px 12px', // ← 缩小整体 padding
        borderRadius: 999,
        boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 10, // ← 缩短间距
        zIndex: 200,
        fontSize: 13,
        fontWeight: 500,
        pointerEvents: 'all',
      }}
    >
      {/* 缩小 */}
      <button type="button" onClick={handleZoomOut} style={iconButtonStyle}>
        <Minus size={14} />
      </button>

      {/* 中间数字块（更紧凑、数值更居中） */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2, // ← 让数字和 % 靠近一点
          minWidth: 50, // ← 固定宽度，使其在整体中可居中
          justifyContent: 'center', // ← 让数字整体居中
        }}
      >
        <input
          value={inputValue}
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false)
            applyZoomFromInput()
          }}
          onChange={(e) => {
            const v = e.target.value
            if (/^\d*$/.test(v)) {
              setInputValue(v)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false)
              applyZoomFromInput()
            }
            if (e.key === 'Escape') {
              setIsEditing(false)
              setInputValue(String(zoom))
            }
          }}
          style={{
            width: 32, // ← 比原来更窄
            textAlign: 'right',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 500,
            color: '#0f172a',
            padding: 0, // ← 去掉默认 padding
          }}
        />
        <span style={{ fontSize: 13, color: '#0f172a' }}>%</span>
      </div>

      {/* 放大 */}
      <button type="button" onClick={handleZoomIn} style={iconButtonStyle}>
        <Plus size={14} />
      </button>

      {/* 重置（↻） */}
      <button
        type="button"
        onClick={handleResetZoom}
        title="重置为 100%"
        style={{
          ...iconButtonStyle,
        }}
      >
        <RotateCcw size={14} />
      </button>
    </div>
  )
})
