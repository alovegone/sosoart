// soart_frontend/src/components/shapes/ImageGeneratorShape.tsx

import {
    BaseBoxShapeUtil,
    HTMLContainer,
    type TLBaseShape,
    useEditor
} from 'tldraw'
import { useState, useEffect } from 'react'
import {
    Image as ImageIcon,
    Upload,
    Pipette,
    X,
    Sparkles,
    ChevronDown
} from 'lucide-react'
import axios from 'axios'

// 常量定义
const PLACEHOLDER_SIZE = 320
const PANEL_WIDTH = 460

// 模型列表（对应你截图里的菜单）
const AVAILABLE_MODELS = [
    { id: 'nano-banana-pro', name: 'Nano Banana Pro' },
    { id: 'nano-banana', name: 'Nano Banana' },
    { id: 'seedream-4', name: 'Seedream 4' },
    { id: 'gpt-image', name: 'GPT Image' },
    { id: 'midjourney', name: 'Midjourney' },
    { id: 'seedream-3', name: 'Seedream 3' },
    { id: 'seededit', name: 'Seededit' },
    { id: 'ideogram', name: 'Ideogram' }
]

// 分辨率菜单
const RESOLUTIONS = ['1K', '2K', '4K']

// 比例菜单（带像素说明）
const RATIO_OPTIONS = [
    { value: '21:9', pixels: '1568×672' },
    { value: '16:9', pixels: '1456×816' },
    { value: '4:3', pixels: '1232×928' },
    { value: '3:2', pixels: '1344×896' },
    { value: '1:1', pixels: '1024×1024' },
    { value: '9:16', pixels: '816×1456' },
    { value: '3:4', pixels: '928×1232' },
    { value: '2:3', pixels: '896×1344' },
    { value: '5:4', pixels: '1280×1024' },
    { value: '4:5', pixels: '1024×1280' }
]

export type IImageGeneratorShape = TLBaseShape<
    'image-generator',
    {
        w: number
        h: number
        prompt: string
        refImages: string[]
        generatedImage: string | null
        modelId: string
        resolution: string
        ratio: string
    }
>

export class ImageGeneratorShapeUtil extends BaseBoxShapeUtil<IImageGeneratorShape> {
    static override type = 'image-generator' as const

    override getDefaultProps(): IImageGeneratorShape['props'] {
        const d = AVAILABLE_MODELS[0]
        return {
            w: PLACEHOLDER_SIZE,
            h: PLACEHOLDER_SIZE,
            prompt: '',
            refImages: [],
            generatedImage: null,
            modelId: d.id,
            resolution: RESOLUTIONS[0],
            ratio: '1:1'
        }
    }

