import { useEditor, track } from 'tldraw'
import { Layers, Minimize2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export const BottomLeftPanel = track(({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const editor = useEditor()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')

  // 简单的自动收起逻辑（保留，因为体验好且不涉及复杂数据）
  const isOpenRef = useRef(isOpen)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  useEffect(() => {
    if (!editor) return
    const handleGlobalEvent = (info: any) => {
        if (info.name === 'pointer_down' && info.target === 'canvas' && isOpenRef.current) {
            setIsOpen(false)
        }
    }
    editor.on('event', handleGlobalEvent)
    return () => { editor.off('event', handleGlobalEvent) }
  }, [editor, setIsOpen])

  const shapeIds = editor ? editor.getCurrentPageShapeIds() : []
  const shapes = Array.from(shapeIds).map(id => editor.getShape(id)).filter(Boolean).reverse()

  // --- 简化后的命名逻辑 (只读 meta 或默认类型名) ---
  const getDisplayName = (shape: any) => {
    // 1. 如果有手动设置的名字 (meta.name)，就用它
    if (shape.meta?.name) return shape.meta.name
    
    // 2. 没有就显示默认类型名，不再去监听文本内容，保证稳定
    const typeMap: Record<string, string> = { 
        geo: '几何图形', 
        draw: '手绘', 
        arrow: '箭头', 
        text: '文本', 
        note: '便签', 
        image: '图片',
        frame: '画板', 
        group: '组' 
    }
    return typeMap[shape.type] || '元素'
  }

  const handleDoubleClick = (e: React.MouseEvent, shape: any) => {
    e.stopPropagation()
    setEditingId(shape.id)
    setTempName(getDisplayName(shape))
  }

  const handleSubmitName = () => {
    if (editingId) {
      editor.updateShape({ id: editingId as any, meta: { name: tempName } })
      setEditingId(null)
    }
  }

  return (
    <>
        {/* 侧边栏本体 */}
        <div style={{
            position: 'absolute', top: 12, bottom: 12, left: 12, width: 240, 
            background: 'white', borderRadius: 24, 
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            zIndex: 290, pointerEvents: 'all',
            transform: isOpen ? 'translateX(0)' : 'translateX(-120%)', 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
            <div style={{ padding: '20px 20px 10px', display:'flex', alignItems:'center' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>图层</span>
                <span style={{ marginLeft: 6, fontSize: 12, color: '#999', background:'#f5f5f5', padding:'2px 6px', borderRadius:10 }}>{shapes.length}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                {shapes.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '50%', color: '#ccc', fontSize: 13 }}>暂无图层</div>
                )}
                {shapes.map((shape: any) => (
                    <div 
                        key={shape.id}
                        onClick={() => editor.select(shape.id)}
                        style={{
                            padding: '10px 12px', fontSize: 14, marginBottom: 4, borderRadius: 12,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            background: editor.getSelectedShapeIds().includes(shape.id) ? '#f0f2ff' : 'transparent',
                            color: editor.getSelectedShapeIds().includes(shape.id) ? '#4f46e5' : '#333',
                            transition: 'background 0.2s'
                        }}
                    >
                        <span style={{ opacity: 0.6, fontSize:12 }}>{shape.type === 'image' ? '🖼️' : shape.type === 'text' ? '📝' : '⬜'}</span>
                        
                        {editingId === shape.id ? (
                            <input 
                                autoFocus value={tempName} onChange={e => setTempName(e.target.value)}
                                onBlur={handleSubmitName} onKeyDown={e => e.key === 'Enter' && handleSubmitName()}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '100%', border: '1px solid #4f46e5', borderRadius: 6, fontSize: 13, padding: '2px 6px' }}
                            />
                        ) : (
                            <span onDoubleClick={(e) => handleDoubleClick(e, shape)} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace:'nowrap', userSelect:'none' }}>
                                {getDisplayName(shape)}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #f5f5f5', display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, padding: 6, borderRadius: 8, transition: 'background 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }} title="收起面板">
                    <Minimize2 size={20} />
                </button>
            </div>
        </div>

        {/* 外部打开按钮 */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 300, pointerEvents: 'all', opacity: isOpen ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: isOpen ? 'none' : 'all' }}>
            <button onClick={() => setIsOpen(true)} style={{ width: 44, height: 44, background: 'white', borderRadius: 22, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <Layers size={20} />
            </button>
        </div>
    </>
  )
})