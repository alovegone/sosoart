# soart_server/routers/canvas.py

from fastapi import APIRouter, Request, HTTPException
from services.db_service import db_service
import json

router = APIRouter(prefix="/api/canvas")

@router.get("/list")
async def list_canvases():
    return await db_service.list_canvases()

@router.post("/create")
async def create_canvas(request: Request):
    data = await request.json()
    canvas_id = data.get('canvas_id')
    name = data.get('name', 'Untitled')
    if not canvas_id:
        raise HTTPException(status_code=400, detail="canvas_id is required")
    await db_service.create_canvas(canvas_id, name)
    return {"id": canvas_id, "name": name}

# [新增] 复制画布接口
@router.post("/{id}/duplicate")
async def duplicate_canvas(id: str, request: Request):
    data = await request.json()
    new_id = data.get('new_id')
    new_name = data.get('new_name')
    if not new_id:
        raise HTTPException(status_code=400, detail="new_id is required")
    
    await db_service.duplicate_canvas(id, new_id, new_name)
    return {"status": "duplicated", "id": new_id}

@router.get("/{id}")
async def get_canvas(id: str):
    data = await db_service.get_canvas_data(id)
    if not data:
        return {"error": "not_found"}
    try:
        content = json.loads(data['data'])
    except:
        content = {}
    return {
        "id": data['id'],
        "name": data['name'],
        "data": content, 
        "thumbnail": data['thumbnail']
    }

@router.post("/{id}/save")
async def save_canvas(id: str, request: Request):
    payload = await request.json()
    canvas_data = payload.get('data', {})
    thumbnail = payload.get('thumbnail', '')
    data_str = json.dumps(canvas_data)
    await db_service.save_canvas_data(id, data_str, thumbnail)
    return {"status": "saved", "id": id}

@router.post("/{id}/rename")
async def rename_canvas(id: str, request: Request):
    data = await request.json()
    await db_service.rename_canvas(id, data.get('name'))
    return {"status": "renamed"}

@router.delete("/{id}/delete")
async def delete_canvas(id: str):
    await db_service.delete_canvas(id)
    return {"status": "deleted"}