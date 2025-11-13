// 数据管理模块 - 扩展ExperimentApp类的数据操作方法

// 实验管理方法
ExperimentApp.prototype.addExperiment = function() {
    const form = document.getElementById('add-experiment-form');

    // 防止重复提交
    if (this.isSubmitting) {
        return;
    }

    // 检查是否为编辑模式
    const editMode = form.dataset.editMode === 'true';
    const editId = form.dataset.editId;

    if (editMode && editId) {
        this.updateExperiment(editId);
        return;
    }

    this.isSubmitting = true;

    const formData = new FormData(form);

    const experiment = {
        id: this.generateId(),
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        status: 'active',
        createdAt: new Date().toISOString()
    };

    this.experiments.push(experiment);
    this.saveData();

    // 关闭模态框并清空表单
    closeModal('add-experiment-modal');
    form.reset();

    // 清除编辑模式标记
    delete form.dataset.editMode;
    delete form.dataset.editId;

    // 刷新显示
    if (this.currentTab === 'experiments') {
        this.renderExperiments();
    }
    this.updateDashboard();

    this.isSubmitting = false;

    alert('实验创建成功！');
};

ExperimentApp.prototype.editExperiment = function(experimentId) {
    const experiment = this.experiments.find(exp => exp.id === experimentId);
    if (!experiment) return;

    // 填充表单
    document.getElementById('experiment-title').value = experiment.title;
    document.getElementById('experiment-description').value = experiment.description || '';
    document.getElementById('experiment-category').value = experiment.category || '';
    document.getElementById('experiment-start-date').value = experiment.startDate || '';
    document.getElementById('experiment-end-date').value = experiment.endDate || '';

    // 标记为编辑模式
    const form = document.getElementById('add-experiment-form');
    form.dataset.editMode = 'true';
    form.dataset.editId = experimentId;

    // 显示模态框
    showAddExperimentModal();
};

ExperimentApp.prototype.updateExperiment = function(experimentId) {
    const form = document.getElementById('add-experiment-form');

    // 防止重复提交
    if (this.isSubmitting) {
        return;
    }

    this.isSubmitting = true;

    const formData = new FormData(form);

    const experimentIndex = this.experiments.findIndex(exp => exp.id === experimentId);
    if (experimentIndex === -1) {
        this.isSubmitting = false;
        return;
    }

    this.experiments[experimentIndex] = {
        ...this.experiments[experimentIndex],
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        updatedAt: new Date().toISOString()
    };

    this.saveData();

    closeModal('add-experiment-modal');
    form.reset();

    // 清除编辑模式标记
    delete form.dataset.editMode;
    delete form.dataset.editId;

    if (this.currentTab === 'experiments') {
        this.renderExperiments();
    }
    this.updateDashboard();

    this.isSubmitting = false;

    alert('实验更新成功！');
};

ExperimentApp.prototype.deleteExperiment = function(experimentId) {
    if (!confirm('确定要删除这个实验吗？这将同时删除相关的所有记录。')) {
        return;
    }
    
    // 删除实验
    this.experiments = this.experiments.filter(exp => exp.id !== experimentId);
    
    // 删除相关记录
    this.records = this.records.filter(record => record.experimentId !== experimentId);
    
    this.saveData();
    
    if (this.currentTab === 'experiments') {
        this.renderExperiments();
    }
    this.updateDashboard();
    
    alert('实验及相关记录已删除！');
};

ExperimentApp.prototype.changeExperimentStatus = function(experimentId) {
    const experimentIndex = this.experiments.findIndex(exp => exp.id === experimentId);
    if (experimentIndex === -1) return;
    
    const currentStatus = this.experiments[experimentIndex].status;
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    
    this.experiments[experimentIndex].status = newStatus;
    this.saveData();
    
    if (this.currentTab === 'experiments') {
        this.renderExperiments();
    }
    this.updateDashboard();
    
    alert(`实验状态已更新为：${this.getStatusText(newStatus)}`);
};

// 记录管理方法
ExperimentApp.prototype.addRecord = function() {
    const form = document.getElementById('add-record-form');
    const formData = new FormData(form);
    
    const record = {
        id: this.generateId(),
        experimentId: formData.get('experimentId'),
        date: formData.get('date'),
        content: formData.get('content'),
        parameters: formData.get('parameters') || '',
        results: formData.get('results') || '',
        createdAt: new Date().toISOString()
    };

    this.records.push(record);
    this.saveData();
    
    closeModal('add-record-modal');
    form.reset();
    
    if (this.currentTab === 'records') {
        this.renderRecords();
    }
    this.updateDashboard();
    
    alert('记录添加成功！');
};

