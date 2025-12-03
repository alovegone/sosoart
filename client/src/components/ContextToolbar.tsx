import { useEditor, track } from 'tldraw'
import { 
  Group, Ungroup, Download, Scissors,
  AlignLeft, AlignCenterHorizontal, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  // [关键修复] 删除了可能导致报错的 Distribute 图标，改用更通用的图标
  MoreHorizontal, MoreVertical, 
  Grid, ChevronDown 
} from 'lucide-react'
import { useState } from 'react'
import { TextToolbar } from './TextToolbar'
import { ShapeToolbar } from './ShapeToolbar'

export const ContextToolbar = track(() => {
  // 1. Hooks
  const editor = useEditor()
  const [showAlignMenu, setShowAlignMenu] = useState(false)

  // 2. 数据获取
  const selectedIds = editor.getSelectedShapeIds()
  const hasSelection = selectedIds.length > 0
  const selectedShapes = editor.getSelectedShapes()

  // 3. 变量计算
  const imageShapes = selectedShapes.filter(s => s.type === 'image')
  const hasImages = imageShapes.length > 0
  
  const isAllText = hasSelection && selectedShapes.every(s => s.type === 'text')
  const styleableTypes = ['geo', 'arrow', 'line', 'draw']
  const isAllStyleable = hasSelection && selectedShapes.every(s => styleableTypes.includes(s.type))
  
  const isSingleGroup = hasSelection && selectedIds.length === 1 && editor.getShape(selectedIds[0])?.type === 'group'
  const isMultiSelect = selectedIds.length > 1
  const isDistributable = selectedIds.length >= 3

  // 4. 功能函数
  const align = (type: any) => editor.alignShapes(selectedIds, type)
  const distribute = (type: any) => { if(isDistributable) editor.distributeShapes(selectedIds, type) }
  
  const handleDownload = () => {
    if (!hasImages) return
    imageShapes.forEach((shape: any, index) => {
        setTimeout(() => {
            const assetId = shape.props.assetId
            const asset = editor.getAsset(assetId) as any
            if (asset && asset.props.src) {
                const a = document.createElement('a')
                a.href = asset.props.src
                a.download = asset.props.name || `image-${Date.now()}-${index}.png`
                document.body.appendChild(a); a.click(); document.body.removeChild(a)
            }
        }, index * 200)
    })
  }

  const handleGroup = () => isSingleGroup ? editor.ungroupShapes(selectedIds) : editor.groupShapes(selectedIds)
  const handleCrop = () => alert('提示：双击图片即可进入裁剪模式') 

  // 5. Early Return
  if (!hasSelection) return null

  // 6. UI 定位
  const bounds = editor.getSelectionPageBounds()
  if (!bounds) return null
  const screenPos = editor.pageToViewport({ x: bounds.midX, y: bounds.minY })
  
  const style = {
      position: 'absolute' as const, top: screenPos.y - 60, left: screenPos.x,
      transform: 'translateX(-50%)', zIndex: 2000
  }

  // --- 分流渲染 ---

  // A. 文本模式
  if (isAllText) {
      return (
        <div style={style} onPointerDown={e => e.stopPropagation()}>
            <TextToolbar selectedIds={selectedIds} />
        </div>
      )
  }

  // B. 图形样式模式
  if (isAllStyleable) {
      return (
        <div style={style} onPointerDown={e => e.stopPropagation()}>
            <ShapeToolbar selectedIds={selectedIds} />
        </div>
      )
  }

  // C. 通用模式
  return (
    <div style={style} onPointerDown={e => e.stopPropagation()}>
        <div style={toolbarContainerStyle}>
            {/* 编组 */}
            <ToolBtn 
                onClick={handleGroup} 
                icon={isSingleGroup ? <Ungroup size={18} /> : <Group size={18} />} 
                label={isSingleGroup ? "解组" : "编组"} 
            />

            {/* 裁剪 */}
            {selectedIds.length === 1 && editor.getShape(selectedIds[0])?.type === 'image' && (
                <ToolBtn onClick={handleCrop} icon={<Scissors size={18} />} label="裁剪" />
            )}

            {/* 对齐菜单 */}
            {isMultiSelect && (
                <div 
                    style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={() => setShowAlignMenu(true)}
                    onMouseLeave={() => setShowAlignMenu(false)}
                >
                    <ToolBtn icon={<Grid size={18} />} label="对齐" active={showAlignMenu} hasArrow />
                    {showAlignMenu && (
                        <div style={dropdownStyle}>
                            <div style={menuContainerStyle}>
                                <div style={headerStyle}>水平 (X轴)</div>
                                <MenuRow label="左对齐" icon={<AlignLeft size={16}/>} onClick={() => align('left')} />
                                <MenuRow label="水平居中" icon={<AlignCenterHorizontal size={16}/>} onClick={() => align('center-horizontal')} />
                                <MenuRow label="右对齐" icon={<AlignRight size={16}/>} onClick={() => align('right')} />
                                {/* [修复] 使用 MoreHorizontal 代替 DistributeHorizontal */}
                                <MenuRow label="水平分布" icon={<MoreHorizontal size={16}/>} onClick={() => distribute('horizontal')} disabled={!isDistributable}/>
                                
                                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                                
                                <div style={headerStyle}>垂直 (Y轴)</div>
                                <MenuRow label="顶对齐" icon={<AlignStartVertical size={16}/>} onClick={() => align('top')} />
                                <MenuRow label="垂直居中" icon={<AlignCenterVertical size={16}/>} onClick={() => align('center-vertical')} />
                                <MenuRow label="底对齐" icon={<AlignEndVertical size={16}/>} onClick={() => align('bottom')} />
                                {/* [修复] 使用 MoreVertical 代替 DistributeVertical */}
                                <MenuRow label="垂直分布" icon={<MoreVertical size={16}/>} onClick={() => distribute('vertical')} disabled={!isDistributable}/>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 下载 */}
            {hasImages && (
                <>
                    <div style={{ width: 1, height: 16, background: '#e5e5e5', margin: '0 4px' }}></div>
                    <ToolBtn onClick={handleDownload} icon={<Download size={18} />} label={`下载图片 (${imageShapes.length})`} />
                </>
            )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-5px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  )
})

// --- 样式常量和辅助组件 ---
const toolbarContainerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 6px', background: 'white', borderRadius: 999, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)', height: 40
}
const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
    paddingTop: 12, zIndex: 2001, animation: 'fadeIn 0.15s ease-out'
}
const menuContainerStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
    padding: '6px 0', width: 180, display: 'flex', flexDirection: 'column'
}
const headerStyle: React.CSSProperties = { fontSize: 11, color: '#94a3b8', padding: '4px 12px', fontWeight: 600, letterSpacing: '0.02em' }

const ToolBtn = ({ onClick, icon, label, active, hasArrow }: any) => (
    <button onClick={onClick} title={label} style={{ background: active ? '#f0f0f0' : 'transparent', border: 'none', borderRadius: 8, height: 32, padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: '#444', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}>
        {icon} {hasArrow && <ChevronDown size={12} style={{opacity:0.5}} />}
    </button>
)

const MenuRow = ({ label, icon, onClick, disabled }: any) => (
    <div onClick={(e) => { e.stopPropagation(); if(!disabled) onClick() }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, color: disabled ? '#cbd5e1' : '#333', transition: 'background 0.1s', opacity: disabled ? 0.6 : 1 }} onMouseEnter={e => !disabled && (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ color: disabled ? '#cbd5e1' : '#64748b', display:'flex', width: 20, justifyContent:'center' }}>{icon}</span><span style={{ flex: 1 }}>{label}</span>
    </div>
)