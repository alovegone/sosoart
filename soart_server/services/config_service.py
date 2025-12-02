# soart_server/services/config_service.py

import os
from typing import Dict, Any
from dotenv import load_dotenv

# 强制重载 .env，确保读取最新修改
load_dotenv(override=True)

class ConfigService:
    def __init__(self):
        pass

    def get_config(self) -> Dict[str, Any]:
        """
        动态生成配置：完全由环境变量决定
        """
        # 1. 从环境变量读取模型列表字符串 (例如 "gpt-4o,claude-3-5")
        models_str = os.getenv("CHAT_MODELS", "gpt-4o")
        
        # 2. 分割成列表，并去除空格
        model_list = [m.strip() for m in models_str.split(',') if m.strip()]
        
        # 3. 动态构建 models 字典
        # 结构: { "gpt-4o": {type: "text", ...}, "claude": {...} }
        chat_models_config = {}
        for model_name in model_list:
            chat_models_config[model_name] = {
                'type': 'text',
                'is_custom': True
            }

        # 4. 组装最终配置
        return {
            'openai': {
                'models': chat_models_config, # <--- 这里不再是写死的，而是动态生成的
                'is_custom': True
            },
            # 生图部分保持不变，因为工具 ID 是固定的
            'jaaz': {
                'models': {
                    'generate_image_by_gpt_image_1_jaaz': {'type': 'image', 'is_custom': True}
                },
                'is_custom': True
            }
        }

config_service = ConfigService()