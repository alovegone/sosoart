# soart_server/routers/magic.py

from fastapi import APIRouter, HTTPException, Request
from tools.magic_gen import generate_magic_image
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/api/magic")

@router.post("/generate")
async def magic_generate(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    
    # [修改] 兼容单图和多图字段
    # 如果前端传了 ref_images (新版)，用它
    # 如果没传，看看有没有 ref_image (旧版)，有的话把它包成列表
    ref_images = data.get("ref_images", [])
    if not ref_images and data.get("ref_image"):
        ref_images = [data.get("ref_image")]

    if not prompt and not ref_images:
        raise HTTPException(status_code=400, detail="Prompt or Reference Image is required")
    
    url = await generate_magic_image(prompt, ref_images)
    if not url:
        raise HTTPException(status_code=500, detail="Generation failed")
    
    return {"url": url}

# ... 下面的代码保持不变 ...

# 2. 图片访问接口 (让前端能看到图)
# 图片存放在 user_data/files，我们需要把这个目录公开
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES_DIR = os.path.join(BASE_DIR, "user_data", "files")

@router.get("/file/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(FILES_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "File not found"}