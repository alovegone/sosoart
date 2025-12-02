# soart_server/routers/ai_config.py

from fastapi import APIRouter
from services.config_service import config_service

router = APIRouter()

@router.get("/api/list_models")
async def list_models():
    """解决 404 错误：返回模型列表"""
    config = config_service.get_config()
    return {
        "status": "success",
        "data": config
    }

@router.get("/api/list_tools")
async def list_tools():
    """解决 404 错误：返回工具列表"""
    return {
        "status": "success",
        "data": {} 
    }