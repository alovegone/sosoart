// soart_frontend/src/components/SoartUI.tsx

import { Editor, createShapeId } from 'tldraw'
import { 
    MousePointer2, Hand, Pencil, Type, Eraser, 
    Plus, Image as ImageIcon, Video, LayoutTemplate,
    Undo2, Redo2, Home, Settings
} from 'lucide-react'
import { useEffect, useState } from 'react'

// ===========================================
// 1. 左侧悬浮工具栏 (含智能生成逻辑)
// ===========================================
export function LeftToolbar({ editor }: { editor: Editor | null }) {
    const [activeTool, setActiveTool] = useState('select');
    const [showAddMenu, setShowAddMenu] = useState(false);

    useEffect(() => {
        if (!editor) return;
        const cleanup = editor.store.listen(() => {
            setActiveTool(editor.getCurrentToolId());
        });
        return cleanup;
    }, [editor]);

    // [核心算法] 寻找屏幕中心的最近空位
    const findSafePosition = (w: number, h: number) => {
        if (!editor) return { x: 0, y: 0 };

        // 1. 获取当前屏幕可视区域的中心 (页面坐标系)
        const viewport = editor.getViewportPageBounds();
        const centerX = viewport.center.x - w / 2;
        const centerY = viewport.center.y - h / 2;

        // 2. 获取当前页面所有形状
        const shapes = Array.from(editor.getCurrentPageShapes());
        
        // 如果没形状，直接居中
        if (shapes.length === 0) return { x: centerX, y: centerY };

        // 3. 螺旋搜索算法 (从中心向外找空位)
        // 步长 50px，尝试 100 次
        const step = 50; 
        // 方向：右、下、左、上
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]; 
        
        let x = centerX;
        let y = centerY;
        let dirIdx = 0;
        let stepsInCurrentDir = 1;
        let stepsTaken = 0;
        let changeDirCount = 0;

        for (let i = 0; i < 100; i++) {
            // 检查当前 (x, y) 是否与现有形状重叠
            let isOverlapping = false;
            const PADDING = 20; // 留点缝隙

            for (const shape of shapes) {
                const b = editor.getShapePageBounds(shape);
                if (!b) continue;
                
                // 忽略超大的背景图 (超过 2000px 的当背景处理，不避让)
                if (b.w > 2000 || b.h > 2000) continue;

                // AABB 碰撞检测
                if (
                    x < b.x + b.w + PADDING &&
                    x + w + PADDING > b.x &&
                    y < b.y + b.h + PADDING &&
                    y + h + PADDING > b.y
                ) {
                    isOverlapping = true;
                    break;
                }
            }

            // 找到空位了！
            if (!isOverlapping) {
                return { x, y };
            }

            // 没找到，移动到下一个螺旋点
            x += directions[dirIdx][0] * step;
            y += directions[dirIdx][1] * step;
            stepsTaken++;

            if (stepsTaken === stepsInCurrentDir) {
                stepsTaken = 0;
                dirIdx = (dirIdx + 1) % 4;
                changeDirCount++;
                if (changeDirCount % 2 === 0) stepsInCurrentDir++;
            }
        }

        // 如果实在找不到 (屏幕爆满)，就在中心随机偏移一点
        return { 
            x: centerX + (Math.random() - 0.5) * 50, 
            y: centerY + (Math.random() - 0.5) * 50 
        };
    };

    const createGenerator = (type: 'image' | 'video') => {
        if (!editor) return;
        
        // 使用智能算法计算位置 (卡片大小 320x320)
        const { x, y } = findSafePosition(320, 320);
        
        const id = createShapeId();
        editor.createShape({
            id: id,
            type: 'image-generator', 
            x: x, 
            y: y,
            props: { model: type === 'image' ? 'gemini' : 'kling' }
        });

        editor.select(id);
        setShowAddMenu(false);
    };

    const tools = [
        { id: 'select', icon: <MousePointer2 size={20} />, label: '选择 (V)' },
        { id: 'hand', icon: <Hand size={20} />, label: '抓手 (H)' },
        { id: 'draw', icon: <Pencil size={20} />, label: '画笔 (P)' },
        { id: 'text', icon: <Type size={20} />, label: '文字 (T)' },
        { id: 'eraser', icon: <Eraser size={20} />, label: '橡皮 (E)' }
    ];

    if (!editor) return null;

    return (
        <div style={{
            position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000
        }}>
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '8px',
                background: 'white', padding: '8px', borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #f0f0f0',
            }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        style={{...toolBtnStyle, background: showAddMenu ? '#000' : '#f5f5f5', color: showAddMenu ? 'white' : '#333'}}
                        title="添加内容"
                    >
                        <Plus size={20} />
                    </button>

                    {showAddMenu && (
                        <div style={{
                            position: 'absolute', left: '100%', top: 0, marginLeft: '12px',
                            background: 'white', borderRadius: '12px', padding: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #eee',
                            width: '160px', display: 'flex', flexDirection: 'column', gap: '4px'
                        }}>
                            <div style={{fontSize:'12px', color:'#999', padding:'4px 8px'}}>新增</div>
                            <MenuItem icon={<ImageIcon size={16}/>} label="上传图片" onClick={() => document.getElementById('hidden-file-input')?.click()} />
                            <MenuItem icon={<Video size={16}/>} label="上传视频" onClick={() => alert('暂未实现')} />
                            <div style={{height:'1px', background:'#eee', margin:'4px 0'}}/>
                            <MenuItem icon={<LayoutTemplate size={16}/>} label="图像生成器" shortcut="A" onClick={() => createGenerator('image')} />
                            <MenuItem icon={<Video size={16}/>} label="视频生成器" onClick={() => createGenerator('video')} />
                        </div>
                    )}
                </div>

                <div style={{height:'1px', background:'#eee', margin:'4px 0'}}/>

                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        title={tool.label}
                        onClick={() => editor.setCurrentTool(tool.id)}
                        style={{
                            ...toolBtnStyle,
                            background: activeTool === tool.id ? '#F3F4F6' : 'transparent',
                            color: activeTool === tool.id ? 'black' : '#666',
                        }}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>
            
            <input 
                id="hidden-file-input" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) editor.putExternalContent({ type: 'files', files: [file] });
                }}
            />
        </div>
    );
}

