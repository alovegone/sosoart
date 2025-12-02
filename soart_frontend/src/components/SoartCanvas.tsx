// soart_frontend/src/components/SoartCanvas.tsx

import { useEffect, useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import axios from 'axios'
import html2canvas from 'html2canvas'

import { LeftToolbar, TopBar } from './SoartUI'
import SettingsModal from './SettingsModal'
import { ImageGeneratorShapeUtil } from './shapes/ImageGeneratorShape'

const API_BASE_URL = 'http://localhost:8000';
const customShapeUtils = [ImageGeneratorShapeUtil]

interface SoartCanvasProps {
    canvasId: string;
    onBack?: () => void;
}

export default function SoartCanvas({ canvasId, onBack }: SoartCanvasProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const [canvasName, setCanvasName] = useState("加载中...");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 0. 生成缩略图工具
    const generateThumbnail = async (): Promise<string> => {
        try {
            const element = document.getElementById("soart-canvas-container");
            if (!element) return "";
            const target = element.querySelector('.tl-canvas') as HTMLElement || element;

            const canvas = await html2canvas(target, {
                scale: 0.5, 
                useCORS: true,
                logging: false,
                backgroundColor: '#f9fafb',
            });
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (e) {
            console.warn("截图失败:", e);
            return "";
        }
    };

    // 1. 加载数据
    useEffect(() => {
        if (!editor) return;
        const load = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/canvas/${canvasId}`);
                if (res.data?.name) setCanvasName(res.data.name);
                if (res.data?.data && Object.keys(res.data.data).length > 0) {
                    editor.loadSnapshot(res.data.data);
                }
            } catch (e) { console.error("❌ 加载失败:", e); }
        };
        load();
    }, [editor, canvasId]);

    // 2. 自动保存
    useEffect(() => {
        if (!editor) return;
        let timer: any;
        const cleanup = editor.store.listen(() => {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                try {
                    const snapshot = editor.getSnapshot();
                    const thumbnail = await generateThumbnail();
                    await axios.post(`${API_BASE_URL}/api/canvas/${canvasId}/save`, { 
                        data: snapshot, 
                        thumbnail: thumbnail
                    });
                } catch (e) { console.error(e); }
            }, 3000);
        });
        return () => { cleanup(); clearTimeout(timer); };
    }, [editor, canvasId]);

    // 3. [关键补回] 快捷键删除监听
    useEffect(() => {
        if (!editor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // 如果正在输入框里打字，不触发删除
            const target = e.target as HTMLElement;
            const isTyping = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable;

            if (isTyping) return;

            // 监听 Backspace 和 Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const selectedIds = editor.getSelectedShapeIds();
                if (selectedIds.length > 0) {
                    editor.deleteShapes(selectedIds);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor]);

    // 4. 安全退出
    const handleSafeBack = async () => {
        if (editor) {
            try {
                const snapshot = editor.getSnapshot();
                const thumbnail = await generateThumbnail();
                await axios.post(`${API_BASE_URL}/api/canvas/${canvasId}/save`, { 
                    data: snapshot, 
                    thumbnail: thumbnail
                });
                console.log("✅ 退出保存成功");
            } catch (e) { console.error("退出保存失败", e); }
        }
        if (onBack) onBack();
    };

    const handleRename = async (newName: string) => {
        setCanvasName(newName);
        try { await axios.post(`${API_BASE_URL}/api/canvas/${canvasId}/rename`, { name: newName }); } 
        catch (e) { console.error(e); }
    };

    return (
        <div 
            id="soart-canvas-container"
            style={{ position: 'fixed', inset: 0, background: '#f9fafb' }}
        >
            <Tldraw 
                onMount={setEditor} 
                hideUi={true} 
                shapeUtils={customShapeUtils}
            />
            
            <LeftToolbar editor={editor} />
            
            <TopBar 
                editor={editor} 
                canvasName={canvasName}
                onRename={handleRename}
                onBack={handleSafeBack} 
                onSettings={() => setIsSettingsOpen(true)}
            />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    )
}