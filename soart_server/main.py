# soart_server/main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# 1. 导入核心服务
from services.db_service import db_service

# 2. 导入所有路由模块
from routers import canvas      # 画布增删改查
from routers import ai_config   # 模型列表配置
from routers import magic       # 魔法生图接口
from routers import chat        # AI 聊天接口
from routers import settings    # [新增] 设置接口

# 生命周期管理：启动时自动初始化数据库
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Soart Server starting...")
    # 初始化数据库（建表）
    await db_service.initialize()
    print("✅ Database initialized.")
    yield
    print("👋 Soart Server shutting down...")

# 创建 FastAPI 应用
app = FastAPI(lifespan=lifespan)

# 配置跨域 (CORS) - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],
)

# ==========================================
# 3. 注册路由 (挂载所有接口)
# ==========================================
app.include_router(canvas.router)    # 挂载画布接口 (/api/canvas/...)
app.include_router(ai_config.router) # 挂载配置接口 (/api/list_models...)
app.include_router(magic.router)     # 挂载生图接口 (/api/magic/...)
app.include_router(chat.router)      # 挂载聊天接口 (/api/chat/...)
app.include_router(settings.router)  # 挂载设置接口 (/api/settings/...)

# 健康检查接口
@app.get("/")
def read_root():
    return {"status": "Soart Server is running", "version": "1.0.0"}

if __name__ == "__main__":
    # 启动服务，端口 8000
    print("🌟 Soart backend is ready!")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)