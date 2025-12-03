import { useEditor, track } from 'tldraw'
import { useState, useEffect } from 'react'
import { getSnapshot } from 'tldraw'

export const SaveStatus = track(() => {
  const editor = useEditor()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  useEffect(() => {
    if (!editor) return
    let timeoutId: any = null

    // 监听全局变化，只负责保存，不影响其他 UI
    const cleanup = editor.store.listen(() => {
      setSaveStatus('unsaved')
      if (timeoutId) clearTimeout(timeoutId)
      
      timeoutId = setTimeout(async () => {
        setSaveStatus('saving')
        const snapshot = getSnapshot(editor.store)
        try {
            await fetch('http://localhost:3001/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(snapshot)
            })
            setSaveStatus('saved')
        } catch (e) {
            setSaveStatus('unsaved')
        }
      }, 1000)
    })
    return () => { cleanup(); if (timeoutId) clearTimeout(timeoutId) }
  }, [editor])

  return (
    <div style={{ 
        position: 'absolute', bottom: 20, right: 20, zIndex: 300, 
        fontSize: 12, color: '#999', background:'rgba(255,255,255,0.9)', 
        padding:'6px 10px', borderRadius: 20, pointerEvents:'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
        {saveStatus === 'saving' ? '同步中...' : saveStatus === 'unsaved' ? '等待同步...' : '已同步'}
    </div>
  )
})