// ===========================================
// 2. 顶部标题栏
// ===========================================
interface TopBarProps {
    editor: Editor | null;
    canvasName?: string;
    onRename?: (newName: string) => void;
    onBack: () => void;
    onSettings: () => void;
}

export function TopBar({ editor, canvasName = "未命名", onRename, onBack, onSettings }: TopBarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(canvasName);

    useEffect(() => {
        setTempName(canvasName);
    }, [canvasName]);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempName.trim() !== "" && tempName !== canvasName && onRename) {
            onRename(tempName);
        } else {
            setTempName(canvasName);
        }
    };

    return (
        <div style={{
            position: 'absolute', top: '16px', left: '16px', right: '16px', height: '50px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none'
        }}>
            <div style={{ pointerEvents: 'auto', display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                <button onClick={onBack} style={iconBtnStyle} title="返回首页"><Home size={18} /></button>
                <div style={{ width: '1px', height: '16px', background: '#ddd' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Soart Canvas</span>
                <span style={{ fontSize: '12px', color: '#ccc' }}>/</span>
                {isEditing ? (
                    <input 
                        autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleBlur} onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        style={{ fontSize: '12px', color: '#333', border: '1px solid #2196F3', borderRadius: '4px', padding: '2px 4px', outline: 'none', width: '120px' }}
                    />
                ) : (
                    <span onDoubleClick={() => setIsEditing(true)} title="双击重命名" style={{ fontSize: '12px', color: '#666', cursor: 'text', minWidth: '50px' }}>{tempName}</span>
                )}
            </div>
            <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                    <button onClick={() => editor?.undo()} style={iconBtnStyle} title="撤销"><Undo2 size={18} /></button>
                    <button onClick={() => editor?.redo()} style={iconBtnStyle} title="重做"><Redo2 size={18} /></button>
                </div>
                <button onClick={onSettings} style={{ ...iconBtnStyle, background: 'white', width: '36px', height: '36px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }} title="设置"><Settings size={18} /></button>
            </div>
        </div>
    )
}

function MenuItem({ icon, label, shortcut, onClick }: any) {
    return (
        <div 
            onClick={() => { onClick(); }}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px',
                borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#333',
                transition: 'background 0.1s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
            {icon}
            <span style={{flex:1}}>{label}</span>
            {shortcut && <span style={{color:'#ccc', fontSize:'12px'}}>{shortcut}</span>}
        </div>
    )
}

const toolBtnStyle = {
    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'transparent', color: '#666', borderRadius: '8px', cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const iconBtnStyle = {
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'transparent', color: '#555', borderRadius: '6px', cursor: 'pointer',
};