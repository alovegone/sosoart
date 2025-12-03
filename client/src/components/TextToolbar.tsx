import { useEditor, track } from 'tldraw'
import { Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

export const TextToolbar = track(({ selectedIds }: { selectedIds: string[] }) => {
  const editor = useEditor()
  const firstShape = editor.getShape(selectedIds[0])
  if (!firstShape) return null

  const updateTextProp = (prop: string, value: string) => {
    editor.updateShapes(selectedIds.map(id => ({ id, props: { [prop]: value } })))
  }

  const handleToggleFont = () => {
    const fonts = ['sans', 'serif', 'draw', 'mono']
    const current = (firstShape.props as any).font
    const next = fonts[(fonts.indexOf(current) + 1) % fonts.length]
    updateTextProp('font', next)
  }

  return (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
        background: 'white', borderRadius: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', height: 40, pointerEvents: 'all'
    }}>
        <ToolBtn onClick={handleToggleFont} icon={<Type size={18} />} label="切换字体" />
        <div style={{ width: 1, height: 16, background: '#e5e5e5', margin: '0 4px' }} />
        {['s', 'm', 'l', 'xl'].map(size => (
            <TextSizeBtn key={size} label={size.toUpperCase()} active={(firstShape.props as any).size === size} onClick={() => updateTextProp('size', size)} />
        ))}
        <div style={{ width: 1, height: 16, background: '#e5e5e5', margin: '0 4px' }} />
        {/* 注意：这里属性名是 textAlign */}
        <ToolBtn onClick={() => updateTextProp('textAlign', 'start')} icon={<AlignLeft size={18} />} label="左对齐" active={(firstShape.props as any).textAlign === 'start'} />
        <ToolBtn onClick={() => updateTextProp('textAlign', 'middle')} icon={<AlignCenter size={18} />} label="居中" active={(firstShape.props as any).textAlign === 'middle'} />
        <ToolBtn onClick={() => updateTextProp('textAlign', 'end')} icon={<AlignRight size={18} />} label="右对齐" active={(firstShape.props as any).textAlign === 'end'} />
        <div style={{ width: 1, height: 16, background: '#e5e5e5', margin: '0 4px' }} />
        <div style={{ display: 'flex', gap: 4 }}>
            {['black', 'blue', 'red', 'green', 'orange'].map(color => (
                <ColorDot key={color} color={color} active={(firstShape.props as any).color === color} onClick={() => updateTextProp('color', color)} />
            ))}
        </div>
    </div>
  )
})

const ToolBtn = ({ onClick, icon, label, active }: any) => ( <button onClick={onClick} title={label} style={{ background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#444', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{icon}</button> )
const TextSizeBtn = ({ label, active, onClick }: any) => ( <button onClick={onClick} style={{ background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#64748b', border: 'none', borderRadius: 6, width: 24, height: 24, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</button> )
const ColorDot = ({ color, active, onClick }: any) => { const map:any={black:'#1e293b',blue:'#3b82f6',red:'#ef4444',green:'#22c55e',orange:'#f97316'}; return <button onClick={onClick} style={{ width: 16, height: 16, borderRadius: '50%', background: map[color], border: active ? '2px solid white' : '1px solid transparent', boxShadow: active ? `0 0 0 2px ${map[color]}` : 'none', cursor: 'pointer' }} /> }