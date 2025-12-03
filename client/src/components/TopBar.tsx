import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'

export const TopBar = () => {
  const [title, setTitle] = useState('未命名画板')
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        height: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {/* 左上角 Logo + 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'all',
        }}
      >
        <button
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            border: 'none',
            outline: 'none',
            background: '#020617',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 14px 30px rgba(15,23,42,0.35)',
            cursor: 'pointer',
          }}
        >
          <LayoutGrid size={20} color="#f9fafb" />
        </button>

        <div
          onDoubleClick={() => setIsEditing(true)}
          style={{
            minWidth: 160,
            maxWidth: 320,
            padding: '8px 12px',
            borderRadius: 999,
            background: 'white',
            boxShadow: '0 10px 25px rgba(15,23,42,0.14)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditing(false)
              }}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 14,
                fontWeight: 500,
                color: '#0f172a',
                width: '100%',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {title}
            </span>
          )}
        </div>
      </div>
      {/* 右侧区域去掉了占位圆圈，所以这里不再渲染任何东西 */}
    </div>
  )
}
