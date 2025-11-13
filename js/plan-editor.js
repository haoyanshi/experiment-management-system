// 新的计划编辑器相关函数

// 当前正在编辑的计划
let currentEditingPlan = null;
let moduleTypeSelector = null;
let pendingModuleParentId = null;
let isReadOnlyMode = false;
let selectedTemplate = null;

// 初始化模块类型选择器
function initModuleTypeSelector() {
    const selector = document.getElementById('module-type-selector');
    const categories = {
        '基本模块': ['section', 'objective', 'hypothesis', 'method', 'experiment'],
        '进度管理': ['timeline', 'milestone', 'progress'],
        '资源管理': ['material', 'equipment'],
        '结果分析': ['expected_result', 'data_analysis'],
        '其他': ['note', 'reference', 'custom']
    };
    
    let html = '';
    for (const [category, types] of Object.entries(categories)) {
        html += `<div class="module-type-category">${category}</div>`;
        types.forEach(typeId => {
            const type = Object.values(MODULE_TYPES).find(t => t.id === typeId);
            if (type) {
                html += `
                    <div class="module-type-option" onclick="selectModuleType('${type.id}')">
                        <span class="module-type-icon">${type.icon}</span>
                        <span class="module-type-name">${type.name}</span>
                        ${type.supportImages ? '<span class="module-feature-tag">📷</span>' : ''}
                        ${type.supportProgress ? '<span class="module-feature-tag">📊</span>' : ''}
                    </div>
                `;
            }
        });
    }
    selector.innerHTML = html;
}

// 显示新建计划模态框 - 移到全局作用域
window.showAddPlanModal = function() {
    console.log('showAddPlanModal called');
    // 显示模板选择器
    showTemplateSelector();
}

// 显示模板选择器 - 也移到全局作用域
window.showTemplateSelector = function() {
    console.log('showTemplateSelector called');
    console.log('MODULE_TEMPLATES:', window.MODULE_TEMPLATES);
    
    if (!window.MODULE_TEMPLATES) {
        console.error('MODULE_TEMPLATES not defined');
        alert('模板系统未正确加载，请刷新页面重试');
        return;
    }
    
    const modalContent = `
        <div class="template-selector-modal">
            <h3>选择实验计划模板</h3>
            <div class="template-grid">
                ${Object.values(MODULE_TEMPLATES).map(template => `
                    <div class="template-card" onclick="selectTemplate('${template.id}')">
                        <div class="template-icon">${template.icon}</div>
                        <h4>${template.name}</h4>
                        <p>${template.description}</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary" onclick="closeTemplateSelector()">取消</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'template-selector-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = modalContent;
    document.body.appendChild(overlay);
}

// 选择模板 - 移到全局作用域
window.selectTemplate = function(templateId) {
    console.log('selectTemplate called with:', templateId);
    selectedTemplate = MODULE_TEMPLATES[templateId];
    closeTemplateSelector();
    
    // 创建新计划实例
    currentEditingPlan = new ExperimentPlan();
    isReadOnlyMode = false;
    if (app) app.currentPlan = currentEditingPlan;
    
    // 根据模板初始化模块
    if (selectedTemplate && selectedTemplate.modules && selectedTemplate.modules.length > 0) {
        selectedTemplate.modules.forEach(moduleConfig => {
            const moduleType = MODULE_TYPES[moduleConfig.type.toUpperCase()];
            if (moduleType) {
                const module = currentEditingPlan.addModule(null, moduleType);
                if (moduleConfig.title) {
                    currentEditingPlan.updateModule(module.id, { title: moduleConfig.title });
                }
            }
        });
    }
    
    // 配置界面
    const modalTitle = document.getElementById('plan-modal-title');
    if (modalTitle) modalTitle.textContent = '新建实验计划';
    
    const planTitle = document.getElementById('plan-title');
    if (planTitle) {
        planTitle.value = currentEditingPlan.title;
        planTitle.readOnly = false;
    }
    
    const planStatus = document.getElementById('plan-status');
    if (planStatus) {
        planStatus.value = currentEditingPlan.status;
        planStatus.disabled = false;
    }
    
    const addModuleBtn = document.querySelector('.add-module-btn');
    if (addModuleBtn) addModuleBtn.style.display = 'flex';
    
    const formActions = document.querySelector('.form-actions');
    if (formActions) formActions.style.display = 'block';
    
    // 修改：新建计划时也显示删除按钮
    const deleteBtn = document.getElementById('delete-plan-btn');
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
    
    renderPlanModules();
    
    const planModal = document.getElementById('add-plan-modal');
    if (planModal) {
        planModal.style.display = 'block';
        console.log('Plan modal displayed');
    } else {
        console.error('add-plan-modal not found');
    }
}

