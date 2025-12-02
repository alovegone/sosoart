# soart_server/services/db_service.py

import aiosqlite
import os
import time
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER_DATA_DIR = os.path.join(BASE_DIR, "user_data")
DB_PATH = os.path.join(USER_DATA_DIR, "soart.sqlite")

os.makedirs(USER_DATA_DIR, exist_ok=True)

class DatabaseService:
    def __init__(self):
        self.db_path = DB_PATH
        print(f"📂 [Soart DB] Database path: {self.db_path}")

    async def initialize(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS canvases (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    data TEXT,
                    thumbnail TEXT,
                    updated_at REAL
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            """)
            await db.commit()

    async def list_canvases(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT id, name, thumbnail, updated_at FROM canvases ORDER BY updated_at DESC") as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def create_canvas(self, canvas_id: str, name: str):
        async with aiosqlite.connect(self.db_path) as db:
            now = time.time()
            await db.execute(
                "INSERT INTO canvases (id, name, data, thumbnail, updated_at) VALUES (?, ?, ?, ?, ?)",
                (canvas_id, name, "{}", "", now)
            )
            await db.commit()

    # [新增] 复制画布
    async def duplicate_canvas(self, source_id: str, new_id: str, new_name: str):
        async with aiosqlite.connect(self.db_path) as db:
            # 1. 查出源数据
            async with db.execute("SELECT data, thumbnail FROM canvases WHERE id = ?", (source_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    raise Exception("Source canvas not found")
                data, thumbnail = row[0], row[1]
            
            # 2. 插入新数据
            now = time.time()
            await db.execute(
                "INSERT INTO canvases (id, name, data, thumbnail, updated_at) VALUES (?, ?, ?, ?, ?)",
                (new_id, new_name, data, thumbnail, now)
            )
            await db.commit()

    async def get_canvas_data(self, canvas_id: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM canvases WHERE id = ?", (canvas_id,)) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else None

    async def save_canvas_data(self, canvas_id: str, data_json: str, thumbnail: str = ""):
        async with aiosqlite.connect(self.db_path) as db:
            now = time.time()
            await db.execute(
                "UPDATE canvases SET data = ?, thumbnail = ?, updated_at = ? WHERE id = ?",
                (data_json, thumbnail, now, canvas_id)
            )
            await db.commit()

    async def rename_canvas(self, canvas_id: str, new_name: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE canvases SET name = ? WHERE id = ?", (new_name, canvas_id))
            await db.commit()

    async def delete_canvas(self, canvas_id: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM canvases WHERE id = ?", (canvas_id,))
            await db.commit()

    # --- Settings ---
    async def get_setting(self, key: str, default: str = "") -> str:
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT value FROM settings WHERE key = ?", (key,)) as cursor:
                row = await cursor.fetchone()
                return row[0] if row else default

    async def set_setting(self, key: str, value: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
            await db.commit()
            
    async def get_all_settings(self) -> Dict[str, str]:
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT key, value FROM settings") as cursor:
                rows = await cursor.fetchall()
                return {row[0]: row[1] for row in rows}

db_service = DatabaseService()