ExperimentApp.prototype.editRecord = function(recordId) {
    const record = this.records.find(rec => rec.id === recordId);
    if (!record) return;
    
    // 填充表单
    document.getElementById('record-experiment').value = record.experimentId;
    document.getElementById('record-date').value = record.date;
    document.getElementById('record-content').value = record.content;
    document.getElementById('record-parameters').value = record.parameters || '';
    document.getElementById('record-results').value = record.results || '';
    
    showAddRecordModal();
    
    // 修改表单提交行为
    const form = document.getElementById('add-record-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        this.updateRecord(recordId);
    };
};

ExperimentApp.prototype.updateRecord = function(recordId) {
    const form = document.getElementById('add-record-form');
    const formData = new FormData(form);
    
    const recordIndex = this.records.findIndex(rec => rec.id === recordId);
    if (recordIndex === -1) return;
    
    this.records[recordIndex] = {
        ...this.records[recordIndex],
        experimentId: formData.get('experimentId'),
        date: formData.get('date'),
        content: formData.get('content'),
        parameters: formData.get('parameters') || '',
        results: formData.get('results') || '',
        updatedAt: new Date().toISOString()
    };
    
    this.saveData();
    
    // 恢复表单原始提交行为
    form.onsubmit = (e) => {
        e.preventDefault();
        this.addRecord();
    };
    
    closeModal('add-record-modal');
    form.reset();
    
    if (this.currentTab === 'records') {
        this.renderRecords();
    }
    this.updateDashboard();
    
    alert('记录更新成功！');
};

ExperimentApp.prototype.deleteRecord = function(recordId) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    this.records = this.records.filter(record => record.id !== recordId);
    this.saveData();
    
    if (this.currentTab === 'records') {
        this.renderRecords();
    }
    this.updateDashboard();
    
    alert('记录已删除！');
};

// 文件管理方法
ExperimentApp.prototype.handleFileUpload = function(files) {
    Array.from(files).forEach(file => {
        const fileData = {
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString().split('T')[0],
            // 存储文件的完整路径信息
            fullPath: file.webkitRelativePath || file.name,
            // 存储当前系统路径（显示用）
            currentPath: this.getCurrentPath(),
            file: file,
            // 用于存储文件内容的Base64编码（用于预览）
            content: null,
            // 预览类型标记
            previewType: this.getPreviewType(file.type, file.name),
            // 文件读取状态
            isContentLoaded: false,
            // qPCR数据识别结果
            isQPCRData: false,
            qpcrColumns: null
        };
        
        // 立即读取文件内容用于预览和存储
        this.loadFileContent(file, fileData);
        
        this.files.push(fileData);
    });
    
    this.saveData();
    
    if (this.currentTab === 'files') {
        this.renderFiles();
    }
    
    alert(`成功上传 ${files.length} 个文件！`);
};

// 加载文件内容（解决直接打开HTML的问题）
ExperimentApp.prototype.loadFileContent = function(file, fileData) {
    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
        reader.onload = (e) => {
            fileData.content = e.target.result;
            fileData.isContentLoaded = true;
            // 立即更新localStorage中的数据
            this.updateFileInStorage(fileData);
            console.log(`图片 ${file.name} 加载完成，大小: ${e.target.result.length} 字符`);
        };
        reader.onerror = (e) => {
            console.error(`图片 ${file.name} 加载失败:`, e);
            fileData.isContentLoaded = false;
            this.updateFileInStorage(fileData);
        };
        reader.readAsDataURL(file);
    } else if (this.isTextFile(file.type, file.name)) {
        reader.onload = (e) => {
            fileData.content = e.target.result;
            fileData.isContentLoaded = true;
            
            // 检查是否为qPCR数据
            this.checkQPCRData(fileData, e.target.result);
            
            // 立即更新localStorage中的数据
            this.updateFileInStorage(fileData);
            console.log(`文本文件 ${file.name} 加载完成${fileData.isQPCRData ? '，检测到qPCR数据' : ''}`);
        };
        reader.onerror = (e) => {
            console.error(`文本文件 ${file.name} 加载失败:`, e);
            fileData.isContentLoaded = false;
            this.updateFileInStorage(fileData);
        };
        reader.readAsText(file);
    } else {
        // 即使不能预览，也读取为二进制数据便于下载
        reader.onload = (e) => {
            fileData.content = e.target.result;
            fileData.isContentLoaded = true;
            this.updateFileInStorage(fileData);
            console.log(`文件 ${file.name} 加载完成`);
        };
        reader.onerror = (e) => {
            console.error(`文件 ${file.name} 加载失败:`, e);
            fileData.isContentLoaded = false;
            this.updateFileInStorage(fileData);
        };
        reader.readAsDataURL(file);
    }
};

