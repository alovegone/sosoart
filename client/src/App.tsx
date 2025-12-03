import { useState, useEffect } from 'react'
import { 
  Tldraw, 
  Editor, 
  loadSnapshot,
  // 引入默认的图形工具类
  GeoShapeUtil, 
  ArrowShapeUtil, 
  DrawShapeUtil, 
  NoteShapeUtil, 
  LineShapeUtil, 
  FrameShapeUtil,
  HighlightShapeUtil,
  // 引入校验器
  T
} from 'tldraw' 
import 'tldraw/tldraw.css'

import { Toolbar } from './components/Toolbar'
import { TopBar } from './components/TopBar'
import { ZoomControl } from './components/Panels'
import { BottomLeftPanel } from './components/BottomLeftPanel'
import { SaveStatus } from './components/SaveStatus'
import { ImageInfo } from './components/ImageInfo'
import { ContextToolbar } from './components/ContextToolbar'

// --- 修复部分开始 ---

// 1. 辅助函数：创建一个放宽颜色校验的 ShapeUtil
function createCustomShapeUtil(BaseUtil: any) {
  return class CustomUtil extends BaseUtil {
    // 继承并重写静态属性 props
    static override props = {
      // 必须保留父类的其他属性定义
      ...(BaseUtil.props || {}),
      // 覆盖 color 属性的校验规则，允许任意字符串
      color: T.string, 
    }
  }
}

// 2. 创建自定义工具集
const customShapeUtils = [
  createCustomShapeUtil(GeoShapeUtil),       // 几何图形
  createCustomShapeUtil(ArrowShapeUtil),     // 箭头
  createCustomShapeUtil(DrawShapeUtil),      // 画笔
  createCustomShapeUtil(NoteShapeUtil),      // 便签
  createCustomShapeUtil(LineShapeUtil),      // 线条
  createCustomShapeUtil(FrameShapeUtil),     // 画框
  createCustomShapeUtil(HighlightShapeUtil), // 荧光笔
]

// --- 修复部分结束 ---

function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const handleMount = (editorInstance: Editor) => {
    setEditor(editorInstance)
    editorInstance.setCameraOptions({
        minZoom: 0.01, maxZoom: 100, zoomSteps: 1.05
    })
    
    // 异步加载数据
    setTimeout(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/load')
            if (res.ok) {
                const data = await res.json()
                if (data && Object.keys(data).length > 0) {
                    loadSnapshot(editorInstance.store, data)
                }
            }
        } catch (e) { 
            console.error("Failed to load snapshot:", e) 
        }
    }, 500)
  }

  // 快捷键逻辑
  useEffect(() => {
    if (!editor) return
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement
        // 如果正在输入文字，不触发快捷键
        if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return

        const isCtrlOrCmd = e.ctrlKey || e.metaKey
        const key = e.key.toLowerCase()

        // 编组 (Ctrl/Cmd + G)
        if (isCtrlOrCmd && key === 'g') {
            e.preventDefault(); e.stopPropagation()
            const selectedIds = editor.getSelectedShapeIds()
            if (selectedIds.length > 0) {
                if (e.shiftKey) editor.ungroupShapes(selectedIds)
                else editor.groupShapes(selectedIds)
            }
        }
        // 撤销/重做 (Ctrl/Cmd + Z)
        else if (isCtrlOrCmd && key === 'z') {
            e.preventDefault(); e.stopPropagation()
            if (e.shiftKey) editor.redo()
            else editor.undo()
        }
        // 删除 (Delete / Backspace) - [关键修复]
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedIds = editor.getSelectedShapeIds()
            // 只有在选中了图形时才拦截删除键
            if (selectedIds.length > 0) {
                e.preventDefault(); e.stopPropagation()
                editor.deleteShapes(selectedIds)
            }
        }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [editor])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f8f9fa' }}>
      <Tldraw 
        onMount={handleMount} 
        hideUi 
        shapeUtils={customShapeUtils} // 注入自定义工具集
        persistenceKey="sosoart-editor"
      >
        <TopBar />
        <Toolbar isSidebarOpen={isSidebarOpen} />
        <ZoomControl isSidebarOpen={isSidebarOpen} />
        <BottomLeftPanel isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <SaveStatus />
        <ImageInfo />
        <ContextToolbar />
      </Tldraw>
    </div>
  )
}

export default App