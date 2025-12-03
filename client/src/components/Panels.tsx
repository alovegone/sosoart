// client/src/components/Panels.tsx
import { useEditor, track } from 'tldraw'
import { Minus, Plus } from 'lucide-react'

export const ZoomControl = track(({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const editor = useEditor()
  const zoom = editor ? Math.round(editor.getZoomLevel() * 100) : 100

  return (
    <div style={{
      position: 'absolute', bottom: 20, 
      left: isSidebarOpen ? 260 : 80, // 联动位置
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'white', padding: '6px 12px', borderRadius: 20,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 200, fontSize: 13, fontWeight: 500, pointerEvents: 'all'
    }}>
      <button onClick={() => editor.zoomOut()} style={{border:'none', background:'transparent', cursor:'pointer', display:'flex', color:'#333'}}><Minus size={14} /></button>
      <span style={{ minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
      <button onClick={() => editor.zoomIn()} style={{border:'none', background:'transparent', cursor:'pointer', display:'flex', color:'#333'}}><Plus size={14} /></button>
    </div>
  )
})