import { useEditor, track } from 'tldraw'
import { 
  Minus, MoreHorizontal, Pen, 
  Ban, Grid, Square, 
  Palette, MousePointer2, ChevronDown
} from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { useState, useRef, useEffect } from 'react'

// Tldraw 标准色板扩充 (模拟更丰富的预设)
const PRESET_COLORS = [
  { name: 'black', hex: '#1e293b' },
  { name: 'grey', hex: '#94a3b8' },
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'green', hex: '#22c55e' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'white', hex: '#ffffff' }, 
]

export const ShapeToolbar = track(({ selectedIds }: { selectedIds: string[] }) => {
  const editor = useEditor()
  const [activePopover, setActivePopover] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭 Popover
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const firstShape = editor.getShape(selectedIds[0])
  if (!firstShape) return null

  const props = firstShape.props as any
  const opacity = (firstShape as any).opacity ?? 1
  
  // 判断当前选中是否支持填充
  const showFill = selectedIds.every(id => editor.getShape(id)?.type === 'geo')

  // 更新属性 (Props)
  const updateProp = (prop: string, value: any) => {
    editor.updateShapes(selectedIds.map(id => ({ id, props: { [prop]: value } })))
  }

  // 更新透明度 (Opacity 是顶层属性，不在 props 里)
  const updateOpacity = (value: number) => {
    editor.updateShapes(selectedIds.map(id => ({ id, opacity: value })))
  }

  const togglePopover = (name: string) => setActivePopover(activePopover === name ? null : name)

  return (
    <div className="shape-toolbar" ref={popoverRef} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', background: 'white',
      borderRadius: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)',
      pointerEvents: 'all', userSelect: 'none'
    }}>
        
        {/* --- 1. 颜色控制 (带 Popover) --- */}
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => togglePopover('color')}
                style={btnStyle(activePopover === 'color')}
            >
                <div style={{ 
                    width: 18, height: 18, borderRadius: '50%', 
                    background: PRESET_COLORS.find(c => c.name === props.color)?.hex || props.color || '#000',
                    border: '1px solid rgba(0,0,0,0.1)' 
                }} />
                <ChevronDown size={14} color="#666" />
            </button>
            
            {activePopover === 'color' && (
                <div style={popoverStyle}>
                    <div style={{ padding: 12 }}>
                        {/* 预设颜色网格 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => updateProp('color', c.name)}
                                    title={c.name}
                                    style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: c.hex,
                                        border: props.color === c.name ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)',
                                        boxShadow: props.color === c.name ? '0 0 0 2px white inset' : 'none',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                        <div style={sepHorizontalStyle} />
                        {/* 自定义颜色 (HexColorPicker) */}
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 8, fontWeight: 600 }}>自定义颜色</div>
                            <HexColorPicker 
                                color={props.color.startsWith('#') ? props.color : '#000000'} 
                                onChange={(c) => updateProp('color', c)} 
                                style={{ width: '100%', height: 120 }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div style={sepStyle}></div>

        {/* --- 2. 填充模式 (仅 Geo 显示) --- */}
        {showFill && (
            <>
                <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', padding: 2, borderRadius: 8 }}>
                    <IconBtn 
                        icon={<Ban size={14} />} 
                        active={props.fill === 'none'} 
                        onClick={() => updateProp('fill', 'none')} 
                        title="无填充"
                    />
                    <IconBtn 
                        icon={<Grid size={14} style={{opacity:0.6}} />} 
                        active={props.fill === 'semi'} 
                        onClick={() => updateProp('fill', 'semi')} 
                        title="半透明"
                    />
                    <IconBtn 
                        icon={<Square size={12} fill="currentColor" />} 
                        active={props.fill === 'solid'} 
                        onClick={() => updateProp('fill', 'solid')} 
                        title="实心"
                    />
                </div>
                <div style={sepStyle}></div>
            </>
        )}

        {/* --- 3. 线条样式 --- */}
        <div style={{ display: 'flex', gap: 2 }}>
            <IconBtn 
                icon={<Minus size={16} />} 
                active={props.dash === 'solid'} 
                onClick={() => updateProp('dash', 'solid')} 
                title="实线"
            />
            <IconBtn 
                icon={<MoreHorizontal size={16} />} 
                active={props.dash === 'dashed'} 
                onClick={() => updateProp('dash', 'dashed')} 
                title="虚线"
            />
            <IconBtn 
                icon={<Pen size={14} />} 
                active={props.dash === 'draw'} 
                onClick={() => updateProp('dash', 'draw')} 
                title="手绘风"
            />
        </div>

        <div style={sepStyle}></div>

        {/* --- 4. 粗细 --- */}
        <div style={{ display: 'flex', gap: 2 }}>
            {['s', 'm', 'l', 'xl'].map(size => (
                <SizeBtn 
                    key={size} 
                    label={size} 
                    active={props.size === size} 
                    onClick={() => updateProp('size', size)} 
                />
            ))}
        </div>

        <div style={sepStyle}></div>

        {/* --- 5. 透明度滑块 (新增功能) --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
            <div title="透明度" style={{ display: 'flex', opacity: 0.5 }}><MousePointer2 size={14} /></div>
            <input 
                type="range" 
                min="0.1" max="1" step="0.1" 
                value={opacity}
                onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                style={{ 
                    width: 60, height: 4, borderRadius: 2, 
                    accentColor: '#3b82f6', cursor: 'pointer' 
                }} 
            />
        </div>

    </div>
  )
})

// --- 样式定义 ---

const btnStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 8px', borderRadius: 8,
    background: active ? '#eff6ff' : 'transparent',
    border: active ? '1px solid #bfdbfe' : '1px solid transparent',
    cursor: 'pointer', transition: 'all 0.2s',
}) as React.CSSProperties

const popoverStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 10px)', left: 0,
    background: 'white', borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
    zIndex: 3000, width: 200, overflow: 'hidden'
}

const sepStyle: React.CSSProperties = { 
    width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' 
}

const sepHorizontalStyle: React.CSSProperties = {
    width: '100%', height: 1, background: '#f1f5f9', margin: '12px 0'
}

const IconBtn = ({ icon, active, onClick, title }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        title={title}
        style={{
            width: 28, height: 28, borderRadius: 6,
            background: active ? 'white' : 'transparent',
            color: active ? '#2563eb' : '#64748b',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s'
        }}
    >
        {icon}
    </button>
)

const SizeBtn = ({ label, active, onClick }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={{
            width: 24, height: 24, borderRadius: '50%',
            background: active ? '#3b82f6' : 'transparent',
            color: active ? 'white' : '#64748b',
            border: active ? 'none' : '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            transition: 'all 0.15s'
        }}
    >
        {label}
    </button>
)