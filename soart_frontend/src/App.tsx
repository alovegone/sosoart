// soart_frontend/src/App.tsx

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { 
  LayoutGrid, Plus, Settings, MoreHorizontal, 
  Home as HomeIcon, Paperclip, ArrowUp,
  Image as ImageIcon, Video, PenTool, ShoppingBag,
  Trash2, Copy, Edit2
} from 'lucide-react';

import SoartCanvas from './components/SoartCanvas';
import ChatSidebar from './components/ChatSidebar';
import SettingsModal from './components/SettingsModal';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'projects' | 'canvas'>('home');
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [homeInput, setHomeInput] = useState('');

  // 状态：菜单与重命名
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 加载列表
  const fetchCanvases = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/canvas/list`);
      setCanvases(res.data);
    } catch (error) {
      console.error("加载失败", error);
    }
  };

  useEffect(() => {
    if (currentView === 'projects') {
      fetchCanvases();
    }
  }, [currentView]);

  // 关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- 核心操作 ---

  const createNewCanvas = async (initialPrompt = "") => {
    const name = initialPrompt ? (initialPrompt.slice(0, 10) + "...") : "未命名项目";
    const newId = nanoid();
    try {
      await axios.post(`${API_BASE_URL}/api/canvas/create`, {
        canvas_id: newId,
        name: name
      });
      setCurrentCanvasId(newId);
      setCurrentView('canvas');
    } catch (error) {
      alert("创建失败");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这个项目吗？")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/canvas/${id}/delete`);
      fetchCanvases();
    } catch (error) {
      alert("删除失败");
    }
  };

  const handleDuplicate = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = nanoid();
    try {
      await axios.post(`${API_BASE_URL}/api/canvas/${id}/duplicate`, {
        new_id: newId,
        new_name: name + " (副本)"
      });
      fetchCanvases();
    } catch (error) {
      alert("复制失败");
    }
  };

  const startRename = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(c.id);
    setRenameValue(c.name);
    setMenuOpenId(null);
  };

  const submitRename = async () => {
    if (!renamingId) return;
    try {
      await axios.post(`${API_BASE_URL}/api/canvas/${renamingId}/rename`, {
        name: renameValue
      });
      fetchCanvases();
    } catch (error) {
      console.error(error);
    } finally {
      setRenamingId(null);
    }
  };

  const goBack = () => {
    setCurrentCanvasId(null);
    setCurrentView('projects');
    fetchCanvases();
  };

  // --- 格式化时间函数 ---
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 使用24小时制
    });
  };

  // 视图: 画布
  if (currentView === 'canvas' && currentCanvasId) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <SoartCanvas canvasId={currentCanvasId} onBack={goBack} />
        <ChatSidebar />
      </div>
    );
  }

  // 视图: 首页/项目列表
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 左侧侧边栏 */}
      <div style={{ width: '70px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
        <div style={{ width: '40px', height: '40px', background: 'black', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px' }}>So</div>
        <NavIcon icon={<Plus size={24} />} active={false} onClick={() => createNewCanvas()} highlight />
        <NavIcon icon={<HomeIcon size={24} />} active={currentView === 'home'} onClick={() => setCurrentView('home')} />
        <NavIcon icon={<LayoutGrid size={24} />} active={currentView === 'projects'} onClick={() => setCurrentView('projects')} />
        <div style={{ flex: 1 }} />
        <NavIcon icon={<Settings size={24} />} onClick={() => setIsSettingsOpen(true)} />
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, overflowY: 'auto', background: currentView === 'home' ? '#fff' : '#F9FAFB' }}>
        
        {/* === 首页视图 === */}
        {currentView === 'home' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'black', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>So</div>
              <h1 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>Soart 让设计更简单</h1>
            </div>
            <p style={{ color: '#999', fontSize: '16px', marginBottom: '40px' }}>懂你的设计代理，帮你搞定一切</p>
            <div style={{ width: '100%', maxWidth: '800px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <textarea placeholder="描述你的创意..." value={homeInput} onChange={e => setHomeInput(e.target.value)} style={{ width: '100%', height: '80px', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '16px', color: '#333' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button style={toolBtnStyle}><Paperclip size={20} /></button>
                <button onClick={() => createNewCanvas(homeInput)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: homeInput ? 'black' : '#E5E7EB', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: homeInput ? 'pointer' : 'default' }}><ArrowUp size={18} /></button>
              </div>
            </div>
            <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
              <Chip icon={<ImageIcon size={16} />} label="Design" />
              <Chip icon={<PenTool size={16} />} label="Branding" />
              <Chip icon={<Video size={16} />} label="Video" />
            </div>
          </div>
        )}

        {/* === 项目列表视图 === */}
        {currentView === 'projects' && (
          <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#111' }}>项目</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              
              <div onClick={() => createNewCanvas()} style={{ aspectRatio: '4/3', background: '#F3F4F6', borderRadius: '16px', border: '2px dashed #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
                <div style={{ width: '48px', height: '48px', background: 'black', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '12px' }}><Plus size={24} /></div>
                <span>新建项目</span>
              </div>

              {canvases.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                  <div 
                    onClick={() => { setCurrentCanvasId(c.id); setCurrentView('canvas'); }}
                    style={{ aspectRatio: '4/3', background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  >
                    {c.thumbnail ? <img src={c.thumbnail} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '30px' }}>
                    {renamingId === c.id ? (
                      <input 
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={e => e.key === 'Enter' && submitRename()}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: '4px', fontSize: '15px', border: '1px solid #2196F3', borderRadius: '4px', outline: 'none' }}
                      />
                    ) : (
                      <div style={{ flex: 1 }}>
                        <h3 
                          onDoubleClick={(e) => startRename(c, e)} 
                          title="双击重命名"
                          style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#111', cursor: 'text' }}
                        >
                          {c.name}
                        </h3>
                        {/* [修改] 格式化后的时间 */}
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                          {formatTime(c.updated_at)}
                        </p>
                      </div>
                    )}

                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setMenuOpenId(menuOpenId === c.id ? null : c.id); 
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpenId === c.id && (
                        <div style={{
                          position: 'absolute', top: '100%', right: 0, zIndex: 10,
                          background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '120px'
                        }}>
                          <MenuItem icon={<Copy size={14}/>} label="复制" onClick={(e: any) => handleDuplicate(c.id, c.name, e)} />
                          <MenuItem icon={<Edit2 size={14}/>} label="重命名" onClick={(e: any) => startRename(c, e)} />
                          <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
                          <MenuItem icon={<Trash2 size={14}/>} label="删除" onClick={(e: any) => handleDelete(c.id, e)} danger />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

// 辅助组件
function MenuItem({ icon, label, onClick, danger }: any) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
        fontSize: '14px', color: danger ? '#FF3366' : '#333', cursor: 'pointer',
        transition: 'background 0.1s'
      }}
      onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
      onMouseOut={e => e.currentTarget.style.background = 'white'}
    >
      {icon} {label}
    </div>
  )
}

function NavIcon({ icon, active, onClick, highlight }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        width: '44px', height: '44px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: highlight ? 'black' : (active ? '#F3F4F6' : 'transparent'),
        color: highlight ? 'white' : (active ? 'black' : '#666'),
        cursor: 'pointer', transition: 'all 0.2s',
        border: active ? '1px solid #e5e5e5' : '1px solid transparent'
      }}
    >
      {icon}
    </div>
  )
}

function Chip({ icon, label, active }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 16px', borderRadius: '100px',
      border: '1px solid #E5E7EB',
      background: active ? '#FFF8F1' : 'white',
      color: active ? '#FF9933' : '#333',
      borderColor: active ? '#FF9933' : '#E5E7EB',
      fontSize: '14px', cursor: 'pointer', fontWeight: 500
    }}>
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      <span>{label}</span>
    </div>
  )
}

const toolBtnStyle = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: '50%',
  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#666'
}

export default App;