// 更新存储中的文件数据
ExperimentApp.prototype.updateFileInStorage = function(fileData) {
    const index = this.files.findIndex(f => f.id === fileData.id);
    if (index !== -1) {
        // 不保存原始File对象，只保存内容
        this.files[index] = {
            ...fileData,
            file: null // 清除File对象引用，避免序列化问题
        };
        this.saveData();
        
        // 如果当前在文件页面，刷新显示
        if (this.currentTab === 'files') {
            this.renderFiles();
        }
    }
};

// 文件预览相关方法
ExperimentApp.prototype.getCurrentPath = function() {
    // 获取当前系统路径信息
    const currentPath = window.location.pathname;
    const protocol = window.location.protocol;
    
    // 尝试获取更准确的文件路径
    try {
        // 在本地环境下显示相对路径
        if (protocol === 'file:') {
            return '浏览器本地存储 (localStorage) - 文件以Base64格式保存在浏览器数据库中';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `本地服务器: ${window.location.origin}`;
        } else {
            return window.location.origin + currentPath;
        }
    } catch (e) {
        return '浏览器本地存储 (localStorage)';
    }
};

ExperimentApp.prototype.getPreviewType = function(mimeType, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (mimeType.startsWith('image/')) {
        return 'image';
    } else if (mimeType.includes('csv') || extension === 'csv') {
        return 'csv';
    } else if (mimeType.includes('excel') || extension === 'xlsx' || extension === 'xls') {
        return 'excel';
    } else if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'js', 'css', 'html', 'xml'].includes(extension)) {
        return 'text';
    } else if (mimeType.includes('pdf')) {
        return 'pdf';
    }
    
    return 'unknown';
};

ExperimentApp.prototype.canPreview = function(mimeType, fileName) {
    const previewType = this.getPreviewType(mimeType, fileName);
    return ['image', 'csv', 'text'].includes(previewType);
};

ExperimentApp.prototype.isTextFile = function(mimeType, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    return mimeType.startsWith('text/') || 
           mimeType.includes('csv') ||
           ['txt', 'md', 'json', 'js', 'css', 'html', 'xml', 'csv'].includes(extension);
};

ExperimentApp.prototype.updateFileInList = function(fileData) {
    const index = this.files.findIndex(f => f.id === fileData.id);
    if (index !== -1) {
        this.files[index] = fileData;
        this.saveData();
        if (this.currentTab === 'files') {
            this.renderFiles();
        }
    }
};

ExperimentApp.prototype.previewFile = function(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;
    
    // 检查内容是否已加载
    if (!file.isContentLoaded || !file.content) {
        alert('文件内容正在加载中，请稍后再试...');
        return;
    }
    
    // 创建预览模态框
    this.showFilePreview(file);
};

