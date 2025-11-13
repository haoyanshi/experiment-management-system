# 数据存储结构说明

## 概述
实验管理系统使用本地存储来保存数据，主要通过 localStorage 存储在浏览器中，同时提供 JSON 文件的导出导入功能。

## 数据结构

### 实验数据 (Experiments)
```json
{
  "id": "唯一标识符",
  "title": "实验标题",
  "description": "实验描述",
  "category": "实验分类",
  "startDate": "开始日期 (YYYY-MM-DD)",
  "endDate": "结束日期 (YYYY-MM-DD)",
  "status": "状态 (active/completed/planned)",
  "createdAt": "创建时间 (ISO 8601)",
  "updatedAt": "更新时间 (ISO 8601)"
}
```

### 实验记录 (Records)
```json
{
  "id": "唯一标识符",
  "experimentId": "关联的实验ID",
  "date": "记录日期 (YYYY-MM-DD)",
  "content": "记录内容",
  "parameters": "实验参数",
  "results": "实验结果",
  "createdAt": "创建时间 (ISO 8601)",
  "updatedAt": "更新时间 (ISO 8601)"
}
```

### 文件数据 (Files)
```json
{
  "id": "唯一标识符",
  "name": "文件名",
  "size": "文件大小 (字节)",
  "type": "文件类型 (MIME type)",
  "uploadDate": "上传日期 (YYYY-MM-DD)",
  "file": "文件对象 (仅在内存中)"
}
```

## 存储方式

### 1. localStorage 存储
- 键名：`experimentData`
- 格式：JSON 字符串
- 包含：experiments, records, files 三个数组

### 2. 文件导出格式
- 文件名：`experiment-data-YYYY-MM-DD.json`
- 包含所有数据和导出时间戳
- 注意：文件内容不包含在导出中，只有文件元数据

## 数据操作

### 创建 (Create)
- 生成唯一ID：时间戳 + 随机字符
- 设置创建时间戳
- 添加到对应数组
- 保存到 localStorage

### 读取 (Read)
- 从 localStorage 读取数据
- 解析 JSON 字符串
- 显示在用户界面

### 更新 (Update)
- 查找对应ID的数据
- 更新字段内容
- 设置更新时间戳
- 保存到 localStorage

### 删除 (Delete)
- 从数组中移除对应项
- 删除实验时同时删除相关记录
- 保存到 localStorage

## 数据备份和恢复

### 备份
1. 使用"导出数据"功能
2. 定期手动备份 JSON 文件
3. 可以复制整个项目文件夹

### 恢复
1. 使用"导入数据"功能
2. 将 JSON 文件内容复制到系统中
3. 重新上传相关文件

## 注意事项

1. **浏览器限制**：localStorage 有存储大小限制（通常 5-10MB）
2. **文件存储**：实际文件存储在内存中，刷新页面后丢失
3. **数据安全**：数据存储在本地，注意定期备份
4. **浏览器兼容**：需要支持 HTML5 的现代浏览器
5. **隐私保护**：所有数据仅存储在本地，不会上传到服务器

## 扩展建议

1. **数据库集成**：可以集成 IndexedDB 用于更大的存储空间
2. **文件系统**：通过 File System Access API 实现真正的文件保存
3. **同步功能**：可以添加云端同步功能
4. **版本控制**：实现数据版本管理和历史记录