import { useState, useEffect } from 'react'
import { Tldraw, Editor, loadSnapshot } from 'tldraw' 
import 'tldraw/tldraw.css'

import { Toolbar } from './components/Toolbar'
import { TopBar } from './components/TopBar'
import { ZoomControl } from './components/Panels'
import { BottomLeftPanel } from './components/BottomLeftPanel'
import { SaveStatus } from './components/SaveStatus'
import { ImageInfo } from './components/ImageInfo'
import { ContextToolbar } from './components/ContextToolbar'

function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const handleMount = (editorInstance: Editor) => {
    setEditor(editorInstance)
    // 保持你喜欢的缩放手感
    editorInstance.setCameraOptions({
        minZoom: 0.01, maxZoom: 100, zoomSteps: 1.05
    })
    setTimeout(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/load')
            const data = await res.json()
            if (data && Object.keys(data).length > 0) loadSnapshot(editorInstance.store, data)
        } catch (e) { console.error(e) }
    }, 500)
  }

  // 全局快捷键 (编组/删除/撤销)
  useEffect(() => {
    if (!editor) return
    const handleKeyDown = (e: KeyboardEvent) => {
        const active = document.activeElement
        const isInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.getAttribute('contenteditable') === 'true'
        if (isInput) return

        const isCtrlOrCmd = e.ctrlKey || e.metaKey

        if (isCtrlOrCmd && e.key.toLowerCase() === 'g') {
            e.preventDefault(); e.stopPropagation()
            const selectedIds = editor.getSelectedShapeIds()
            if (selectedIds.length > 0) {
                if (e.shiftKey) editor.ungroupShapes(selectedIds)
                else editor.groupShapes(selectedIds)
            }
        }
        else if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
            e.preventDefault(); e.stopPropagation()
            if (e.shiftKey) editor.redo()
            else editor.undo()
        }
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedIds = editor.getSelectedShapeIds()
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
      <Tldraw onMount={handleMount} hideUi>
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