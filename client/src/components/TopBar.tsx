import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'

export const TopBar = () => {
  const [title, setTitle] = useState('未命名画板')
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, right: 12,
      height: 0, // 不占位，让子元素决定高度
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      zIndex: 2000, pointerEvents: 'none' 
    }}>
      {/* 左上角 Logo 和标题 */}
      <div style={{ 
        pointerEvents: 'all', 
        display: 'flex', alignItems: 'center', gap: 12 
      }}>
        {/* Logo 按钮 */}
        <div style={{ 
            background: 'black', color: 'white', 
            width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <LayoutGrid size={20} />
        </div>
        
        {/* 标题 (双击可编辑) */}
        <div style={{
            background: 'white', height: 40, padding: '0 16px', borderRadius: 12,
            display: 'flex', alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            pointerEvents: 'all'
        }}>
            {isEditing ? (
                <input 
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
                    style={{ 
                        fontSize: 14, fontWeight: 600, border: 'none', outline: 'none', 
                        width: 120, background: 'transparent' 
                    }}
                />
            ) : (
                <span 
                    onDoubleClick={() => setIsEditing(true)}
                    style={{ fontSize: 14, fontWeight: 600, color: '#333', cursor: 'text' }}
                >
                    {title}
                </span>
            )}
        </div>
      </div>

      {/* 右上角 (可以放头像或分享按钮) */}
      <div style={{ pointerEvents: 'all', display: 'flex', gap: 8 }}>
          {/* 占位：比如用户头像 */}
          <div style={{
             width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9',
             border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }} />
      </div>
    </div>
  )
}