const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API 路由（可选，用于未来扩展）
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '实验管理系统运行正常',
        timestamp: new Date().toISOString()
    });
});

// 处理所有其他路由，返回主页（单页应用）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: err.message 
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('=====================================');
    console.log('🧪 实验管理系统已启动');
    console.log('=====================================');
    console.log(`📋 访问地址: http://localhost:${PORT}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log('📁 项目目录:', __dirname);
    console.log('=====================================');
    console.log('💡 使用说明:');
    console.log('   - 在浏览器中访问上述地址');
    console.log('   - 数据将自动保存在浏览器本地存储中');
    console.log('   - 可以通过系统导出/导入功能备份数据');
    console.log('   - 按 Ctrl+C 停止服务器');
    console.log('=====================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('\\n📴 正在关闭实验管理系统...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\\n📴 正在关闭实验管理系统...');
    process.exit(0);
});