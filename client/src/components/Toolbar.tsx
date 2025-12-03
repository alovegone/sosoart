import { useEditor, useValue, createShapeId, GeoShapeGeoStyle } from 'tldraw'
import { 
  MousePointer2, Square, Circle, Triangle, Minus, ArrowRight, // 图形图标
  Type, Pen, Plus, 
  Image as ImageIcon, Video, Wand2, LayoutGrid, ChevronRight
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export const Toolbar = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const editor = useEditor()
  
  // 两个菜单的状态
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showShapeMenu, setShowShapeMenu] = useState(false) // 新增：图形菜单状态

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Refs 用于点击外部关闭检测
  const addMenuRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const shapeMenuRef = useRef<HTMLDivElement>(null)
  const shapeButtonRef = useRef<HTMLButtonElement>(null)

  const currentTool = useValue('tool', () => editor ? editor.getCurrentToolId() : 'select', [editor])

  // --- 核心：切换图形类型 ---
  const handleSelectShape = (tool: string, geoType?: string) => {
    editor.setCurrentTool(tool)
    
    // 如果是几何图形 (geo)，需要进一步设置具体的形状样式
    if (tool === 'geo' && geoType) {
        editor.setStyleForNextShapes(GeoShapeGeoStyle, geoType)
    }
    
    setShowShapeMenu(false)
  }

  // --- 点击外部自动关闭所有菜单 ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node

        // 处理“新增”菜单关闭
        if (showAddMenu && !addMenuRef.current?.contains(target) && !addButtonRef.current?.contains(target)) {
            setShowAddMenu(false)
        }

        // 处理“图形”菜单关闭
        if (showShapeMenu && !shapeMenuRef.current?.contains(target) && !shapeButtonRef.current?.contains(target)) {
            setShowShapeMenu(false)
        }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddMenu, showShapeMenu])

  // 图片上传逻辑 (保持不变)
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editor) return

    const readImage = (file: File): Promise<{ src: string, w: number, h: number, name: string, type: string }> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
                const src = reader.result as string
                const img = new window.Image()
                img.onload = () => resolve({ src, w: img.width, h: img.height, name: file.name, type: file.type })
                img.src = src
            }
            reader.readAsDataURL(file)
        })
    }

    try {
        const imageInfos = await Promise.all(Array.from(files).map(readImage))
        const gap = 50
        const totalNewWidth = imageInfos.reduce((sum, img) => sum + img.w, 0) + (imageInfos.length - 1) * gap
        
        const existingShapeIds = editor.getCurrentPageShapeIds()
        let startX = 0, centerY = 0
        
        if (existingShapeIds.size > 0) {
            let maxX = -Infinity, minY = Infinity, maxY = -Infinity
            let hasBounds = false
            for (const id of existingShapeIds) {
                const bounds = editor.getShapePageBounds(id)
                if (bounds) {
                    hasBounds = true
                    if (bounds.maxX > maxX) maxX = bounds.maxX
                    if (bounds.minY < minY) minY = bounds.minY
                    if (bounds.maxY > maxY) maxY = bounds.maxY
                }
            }
            if (hasBounds) {
                startX = maxX + 200
                centerY = minY + (maxY - minY) / 2
            }
        } 
        
        if (startX === 0) {
            const vp = editor.getViewportPageBounds()
            startX = vp.center.x - totalNewWidth / 2
            centerY = vp.center.y
        }

        const assetsToCreate: any[] = []
        const shapesToCreate: any[] = []
        const newShapeIds: any[] = []
        
        let currentX = startX

        imageInfos.forEach((img) => {
            const assetId = `asset:${Date.now()}-${Math.random()}`
            const shapeId = createShapeId()
            assetsToCreate.push({
                id: assetId as any, type: 'image', typeName: 'asset',
                props: { name: img.name, src: img.src, w: img.w, h: img.h, mimeType: img.type, isAnimated: false },
                meta: {}
            })
            shapesToCreate.push({
                id: shapeId, type: 'image', x: currentX, y: centerY - img.h / 2, 
                props: { w: img.w, h: img.h, assetId: assetId as any },
                meta: { name: img.name }
            })
            newShapeIds.push(shapeId)
            currentX += img.w + gap
        })

        editor.createAssets(assetsToCreate)
        editor.createShapes(shapesToCreate)
        
        if (newShapeIds.length > 0) {
            editor.select(...newShapeIds)
            const newBounds = editor.getSelectionPageBounds()
            if (newBounds) editor.zoomToBounds(newBounds, { inset: 0.2, animation: { duration: 500 } })
        }
    } catch (err) { console.error(err) }

    setShowAddMenu(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
        if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey) {
            console.log('AI Triggered')
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div style={{
      position: 'absolute', top: '50%', 
      left: isSidebarOpen ? 260 : 20, 
      transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 12, zIndex: 200, pointerEvents: 'all',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" multiple onChange={handleUploadImage}/>

      <div style={{
        background: 'white', padding: 8, borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)', 
        display: 'flex', flexDirection: 'column', gap: 6
      }}>
        
        {/* 1. 选择工具 */}
        <ToolBtn 
            id="select"
            icon={<MousePointer2 size={20} />} 
            label="选择 (V)" 
            isActive={currentTool === 'select'}
            onClick={() => editor.setCurrentTool('select')}
        />

        {/* 2. 图形工具 (带下拉菜单) */}
        <div style={{ position: 'relative' }}>
            <button
                ref={shapeButtonRef}
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                title="形状工具"
                style={{
                    padding: 10, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: (currentTool === 'geo' || currentTool === 'arrow' || currentTool === 'line') ? '#eff6ff' : 'transparent',
                    color: (currentTool === 'geo' || currentTool === 'arrow' || currentTool === 'line') ? '#2563eb' : '#64748b',
                    transition: 'all 0.2s', width: '100%', display: 'flex', justifyContent: 'center'
                }}
            >
                {/* 根据当前选中的形状显示不同图标 */}
                <Square size={20} />
            </button>

            {/* 图形下拉菜单 */}
            {showShapeMenu && (
                <div 
                    ref={shapeMenuRef}
                    style={{
                        position: 'absolute', left: '140%', top: -20, width: 140,
                        background: 'white', borderRadius: 12, padding: '6px 0',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                        display: 'flex', flexDirection: 'column', gap: 2,
                        animation: 'slideIn 0.15s ease-out'
                    }}
                >
                    <MenuItem icon={<Square size={16} />} label="矩形" onClick={() => handleSelectShape('geo', 'rectangle')} />
                    <MenuItem icon={<Circle size={16} />} label="圆形" onClick={() => handleSelectShape('geo', 'ellipse')} />
                    <MenuItem icon={<Triangle size={16} />} label="三角形" onClick={() => handleSelectShape('geo', 'triangle')} />
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 8px' }} />
                    <MenuItem icon={<ArrowRight size={16} />} label="箭头" onClick={() => handleSelectShape('arrow')} />
                    <MenuItem icon={<Minus size={16} />} label="线条" onClick={() => handleSelectShape('line')} />
                </div>
            )}
        </div>

        {/* 3. 文字工具 */}
        <ToolBtn 
            id="text"
            icon={<Type size={20} />} 
            label="文字 (T)" 
            isActive={currentTool === 'text'}
            onClick={() => editor.setCurrentTool('text')}
        />

        {/* 4. 画笔工具 */}
        <ToolBtn 
            id="draw"
            icon={<Pen size={20} />} 
            label="画笔 (P)" 
            isActive={currentTool === 'draw'}
            onClick={() => editor.setCurrentTool('draw')}
        />

        <div style={{ height: 1, background: '#f1f5f9', margin: '2px 8px' }} />

        {/* 5. 新增菜单 (保持不变) */}
        <div style={{ position: 'relative' }}>
          <button
            ref={addButtonRef}
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              padding: 10, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: showAddMenu ? '#eff6ff' : 'transparent', 
              color: showAddMenu ? '#2563eb' : '#64748b',
              width: '100%', display: 'flex', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={22} />
          </button>

          {showAddMenu && (
            <div 
              ref={addMenuRef}
              style={{
                position: 'absolute', left: '140%', top: -80, width: 220, 
                background: 'white', borderRadius: 16, padding: '8px 0', 
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', gap: 2,
                animation: 'slideIn 0.15s ease-out'
              }}
            >
              <div style={groupTitleStyle}>新增</div>
              <MenuItem icon={<ImageIcon size={18} />} label="上传图片" onClick={() => fileInputRef.current?.click()} />
              <MenuItem icon={<Video size={18} />} label="上传视频" onClick={() => alert('视频功能开发中...')} />
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 12px' }} />
              <div style={groupTitleStyle}>AI 创意</div>
              <MenuItem icon={<Wand2 size={18} />} label="图像生成器" shortcut="A" onClick={() => alert('AI 功能即将上线')} highlight />
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 12px' }} />
              <MenuItem icon={<LayoutGrid size={18} />} label="智能画板" shortcut="F" onClick={() => alert('智能画板')} />
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// --- 样式与子组件 ---

const ToolBtn = ({ icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            padding: 10, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: isActive ? '#eff6ff' : 'transparent', 
            color: isActive ? '#2563eb' : '#64748b',
            transition: 'all 0.2s'
        }}
    >
        {icon}
    </button>
)

const groupTitleStyle: React.CSSProperties = {
    fontSize: 12, color: '#94a3b8', padding: '8px 16px 4px', fontWeight: 500
}

const MenuItem = ({ icon, label, shortcut, onClick, highlight }: any) => (
  <div 
    onClick={onClick}
    style={{
        display: 'flex', alignItems: 'center', gap: 12, 
        padding: '10px 16px', margin: '0 4px', borderRadius: 8,
        cursor: 'pointer', fontSize: 14, color: '#334155',
        transition: 'background 0.15s',
        background: 'transparent'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ color: highlight ? '#7c3aed' : '#64748b', display: 'flex', alignItems: 'center' }}>
        {icon}
    </div>
    <span style={{ flex: 1, fontWeight: 400 }}>{label}</span>
    {shortcut && (
        <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, background: '#fff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
            {shortcut}
        </span>
    )}
  </div>
)