// 关闭模板选择器 - 也需要在全局作用域
window.closeTemplateSelector = function() {
    const overlay = document.getElementById('template-selector-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 打开计划编辑器
function openPlanEditor(plan, isReadOnly = false) {
    // 修改：去掉只读模式，强制设为false
    isReadOnlyMode = false;
    if (app) {
        app.openPlanEditor(plan, false);
    }
}

// 渲染计划模块
function renderPlanModules() {
    const container = document.getElementById('plan-modules');
    
    if (!currentEditingPlan || currentEditingPlan.modules.length === 0) {
        container.innerHTML = `
            <div class="empty-plan">
                <h3>开始构建您的实验计划</h3>
                <p>点击下方"添加模块"按钮，选择合适的模块类型来构建您的计划</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = renderModuleTree(currentEditingPlan.modules);
}

// 递归渲染模块树
function renderModuleTree(modules, level = 0) {
    return renderModuleTreeWithDrag(modules, level);
}

// 显示模块类型选择器
function showModuleTypeSelector(parentId, event) {
    event.stopPropagation();
    
    pendingModuleParentId = parentId;
    const selector = document.getElementById('module-type-selector');
    
    // 定位选择器
    const rect = event.target.getBoundingClientRect();
    selector.style.left = rect.left + 'px';
    selector.style.top = (rect.bottom + 5) + 'px';
    
    // 显示选择器
    selector.classList.add('show');
    
    // 点击其他地方关闭
    setTimeout(() => {
        document.addEventListener('click', hideModuleTypeSelector, { once: true });
    }, 100);
}

// 隐藏模块类型选择器
function hideModuleTypeSelector() {
    const selector = document.getElementById('module-type-selector');
    selector.classList.remove('show');
}

// 选择模块类型
function selectModuleType(typeId) {
    if (!currentEditingPlan) return;
    
    const moduleType = Object.values(MODULE_TYPES).find(t => t.id === typeId);
    if (moduleType) {
        currentEditingPlan.addModule(pendingModuleParentId, moduleType);
        renderPlanModules();
    }
    
    hideModuleTypeSelector();
}

// 切换模块展开/折叠
function toggleModule(moduleId) {
    if (!currentEditingPlan) return;
    
    const module = currentEditingPlan.findModule(moduleId);
    if (module && MODULE_TYPES[module.type.toUpperCase()]?.canHaveChildren) {
        module.expanded = !module.expanded;
        renderPlanModules();
    }
}

// 更新模块标题
function updateModuleTitle(moduleId, title) {
    if (!currentEditingPlan) return;
    currentEditingPlan.updateModule(moduleId, { title });
}

// 更新模块内容
function updateModuleContent(moduleId, content) {
    if (!currentEditingPlan) return;
    currentEditingPlan.updateModule(moduleId, { content });
}

// 删除模块
function deleteModule(moduleId) {
    if (!currentEditingPlan) return;
    
    if (confirm('确定要删除这个模块吗？')) {
        currentEditingPlan.deleteModule(moduleId);
        renderPlanModules();
    }
}

// 上移模块
function moveModuleUp(moduleId) {
    if (!currentEditingPlan || isReadOnlyMode) return;
    
    // 查找模块及其父级
    let parentModules = null;
    let moduleIndex = -1;
    let parentId = null;
    
    const findModuleAndParent = (modules, currentParentId = null) => {
        for (let i = 0; i < modules.length; i++) {
            if (modules[i].id === moduleId) {
                parentModules = modules;
                moduleIndex = i;
                parentId = currentParentId;
                return true;
            }
            if (modules[i].children && modules[i].children.length > 0) {
                if (findModuleAndParent(modules[i].children, modules[i].id)) {
                    return true;
                }
            }
        }
        return false;
    };
    
    if (findModuleAndParent(currentEditingPlan.modules) && moduleIndex > 0) {
        // 交换位置
        const temp = parentModules[moduleIndex];
        parentModules[moduleIndex] = parentModules[moduleIndex - 1];
        parentModules[moduleIndex - 1] = temp;
        
        currentEditingPlan.updatedAt = new Date().toISOString();
        renderPlanModules();
    }
}

// 下移模块
function moveModuleDown(moduleId) {
    if (!currentEditingPlan || isReadOnlyMode) return;
    
    // 查找模块及其父级
    let parentModules = null;
    let moduleIndex = -1;
    let parentId = null;
    
    const findModuleAndParent = (modules, currentParentId = null) => {
        for (let i = 0; i < modules.length; i++) {
            if (modules[i].id === moduleId) {
                parentModules = modules;
                moduleIndex = i;
                parentId = currentParentId;
                return true;
            }
            if (modules[i].children && modules[i].children.length > 0) {
                if (findModuleAndParent(modules[i].children, modules[i].id)) {
                    return true;
                }
            }
        }
        return false;
    };
    
    if (findModuleAndParent(currentEditingPlan.modules) && moduleIndex < parentModules.length - 1) {
        // 交换位置
        const temp = parentModules[moduleIndex];
        parentModules[moduleIndex] = parentModules[moduleIndex + 1];
        parentModules[moduleIndex + 1] = temp;
        
        currentEditingPlan.updatedAt = new Date().toISOString();
        renderPlanModules();
    }
}

// 检查localStorage可用空间
function checkStorageSpace() {
    try {
        const used = new Blob(Object.values(localStorage)).size;
        const usedMB = (used / (1024 * 1024)).toFixed(2);
        
        // 估算剩余空间（假设总共5MB）
        const totalMB = 5;
        const remainingMB = totalMB - parseFloat(usedMB);
        
        if (remainingMB < 0.5) {
            showToast(`存储空间不足！已用${usedMB}MB，建议清理数据`, 'error');
            return false;
        } else if (remainingMB < 1) {
            showToast(`存储空间即将用完，剩余约${remainingMB.toFixed(2)}MB`, 'warning');
        }
        
        return true;
    } catch (e) {
        console.error('检查存储空间失败:', e);
        return true; // 出错时允许继续
    }
}

// 保存计划 - 移到全局作用域
window.savePlan = function() {
    console.log('savePlan called');
    
    if (!currentEditingPlan) {
        console.error('No plan to save');
        alert('没有要保存的计划');
        return;
    }
    
    // 检查存储空间
    if (!checkStorageSpace()) {
        if (!confirm('存储空间不足，是否继续保存？可能会失败。')) {
            return;
        }
    }
    
    // 更新计划基本信息
    const planTitleInput = document.getElementById('plan-title');
    const planStatusSelect = document.getElementById('plan-status');
    
    if (!planTitleInput || !planTitleInput.value.trim()) {
        alert('请输入计划标题');
        return;
    }
    
    currentEditingPlan.title = planTitleInput.value.trim();
    if (planStatusSelect) currentEditingPlan.status = planStatusSelect.value;
    currentEditingPlan.updatedAt = new Date().toISOString();
    
    console.log('Plan to save:', currentEditingPlan);
    
    try {
        // 从localStorage读取现有数据
        const savedData = localStorage.getItem('experimentData');
        let data = savedData ? JSON.parse(savedData) : {
            experiments: [],
            records: [],
            files: [],
            plans: []
        };
        
        // 重要：需要将 ExperimentPlan 对象转换为普通对象
        const planData = currentEditingPlan.toJSON ? currentEditingPlan.toJSON() : currentEditingPlan;
        console.log('Plan data (JSON):', planData);
        
        // 估算数据大小
        const planDataSize = JSON.stringify(planData).length;
        const planDataSizeMB = (planDataSize / (1024 * 1024)).toFixed(2);
        console.log(`计划数据大小: ${planDataSizeMB}MB`);
        
        // 确保计划有ID
        if (!planData.id) {
            planData.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            currentEditingPlan.id = planData.id;
            currentEditingPlan.createdAt = new Date().toISOString();
            planData.createdAt = currentEditingPlan.createdAt;
        }
        
        // 检查是新建还是更新
        const existingIndex = data.plans.findIndex(p => p.id === planData.id);
        if (existingIndex >= 0) {
            data.plans[existingIndex] = planData;
            showToast('计划已更新', 'success');
        } else {
            data.plans.push(planData);
            showToast('计划已创建', 'success');
        }
        
        // 保存回localStorage
        localStorage.setItem('experimentData', JSON.stringify(data));
        console.log('Saved to localStorage');
        
        // 如果app实例存在，同步数据并刷新界面
        if (window.app) {
            console.log('Syncing with app instance');
            window.app.loadData(); // 重新加载数据
            
            // 如果在计划页面，刷新列表
            if (window.app.currentTab === 'plans') {
                window.app.renderPlans();
            }
            
            // 更新仪表板
            window.app.updateDashboard();
        }
        
        // 关闭模态框
        if (window.closeModal) {
            closeModal('add-plan-modal');
        } else {
            document.getElementById('add-plan-modal').style.display = 'none';
        }
        
        console.log('Plan saved successfully');
        
    } catch (error) {
        console.error('Error saving plan:', error);
        if (error.name === 'QuotaExceededError' || error.message.includes('exceeded the quota')) {
            alert('存储空间已满！\n\n建议：\n1. 删除不需要的计划或图片\n2. 导出数据备份后清理\n3. 减少图片数量或大小');
        } else {
            alert('保存计划时出错：' + error.message);
        }
    }
}

// 取消编辑 - 移到全局作用域
window.cancelPlanEdit = function() {
    if (confirm('确定要取消编辑吗？未保存的更改将丢失。')) {
        currentEditingPlan = null;
        if (window.closeModal) {
            closeModal('add-plan-modal');
        } else {
            document.getElementById('add-plan-modal').style.display = 'none';
        }
    }
}

// 导出为Markdown
function exportPlanAsMarkdown() {
    if (!currentEditingPlan) return;
    
    const markdown = currentEditingPlan.toMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEditingPlan.title}.md`;
    a.click();
    
    URL.revokeObjectURL(url);
    if (app) app.showToast('计划已导出为Markdown文件', 'success');
}

// 删除计划（从编辑器中）
function deletePlanFromEditor() {
    // 修改：去掉对currentEditingPlan.id的检查，允许删除新建的计划
    if (!currentEditingPlan) return;
    
    if (confirm('确定要删除这个计划吗？此操作不可恢复。')) {
        // 如果是已保存的计划，从存储中删除
        if (currentEditingPlan.id) {
            try {
                const savedData = localStorage.getItem('experimentData');
                if (savedData) {
                    let data = JSON.parse(savedData);
                    data.plans = data.plans.filter(p => p.id !== currentEditingPlan.id);
                    localStorage.setItem('experimentData', JSON.stringify(data));
                }
                
                // 如果app实例存在，同步删除
                if (window.app) {
                    window.app.plans = window.app.plans.filter(p => p.id !== currentEditingPlan.id);
                    
                    // 如果在计划页面，刷新列表
                    if (window.app.currentTab === 'plans') {
                        window.app.renderPlans();
                    }
                    
                    // 更新仪表板
                    window.app.updateDashboard();
                }
            } catch (error) {
                console.error('Error deleting plan:', error);
                showToast('删除计划时出错', 'error');
                return;
            }
        }
        
        // 显示成功消息
        showToast('计划已删除', 'success');
        currentEditingPlan = null;
        
        // 关闭模态框
        if (window.closeModal) {
            closeModal('add-plan-modal');
        } else {
            document.getElementById('add-plan-modal').style.display = 'none';
        }
    }
}

// 渲染进度条部分
function renderProgressSection(module) {
    if (!module.progress && module.progress !== 0) return '';
    
    return `
        <div class="module-progress-section">
            <div class="progress-header">
                <span>进度: ${module.progress}%</span>
                ${!isReadOnlyMode ? `
                    <input type="range" class="progress-slider" 
                           min="0" max="100" value="${module.progress}"
                           onchange="updateModuleProgress('${module.id}', this.value)">
                ` : ''}
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${module.progress}%"></div>
            </div>
        </div>
    `;
}

// 渲染图片部分
function renderImageSection(module) {
    return `
        <div class="module-images-section">
            <div class="images-grid">
                ${module.images ? module.images.map((img, index) => `
                    <div class="image-item">
                        <img src="${img.url}" alt="${img.caption || ''}"
                             onclick="viewFullImage('${img.url}', '${img.caption || ''}')">
                        ${!isReadOnlyMode ? `
                            <button class="image-delete-btn" 
                                    onclick="deleteModuleImage('${module.id}', ${index})">×</button>
                        ` : ''}
                        ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
                    </div>
                `).join('') : ''}
            </div>
            ${!isReadOnlyMode ? `
                <button class="add-image-btn" onclick="selectImageForModule('${module.id}')">
                    <span>📷</span> 添加图片
                </button>
            ` : ''}
        </div>
    `;
}

// 渲染日期部分
function renderDateSection(module) {
    return `
        <div class="module-date-section">
            ${module.startDate ? `
                <div class="date-item">
                    <label>开始日期:</label>
                    <input type="date" value="${module.startDate}"
                           ${isReadOnlyMode ? 'readonly' : ''}
                           onchange="updateModuleDates('${module.id}', 'startDate', this.value)">
                </div>
            ` : ''}
            ${module.endDate ? `
                <div class="date-item">
                    <label>结束日期:</label>
                    <input type="date" value="${module.endDate}"
                           ${isReadOnlyMode ? 'readonly' : ''}
                           onchange="updateModuleDates('${module.id}', 'endDate', this.value)">
                </div>
            ` : ''}
        </div>
    `;
}

// 更新模块进度
function updateModuleProgress(moduleId, progress) {
    if (!currentEditingPlan) return;
    currentEditingPlan.updateModule(moduleId, { progress: parseInt(progress) });
    renderPlanModules();
}

// 压缩图片
async function compressImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算新的尺寸
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制并压缩图片
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为blob再转base64
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = reject;
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// 为模块选择图片
function selectImageForModule(moduleId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        
        showToast('正在处理图片...', 'info');
        
        for (const file of files) {
            try {
                // 检查文件大小
                const fileSizeMB = file.size / (1024 * 1024);
                
                // 根据文件大小决定压缩参数
                let maxWidth = 1024;
                let quality = 0.8;
                
                if (fileSizeMB > 2) {
                    maxWidth = 800;
                    quality = 0.6;
                } else if (fileSizeMB > 1) {
                    maxWidth = 1024;
                    quality = 0.7;
                }
                
                // 压缩图片
                const compressedImage = await compressImage(file, maxWidth, quality);
                
                const module = currentEditingPlan.findModule(moduleId);
                if (!module.images) module.images = [];
                
                const caption = prompt('请输入图片说明（可选）');
                module.images.push({
                    url: compressedImage,
                    caption: caption || '',
                    uploadDate: new Date().toISOString(),
                    originalSize: file.size,
                    compressedSize: compressedImage.length
                });
                
                currentEditingPlan.updatedAt = new Date().toISOString();
                renderPlanModules();
                
                // 显示压缩信息
                const compressionRatio = ((1 - compressedImage.length / file.size) * 100).toFixed(1);
                console.log(`图片压缩: ${fileSizeMB.toFixed(2)}MB -> ${(compressedImage.length / (1024 * 1024)).toFixed(2)}MB (节省${compressionRatio}%)`);
                
            } catch (error) {
                console.error('图片处理失败:', error);
                showToast('图片处理失败，请重试', 'error');
            }
        }
        
        showToast('图片添加成功', 'success');
    };
    
    input.click();
}

// 删除模块图片
function deleteModuleImage(moduleId, imageIndex) {
    if (!currentEditingPlan) return;
    
    if (confirm('确定要删除这张图片吗？')) {
        const module = currentEditingPlan.findModule(moduleId);
        if (module && module.images) {
            module.images.splice(imageIndex, 1);
            currentEditingPlan.updatedAt = new Date().toISOString();
            renderPlanModules();
        }
    }
}

// 查看大图
function viewFullImage(url, caption) {
    const overlay = document.createElement('div');
    overlay.className = 'image-viewer-overlay';
    overlay.innerHTML = `
        <div class="image-viewer">
            <button class="close-viewer" onclick="this.parentElement.parentElement.remove()">×</button>
            <img src="${url}" alt="${caption}">
            ${caption ? `<p class="viewer-caption">${caption}</p>` : ''}
        </div>
    `;
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    document.body.appendChild(overlay);
}

// 更新模块日期
function updateModuleDates(moduleId, dateType, value) {
    if (!currentEditingPlan) return;
    currentEditingPlan.updateModule(moduleId, { [dateType]: value });
}

// 显示时间线视图
function showTimelineView() {
    if (!currentEditingPlan) return;
    
    const timelineModules = [];
    const collectTimelineData = (modules) => {
        modules.forEach(module => {
            if (module.startDate || module.endDate) {
                timelineModules.push(module);
            }
            if (module.children) {
                collectTimelineData(module.children);
            }
        });
    };
    collectTimelineData(currentEditingPlan.modules);
    
    if (timelineModules.length === 0) {
        alert('没有找到包含时间信息的模块');
        return;
    }
    
    // 创建时间线视图
    const overlay = document.createElement('div');
    overlay.className = 'timeline-view-overlay';
    overlay.innerHTML = `
        <div class="timeline-view">
            <div class="timeline-header">
                <h3>实验时间线</h3>
                <button class="close-timeline" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="timeline-content">
                ${renderTimelineChart(timelineModules)}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// 渲染时间线图表
function renderTimelineChart(modules) {
    // 简单的甘特图实现
    const sortedModules = modules.sort((a, b) => 
        new Date(a.startDate || a.endDate) - new Date(b.startDate || b.endDate)
    );
    
    return `
        <div class="gantt-chart">
            ${sortedModules.map(module => {
                const moduleType = MODULE_TYPES[module.type.toUpperCase()];
                const start = new Date(module.startDate || module.endDate);
                const end = new Date(module.endDate || module.startDate);
                const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                
                return `
                    <div class="gantt-row">
                        <div class="gantt-label">
                            <span>${moduleType.icon} ${module.title}</span>
                        </div>
                        <div class="gantt-bar-container">
                            <div class="gantt-bar" style="width: ${duration * 10}px">
                                <span class="gantt-dates">
                                    ${start.toLocaleDateString()} - ${end.toLocaleDateString()}
                                </span>
                                ${module.progress ? `
                                    <div class="gantt-progress" style="width: ${module.progress}%"></div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 获取计划状态文本
function getPlanStatusText(status) {
    const statusMap = {
        'draft': '草稿',
        'active': '进行中',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

// 简单的提示函数
window.showToast = function(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 添加样式
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // 根据类型设置背景色
    if (type === 'success') {
        toast.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#f44336';
    } else {
        toast.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initModuleTypeSelector();
    initDragAndDrop();
    
    // 防止点击模态框外部关闭
    const planModal = document.getElementById('add-plan-modal');
    if (planModal) {
        planModal.addEventListener('click', function(e) {
            // 如果点击的是模态框背景（不是内容区域）
            if (e.target === planModal) {
                e.stopPropagation();
                // 提示用户
                if (currentEditingPlan) {
                    alert('请使用"保存计划"或"取消"按钮来关闭编辑窗口，以防止数据丢失。');
                }
            }
        });
    }
    
    // 添加状态选择器的实时更新监听器
    const planStatusSelect = document.getElementById('plan-status');
    if (planStatusSelect) {
        planStatusSelect.addEventListener('change', function() {
            if (currentEditingPlan && !isReadOnlyMode) {
                const oldStatus = currentEditingPlan.status;
                currentEditingPlan.status = this.value;
                currentEditingPlan.updatedAt = new Date().toISOString();
                
                // 显示状态改变提示
                showToast(`计划状态已更改为: ${getPlanStatusText(this.value)}`, 'info');
                
                // 可选：自动保存
                // savePlan();
            }
        });
    }
    
    // 将函数暴露到全局作用域供 onclick 使用
    window.selectModuleType = selectModuleType;
    window.showModuleTypeSelector = showModuleTypeSelector;
    window.toggleModule = toggleModule;
    window.updateModuleTitle = updateModuleTitle;
    window.updateModuleContent = updateModuleContent;
    window.deleteModule = deleteModule;
    window.moveModuleUp = moveModuleUp;
    window.moveModuleDown = moveModuleDown;
    window.updateModuleProgress = updateModuleProgress;
    window.selectImageForModule = selectImageForModule;
    window.deleteModuleImage = deleteModuleImage;
    window.viewFullImage = viewFullImage;
    window.updateModuleDates = updateModuleDates;
    window.showTimelineView = showTimelineView;
    window.savePlan = savePlan;
    window.cancelPlanEdit = cancelPlanEdit;
    window.deletePlanFromEditor = deletePlanFromEditor;
    window.exportPlanAsMarkdown = exportPlanAsMarkdown;
});

// 初始化拖拽功能
function initDragAndDrop() {
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
}

let draggedElement = null;
let draggedModuleId = null;

// 开始拖拽
function handleDragStart(e) {
    if (isReadOnlyMode) return;
    
    const moduleItem = e.target.closest('.module-item');
    if (!moduleItem) return;
    
    draggedElement = moduleItem;
    draggedModuleId = moduleItem.dataset.moduleId;
    moduleItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

// 拖拽经过
function handleDragOver(e) {
    if (!draggedElement || isReadOnlyMode) return;
    
    e.preventDefault();
    const moduleItem = e.target.closest('.module-item');
    if (!moduleItem || moduleItem === draggedElement) return;
    
    const rect = moduleItem.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // 清除所有drag-over类
    document.querySelectorAll('.module-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    
    // 判断是在元素的上半部分还是下半部分
    if (y < rect.height / 2) {
        moduleItem.classList.add('drag-over-top');
    } else {
        moduleItem.classList.add('drag-over-bottom');
    }
}

// 放置
function handleDrop(e) {
    if (!draggedElement || isReadOnlyMode) return;
    
    e.preventDefault();
    const targetModuleItem = e.target.closest('.module-item');
    if (!targetModuleItem || targetModuleItem === draggedElement) return;
    
    const targetModuleId = targetModuleItem.dataset.moduleId;
    const rect = targetModuleItem.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const insertBefore = y < rect.height / 2;
    
    // 执行移动操作
    moveModuleByDrag(draggedModuleId, targetModuleId, insertBefore);
}

// 结束拖拽
function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        draggedModuleId = null;
    }
    
    // 清除所有drag-over类
    document.querySelectorAll('.module-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

// 通过拖拽移动模块
function moveModuleByDrag(sourceId, targetId, insertBefore) {
    if (!currentEditingPlan) return;
    
    // 找到源模块和目标模块的位置
    let sourceParentModules = null;
    let sourceIndex = -1;
    let targetParentModules = null;
    let targetIndex = -1;
    
    const findModulePosition = (modules, parentModules = null) => {
        for (let i = 0; i < modules.length; i++) {
            if (modules[i].id === sourceId) {
                sourceParentModules = parentModules || currentEditingPlan.modules;
                sourceIndex = i;
            }
            if (modules[i].id === targetId) {
                targetParentModules = parentModules || currentEditingPlan.modules;
                targetIndex = i;
            }
            if (modules[i].children && modules[i].children.length > 0) {
                findModulePosition(modules[i].children, modules[i].children);
            }
        }
    };
    
    findModulePosition(currentEditingPlan.modules);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // 移动模块
    const sourceModule = sourceParentModules.splice(sourceIndex, 1)[0];
    
    // 计算新的插入位置
    let newIndex = targetIndex;
    if (sourceParentModules === targetParentModules && sourceIndex < targetIndex) {
        newIndex--;
    }
    if (!insertBefore) {
        newIndex++;
    }
    
    targetParentModules.splice(newIndex, 0, sourceModule);
    
    currentEditingPlan.updatedAt = new Date().toISOString();
    renderPlanModules();
}

// 更新渲染函数以支持拖拽
function renderModuleTreeWithDrag(modules, level = 0) {
    return modules.map(module => {
        const moduleType = MODULE_TYPES[module.type.toUpperCase()] || MODULE_TYPES.CUSTOM;
        const canHaveChildren = moduleType.canHaveChildren;
        const hasChildren = module.children && module.children.length > 0;
        const supportImages = moduleType.supportImages;
        const supportProgress = moduleType.supportProgress;
        
        return `
            <div class="module-item ${module.type}" data-module-id="${module.id}" ${!isReadOnlyMode ? 'draggable="true"' : ''}>
                <div class="module-header" onclick="toggleModule('${module.id}')">
                    ${canHaveChildren ? `<span class="module-expand-icon ${module.expanded ? '' : 'collapsed'}">▼</span>` : '<span style="width: 20px; display: inline-block;"></span>'}
                    <span class="module-icon">${moduleType.icon}</span>
                    <input type="text" class="module-title" value="${module.title}" 
                           onclick="event.stopPropagation()" 
                           onchange="updateModuleTitle('${module.id}', this.value)"
                           ${isReadOnlyMode ? 'readonly' : ''}
                           style="border: none; background: transparent; font-weight: 500; flex: 1;">
                    <div class="module-actions" ${isReadOnlyMode ? 'style="display: none;"' : ''}>
                        ${canHaveChildren ? `<button class="module-action-btn" onclick="showModuleTypeSelector('${module.id}', event)">添加子模块</button>` : ''}
                        <button class="module-action-btn" onclick="event.stopPropagation(); moveModuleUp('${module.id}')">↑</button>
                        <button class="module-action-btn" onclick="event.stopPropagation(); moveModuleDown('${module.id}')">↓</button>
                        <button class="module-action-btn danger" onclick="event.stopPropagation(); deleteModule('${module.id}')">删除</button>
                    </div>
                </div>
                <div class="module-content ${module.expanded !== false ? 'expanded' : ''}">
                    ${supportProgress ? renderProgressSection(module) : ''}
                    <textarea class="module-content-editor" 
                              placeholder="输入内容..." 
                              ${isReadOnlyMode ? 'readonly' : ''}
                              onchange="updateModuleContent('${module.id}', this.value)">${module.content || ''}</textarea>
                    ${supportImages ? renderImageSection(module) : ''}
                    ${module.startDate || module.endDate ? renderDateSection(module) : ''}
                    ${canHaveChildren && hasChildren ? `
                        <div class="module-children">
                            ${renderModuleTreeWithDrag(module.children, level + 1)}
                        </div>
                    ` : ''}
                    ${!isReadOnlyMode && canHaveChildren ? `
                        <button class="add-module-inline" onclick="showModuleTypeSelector('${module.id}', event)">
                            + 添加子模块
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}