import { useEditor, track } from 'tldraw'

export const ImageInfo = track(() => {
  const editor = useEditor()
  const selectedIds = editor.getSelectedShapeIds()

  // 仅选中单图时显示
  if (selectedIds.length !== 1) return null
  const shape = editor.getShape(selectedIds[0])
  if (!shape || shape.type !== 'image') return null

  // 获取边界
  const bounds = editor.getShapePageBounds(shape.id)
  if (!bounds) return null

  // --- 坐标：放在图片底部正中 ---
  const pagePoint = { x: bounds.midX, y: bounds.maxY } 
  const screenPoint = editor.pageToViewport(pagePoint)

  return (
    <div
      style={{
        position: 'absolute',
        // 位于底部下方 10px
        top: screenPoint.y + 10, 
        left: screenPoint.x,
        // 水平居中
        transform: 'translateX(-50%)', 
        
        // 样式：半透明黑胶囊
        background: 'rgba(0, 0, 0, 0.65)',
        color: 'white',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontFamily: 'sans-serif',
        pointerEvents: 'none', // 穿透点击
        zIndex: 1000,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(4px)' // 模糊背景效果
      }}
    >
      {Math.round(bounds.w)} × {Math.round(bounds.h)}
    </div>
  )
})