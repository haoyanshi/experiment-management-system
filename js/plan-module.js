// 实验计划模块 - 树形结构设计

// 模块类型定义
const MODULE_TYPES = {
    SECTION: { 
        id: 'section', 
        name: '章节', 
        icon: '📂',
        canHaveChildren: true,
        supportImages: false,
        supportProgress: false,
        defaultContent: ''
    },
    OBJECTIVE: { 
        id: 'objective', 
        name: '研究目标', 
        icon: '🎯',
        canHaveChildren: false,
        supportImages: false,
        supportProgress: true,
        defaultContent: ''
    },
    HYPOTHESIS: { 
        id: 'hypothesis', 
        name: '研究假设', 
        icon: '💡',
        canHaveChildren: false,
        supportImages: false,
        supportProgress: false,
        defaultContent: ''
    },
    METHOD: { 
        id: 'method', 
        name: '实验方法', 
        icon: '🔬',
        canHaveChildren: true,
        supportImages: true,
        supportProgress: false,
        defaultContent: ''
    },
    EXPERIMENT: { 
        id: 'experiment', 
        name: '实验步骤', 
        icon: '🧪',
        canHaveChildren: true,
        supportImages: true,
        supportProgress: true,
        defaultContent: ''
    },
    PROGRESS: {
        id: 'progress',
        name: '进度展示',
        icon: '📸',
        canHaveChildren: false,
        supportImages: true,
        supportProgress: true,
        defaultContent: ''
    },
    MATERIAL: { 
        id: 'material', 
        name: '材料清单', 
        icon: '📋',
        canHaveChildren: false,
        supportImages: true,
        supportProgress: false,
        defaultContent: ''
    },
    EQUIPMENT: { 
        id: 'equipment', 
        name: '设备需求', 
        icon: '🔧',
        canHaveChildren: false,
        supportImages: true,
        supportProgress: false,
        defaultContent: ''
    },
    TIMELINE: { 
        id: 'timeline', 
        name: '时间规划', 
        icon: '📅',
        canHaveChildren: true,
        supportImages: false,
        supportProgress: true,
        defaultContent: ''
    },
    MILESTONE: {
        id: 'milestone',
        name: '里程碑',
        icon: '🏁',
        canHaveChildren: false,
        supportImages: true,
        supportProgress: true,
        defaultContent: ''
    },
    EXPECTED_RESULT: { 
        id: 'expected_result', 
        name: '预期结果', 
        icon: '📊',
        canHaveChildren: false,
        supportImages: true,
        supportProgress: true,
        defaultContent: ''
    },
    DATA_ANALYSIS: {
        id: 'data_analysis',
        name: '数据分析',
        icon: '📈',
        canHaveChildren: true,
        supportImages: true,
        supportProgress: false,
        defaultContent: ''
    },
    NOTE: { 
        id: 'note', 
        name: '备注说明', 
        icon: '📝',
        canHaveChildren: false,
        supportImages: false,
        supportProgress: false,
        defaultContent: ''
    },
    REFERENCE: {
        id: 'reference',
        name: '参考文献',
        icon: '📚',
        canHaveChildren: false,
        supportImages: false,
        supportProgress: false,
        defaultContent: ''
    },
    CUSTOM: { 
        id: 'custom', 
        name: '自定义模块', 
        icon: '📌',
        canHaveChildren: true,
        supportImages: true,
        supportProgress: true,
        defaultContent: ''
    }
};

// 实验计划类
class ExperimentPlan {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '新建实验计划';
        this.status = data.status || 'draft';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.modules = data.modules || [];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 添加模块
    addModule(parentId = null, moduleType = MODULE_TYPES.SECTION, position = null) {
        const module = {
            id: this.generateId(),
            type: moduleType.id,
            title: moduleType.name,
            content: moduleType.defaultContent,
            children: [],
            expanded: true,
            createdAt: new Date().toISOString(),
            images: [],
            progress: moduleType.supportProgress ? 0 : null,
            startDate: null,
            endDate: null,
            tags: [],
            attachments: []
        };

        if (parentId === null) {
            // 添加到根级别
            if (position !== null && position >= 0 && position <= this.modules.length) {
                this.modules.splice(position, 0, module);
            } else {
                this.modules.push(module);
            }
        } else {
            // 添加到指定父模块
            const parent = this.findModule(parentId);
            if (parent && MODULE_TYPES[parent.type.toUpperCase()]?.canHaveChildren) {
                if (position !== null && position >= 0 && position <= parent.children.length) {
                    parent.children.splice(position, 0, module);
                } else {
                    parent.children.push(module);
                }
            }
        }

        this.updatedAt = new Date().toISOString();
        return module;
    }

    // 查找模块
    findModule(moduleId, modules = this.modules) {
        for (let module of modules) {
            if (module.id === moduleId) {
                return module;
            }
            if (module.children && module.children.length > 0) {
                const found = this.findModule(moduleId, module.children);
                if (found) return found;
            }
        }
        return null;
    }

