const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const tagsFilePath = path.join(__dirname, 'tags.txt');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 辅助函数 ---

// 读取标签文件，使用换行符分隔
const readTags = () => {
    try {
        // 读取文件内容
        const data = fs.readFileSync(tagsFilePath, 'utf8');
        // 去除首尾空白，按换行符分割
        // 过滤掉因多个换行符或空行产生的空字符串
        // 遍历结果数组，对每个标签再次trim，去除标签内容前后的空格
        return data.trim().split('\n').filter(tag => tag.trim() !== '').map(tag => tag.trim());
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`${tagsFilePath} 文件不存在，返回空数组.`);
            return [];
        }
        console.error("读取 tags.txt 文件出错:", err);
        throw err;
    }
};

// 写入标签文件，使用换行符连接
const writeTags = (tagsArray) => {
    try {
        // 将标签数组用换行符连接成字符串
        // 过滤掉空字符串，避免写入空行
        const data = tagsArray.filter(tag => tag.trim() !== '').join('\n');
        fs.writeFileSync(tagsFilePath, data, 'utf8');
        console.log("tags.txt 文件已更新.");
    } catch (err) {
        console.error("写入 tags.txt 文件出错:", err);
        throw err;
    }
};

// --- API 路由 ---

// GET /tags: 获取所有标签
app.get('/tags', (req, res) => {
    try {
        const tags = readTags();
        res.json(tags);
    } catch (err) {
        res.status(500).send('Error fetching tags');
    }
});

// POST /tags: 更新所有标签 (接收整个数组并覆盖文件)
app.post('/tags', (req, res) => {
    const tags = req.body;
    if (!Array.isArray(tags)) {
        return res.status(400).send('Invalid input: Expected an array of tags.');
    }
    try {
        writeTags(tags);
        res.status(200).send('Tags updated successfully.');
    } catch (err) {
        res.status(500).send('Error saving tags');
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});