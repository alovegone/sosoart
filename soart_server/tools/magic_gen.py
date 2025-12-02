# soart_server/tools/magic_gen.py

import os
import asyncio
import base64
import io
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
from nanoid import generate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES_DIR = os.path.join(BASE_DIR, "user_data", "files")
DEFAULT_PORT = 8000

load_dotenv(override=True)

api_key = os.getenv("API_KEY")
base_url = os.getenv("GOOGLE_BASE_URL", "https://aihubmix.com/gemini")

if not api_key:
    client = None
else:
    client = genai.Client(
        api_key=api_key,
        http_options={"base_url": base_url}
    )

def process_image_data(img_data: str) -> Image.Image:
    """辅助函数：将 Base64 或 URL 转换为 PIL Image 对象"""
    try:
        # 情况 1: Base64 图片 (data:image/png;base64,...)
        if img_data.startswith("data:image"):
            base64_str = img_data.split(",")[1]
            image_bytes = base64.b64decode(base64_str)
            return Image.open(io.BytesIO(image_bytes))
        
        # 情况 2: 本地 URL (http://localhost...) 或 网络 URL
        elif img_data.startswith("http"):
            # 如果是本地 localhost 图片，直接读文件可能更快，但用 requests 通用性更好
            resp = requests.get(img_data)
            resp.raise_for_status()
            return Image.open(io.BytesIO(resp.content))
            
        return None
    except Exception as e:
        print(f"❌ 图片处理失败: {e}")
        return None

async def generate_magic_image(prompt: str, ref_images: list = None) -> str:
    """
    prompt: 提示词
    ref_images: 图片数据列表 (Base64 或 URL)
    """
    if not client:
        return ""

    try:
        model_name = os.getenv("MAGIC_MODEL_NAME", "gemini-3-pro-image-preview")
        print(f"🎨 [Magic] Generating: {prompt[:30]}... (Refs: {len(ref_images) if ref_images else 0})")

        # 1. 构建 Gemini 的内容列表 [文本, 图片1, 图片2...]
        contents_payload = [prompt]
        
        if ref_images and isinstance(ref_images, list):
            for img_str in ref_images:
                pil_img = process_image_data(img_str)
                if pil_img:
                    contents_payload.append(pil_img)

        # 2. 调用 API
        def _sync_gen():
            return client.models.generate_content(
                model=model_name,
                contents=contents_payload, # 传入混合内容列表
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE'],
                    image_config=types.ImageConfig(aspect_ratio="1:1", image_size="2K"),
                ),
            )

        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _sync_gen)

        # 3. 保存结果
        if response.parts:
            for part in response.parts:
                if image := part.as_image():
                    filename = f'{generate(size=10)}.png'
                    if not os.path.exists(FILES_DIR): os.makedirs(FILES_DIR)
                    image.save(os.path.join(FILES_DIR, filename))
                    return f"http://localhost:{DEFAULT_PORT}/api/file/{filename}"
        
        return ""
    except Exception as e:
        print(f"❌ Error: {e}")
        return ""