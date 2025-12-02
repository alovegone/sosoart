# soart_server/routers/chat.py

import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from openai import OpenAI
from services.db_service import db_service # 导入数据库服务

router = APIRouter(prefix="/api/chat")

# 辅助函数：获取配置，如果数据库没存，就用 .env 里的保底
async def get_config(key: str, default: str) -> str:
    val = await db_service.get_setting(key)
    return val if val else os.getenv(key, default)

@router.post("/completions")
async def chat_completions(request: Request):
    try:
        data = await request.json()
        messages = data.get("messages", [])
        
        if not messages:
            raise HTTPException(status_code=400, detail="Messages are required")

        # [修改] 1. 动态获取配置
        api_key = await get_config("API_KEY", "")
        base_url = await get_config("OPENAI_BASE_URL", "https://aihubmix.com/v1")
        default_model = await get_config("DEFAULT_CHAT_MODEL", "gpt-4o")

        # 检查 Key
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key not configured in settings")

        # [修改] 2. 动态初始化 Client
        client = OpenAI(api_key=api_key, base_url=base_url)

        # 3. 准备模型参数
        # 前端可以传 model 参数，如果没有，就用数据库里的默认值
        model = data.get("model") or default_model

        print(f"💬 [Chat] Model: {model} | API: {base_url}")

        # 4. 系统提示词
        system_prompt = {
            "role": "system",
            "content": "你叫 Soart AI，是一个专业的创意视觉助手。请用中文回答。"
        }
        full_messages = [system_prompt] + messages

        # 5. 调用
        response = client.chat.completions.create(
            model=model,
            messages=full_messages,
            stream=True,
            temperature=0.7
        )

        def event_generator():
            for chunk in response:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content is not None:
                        yield delta.content

        return StreamingResponse(event_generator(), media_type="text/plain")

    except Exception as e:
        print(f"❌ [Chat] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))