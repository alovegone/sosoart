import { useEditor, track } from 'tldraw'
import { 
  Minus, MoreHorizontal, Pen, 
  Ban, Grid, Square, Check
} from 'lucide-react'

// Tldraw 标准色板定义
const COLORS = [
  { name: 'black', hex: '#1e293b' },
  { name: 'grey', hex: '#94a3b8' },
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'green', hex: '#22c55e' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'violet', hex: '#8b5cf6' },
]

export const ShapeToolbar = track(({ selectedIds }: { selectedIds: string[] }) => {
  const editor = useEditor()
  
  // 获取第一个选中的图形作为样式回显参考
  const firstShape = editor.getShape(selectedIds[0])
  if (!firstShape) return null

  const props = firstShape.props as any
  
  // 只有几何图形 (geo) 才显示填充选项，箭头/画笔没有填充
  const showFill = selectedIds.every(id => editor.getShape(id)?.type === 'geo')

  // 通用更新函数
  const updateProp = (prop: string, value: string) => {
    editor.updateShapes(selectedIds.map(id => ({ id, props: { [prop]: value } })))
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 8px', background: 'white',
      borderRadius: 12, // 大圆角
      boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      pointerEvents: 'all'
    }}>
        
        {/* 1. 颜色选择器 */}
        <div style={{ display: 'flex', gap: 4 }}>
            {COLORS.map((c) => (
                <ColorBtn 
                    key={c.name} 
                    color={c.hex} 
                    active={props.color === c.name} 
                    onClick={() => updateProp('color', c.name)} 
                />
            ))}
        </div>

        <div style={sepStyle}></div>

        {/* 2. 填充模式 (仅 Geo 显示) */}
        {showFill && (
            <>
                <div style={{ display: 'flex', gap: 2 }}>
                    <IconBtn 
                        icon={<Ban size={16} />} 
                        active={props.fill === 'none'} 
                        onClick={() => updateProp('fill', 'none')} 
                        title="无填充"
                    />
                    <IconBtn 
                        icon={<Grid size={16} style={{opacity:0.6}} />} 
                        active={props.fill === 'semi'} 
                        onClick={() => updateProp('fill', 'semi')} 
                        title="半透明"
                    />
                    <IconBtn 
                        icon={<Square size={14} fill="currentColor" />} 
                        active={props.fill === 'solid'} 
                        onClick={() => updateProp('fill', 'solid')} 
                        title="实心"
                    />
                </div>
                <div style={sepStyle}></div>
            </>
        )}

        {/* 3. 线条样式 */}
        <div style={{ display: 'flex', gap: 2 }}>
            <IconBtn 
                icon={<Minus size={18} />} 
                active={props.dash === 'solid'} // 实线
                onClick={() => updateProp('dash', 'solid')} 
                title="实线"
            />
            <IconBtn 
                icon={<MoreHorizontal size={18} />} 
                active={props.dash === 'dashed'} // 虚线
                onClick={() => updateProp('dash', 'dashed')} 
                title="虚线"
            />
            <IconBtn 
                icon={<Pen size={14} />} 
                active={props.dash === 'draw'} // 手绘风
                onClick={() => updateProp('dash', 'draw')} 
                title="手绘风格"
            />
        </div>

        <div style={sepStyle}></div>

        {/* 4. 粗细 (S/M/L/XL) */}
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

    </div>
  )
})

// --- UI 组件 ---

const sepStyle: React.CSSProperties = { width: 1, height: 20, background: '#e5e5e5', margin: '0 2px' }

const ColorBtn = ({ color, active, onClick }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={{
            width: 20, height: 20, borderRadius: '50%',
            background: color,
            border: active ? '2px solid white' : '1px solid transparent',
            boxShadow: active ? `0 0 0 2px ${color}` : 'none',
            cursor: 'pointer', position: 'relative',
            transition: 'transform 0.1s'
        }}
    >
        {active && <Check size={10} color="white" style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)'}} />}
    </button>
)

const IconBtn = ({ icon, active, onClick, title }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        title={title}
        style={{
            width: 30, height: 30, borderRadius: 6,
            background: active ? '#eff6ff' : 'transparent',
            color: active ? '#2563eb' : '#555',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
        }}
    >
        {icon}
    </button>
)

const SizeBtn = ({ label, active, onClick }: any) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={{
            width: 26, height: 26, borderRadius: 6,
            background: active ? '#eff6ff' : 'transparent',
            color: active ? '#2563eb' : '#555',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
        }}
    >
        {label}
    </button>
)