    // 删除模块
    deleteModule(moduleId) {
        const deleteFromArray = (modules) => {
            for (let i = 0; i < modules.length; i++) {
                if (modules[i].id === moduleId) {
                    modules.splice(i, 1);
                    return true;
                }
                if (modules[i].children && deleteFromArray(modules[i].children)) {
                    return true;
                }
            }
            return false;
        };

        if (deleteFromArray(this.modules)) {
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // 更新模块
    updateModule(moduleId, updates) {
        const module = this.findModule(moduleId);
        if (module) {
            Object.assign(module, updates);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // 移动模块
    moveModule(moduleId, newParentId, position) {
        // 先找到并移除模块
        let moduleToMove = null;
        const removeModule = (modules) => {
            for (let i = 0; i < modules.length; i++) {
                if (modules[i].id === moduleId) {
                    moduleToMove = modules.splice(i, 1)[0];
                    return true;
                }
                if (modules[i].children && removeModule(modules[i].children)) {
                    return true;
                }
            }
            return false;
        };

        if (removeModule(this.modules) && moduleToMove) {
            // 插入到新位置
            if (newParentId === null) {
                if (position !== null && position >= 0 && position <= this.modules.length) {
                    this.modules.splice(position, 0, moduleToMove);
                } else {
                    this.modules.push(moduleToMove);
                }
            } else {
                const newParent = this.findModule(newParentId);
                if (newParent && MODULE_TYPES[newParent.type.toUpperCase()]?.canHaveChildren) {
                    if (position !== null && position >= 0 && position <= newParent.children.length) {
                        newParent.children.splice(position, 0, moduleToMove);
                    } else {
                        newParent.children.push(moduleToMove);
                    }
                }
            }
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // 导出为JSON
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            modules: this.modules
        };
    }

    // 导出为Markdown
    toMarkdown() {
        let markdown = `# ${this.title}\n\n`;
        markdown += `**状态**: ${this.getStatusText()}\n`;
        markdown += `**创建时间**: ${new Date(this.createdAt).toLocaleDateString()}\n`;
        markdown += `**更新时间**: ${new Date(this.updatedAt).toLocaleDateString()}\n\n`;

        const renderModules = (modules, level = 0) => {
            let result = '';
            for (let module of modules) {
                const indent = '  '.repeat(level);
                const icon = MODULE_TYPES[module.type.toUpperCase()]?.icon || '';
                
                if (level === 0) {
                    result += `\n## ${icon} ${module.title}\n\n`;
                } else {
                    result += `${indent}- **${icon} ${module.title}**\n`;
                }

                if (module.content) {
                    const contentIndent = level === 0 ? '' : '  ' + indent;
                    result += `${contentIndent}${module.content}\n\n`;
                }

                if (module.children && module.children.length > 0) {
                    result += renderModules(module.children, level + 1);
                }
            }
            return result;
        };

        markdown += renderModules(this.modules);
        return markdown;
    }

    getStatusText() {
        const statusTexts = {
            'draft': '草稿',
            'active': '进行中',
            'completed': '已完成'
        };
        return statusTexts[this.status] || this.status;
    }
}

// 模块模板定义
const MODULE_TEMPLATES = {
    BASIC_RESEARCH: {
        id: 'basic_research',
        name: '基础研究模板',
        icon: '🧬',
        description: '适用于基础科学研究的标准模板',
        modules: [
            { type: 'objective', title: '研究目标' },
            { type: 'hypothesis', title: '研究假设' },
            { type: 'method', title: '研究方法' },
            { type: 'experiment', title: '实验设计' },
            { type: 'timeline', title: '时间安排' },
            { type: 'expected_result', title: '预期成果' }
        ]
    },
    ENGINEERING_PROJECT: {
        id: 'engineering_project',
        name: '工程项目模板',
        icon: '⚙️',
        description: '适用于工程实验和产品开发',
        modules: [
            { type: 'objective', title: '项目目标' },
            { type: 'section', title: '需求分析' },
            { type: 'section', title: '设计方案' },
            { type: 'equipment', title: '设备清单' },
            { type: 'material', title: '材料准备' },
            { type: 'experiment', title: '实施步骤' },
            { type: 'milestone', title: '关键节点' },
            { type: 'progress', title: '进度记录' }
        ]
    },
    DATA_COLLECTION: {
        id: 'data_collection',
        name: '数据采集模板',
        icon: '📊',
        description: '适用于数据收集和分析类实验',
        modules: [
            { type: 'objective', title: '采集目标' },
            { type: 'section', title: '数据源说明' },
            { type: 'method', title: '采集方法' },
            { type: 'timeline', title: '采集计划' },
            { type: 'data_analysis', title: '分析方案' },
            { type: 'expected_result', title: '预期产出' }
        ]
    },
    CUSTOM_TEMPLATE: {
        id: 'custom_template',
        name: '空白模板',
        icon: '📄',
        description: '从零开始创建您的实验计划',
        modules: []
    }
};

// 导出给主应用使用
window.ExperimentPlan = ExperimentPlan;
window.MODULE_TYPES = MODULE_TYPES;
window.MODULE_TEMPLATES = MODULE_TEMPLATES;