ExperimentApp.prototype.showFilePreview = function(file) {
    // 检查文件内容是否真的存在
    if (!file.content) {
        alert('文件内容不可用，请重新上传文件');
        return;
    }
    
    // 如果预览模态框不存在，创建它
    let modal = document.getElementById('file-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'file-preview-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    let previewContent = '';
    
    switch (file.previewType) {
        case 'image':
            // 确保图片内容是有效的Base64格式
            if (file.content && file.content.startsWith('data:image/')) {
                previewContent = `
                    <div style="text-align: center; max-height: 70vh; overflow: auto;">
                        <img src="${file.content}" alt="${file.name}" 
                             style="max-width: 100%; max-height: 60vh; object-fit: contain; border: 1px solid #ddd; border-radius: 5px;"
                             onload="console.log('图片加载成功: ${file.name}')"
                             onerror="console.error('图片加载失败: ${file.name}'); this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; color: red; padding: 20px;">
                            <p>❌ 图片加载失败</p>
                            <p>文件可能已损坏或格式不支持</p>
                        </div>
                    </div>
                `;
            } else {
                previewContent = '<p style="color: red;">❌ 图片数据格式错误，无法预览</p>';
            }
            break;
            
        case 'csv':
            previewContent = this.renderCSVPreview(file.content);
            break;
            
        case 'text':
            previewContent = `<pre style="white-space: pre-wrap; max-height: 70vh; overflow-y: auto; background: #f8f9fa; padding: 1rem; border-radius: 5px; font-family: 'Courier New', monospace; text-align: left;">${this.escapeHtml(file.content)}</pre>`;
            break;
            
        default:
            previewContent = '<p>此文件类型暂不支持预览</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 95vh;">
            <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
            <h3>📁 文件预览: ${file.name}</h3>
            <div class="file-info" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
                <p><strong>📄 文件名:</strong> ${file.name}</p>
                <p><strong>📏 文件大小:</strong> ${this.formatFileSize(file.size)}</p>
                <p><strong>🏷️ 文件类型:</strong> ${file.type || '未知'}</p>
                <p><strong>📅 上传日期:</strong> ${file.uploadDate}</p>
                <p><strong>💾 存储位置:</strong> ${file.currentPath || '浏览器本地存储 (localStorage)'}</p>
                ${file.fullPath !== file.name ? `<p><strong>📂 原始路径:</strong> ${file.fullPath}</p>` : ''}
                <p><strong>📊 数据状态:</strong> 
                    <span style="color: #28a745;">✅ 已完整保存到浏览器本地数据库</span>
                </p>
                <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                    💡 说明: 文件内容以Base64格式存储在浏览器的localStorage中，不占用磁盘空间
                </p>
            </div>
            <div class="preview-content">
                ${previewContent}
            </div>
            <div class="modal-actions" style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-primary" onclick="app.downloadFile('${file.id}')">📥 下载文件</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">❌ 关闭</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
};

ExperimentApp.prototype.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

ExperimentApp.prototype.renderCSVPreview = function(csvContent) {
    if (!csvContent) return '<p>CSV文件内容为空</p>';
    
    try {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) return '<p>CSV文件内容为空</p>';
        
        // 只显示前20行，避免页面过长
        const displayLines = lines.slice(0, 20);
        const hasMore = lines.length > 20;
        
        let tableHtml = '<div style="overflow-x: auto; max-height: 60vh;"><table style="border-collapse: collapse; width: 100%; font-size: 0.9rem;">';
        
        displayLines.forEach((line, index) => {
            const cells = this.parseCSVLine(line);
            const tag = index === 0 ? 'th' : 'td';
            const style = index === 0 ? 
                'style="background: #667eea; color: white; padding: 0.5rem; border: 1px solid #ddd; text-align: left;"' :
                'style="padding: 0.5rem; border: 1px solid #ddd;"';
            
            tableHtml += '<tr>';
            cells.forEach(cell => {
                tableHtml += `<${tag} ${style}>${this.escapeHtml(cell)}</${tag}>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += '</table></div>';
        
        if (hasMore) {
            tableHtml += `<p style="margin-top: 1rem; color: #666; font-style: italic;">显示前20行，共${lines.length}行数据</p>`;
        }
        
        return tableHtml;
    } catch (error) {
        return '<p>CSV文件格式解析失败</p>';
    }
};

ExperimentApp.prototype.parseCSVLine = function(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
};

ExperimentApp.prototype.downloadFile = function(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;
    
    // 如果有保存的内容，使用保存的内容创建下载
    if (file.content) {
        let blob;
        
        if (file.content.startsWith('data:')) {
            // Base64格式的数据
            const byteString = atob(file.content.split(',')[1]);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const int8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < byteString.length; i++) {
                int8Array[i] = byteString.charCodeAt(i);
            }
            
            blob = new Blob([arrayBuffer], { type: file.type });
        } else {
            // 文本内容
            blob = new Blob([file.content], { type: file.type });
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return;
    }
    
    // 如果没有保存的内容但有原始File对象，使用原始对象
    if (file.file) {
        const url = URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
    }
    
    alert('文件数据不可用，无法下载');
};

ExperimentApp.prototype.deleteFile = function(fileId) {
    if (!confirm('确定要删除这个文件吗？')) {
        return;
    }
    
    this.files = this.files.filter(file => file.id !== fileId);
    this.saveData();
    
    if (this.currentTab === 'files') {
        this.renderFiles();
    }
    
    alert('文件已删除！');
};

// 数据导出和导入方法（优化文件处理）
ExperimentApp.prototype.exportData = function() {
    const data = {
        experiments: this.experiments,
        records: this.records,
        files: this.files.map(file => ({
            ...file,
            file: null, // 不导出File对象
            // 如果文件较小（小于1MB），保留内容用于备份
            content: file.content && file.size < 1024 * 1024 ? file.content : null
        })),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('数据导出成功！注意：大于1MB的文件内容不会包含在备份中。');
};

ExperimentApp.prototype.importData = function(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                this.experiments = data.experiments || [];
                this.records = data.records || [];
                this.files = data.files || [];
                
                this.saveData();
                this.updateDashboard();
                
                // 刷新当前页面
                this.switchTab(this.currentTab);
                
                alert('数据导入成功！');
            }
        } catch (error) {
            alert('导入失败：文件格式不正确！');
        }
    };
    reader.readAsText(file);
};

// 搜索功能
ExperimentApp.prototype.searchAll = function(query) {
    const results = {
        experiments: [],
        records: []
    };
    
    const lowerQuery = query.toLowerCase();
    
    // 搜索实验
    results.experiments = this.experiments.filter(exp => 
        exp.title.toLowerCase().includes(lowerQuery) ||
        (exp.description && exp.description.toLowerCase().includes(lowerQuery)) ||
        (exp.category && exp.category.toLowerCase().includes(lowerQuery))
    );
    
    // 搜索记录
    results.records = this.records.filter(record => 
        record.content.toLowerCase().includes(lowerQuery) ||
        record.parameters.toLowerCase().includes(lowerQuery) ||
        record.results.toLowerCase().includes(lowerQuery)
    );
    
    return results;
};

// 统计方法
ExperimentApp.prototype.getStatistics = function() {
    const stats = {
        totalExperiments: this.experiments.length,
        activeExperiments: this.experiments.filter(exp => exp.status === 'active').length,
        completedExperiments: this.experiments.filter(exp => exp.status === 'completed').length,
        totalRecords: this.records.length,
        avgRecordsPerExperiment: this.experiments.length > 0 ? 
            (this.records.length / this.experiments.length).toFixed(2) : 0,
        monthlyStats: this.getMonthlyStatistics(),
        categoryStats: this.getCategoryStatistics()
    };
    
    return stats;
};

ExperimentApp.prototype.getMonthlyStatistics = function() {
    const monthlyData = {};
    
    this.records.forEach(record => {
        const month = record.date.substring(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    
    return monthlyData;
};

ExperimentApp.prototype.getCategoryStatistics = function() {
    const categoryData = {};
    
    this.experiments.forEach(exp => {
        const category = exp.category || '未分类';
        categoryData[category] = (categoryData[category] || 0) + 1;
    });
    
    return categoryData;
};

// qPCR数据检测方法
ExperimentApp.prototype.checkQPCRData = function(fileData, content) {
    try {
        // 定义qPCR数据的列模式（基于Python文件的逻辑，更加宽松）
        const columnPatterns = {
            'Target': /target|gene|基因|目标/i,
            'Content': /content|type|类型|内容/i,
            'Sample': /sample|样本|样品/i,
            'Biological Set Name': /biological.*set.*name|set.*name|group|分组|组别|生物学分组/i,
            'Cq': /cq|ct|cycle|threshold|循环|阈值/i
        };
        
        // 尝试解析CSV数据
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) return; // 至少需要表头和一行数据
        
        console.log('检查qPCR数据 - 总行数:', lines.length);
        console.log('检查qPCR数据 - 第一行:', lines[0]);
        
        // 尝试不同分隔符
        const separators = ['\t', ',', ';', '|', ' '];
        let columns = null;
        let bestSeparator = null;
        let maxColumns = 0;
        
        for (const sep of separators) {
            const testColumns = lines[0].split(sep);
            console.log(`测试分隔符 "${sep}" - 列数: ${testColumns.length}`);
            if (testColumns.length > maxColumns) {
                columns = testColumns;
                bestSeparator = sep;
                maxColumns = testColumns.length;
            }
        }
        
        if (!columns || columns.length < 3) {
            console.log('列数不足，不是qPCR数据');
            return;
        }
        
        console.log('使用分隔符:', bestSeparator);
        console.log('检测到的列:', columns);
        
        // 检查列名是否匹配qPCR模式
        const columnMapping = {};
        let matchCount = 0;
        
        for (const [expected, pattern] of Object.entries(columnPatterns)) {
            for (let i = 0; i < columns.length; i++) {
                const actual = columns[i].trim();
                if (pattern.test(actual)) {
                    columnMapping[expected] = actual;
                    matchCount++;
                    console.log(`匹配列: ${expected} -> ${actual}`);
                    break;
                }
            }
        }
        
        // 位置后备映射（如果列名不标准，使用位置推断）
        if (matchCount < 2) {
            console.log('列名匹配不足，尝试位置推断');
            if (!columnMapping['Target'] && columns.length >= 1) {
                columnMapping['Target'] = columns[0].trim();
                matchCount++;
                console.log('位置推断: Target -> ' + columns[0].trim());
            }
            if (!columnMapping['Cq'] && columns.length >= 5) {
                columnMapping['Cq'] = columns[4].trim();
                matchCount++;
                console.log('位置推断: Cq -> ' + columns[4].trim());
            } else if (!columnMapping['Cq'] && columns.length >= 3) {
                // 如果只有3列，尝试最后一列作为Cq
                columnMapping['Cq'] = columns[columns.length - 1].trim();
                matchCount++;
                console.log('位置推断: Cq -> ' + columns[columns.length - 1].trim());
            }
            if (!columnMapping['Biological Set Name'] && columns.length >= 4) {
                columnMapping['Biological Set Name'] = columns[3].trim();
                matchCount++;
                console.log('位置推断: Biological Set Name -> ' + columns[3].trim());
            } else if (!columnMapping['Biological Set Name'] && !columnMapping['Sample'] && columns.length >= 2) {
                columnMapping['Sample'] = columns[1].trim();
                matchCount++;
                console.log('位置推断: Sample -> ' + columns[1].trim());
            }
            if (!columnMapping['Sample'] && columns.length >= 3) {
                columnMapping['Sample'] = columns[2].trim();
                matchCount++;
                console.log('位置推断: Sample -> ' + columns[2].trim());
            }
            if (!columnMapping['Content'] && columns.length >= 2) {
                columnMapping['Content'] = columns[1].trim();
                console.log('位置推断: Content -> ' + columns[1].trim());
            }
        }
        
        console.log('最终列映射:', columnMapping);
        console.log('匹配数量:', matchCount);
        
        // 如果至少匹配2个必要列（Target和Cq），认为是qPCR数据
        if (matchCount >= 2 && columnMapping['Target'] && columnMapping['Cq']) {
            fileData.isQPCRData = true;
            fileData.qpcrColumns = columnMapping;
            fileData.qpcrSeparator = bestSeparator;
            fileData.qpcrData = this.parseQPCRData(content, columnMapping, bestSeparator);
            
            console.log(`检测到qPCR数据文件: ${fileData.name}`, columnMapping);
            console.log(`解析得到 ${fileData.qpcrData.length} 行数据`);
        } else {
            console.log('不是qPCR数据文件');
        }
        
    } catch (error) {
        console.log(`检查qPCR数据时出错 ${fileData.name}:`, error);
    }
};

// 解析qPCR数据
ExperimentApp.prototype.parseQPCRData = function(content, columnMapping, separator) {
    try {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(separator);
        const data = [];
        
        console.log('解析qPCR数据 - 列映射:', columnMapping);
        console.log('解析qPCR数据 - 分隔符:', separator);
        console.log('解析qPCR数据 - 表头:', headers);
        
        // 获取列索引
        const columnIndexes = {};
        for (const [key, colName] of Object.entries(columnMapping)) {
            const index = headers.findIndex(h => h.trim() === colName);
            columnIndexes[key] = index;
            console.log(`列"${key}"(${colName}) 在位置: ${index}`);
        }
        
        // 解析数据行
        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(separator);
            const row = {};
            
            for (const [key, index] of Object.entries(columnIndexes)) {
                if (index !== -1 && cells[index] !== undefined) {
                    // 去除前后空白和引号
                    let value = cells[index].trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    row[key] = value;
                }
            }
            
            // 验证关键数据 - 放宽验证条件
            if (row['Target'] && row['Target'].trim() !== '' && 
                row['Cq'] && row['Cq'].trim() !== '' && 
                !isNaN(parseFloat(row['Cq']))) {
                
                // 确保分组信息存在
                if (!row['Biological Set Name'] || row['Biological Set Name'].trim() === '') {
                    if (row['Sample'] && row['Sample'].trim() !== '') {
                        row['Biological Set Name'] = row['Sample'];
                    } else {
                        row['Biological Set Name'] = 'Default';
                    }
                }
                
                console.log(`解析行 ${i}:`, row);
                data.push(row);
            } else {
                console.log(`跳过行 ${i} - 数据不完整:`, row);
            }
        }
        
        console.log(`成功解析 ${data.length} 行数据`);
        return data;
    } catch (error) {
        console.error('解析qPCR数据出错:', error);
        return [];
    }
};