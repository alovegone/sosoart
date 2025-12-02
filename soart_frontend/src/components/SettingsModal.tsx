// soart_frontend/src/components/SettingsModal.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState({
        API_KEY: '',
        OPENAI_BASE_URL: 'https://aihubmix.com/v1',
        GOOGLE_BASE_URL: 'https://aihubmix.com/gemini',
        DEFAULT_CHAT_MODEL: 'gpt-4o',
        MAGIC_MODEL_NAME: 'gemini-3-pro-image-preview'
    });
    const [status, setStatus] = useState('');

    // 打开时加载配置
    useEffect(() => {
        if (isOpen) {
            axios.get(`${API_BASE_URL}/api/settings/all`)
                .then(res => {
                    // 如果数据库有值就用数据库的，否则保持默认
                    if (res.data && Object.keys(res.data).length > 0) {
                        setSettings(prev => ({ ...prev, ...res.data }));
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            await axios.post(`${API_BASE_URL}/api/settings/update`, settings);
            setStatus('✅ 保存成功！重启后端生效(部分配置)');
            setTimeout(() => {
                setStatus('');
                onClose();
            }, 1000);
        } catch (error) {
            setStatus('❌ 保存失败');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '12px',
                width: '500px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0 }}>⚙️ 系统设置</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <label>
                        <strong>API Key</strong> (共用)
                        <input 
                            type="password"
                            value={settings.API_KEY}
                            onChange={e => setSettings({...settings, API_KEY: e.target.value})}
                            style={inputStyle} placeholder="sk-..." 
                        />
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <label style={{ flex: 1 }}>
                            <strong>Chat Base URL</strong>
                            <input 
                                value={settings.OPENAI_BASE_URL}
                                onChange={e => setSettings({...settings, OPENAI_BASE_URL: e.target.value})}
                                style={inputStyle} 
                            />
                        </label>
                        <label style={{ flex: 1 }}>
                            <strong>Chat Model</strong>
                            <input 
                                value={settings.DEFAULT_CHAT_MODEL}
                                onChange={e => setSettings({...settings, DEFAULT_CHAT_MODEL: e.target.value})}
                                style={inputStyle} 
                            />
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <label style={{ flex: 1 }}>
                            <strong>Magic Base URL</strong>
                            <input 
                                value={settings.GOOGLE_BASE_URL}
                                onChange={e => setSettings({...settings, GOOGLE_BASE_URL: e.target.value})}
                                style={inputStyle} 
                            />
                        </label>
                        <label style={{ flex: 1 }}>
                            <strong>Magic Model</strong>
                            <input 
                                value={settings.MAGIC_MODEL_NAME}
                                onChange={e => setSettings({...settings, MAGIC_MODEL_NAME: e.target.value})}
                                style={inputStyle} 
                            />
                        </label>
                    </div>

                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: status.includes('❌') ? 'red' : 'green', fontSize: '14px' }}>{status}</span>
                    <button onClick={onClose} style={cancelBtnStyle}>取消</button>
                    <button onClick={handleSave} style={saveBtnStyle}>保存</button>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '8px', marginTop: '5px',
    border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' as const
};

const saveBtnStyle = {
    background: '#2196F3', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
};

const cancelBtnStyle = {
    background: '#f5f5f5', color: '#333', border: '1px solid #ccc',
    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer'
};