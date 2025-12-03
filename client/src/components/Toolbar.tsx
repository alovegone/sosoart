import { useEditor, useValue, createShapeId, GeoShapeGeoStyle } from "tldraw";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Type,
  Pen,
  Plus,
  Image as ImageIcon,
  Video,
  Wand2,
  ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect, ChangeEvent } from "react";

type ToolbarProps = {
  isSidebarOpen: boolean;
};

type UploadedImageInfo = {
  src: string;
  w: number;
  h: number;
  name: string;
  type: string;
};

export const Toolbar = ({ isSidebarOpen }: ToolbarProps) => {
  const editor = useEditor();

  const currentToolId = useValue(
    "currentTool",
    () => editor.getCurrentToolId(),
    [editor]
  );

  const geoShapeStyle = useValue(
    "geoStyle",
    () => editor.getStyleForNextShape(GeoShapeGeoStyle),
    [editor]
  );

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const shapeMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);



  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addMenuRef.current && !addMenuRef.current.contains(target)) {
        setShowAddMenu(false);
      }
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(target)) {
        setShowShapeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // A 键占位
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === "a") {
        alert("AI 图像功能即将上线（占位）");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const ToolButton = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 16,
        border: "none",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "4px 0",
        cursor: "pointer",
        background: active ? "#eef2ff" : "transparent",
        color: active ? "#4f46e5" : "#64748b",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#f8fafc";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );

  // 图片读取
  const readImageFile = (file: File): Promise<UploadedImageInfo> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            src: reader.result as string,
            w: img.width,
            h: img.height,
            name: file.name,
            type: file.type,
          });
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // 上传图片功能
  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const images = await Promise.all(files.map(readImageFile));
    const spacing = 40;

    // 1. 计算放置位置：优先放在当前视图中心，而不是整个页面的中心
    const viewport = editor.getViewportPageBounds();
    let startX: number;
    let centerY: number;

    // 如果想放在已有内容右侧，保留原逻辑；
    // 但通常用户更喜欢把图片放在"眼皮底下"（当前视图中心）
    // 为了稳妥，这里还是保留你的"放在最右侧"逻辑，但确保基于页面边界计算正确
    const pageBounds = editor.getCurrentPageBounds();
    if (pageBounds) {
      startX = pageBounds.maxX + 100; // 稍微多留点空隙
      centerY = (pageBounds.minY + pageBounds.maxY) / 2;
    } else {
      startX = viewport.center.x;
      centerY = viewport.center.y;
    }

    const assets: any[] = [];
    const shapes: any[] = [];
    const newShapeIds: string[] = [];

    let currentX = startX;

    for (const img of images) {
      const assetId = `asset:${Date.now()}-${Math.random()}`;
      const shapeId = createShapeId();

      assets.push({
        id: assetId as any,
        type: "image",
        typeName: "asset",
        props: {
          name: img.name,
          src: img.src,
          w: img.w,
          h: img.h,
          mimeType: img.type,
          isAnimated: false,
        },
        meta: {},
      });

      shapes.push({
        id: shapeId,
        type: "image",
        x: currentX,
        y: centerY - img.h / 2,
        props: {
          w: img.w,
          h: img.h,
          assetId: assetId as any,
        },
      });

      newShapeIds.push(shapeId);
      currentX += img.w + spacing;
    }

    // 2. 批量创建
    editor.createAssets(assets as any);
    editor.createShapes(shapes as any);
    
    // 3. 选中新图片
    editor.select(...newShapeIds);

    // ⭐ 关键修改：使用 setTimeout 强制等待 React/Tldraw 渲染循环完成
    // 之前不准确是因为图形刚创建，编辑器的“空间索引”还没更新，不知道它们在哪
    setTimeout(() => {
      editor.zoomToSelection({
        animation: { duration: 400 }, // 动画时间
        inset: 0.2, // 留白比例 (20%)，防止图片贴着屏幕边缘
      });
    }, 100); // 100ms 的延迟通常足以解决所有竞态条件

    e.target.value = "";
    setShowAddMenu(false);
  };

  const MenuItem = ({
    icon,
    label,
    shortcut,
    onClick,
    highlight,
  }: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    onClick: () => void;
    highlight?: boolean;
  }) => (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        fontSize: 13,
        cursor: "pointer",
        color: highlight ? "#4f46e5" : "#0f172a",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", color: highlight ? "#4f46e5" : "#64748b" }}>
        {icon}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && (
        <span
          style={{
            fontSize: 11,
            color: "#94a3b8",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            padding: "2px 6px",
          }}
        >
          {shortcut}
        </span>
      )}
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleUploadImage}
      />

      {/* ⭐ 左侧主工具栏 - 自动视觉居中 */}
      <div
        style={{
          position: "absolute",
          top: "50%", // 改成这个，强制垂直居中
          transform: "translateY(-50%)", // 配合这个属性，达成完美的中心对齐
          left: isSidebarOpen ? 40 : 24,
          zIndex: 200,
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            width: 56,
            padding: "8px 6px",
            borderRadius: 24,
            background: "white",
            boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <ToolButton
            active={currentToolId === "select"}
            title="选择工具 (V)"
            onClick={() => editor.setCurrentTool("select")}
          >
            <MousePointer2 size={20} />
          </ToolButton>

          <ToolButton
            active={currentToolId === "hand"}
            title="抓手工具 (H / 空格)"
            onClick={() => editor.setCurrentTool("hand")}
          >
            <Hand size={20} />
          </ToolButton>

          {/* 图形菜单 */}
          <div style={{ position: "relative", width: "100%" }}>
            <ToolButton
              active={
                currentToolId === "geo" ||
                currentToolId === "arrow" ||
                currentToolId === "line"
              }
              title="图形工具"
              onClick={() => setShowShapeMenu((v) => !v)}
            >
              <Square size={20} />
            </ToolButton>

            {showShapeMenu && (
              <div
                ref={shapeMenuRef}
                style={{
                  position: "absolute",
                  left: 64,
                  top: -10,
                  width: 170,
                  background: "white",
                  borderRadius: 16,
                  padding: "6px 0",
                  boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  zIndex: 300,
                }}
              >
                <MenuItem
                  icon={<Square size={16} />}
                  label="矩形"
                  onClick={() => {
                    editor.setStyleForNextShapes(GeoShapeGeoStyle, "rectangle");
                    editor.setCurrentTool("geo");
                    setShowShapeMenu(false);
                  }}
                  highlight={geoShapeStyle === "rectangle"}
                />

                <MenuItem
                  icon={<Circle size={16} />}
                  label="圆形"
                  onClick={() => {
                    editor.setStyleForNextShapes(GeoShapeGeoStyle, "ellipse");
                    editor.setCurrentTool("geo");
                    setShowShapeMenu(false);
                  }}
                  highlight={geoShapeStyle === "ellipse"}
                />

                <MenuItem
                  icon={<Triangle size={16} />}
                  label="三角形"
                  onClick={() => {
                    editor.setStyleForNextShapes(GeoShapeGeoStyle, "triangle");
                    editor.setCurrentTool("geo");
                    setShowShapeMenu(false);
                  }}
                  highlight={geoShapeStyle === "triangle"}
                />

                <div
                  style={{
                    height: 1,
                    margin: "4px 8px",
                    background: "#e2e8f0",
                  }}
                />

                <MenuItem
                  icon={<ArrowRight size={16} />}
                  label="箭头"
                  onClick={() => {
                    editor.setCurrentTool("arrow");
                    setShowShapeMenu(false);
                  }}
                  highlight={currentToolId === "arrow"}
                />

                <MenuItem
                  icon={<Minus size={16} />}
                  label="直线"
                  onClick={() => {
                    editor.setCurrentTool("line");
                    setShowShapeMenu(false);
                  }}
                  highlight={currentToolId === "line"}
                />
              </div>
            )}
          </div>

          <ToolButton
            active={currentToolId === "text"}
            title="文本工具 (T)"
            onClick={() => editor.setCurrentTool("text")}
          >
            <Type size={20} />
          </ToolButton>

          <ToolButton
            active={currentToolId === "draw"}
            title="画笔工具 (B)"
            onClick={() => editor.setCurrentTool("draw")}
          >
            <Pen size={20} />
          </ToolButton>

          <div
            style={{
              width: "60%",
              height: 1,
              margin: "8px 0",
              background: "#e2e8f0",
            }}
          />

          <div style={{ position: "relative", width: "100%" }}>
            <ToolButton title="添加内容" onClick={() => setShowAddMenu((v) => !v)}>
              <Plus size={20} />
            </ToolButton>

            {showAddMenu && (
              <div
                ref={addMenuRef}
                style={{
                  position: "absolute",
                  left: 64,
                  top: -40,
                  width: 220,
                  background: "white",
                  borderRadius: 16,
                  padding: "8px 0",
                  boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  zIndex: 300,
                }}
              >
                <MenuItem
                  icon={<ImageIcon size={18} />}
                  label="上传图片"
                  onClick={() => fileInputRef.current?.click()}
                  shortcut="Ctrl+U"
                />

                <MenuItem
                  icon={<Video size={18} />}
                  label="上传视频（开发中）"
                  onClick={() => {
                    alert("视频上传功能开发中");
                    setShowAddMenu(false);
                  }}
                />

                <div
                  style={{
                    height: 1,
                    margin: "4px 8px",
                    background: "#e2e8f0",
                  }}
                />

                <MenuItem
                  icon={
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Wand2 size={18} />
                      <ChevronRight size={16} />
                    </div>
                  }
                  label="AI 图像生成器"
                  shortcut="A"
                  onClick={() => {
                    alert("AI 图像功能即将上线");
                    setShowAddMenu(false);
                  }}
                  highlight
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
