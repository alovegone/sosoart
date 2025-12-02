# soart_server/routers/settings.py

from fastapi import APIRouter, Request
from services.db_service import db_service

router = APIRouter(prefix="/api/settings")

@router.get("/all")
async def get_all_settings():
    """获取所有设置"""
    return await db_service.get_all_settings()

@router.post("/update")
async def update_settings(request: Request):
    """批量更新设置"""
    data = await request.json()
    for key, value in data.items():
        await db_service.set_setting(key, str(value))
    return {"status": "success"}