// soart_frontend/src/components/ChatSidebar.tsx

import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '👋 你好！我是 Soart 助手，有什么可以帮你的？' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 1. 发起请求
            const response = await fetch(`${API_BASE_URL}/api/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.body) throw new Error("No response body");

            // 2. 准备接收流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            // 先添加一个空的 AI 消息占位
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            // 3. 逐字读取
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value, { stream: true });
                aiContent += text;

                // 更新最后一条消息（打字机效果）
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = aiContent;
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ 出错了，请检查后端连接。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // 如果是折叠状态，只显示一个小图标
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#2196F3',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    zIndex: 2000
                }}
            >
                💬
            </button>
        );
    }

    // 展开状态：显示完整聊天窗口
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '350px',
            height: '100vh',
            background: 'white',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 标题栏 */}
            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Soart Assistant</h3>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>✖</button>
            </div>

            {/* 消息列表 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? '#2196F3' : '#f1f1f1',
                        color: msg.role === 'user' ? 'white' : 'black',
                        padding: '10px 15px',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        lineHeight: '1.5',
                        fontSize: '14px'
                    }}>
                        {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="问点什么..."
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend} 
                    disabled={isLoading}
                    style={{ padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}
                >
                    发送
                </button>
            </div>
        </div>
    );
}