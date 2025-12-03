const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// 允许跨域（因为前端是 5173，后端是 3001）
app.use(cors());
// 允许接收大的 JSON 数据（画布数据可能会很大）
app.use(express.json({ limit: '50mb' }));

// API: 保存画布
app.post('/api/save', (req, res) => {
    const data = req.body;
    // 将 JSON 写入文件模拟数据库
    fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Write failed' });
        }
        console.log('Canvas saved successfully!');
        res.json({ success: true });
    });
});

// API: 读取画布
app.get('/api/load', (req, res) => {
    if (!fs.existsSync(DB_FILE)) {
        return res.json({}); // 文件不存在返回空
    }
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Read failed' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({});
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});