    override component(shape: IImageGeneratorShape) {
        // eslint-disable-next-line
        const editor = useEditor()
        const [isGenerating, setIsGenerating] = useState(false)
        const [showRefMenu, setShowRefMenu] = useState(false)
        const [showModelMenu, setShowModelMenu] = useState(false)
        const [showResolutionMenu, setShowResolutionMenu] = useState(false)
        const [showRatioMenu, setShowRatioMenu] = useState(false)
        const [isPicking, setIsPicking] = useState(false)
        const [isSelected, setIsSelected] = useState(false)

        const images = Array.isArray(shape.props.refImages)
            ? shape.props.refImages
            : []

        const currentModelData =
            AVAILABLE_MODELS.find((m) => m.id === shape.props.modelId) ||
            AVAILABLE_MODELS[0]

        const updateProps = (
            newProps: Partial<IImageGeneratorShape['props']>
        ) => {
            editor.updateShape({
                id: shape.id,
                type: 'image-generator',
                props: { ...shape.props, ...newProps }
            })
        }

        // 监听选中状态 + 固定占位大小
        useEffect(() => {
            const cleanup = editor.store.listen(() => {
                const selectedIds = editor.getSelectedShapeIds()
                setIsSelected(selectedIds.includes(shape.id))
                if (
                    shape.props.w !== PLACEHOLDER_SIZE ||
                    shape.props.h !== PLACEHOLDER_SIZE
                ) {
                    editor.updateShape({
                        id: shape.id,
                        type: 'image-generator',
                        props: { ...shape.props, w: PLACEHOLDER_SIZE, h: PLACEHOLDER_SIZE }
                    })
                }
            })
            return cleanup
        }, [editor, shape.id, shape.props.w, shape.props.h, shape.props])

        const stop = (e: React.PointerEvent) => e.stopPropagation()

        // 生成按钮是否可用（有提示词或有参考图）
        const canGenerate = !!shape.props.prompt || images.length > 0

        // 调用后端生成接口
        const handleGenerate = async () => {
            if (!canGenerate) return
            setIsGenerating(true)
            try {
                const payload = {
                    prompt: shape.props.prompt,
                    model: shape.props.modelId,
                    ratio: shape.props.ratio,
                    resolution: shape.props.resolution,
                    ref_images: images
                }
                const res = await axios.post(
                    'http://localhost:8000/api/magic/generate',
                    payload
                )
                if (res.data.url) updateProps({ generatedImage: res.data.url })
            } catch (e) {
                alert('生成失败')
            } finally {
                setIsGenerating(false)
            }
        }

        // 本地上传参考图
        const handleLocalUpload = () => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.multiple = true
            input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) {
                    const newImages: string[] = []
                    await Promise.all(
                        Array.from(files).map(
                            (f) =>
                                new Promise<void>((r) => {
                                    const rd = new FileReader()
                                    rd.onload = (e) => {
                                        if (e.target?.result) {
                                            newImages.push(
                                                e.target.result as string
                                            )
                                        }
                                        r()
                                    }
                                    rd.readAsDataURL(f)
                                })
                        )
                    )
                    updateProps({ refImages: [...images, ...newImages] })
                }
            }
            input.click()
            setShowRefMenu(false)
        }

        // 画布吸取图片
        const handleCanvasPick = () => {
            setShowRefMenu(false)
            setIsPicking(true)
            document.body.style.cursor = 'crosshair'

            setTimeout(() => {
                const h = (e: PointerEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const p = editor.screenToPage({
                        x: e.clientX,
                        y: e.clientY
                    })
                    const s = editor
                        .getShapesAtPoint(p, { hitInside: true })
                        .reverse()
                        .find((s) => s.type === 'image')
                    if (s) {
                        // @ts-ignore
                        const src =
                            s.props.src ||
                            // @ts-ignore
                            (s.props.assetId
                                ? editor.getAsset(s.props.assetId)?.props.src
                                : null)
                        if (src) updateProps({ refImages: [...images, src] })
                    }
                    document.body.style.cursor = 'default'
                    setIsPicking(false)
                    window.removeEventListener('pointerdown', h, {
                        capture: true
                    } as any)
                }
                window.addEventListener('pointerdown', h, { capture: true })
            }, 100)
        }

        const removeImage = (index: number) => {
            const n = [...images]
            n.splice(index, 1)
            updateProps({ refImages: n })
        }

        return (
            <HTMLContainer
                style={{ pointerEvents: 'all', overflow: 'visible' }}
            >
                {/* 上方蓝色占位符 */}
                <div
                    // 注意：这里不再 stopPropagation，让 tldraw 能接收到 pointer 事件进行拖动/选中
                    style={{
                        width: '100%',
                        height: '100%',
                        background: shape.props.generatedImage
                            ? 'white'
                            : '#E3F2FD',
                        border: '2px solid #64B5F6',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* 顶部标题条 */}
                    {!shape.props.generatedImage && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0 8px',
                                fontSize: '11px',
                                color: '#546E7A',
                                fontWeight: 600,
                                background:
                                    'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0))'
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <ImageIcon size={12} />
                                Image Generator
                            </span>
                            <span>1024 × 1024</span>
                        </div>
                    )}

                    {shape.props.generatedImage ? (
                        <img
                            src={shape.props.generatedImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <div style={{ color: '#BBDEFB' }}>
                            <ImageIcon size={80} strokeWidth={1} />
                        </div>
                    )}
                </div>

                {/* 下方悬浮控制面板 */}
                {(isSelected || isGenerating) && (
                    <div
                        onPointerDown={stop}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: PANEL_WIDTH,
                            background: 'white',
                            borderRadius: '18px',
                            boxShadow:
                                '0 10px 30px rgba(15,23,42,0.18), 0 0 0 1px rgba(148,163,184,0.2)',
                            padding: '20px 24px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 1000
                        }}
                    >
                        {isPicking && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -40,
                                    left: 0,
                                    right: 0,
                                    background: '#2563EB',
                                    color: 'white',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                👇 点击画布上的图片
                            </div>
                        )}

                        {/* 提示词输入 */}
                        <textarea
                            placeholder="今天我们要创作什么"
                            value={shape.props.prompt}
                            onChange={(e) =>
                                updateProps({ prompt: e.target.value })
                            }
                            onPointerDown={stop}
                            style={{
                                width: '100%',
                                minHeight: '40px',
                                border: 'none',
                                resize: 'none',
                                outline: 'none',
                                fontSize: '16px',
                                background: 'transparent',
                                lineHeight: '1.6',
                                marginBottom: images.length ? '12px' : '20px',
                                fontFamily: 'inherit',
                                color: shape.props.prompt ? '#111827' : '#9CA3AF'
                            }}
                        />

                        {/* 参考图缩略图列表 */}
                        {images.length > 0 && (
                            <div
                                onPointerDown={stop}
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    paddingBottom: '16px',
                                    overflowX: 'auto'
                                }}
                            >
                                {images.map((imgSrc, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            position: 'relative',
                                            flexShrink: 0,
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid #E5E7EB'
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                padding: 0,
                                                background:
                                                    'rgba(0,0,0,0.55)',
                                                color: 'white',
                                                border: 'none',
                                                width: '16px',
                                                height: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            style={{
                                height: '1px',
                                background: '#F3F4F6',
                                width: '100%',
                                marginBottom: '14px'
                            }}
                        />

                        {/* 底部工具条 */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            {/* 左侧：模型 + 图片 */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {/* 模型选择 */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        style={textBtnStyle}
                                        onClick={() =>
                                            setShowModelMenu((v) => !v)
                                        }
                                    >
                                        <Sparkles size={16} />
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: '#111827'
                                            }}
                                        >
                                            {currentModelData.name}
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            color="#9CA3AF"
                                        />
                                    </button>

                                    {showModelMenu && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '120%',
                                                left: 0,
                                                background: 'white',
                                                borderRadius: '14px',
                                                boxShadow:
                                                    '0 10px 30px rgba(15,23,42,0.18)',
                                                padding: '6px 4px',
                                                border:
                                                    '1px solid rgba(148,163,184,0.3)',
                                                minWidth: '180px',
                                                zIndex: 1100
                                            }}
                                        >
                                            {AVAILABLE_MODELS.map((m) => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => {
                                                        updateProps({
                                                            modelId: m.id
                                                        })
                                                        setShowModelMenu(false)
                                                    }}
                                                    style={{
                                                        padding:
                                                            '6px 10px 6px 12px',
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        background:
                                                            m.id ===
                                                            shape.props
                                                                .modelId
                                                                ? '#EEF2FF'
                                                                : 'transparent',
                                                        color:
                                                            m.id ===
                                                            shape.props
                                                                .modelId
                                                                ? '#312E81'
                                                                : '#111827'
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '999px',
                                                            background:
                                                                '#0F172A'
                                                        }}
                                                    />
                                                    {m.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 图片按钮 */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() =>
                                            setShowRefMenu((v) => !v)
                                        }
                                        style={{
                                            ...iconBtnStyle,
                                            background:
                                                images.length > 0
                                                    ? '#ECFDF3'
                                                    : '#F3F4F6'
                                        }}
                                    >
                                        <ImageIcon size={18} />
                                    </button>
                                    {showRefMenu && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '120%',
                                                left: 0,
                                                background: 'white',
                                                border:
                                                    '1px solid #E5E7EB',
                                                borderRadius: '12px',
                                                boxShadow:
                                                    '0 4px 20px rgba(15,23,42,0.18)',
                                                padding: '6px',
                                                width: '150px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                zIndex: 1200
                                            }}
                                        >
                                            <div
                                                onClick={handleLocalUpload}
                                                style={menuItemStyle}
                                            >
                                                <Upload size={14} /> 本地多选
                                            </div>
                                            <div
                                                onClick={handleCanvasPick}
                                                style={menuItemStyle}
                                            >
                                                <Pipette size={14} /> 画布吸取
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 右侧：分辨率 + 比例 + 生成 */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                {/* 分辨率菜单 */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        style={{
                                            ...textBtnStyle,
                                            fontSize: '13px',
                                            color: '#4B5563',
                                            padding: '4px 6px'
                                        }}
                                        onClick={() =>
                                            setShowResolutionMenu((v) => !v)
                                        }
                                    >
                                        {shape.props.resolution}
                                        <ChevronDown
                                            size={12}
                                            color="#9CA3AF"
                                        />
                                    </button>
                                    {showResolutionMenu && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '120%',
                                                right: 0,
                                                background: 'white',
                                                borderRadius: '12px',
                                                boxShadow:
                                                    '0 8px 24px rgba(15,23,42,0.18)',
                                                border:
                                                    '1px solid rgba(148,163,184,0.35)',
                                                padding: '6px',
                                                minWidth: '80px',
                                                zIndex: 1100
                                            }}
                                        >
                                            {RESOLUTIONS.map((r) => (
                                                <div
                                                    key={r}
                                                    onClick={() => {
                                                        updateProps({
                                                            resolution: r
                                                        })
                                                        setShowResolutionMenu(
                                                            false
                                                        )
                                                    }}
                                                    style={{
                                                        padding:
                                                            '6px 10px',
                                                        borderRadius:
                                                            '8px',
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        background:
                                                            r ===
                                                            shape.props
                                                                .resolution
                                                                ? '#EFF6FF'
                                                                : 'transparent',
                                                        color:
                                                            r ===
                                                            shape.props
                                                                .resolution
                                                                ? '#1D4ED8'
                                                                : '#111827'
                                                    }}
                                                >
                                                    {r}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 比例菜单 */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        style={{
                                            ...textBtnStyle,
                                            fontSize: '13px',
                                            color: '#4B5563',
                                            padding: '4px 6px'
                                        }}
                                        onClick={() =>
                                            setShowRatioMenu((v) => !v)
                                        }
                                    >
                                        {shape.props.ratio}
                                        <ChevronDown
                                            size={12}
                                            color="#9CA3AF"
                                        />
                                    </button>
                                    {showRatioMenu && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '120%',
                                                right: 0,
                                                background: 'white',
                                                borderRadius: '12px',
                                                boxShadow:
                                                    '0 8px 24px rgba(15,23,42,0.18)',
                                                border:
                                                    '1px solid rgba(148,163,184,0.35)',
                                                padding: '6px',
                                                minWidth: '150px',
                                                zIndex: 1100
                                            }}
                                        >
                                            {RATIO_OPTIONS.map((opt) => (
                                                <div
                                                    key={opt.value}
                                                    onClick={() => {
                                                        updateProps({
                                                            ratio: opt.value
                                                        })
                                                        setShowRatioMenu(false)
                                                    }}
                                                    style={{
                                                        padding:
                                                            '6px 10px',
                                                        borderRadius:
                                                            '8px',
                                                        display: 'flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'space-between',
                                                        gap: 10,
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        background:
                                                            opt.value ===
                                                            shape.props.ratio
                                                                ? '#EFF6FF'
                                                                : 'transparent',
                                                        color:
                                                            opt.value ===
                                                            shape.props.ratio
                                                                ? '#1D4ED8'
                                                                : '#111827'
                                                    }}
                                                >
                                                    <span>{opt.value}</span>
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#6B7280'
                                                        }}
                                                    >
                                                        {opt.pixels}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 生成按钮 */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={!canGenerate || isGenerating}
                                    style={{
                                        background: canGenerate
                                            ? '#111827'
                                            : '#CBD5E1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding:
                                            '8px 18px 8px 16px',
                                        cursor:
                                            !canGenerate || isGenerating
                                                ? 'default'
                                                : 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: '14px',
                                        transition:
                                            'background 0.15s ease-out, transform 0.1s ease-out',
                                        opacity: isGenerating ? 0.85 : 1
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '15px',
                                            transform:
                                                isGenerating && canGenerate
                                                    ? 'translateY(1px)'
                                                    : 'none'
                                        }}
                                    >
                                        ⚡
                                    </span>
                                    <span>0</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </HTMLContainer>
        )
    }

    override indicator(shape: IImageGeneratorShape) {
        return null
    }
}

// 公共样式
const textBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#111827',
    fontSize: '14px',
    padding: '6px 4px',
    outline: 'none',
    borderRadius: 999
}

const iconBtnStyle: React.CSSProperties = {
    background: '#F3F4F6',
    borderRadius: 10,
    border: 'none',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#374151',
    outline: 'none'
}

const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    fontSize: '13px',
    color: '#111827',
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'background 0.1s',
    whiteSpace: 'nowrap'
}
