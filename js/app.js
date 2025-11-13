// 实验管理系统主应用程序
class ExperimentApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.experiments = [];
        this.records = [];
        this.files = [];
        this.plans = [];
        this.currentPlan = null; // 当前编辑的计划实例
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.updateDashboard();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航栏事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 表单事件
        document.getElementById('add-experiment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExperiment();
        });

        document.getElementById('add-record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // 文件上传事件
        document.getElementById('file-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // 过滤器事件
        document.getElementById('experiment-filter').addEventListener('change', () => {
            this.filterRecords();
        });

        document.getElementById('date-filter').addEventListener('change', () => {
            this.filterRecords();
        });

        document.getElementById('search-filter').addEventListener('input', () => {
            this.filterRecords();
        });

        // 计划过滤器事件
        document.getElementById('plan-status-filter')?.addEventListener('change', () => {
            this.filterPlans();
        });

        document.getElementById('plan-search-filter')?.addEventListener('input', () => {
            this.filterPlans();
        });

        // 模态框外部点击关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有导航链接的活动状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // 显示选中的标签内容
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab=\"${tabName}\"]`).classList.add('active');

        this.currentTab = tabName;

        // 根据标签加载相应内容
        switch(tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'plans':
                this.renderPlans();
                break;
            case 'experiments':
                this.renderExperiments();
                break;
            case 'records':
                this.renderRecords();
                this.updateExperimentFilter();
                break;
            case 'analysis':
                this.renderAnalysis();
                break;
            case 'files':
                this.renderFiles();
                break;
        }
    }

    // 更新仪表板
    updateDashboard() {
        const activeExperiments = this.experiments.filter(exp => exp.status === 'active').length;
        const activePlans = this.plans.filter(plan => plan.status === 'active').length;
        const totalRecords = this.records.length;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRecords = this.records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        }).length;

        document.getElementById('active-experiments').textContent = activeExperiments;
        document.getElementById('active-plans').textContent = activePlans;
        document.getElementById('total-records').textContent = totalRecords;
        document.getElementById('monthly-records').textContent = monthlyRecords;

        this.updateRecentActivities();
    }

    // 更新最近活动
    updateRecentActivities() {
        const recentList = document.getElementById('recent-activities-list');
        const recentRecords = this.records
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentRecords.length === 0) {
            recentList.innerHTML = '<li>暂无活动记录</li>';
            return;
        }

        recentList.innerHTML = recentRecords.map(record => {
            const experiment = this.experiments.find(exp => exp.id === record.experimentId);
            const experimentTitle = experiment ? experiment.title : '未知实验';
            return `<li>${record.date} - ${experimentTitle}: ${record.content.substring(0, 50)}${record.content.length > 50 ? '...' : ''}</li>`;
        }).join('');
    }

    // 渲染实验列表
    renderExperiments() {
        const container = document.getElementById('experiment-list');
        
        if (this.experiments.length === 0) {
            container.innerHTML = '<div class=\"empty-state\"><h3>暂无实验</h3><p>点击上方按钮创建你的第一个实验</p></div>';
            return;
        }

        container.innerHTML = this.experiments.map(experiment => `
            <div class=\"experiment-card\">
                <h4>${experiment.title}</h4>
                <p>${experiment.description || '无描述'}</p>
                <div class=\"experiment-meta\">
                    <span>分类: ${experiment.category || '未分类'}</span>
                    <span>开始日期: ${experiment.startDate || '未设定'}</span>
                    <span>结束日期: ${experiment.endDate || '未设定'}</span>
                    <span class=\"status-badge status-${experiment.status}\">${this.getStatusText(experiment.status)}</span>
                </div>
                <div class=\"card-actions\">
                    <button class=\"btn btn-primary\" onclick=\"app.editExperiment('${experiment.id}')\">编辑</button>
                    <button class=\"btn btn-secondary\" onclick=\"app.changeExperimentStatus('${experiment.id}')\">
                        ${experiment.status === 'active' ? '标记完成' : '重新激活'}
                    </button>
                    <button class=\"btn btn-danger\" onclick=\"app.deleteExperiment('${experiment.id}')\">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 渲染记录列表
    renderRecords() {
        const container = document.getElementById('records-list');
        let filteredRecords = [...this.records];

        // 应用过滤器
        const experimentFilter = document.getElementById('experiment-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        const searchFilter = document.getElementById('search-filter').value.toLowerCase();

        if (experimentFilter) {
            filteredRecords = filteredRecords.filter(record => record.experimentId === experimentFilter);
        }

        if (dateFilter) {
            filteredRecords = filteredRecords.filter(record => record.date === dateFilter);
        }

        if (searchFilter) {
            filteredRecords = filteredRecords.filter(record => 
                record.content.toLowerCase().includes(searchFilter) ||
                record.parameters.toLowerCase().includes(searchFilter) ||
                record.results.toLowerCase().includes(searchFilter)
            );
        }

        if (filteredRecords.length === 0) {
            container.innerHTML = '<div class=\"empty-state\"><h3>暂无记录</h3><p>点击上方按钮添加你的第一条实验记录</p></div>';
            return;
        }

        // 按日期倒序排列
        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = filteredRecords.map(record => {
            const experiment = this.experiments.find(exp => exp.id === record.experimentId);
            const experimentTitle = experiment ? experiment.title : '未知实验';
            
            return `
                <div class=\"record-card\">
                    <div class=\"record-header\" onclick=\"app.toggleRecord('${record.id}')\">
                        <div class=\"record-title\">
                            <h4>${experimentTitle}</h4>
                            <div class=\"record-meta\">
                                <span>日期: ${record.date}</span>
                            </div>
                        </div>
                        <div class=\"toggle-btn\">
                            <span class=\"toggle-icon\">▼</span>
                        </div>
                    </div>
                    <div class=\"record-content\" id=\"record-content-${record.id}\" style=\"display: none;\">
                        ${this.renderRecordContent(record.content, record.id, 'content', '实验内容:')}
                        ${record.parameters ? this.renderRecordContent(record.parameters, record.id, 'parameters', '实验参数:') : ''}
                        ${record.results ? this.renderRecordContent(record.results, record.id, 'results', '实验结果:') : ''}
                        <div class=\"card-actions\">
                            <button class=\"btn btn-primary\" onclick=\"app.editRecord('${record.id}')\">编辑</button>
                            <button class=\"btn btn-danger\" onclick=\"app.deleteRecord('${record.id}')\">删除</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染文件列表
    renderFiles() {
        const container = document.getElementById('files-list');
        
        if (this.files.length === 0) {
            container.innerHTML = '<div class=\"empty-state\"><h3>暂无文件</h3><p>点击上方按钮上传你的第一个文件</p></div>';
            return;
        }

        container.innerHTML = this.files.map(file => {
            const previewAvailable = this.canPreview(file.type, file.name) && file.isContentLoaded;
            const previewIcon = this.getFileIcon(file.previewType);
            const loadingStatus = file.isContentLoaded ? '' : ' (加载中...)';
            
            return `
                <div class=\"file-card\">
                    <div class=\"file-header\" style=\"display: flex; align-items: center; margin-bottom: 1rem;\">
                        <span class=\"file-icon\" style=\"font-size: 2rem; margin-right: 1rem;\">${previewIcon}</span>
                        <div class=\"file-title\">
                            <h4>${file.name}${loadingStatus}</h4>
                            <span class=\"file-preview-badge ${previewAvailable ? 'preview-available' : 'no-preview'}\" 
                                  style=\"font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 10px; 
                                         background: ${previewAvailable ? '#d4edda' : file.isContentLoaded === false ? '#fff3cd' : '#f8d7da'}; 
                                         color: ${previewAvailable ? '#155724' : file.isContentLoaded === false ? '#856404' : '#721c24'};\">
                                ${previewAvailable ? '支持预览' : file.isContentLoaded === false ? '加载中' : '不支持预览'}
                            </span>
                        </div>
                    </div>
                    <div class=\"file-meta\">
                        <span><strong>大小:</strong> ${this.formatFileSize(file.size)}</span>
                        <span><strong>类型:</strong> ${file.type || '未知'}</span>
                        <span><strong>上传:</strong> ${file.uploadDate}</span>
                    </div>
                    <div class=\"file-path\" style=\"margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px; font-size: 0.9rem;\">
                        <strong>存储位置:</strong> ${file.currentPath || '浏览器本地存储 (localStorage)'}
                        ${file.fullPath !== file.name ? `<br><strong>原始路径:</strong> ${file.fullPath}` : ''}
                        <br><strong>状态:</strong> 
                        <span style=\"color: ${file.isContentLoaded ? '#28a745' : '#ffc107'};\">
                            ${file.isContentLoaded ? '✅ 已完全加载到本地存储' : '⏳ 正在加载文件内容'}
                        </span>
                        ${file.isQPCRData ? '<br><span style="color: #007bff; font-weight: bold;">🧬 检测到qPCR数据</span>' : ''}
                    </div>
                    <div class=\"card-actions\">
                        ${file.isQPCRData ? 
                            `<button class=\"btn btn-success\" onclick=\"app.jumpToQPCRAnalysis('${file.id}')\">
                                <span style=\"margin-right: 0.5rem;\">🧬</span>qPCR分析
                             </button>` : ''}
                        ${previewAvailable ? 
                            `<button class=\"btn btn-primary\" onclick=\"app.previewFile('${file.id}')\">
                                <span style=\"margin-right: 0.5rem;\">👁️</span>预览
                             </button>` : 
                             file.isContentLoaded === false ?
                            `<button class=\"btn btn-secondary\" disabled>
                                <span style=\"margin-right: 0.5rem;\">⏳</span>加载中
                             </button>` : ''
                        }
                        <button class=\"btn btn-secondary\" onclick=\"app.downloadFile('${file.id}')\" 
                                ${!file.isContentLoaded && !file.file ? 'disabled' : ''}>
                            <span style=\"margin-right: 0.5rem;\">📥</span>下载
                        </button>
                        <button class=\"btn btn-danger\" onclick=\"app.deleteFile('${file.id}')\">
                            <span style=\"margin-right: 0.5rem;\">🗑️</span>删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染数据分析
    renderAnalysis() {
        const summaryContainer = document.getElementById('analysis-summary');
        
        // 简单的统计分析
        const totalExperiments = this.experiments.length;
        const completedExperiments = this.experiments.filter(exp => exp.status === 'completed').length;
        const completionRate = totalExperiments > 0 ? (completedExperiments / totalExperiments * 100).toFixed(1) : 0;
        
        const recordsPerExperiment = totalExperiments > 0 ? (this.records.length / totalExperiments).toFixed(1) : 0;
        
        summaryContainer.innerHTML = `
            <div class="analysis-tabs">
                <button class="analysis-tab-btn active" onclick="app.switchAnalysisTab('overview')">概览统计</button>
                <button class="analysis-tab-btn" onclick="app.switchAnalysisTab('qpcr')">qPCR分析</button>
                <button class="analysis-tab-btn" onclick="app.switchAnalysisTab('rna')">RNA反转录计算</button>
            </div>
            
            <div id="overview-analysis" class="analysis-tab-content active">
                <h3>实验统计分析</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>完成率</h4>
                        <span class="stat-number">${completionRate}%</span>
                    </div>
                    <div class="stat-card">
                        <h4>平均记录数</h4>
                        <span class="stat-number">${recordsPerExperiment}</span>
                    </div>
                    <div class="stat-card">
                        <h4>活跃实验</h4>
                        <span class="stat-number">${this.experiments.filter(exp => exp.status === 'active').length}</span>
                    </div>
                    <div class="stat-card">
                        <h4>本月记录</h4>
                        <span class="stat-number">${this.getMonthlyRecordsCount()}</span>
                    </div>
                </div>
                <div class="analysis-details">
                    <h4>详细分析</h4>
                    <p>你总共创建了 ${totalExperiments} 个实验项目，其中 ${completedExperiments} 个已完成。</p>
                    <p>平均每个实验有 ${recordsPerExperiment} 条记录，显示了良好的实验跟踪习惯。</p>
                    <p>建议继续保持定期记录实验进展的习惯，这将有助于提高研究效率。</p>
                </div>
            </div>
            
            <div id="qpcr-analysis" class="analysis-tab-content">
                <h3>🧬 qPCR相对定量分析</h3>
                <div class="qpcr-calculator">
                    <!-- 数据来源选择 -->
                    <div class="data-source-section">
                        <h4>📥 数据来源</h4>
                        <div class="source-tabs">
                            <button class="source-tab active" onclick="app.switchDataSource('manual')">🖊️ 手工输入</button>
                            <button class="source-tab" onclick="app.switchDataSource('file')">📁 文件导入</button>
                        </div>
                    </div>
                
                    <!-- 文件导入区域 -->
                    <div id="file-import-source" class="data-source-content" style="display: none;">
                        <h4>📄 选择qPCR数据文件</h4>
                        <div class="qpcr-file-list" id="qpcr-file-list">
                            <p class="no-files">未检测到qPCR数据文件，请先在文件管理中上传包含qPCR数据的文件</p>
                        </div>
                    </div>
                
                    <!-- 手工输入区域 -->
                    <div id="manual-input-source" class="data-source-content qpcr-input-section">
                        <h4>📊 数据输入</h4>
                        
                        <!-- 组数选择 -->
                        <div class="input-group">
                            <label>选择分析类型：</label>
                            <div class="analysis-type-tabs">
                                <button class="analysis-type-btn active" onclick="app.switchAnalysisType('2groups')">2组比较</button>
                                <button class="analysis-type-btn" onclick="app.switchAnalysisType('3groups')">3组两两比较</button>
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <label>选择参考基因 (内参)：</label>
                            <input type="text" id="reference-gene" placeholder="例如：GAPDH, β-actin" />
                        </div>
                        <div class="input-group">
                            <label>选择目标基因：</label>
                            <input type="text" id="target-gene" placeholder="例如：IL-6, TNF-α" />
                        </div>
                        
                        <!-- 2组比较区域 -->
                        <div id="2groups-input" class="groups-input-section">
                            <div class="input-group">
                                <label>对照组Ct值 (用逗号分隔)：</label>
                                <div class="ct-input-row">
                                    <input type="text" id="control-ref-ct" placeholder="参考基因Ct值：20.1,20.3,20.2" />
                                    <input type="text" id="control-target-ct" placeholder="目标基因Ct值：25.1,25.4,25.2" />
                                </div>
                            </div>
                            <div class="input-group">
                                <label>实验组Ct值 (用逗号分隔)：</label>
                                <div class="ct-input-row">
                                    <input type="text" id="exp-ref-ct" placeholder="参考基因Ct值：20.0,20.2,20.1" />
                                    <input type="text" id="exp-target-ct" placeholder="目标基因Ct值：22.1,22.3,22.0" />
                                </div>
                            </div>
                        </div>
                        
                        <!-- 3组比较区域 -->
                        <div id="3groups-input" class="groups-input-section" style="display: none;">
                            <div class="input-group">
                                <label>组1 (对照组) Ct值 (用逗号分隔)：</label>
                                <div class="ct-input-row">
                                    <input type="text" id="group1-ref-ct" placeholder="参考基因Ct值：20.1,20.3,20.2" />
                                    <input type="text" id="group1-target-ct" placeholder="目标基因Ct值：25.1,25.4,25.2" />
                                </div>
                            </div>
                            <div class="input-group">
                                <label>组2 Ct值 (用逗号分隔)：</label>
                                <div class="ct-input-row">
                                    <input type="text" id="group2-ref-ct" placeholder="参考基因Ct值：20.0,20.2,20.1" />
                                    <input type="text" id="group2-target-ct" placeholder="目标基因Ct值：22.1,22.3,22.0" />
                                </div>
                            </div>
                            <div class="input-group">
                                <label>组3 Ct值 (用逗号分隔)：</label>
                                <div class="ct-input-row">
                                    <input type="text" id="group3-ref-ct" placeholder="参考基因Ct值：20.2,20.4,20.3" />
                                    <input type="text" id="group3-target-ct" placeholder="目标基因Ct值：23.2,23.5,23.3" />
                                </div>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" onclick="app.calculateQPCR()">🧮 计算相对表达量</button>
                        <button class="btn btn-secondary" onclick="app.clearQPCRInputs()" style="margin-left: 10px;">🧹 清空输入</button>
                    </div>
                    
                    <div class="qpcr-results-section" id="qpcr-results" style="display: none;">
                        <h4>📈 计算结果</h4>
                        <div class="results-summary" id="results-summary"></div>
                        <div class="results-details" id="results-details"></div>
                        <div class="results-chart" id="results-chart"></div>
                        <div class="result-actions">
                            <button class="btn btn-success" onclick="app.saveQPCRResults()">💾 保存结果到实验记录</button>
                            <button class="btn btn-secondary" onclick="app.exportQPCRResults()">📤 导出结果 (JSON)</button>
                            <button class="btn btn-info" onclick="app.exportQPCRResultsCSV()">📊 导出数据表格 (CSV)</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="rna-analysis" class="analysis-tab-content">
                <h3>🧬 RNA反转录反应体系计算器</h3>
                <div class="rna-calculator">
                    <!-- RNA总量输入 -->
                    <div class="rna-input-section">
                        <h4>📊 基本参数设置</h4>
                        <div class="input-group">
                            <label for="rna-total-amount">目标RNA总量(ng)：</label>
                            <input type="number" id="rna-total-amount" placeholder="例如：1000" />
                        </div>
                        <div class="input-group">
                            <label for="rna-group-count">样本组数：</label>
                            <input type="number" id="rna-group-count" placeholder="例如：6" min="1" max="20" />
                        </div>
                        <button class="btn btn-primary" onclick="app.setupRNAGroups()">🔧 设置样本组</button>
                    </div>
                    
                    <!-- 样本组设置区域 -->
                    <div id="rna-groups-section" class="rna-groups-section" style="display: none;">
                        <h4>📝 样本组信息设置</h4>
                        <div id="rna-groups-container"></div>
                        <button class="btn btn-success" onclick="app.calculateRNA()">🧮 计算体系</button>
                        <button class="btn btn-secondary" onclick="app.clearRNAInputs()">🧹 重置</button>
                    </div>
                    
                    <!-- RNA计算结果 -->
                    <div id="rna-results-section" class="rna-results-section" style="display: none;">
                        <h4>📈 反转录体系计算结果</h4>
                        <div id="rna-results-table"></div>
                        <div class="result-actions" style="margin-top: 20px;">
                            <button class="btn btn-success" onclick="app.saveRNAResults()">💾 保存到实验记录</button>
                            <button class="btn btn-secondary" onclick="app.exportRNAResults()">📤 导出结果</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 初始化样式
        this.setupAnalysisTabStyles();
    }

    // 获取本月记录数量
    getMonthlyRecordsCount() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        }).length;
    }

    // 切换分析标签
    switchAnalysisTab(tab) {
        // 移除所有标签的active类
        document.querySelectorAll('.analysis-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.analysis-tab-content').forEach(content => content.classList.remove('active'));
        
        // 激活当前标签
        event.target.classList.add('active');
        document.getElementById(`${tab}-analysis`).classList.add('active');
    }

    // 设置分析标签样式
    setupAnalysisTabStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .analysis-tabs {
                display: flex;
                border-bottom: 2px solid #ddd;
                margin-bottom: 20px;
            }
            .analysis-tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-bottom: 2px solid transparent;
                transition: all 0.3s ease;
            }
            .analysis-tab-btn.active {
                border-bottom-color: #007bff;
                color: #007bff;
                font-weight: bold;
            }
            .analysis-tab-content {
                display: none;
            }
            .analysis-tab-content.active {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // 切换分析类型
    switchAnalysisType(type) {
        const twoGroupsBtn = document.querySelector('.analysis-type-btn[onclick*="2groups"]');
        const threeGroupsBtn = document.querySelector('.analysis-type-btn[onclick*="3groups"]');
        const twoGroupsInput = document.getElementById('2groups-input');
        const threeGroupsInput = document.getElementById('3groups-input');
        
        if (type === '2groups') {
            twoGroupsBtn.classList.add('active');
            threeGroupsBtn.classList.remove('active');
            twoGroupsInput.style.display = 'block';
            threeGroupsInput.style.display = 'none';
            this.currentAnalysisType = '2groups';
        } else if (type === '3groups') {
            twoGroupsBtn.classList.remove('active');
            threeGroupsBtn.classList.add('active');
            twoGroupsInput.style.display = 'none';
            threeGroupsInput.style.display = 'block';
            this.currentAnalysisType = '3groups';
        }
        
        // 清空之前的结果
        const resultSection = document.getElementById('qpcr-results');
        if (resultSection) {
            resultSection.style.display = 'none';
        }
    }

    // qPCR计算功能
    calculateQPCR() {
        try {
            // 获取输入数据
            const referenceGene = document.getElementById('reference-gene').value.trim();
            const targetGene = document.getElementById('target-gene').value.trim();
            
            // 验证基因名称
            if (!referenceGene || !targetGene) {
                alert('请输入参考基因和目标基因名称');
                return;
            }
            
            // 检查当前分析类型
            const analysisType = this.currentAnalysisType || '2groups';
            
            if (analysisType === '2groups') {
                // 2组比较
                const controlRefCt = document.getElementById('control-ref-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const controlTargetCt = document.getElementById('control-target-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const expRefCt = document.getElementById('exp-ref-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const expTargetCt = document.getElementById('exp-target-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

                if (controlRefCt.length === 0 || controlTargetCt.length === 0 || expRefCt.length === 0 || expTargetCt.length === 0) {
                    alert('请输入所有Ct值');
                    return;
                }

                // 执行qPCR计算
                const results = this.performQPCRCalculation({
                    referenceGene,
                    targetGene,
                    controlRefCt,
                    controlTargetCt,
                    expRefCt,
                    expTargetCt
                });

                // 显示结果
                this.displayQPCRResults(results);
                
            } else if (analysisType === '3groups') {
                // 3组比较
                const group1RefCt = document.getElementById('group1-ref-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const group1TargetCt = document.getElementById('group1-target-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const group2RefCt = document.getElementById('group2-ref-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const group2TargetCt = document.getElementById('group2-target-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const group3RefCt = document.getElementById('group3-ref-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                const group3TargetCt = document.getElementById('group3-target-ct').value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

                if (group1RefCt.length === 0 || group1TargetCt.length === 0 || 
                    group2RefCt.length === 0 || group2TargetCt.length === 0 || 
                    group3RefCt.length === 0 || group3TargetCt.length === 0) {
                    alert('请输入所有组的Ct值');
                    return;
                }

                // 执行3组两两比较
                const results = this.perform3GroupQPCRCalculation({
                    referenceGene,
                    targetGene,
                    group1: { refCt: group1RefCt, targetCt: group1TargetCt, name: '组1(对照组)' },
                    group2: { refCt: group2RefCt, targetCt: group2TargetCt, name: '组2' },
                    group3: { refCt: group3RefCt, targetCt: group3TargetCt, name: '组3' }
                });

                // 显示3组比较结果
                this.display3GroupQPCRResults(results);
            }

        } catch (error) {
            alert(`计算错误: ${error.message}`);
            console.error('qPCR计算错误:', error);
        }
    }

    // 执行qPCR计算的核心算法
    performQPCRCalculation(data) {
        const { referenceGene, targetGene, controlRefCt, controlTargetCt, expRefCt, expTargetCt } = data;

        // 计算ΔCt值 (目标基因Ct - 参考基因Ct)
        const controlDeltaCt = this.calculateMeanAndStd(
            controlTargetCt.map((ct, i) => ct - (controlRefCt[i] || controlRefCt[0]))
        );
        
        const expDeltaCt = this.calculateMeanAndStd(
            expTargetCt.map((ct, i) => ct - (expRefCt[i] || expRefCt[0]))
        );

        // 计算ΔΔCt值 (实验组ΔCt - 对照组ΔCt均值)
        const deltaDeltaCt = {
            control: controlDeltaCt.values.map(v => v - controlDeltaCt.mean),
            experimental: expDeltaCt.values.map(v => v - controlDeltaCt.mean)
        };

        // 计算相对表达量 (2^-ΔΔCt)
        const relativeExpression = {
            control: deltaDeltaCt.control.map(v => Math.pow(2, -v)),
            experimental: deltaDeltaCt.experimental.map(v => Math.pow(2, -v))
        };

        // 计算统计数据
        const controlStats = this.calculateMeanAndStd(relativeExpression.control);
        const expStats = this.calculateMeanAndStd(relativeExpression.experimental);

        // 重要修复：对照组应该标准化为1
        // 在ΔΔCt方法中，对照组相对表达量应该始终为1
        const normalizedControlStats = {
            mean: 1.0,
            std: controlStats.std / controlStats.mean, // 标准化标准差
            sem: controlStats.sem / controlStats.mean, // 标准化标准误
            values: relativeExpression.control.map(v => v / controlStats.mean),
            n: controlStats.n,
            cv: (controlStats.std / controlStats.mean) * 100
        };

        const normalizedExpStats = {
            mean: expStats.mean / controlStats.mean,
            std: expStats.std / controlStats.mean,
            sem: expStats.sem / controlStats.mean,
            values: relativeExpression.experimental.map(v => v / controlStats.mean),
            n: expStats.n,
            cv: (expStats.std / expStats.mean) * 100
        };

        // 计算倍数变化（实验组相对于对照组）
        const foldChange = normalizedExpStats.mean / normalizedControlStats.mean;

        // 使用标准化后的数据进行t检验
        const tTestResult = this.performTTest(normalizedControlStats.values, normalizedExpStats.values);

        return {
            referenceGene,
            targetGene,
            controlGroup: data.controlGroup || '对照组',
            experimentalGroup: data.experimentalGroup || '实验组',
            rawData: {
                controlRefCt,
                controlTargetCt,
                expRefCt,
                expTargetCt
            },
            deltaCt: {
                control: controlDeltaCt,
                experimental: expDeltaCt
            },
            deltaDeltaCt,
            relativeExpression: {
                control: normalizedControlStats.values,
                experimental: normalizedExpStats.values
            },
            statistics: {
                control: normalizedControlStats,
                experimental: normalizedExpStats
            },
            foldChange,
            tTest: tTestResult,
            significance: this.getSignificanceLevel(tTestResult.pValue)
        };
    }

    // 计算平均值和标准差
    calculateMeanAndStd(values) {
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
        const std = Math.sqrt(variance);
        const sem = std / Math.sqrt(n); // 标准误

        return {
            values,
            n,
            mean,
            std,
            sem,
            cv: (std / mean) * 100 // 变异系数
        };
    }

    // 执行t检验
    performTTest(group1, group2) {
        const n1 = group1.length;
        const n2 = group2.length;
        const mean1 = group1.reduce((a, b) => a + b, 0) / n1;
        const mean2 = group2.reduce((a, b) => a + b, 0) / n2;
        
        const var1 = group1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (n1 - 1);
        const var2 = group2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (n2 - 1);
        
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        const tStat = (mean1 - mean2) / Math.sqrt(pooledVar * (1/n1 + 1/n2));
        const df = n1 + n2 - 2;
        
        // 简化的p值估算 (双尾检验)
        const pValue = this.estimatePValue(Math.abs(tStat), df);

        return {
            tStatistic: tStat,
            degreesOfFreedom: df,
            pValue: pValue
        };
    }

    // 估算p值 (简化版本)
    estimatePValue(tStat, df) {
        // 这是一个简化的p值估算，实际应用中建议使用专业统计库
        if (tStat > 4) return 0.001;
        if (tStat > 3) return 0.01;
        if (tStat > 2) return 0.05;
        if (tStat > 1.5) return 0.1;
        return 0.2;
    }

    // 获取显著性水平
    getSignificanceLevel(pValue) {
        if (pValue < 0.001) return { level: 'significant-3', text: '极显著 (p<0.001)' };
        if (pValue < 0.01) return { level: 'significant-2', text: '非常显著 (p<0.01)' };
        if (pValue < 0.05) return { level: 'significant-1', text: '显著 (p<0.05)' };
        return { level: 'ns', text: '不显著 (p≥0.05)' };
    }

    // 显示qPCR结果
    displayQPCRResults(results) {
        const resultSection = document.getElementById('qpcr-results');
        const summaryDiv = document.getElementById('results-summary');
        const detailsDiv = document.getElementById('results-details');
        const chartDiv = document.getElementById('results-chart');

        // 显示结果区域
        resultSection.style.display = 'block';

        // 结果摘要
        summaryDiv.innerHTML = `
            <h5>📊 计算摘要</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                <div class="summary-item">
                    <strong>目标基因:</strong> ${results.targetGene}<br>
                    <strong>参考基因:</strong> ${results.referenceGene}
                </div>
                <div class="summary-item">
                    <strong>倍数变化:</strong> ${results.foldChange.toFixed(3)}倍<br>
                    <strong>显著性:</strong> ${results.significance.text}
                </div>
                <div class="summary-item">
                    <strong>对照组表达量:</strong> 1.000 ± ${results.statistics.control.sem.toFixed(3)}<br>
                    <strong>实验组表达量:</strong> ${results.statistics.experimental.mean.toFixed(3)} ± ${results.statistics.experimental.sem.toFixed(3)}
                </div>
            </div>
        `;

        // 详细计算结果
        detailsDiv.innerHTML = `
            <h5>📋 详细计算过程</h5>
            <table class="qpcr-table">
                <thead>
                    <tr>
                        <th>组别</th>
                        <th>样本数</th>
                        <th>ΔCt (均值±SEM)</th>
                        <th>相对表达量 (均值±SEM)</th>
                        <th>变异系数(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>对照组</td>
                        <td>${results.statistics.control.n}</td>
                        <td>${results.deltaCt.control.mean.toFixed(3)} ± ${results.deltaCt.control.sem.toFixed(3)}</td>
                        <td>1.000 ± ${results.statistics.control.sem.toFixed(3)}</td>
                        <td>${results.statistics.control.cv.toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td>实验组</td>
                        <td>${results.statistics.experimental.n}</td>
                        <td>${results.deltaCt.experimental.mean.toFixed(3)} ± ${results.deltaCt.experimental.sem.toFixed(3)}</td>
                        <td>${results.statistics.experimental.mean.toFixed(3)} ± ${results.statistics.experimental.sem.toFixed(3)}</td>
                        <td>${results.statistics.experimental.cv.toFixed(2)}%</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top: 20px;">
                <h6>统计检验结果:</h6>
                <p>t值: ${results.tTest.tStatistic.toFixed(4)}, 自由度: ${results.tTest.degreesOfFreedom}, p值: ${results.tTest.pValue.toFixed(4)}</p>
            </div>
        `;

        // 简单的柱状图
        this.drawQPCRChart(chartDiv, results);

        // 保存结果到实例变量
        this.lastQPCRResults = results;
    }

    // 绘制简单的qPCR结果图表
    drawQPCRChart(container, results) {
        const controlMean = results.statistics.control.mean;
        const expMean = results.statistics.experimental.mean;
        const controlSem = results.statistics.control.sem;
        const expSem = results.statistics.experimental.sem;
        
        const maxValue = Math.max(controlMean + controlSem, expMean + expSem) * 1.2;
        
        container.innerHTML = `
            <h5>📈 相对表达量图表</h5>
            <div style="display: flex; justify-content: center; align-items: end; height: 250px; margin-top: 20px;">
                <div style="text-align: center; margin: 0 30px;">
                    <div style="width: 60px; height: ${(controlMean / maxValue) * 200}px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 0 auto; position: relative; border-radius: 4px;">
                        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: ${(controlSem / maxValue) * 200}px; background: #333;"></div>
                        <div style="position: absolute; top: -13px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                        <div style="position: absolute; top: ${(controlSem / maxValue) * 200 - 3}px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                    </div>
                    <div style="margin-top: 10px; font-weight: bold;">对照组</div>
                    <div style="font-size: 12px; color: #666;">${controlMean.toFixed(3)} ± ${controlSem.toFixed(3)}</div>
                </div>
                
                <div style="text-align: center; margin: 0 30px;">
                    <div style="width: 60px; height: ${(expMean / maxValue) * 200}px; background: linear-gradient(45deg, #f18f01, #ff6b6b); margin: 0 auto; position: relative; border-radius: 4px;">
                        <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: ${(expSem / maxValue) * 200}px; background: #333;"></div>
                        <div style="position: absolute; top: -13px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                        <div style="position: absolute; top: ${(expSem / maxValue) * 200 - 3}px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                    </div>
                    <div style="margin-top: 10px; font-weight: bold;">实验组</div>
                    <div style="font-size: 12px; color: #666;">${expMean.toFixed(3)} ± ${expSem.toFixed(3)}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <span style="font-size: 18px; font-weight: bold; color: ${results.foldChange > 1 ? '#28a745' : '#dc3545'};">
                    倍数变化: ${results.foldChange.toFixed(3)}倍 ${results.significance.level}
                </span>
            </div>
        `;
    }

    // 清空qPCR输入
    clearQPCRInputs() {
        document.getElementById('reference-gene').value = '';
        document.getElementById('target-gene').value = '';
        
        // 清空2组输入
        document.getElementById('control-ref-ct').value = '';
        document.getElementById('control-target-ct').value = '';
        document.getElementById('exp-ref-ct').value = '';
        document.getElementById('exp-target-ct').value = '';
        
        // 清空3组输入
        document.getElementById('group1-ref-ct').value = '';
        document.getElementById('group1-target-ct').value = '';
        document.getElementById('group2-ref-ct').value = '';
        document.getElementById('group2-target-ct').value = '';
        document.getElementById('group3-ref-ct').value = '';
        document.getElementById('group3-target-ct').value = '';
        
        const resultSection = document.getElementById('qpcr-results');
        if (resultSection) {
            resultSection.style.display = 'none';
        }
    }

    // 执行3组qPCR两两比较计算
    perform3GroupQPCRCalculation(data) {
        const { referenceGene, targetGene, group1, group2, group3 } = data;
        
        // 进行三组两两比较
        const comparisons = [
            { control: group1, experimental: group2, name: `${group1.name} vs ${group2.name}` },
            { control: group1, experimental: group3, name: `${group1.name} vs ${group3.name}` },
            { control: group2, experimental: group3, name: `${group2.name} vs ${group3.name}` }
        ];
        
        const results = [];
        
        for (const comparison of comparisons) {
            const result = this.performQPCRCalculation({
                referenceGene,
                targetGene,
                controlRefCt: comparison.control.refCt,
                controlTargetCt: comparison.control.targetCt,
                expRefCt: comparison.experimental.refCt,
                expTargetCt: comparison.experimental.targetCt,
                controlGroup: comparison.control.name,
                experimentalGroup: comparison.experimental.name
            });
            
            result.comparisonName = comparison.name;
            results.push(result);
        }
        
        return {
            referenceGene,
            targetGene,
            comparisons: results,
            is3GroupComparison: true
        };
    }

    // 显示3组qPCR比较结果
    display3GroupQPCRResults(results) {
        const resultSection = document.getElementById('qpcr-results');
        const summaryDiv = document.getElementById('results-summary');
        const detailsDiv = document.getElementById('results-details');
        const chartDiv = document.getElementById('results-chart');
        
        // 显示结果区域
        resultSection.style.display = 'block';
        
        // 结果摘要
        summaryDiv.innerHTML = `
            <h5>📊 3组两两比较摘要</h5>
            <div style="margin-top: 15px;">
                <p><strong>目标基因:</strong> ${results.targetGene}</p>
                <p><strong>参考基因:</strong> ${results.referenceGene}</p>
            </div>
            <table class="qpcr-table" style="margin-top: 20px;">
                <thead>
                    <tr>
                        <th>比较组</th>
                        <th>倍数变化</th>
                        <th>p值</th>
                        <th>显著性</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.comparisons.map(comp => `
                        <tr>
                            <td>${comp.comparisonName}</td>
                            <td style="color: ${comp.foldChange > 1 ? '#28a745' : '#dc3545'};">
                                ${comp.foldChange.toFixed(3)}倍
                            </td>
                            <td>${comp.tTest.pValue.toFixed(4)}</td>
                            <td>${comp.significance.text}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // 详细结果
        detailsDiv.innerHTML = `
            <h5>📋 详细比较结果</h5>
            ${results.comparisons.map((comp, index) => `
                <div style="margin-top: ${index > 0 ? '30px' : '20px'}; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h6>${comp.comparisonName}</h6>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div>
                            <strong>${comp.controlGroup || '对照组'}:</strong><br>
                            ΔCt: ${comp.deltaCt.control.mean.toFixed(3)} ± ${comp.deltaCt.control.sem.toFixed(3)}<br>
                            相对表达量: 1.000 ± ${comp.statistics.control.sem.toFixed(3)}
                        </div>
                        <div>
                            <strong>${comp.experimentalGroup || '实验组'}:</strong><br>
                            ΔCt: ${comp.deltaCt.experimental.mean.toFixed(3)} ± ${comp.deltaCt.experimental.sem.toFixed(3)}<br>
                            相对表达量: ${comp.statistics.experimental.mean.toFixed(3)} ± ${comp.statistics.experimental.sem.toFixed(3)}
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>统计结果:</strong> t = ${comp.tTest.tStatistic.toFixed(3)}, df = ${comp.tTest.degreesOfFreedom}, p = ${comp.tTest.pValue.toFixed(4)}
                    </div>
                    
                    <!-- 添加原始数据表格 -->
                    <div style="margin-top: 20px;">
                        <h6 style="margin-bottom: 10px;">原始Ct值数据:</h6>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #e9ecef;">
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">组别</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">样本</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">${results.referenceGene} Ct</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">${results.targetGene} Ct</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">ΔCt</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">ΔΔCt</th>
                                    <th style="border: 1px solid #dee2e6; padding: 8px;">2^(-ΔΔCt)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generate3GroupDataRows(comp, results.referenceGene, results.targetGene)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `).join('')}
            
            <!-- 添加完整的3组原始数据汇总表 -->
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h6>📊 3组完整原始数据汇总</h6>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #e9ecef;">
                                <th style="border: 1px solid #dee2e6; padding: 8px;">组别</th>
                                <th style="border: 1px solid #dee2e6; padding: 8px;">样本编号</th>
                                <th style="border: 1px solid #dee2e6; padding: 8px;">${results.referenceGene} Ct</th>
                                <th style="border: 1px solid #dee2e6; padding: 8px;">${results.targetGene} Ct</th>
                                <th style="border: 1px solid #dee2e6; padding: 8px;">ΔCt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateAll3GroupsDataRows(results)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // 绘制比较图表
        this.draw3GroupComparisonChart(chartDiv, results);
        
        // 保存结果到实例变量
        this.lastQPCRResults = results;
    }

    // 绘制3组比较图表
    draw3GroupComparisonChart(container, results) {
        // 计算所有组的数据用于图表
        const groupData = new Map();
        
        // 初始化组数据
        results.comparisons.forEach(comp => {
            if (!groupData.has(comp.controlGroup)) {
                groupData.set(comp.controlGroup, { name: comp.controlGroup, values: [] });
            }
            if (!groupData.has(comp.experimentalGroup)) {
                groupData.set(comp.experimentalGroup, { name: comp.experimentalGroup, values: [] });
            }
        });
        
        // 组1作为对照组，设为1
        const group1Name = results.comparisons[0].controlGroup;
        groupData.get(group1Name).mean = 1;
        groupData.get(group1Name).sem = results.comparisons[0].statistics.control.sem;
        
        // 从比较结果中提取其他组的数据
        results.comparisons.forEach(comp => {
            if (comp.controlGroup === group1Name) {
                const expGroup = groupData.get(comp.experimentalGroup);
                expGroup.mean = comp.statistics.experimental.mean;
                expGroup.sem = comp.statistics.experimental.sem;
            }
        });
        
        const groups = Array.from(groupData.values());
        const maxValue = Math.max(...groups.map(g => (g.mean || 0) + (g.sem || 0))) * 1.2;
        
        container.innerHTML = `
            <h5>📈 3组相对表达量比较图表</h5>
            <div style="display: flex; justify-content: center; align-items: end; height: 250px; margin-top: 20px;">
                ${groups.map((group, index) => `
                    <div style="text-align: center; margin: 0 20px;">
                        <div style="width: 60px; height: ${((group.mean || 0) / maxValue) * 200}px; 
                            background: linear-gradient(45deg, ${index === 0 ? '#667eea, #764ba2' : index === 1 ? '#f18f01, #ff6b6b' : '#00c851, #00a152'}); 
                            margin: 0 auto; position: relative; border-radius: 4px;">
                            <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 2px; height: ${((group.sem || 0) / maxValue) * 200}px; background: #333;"></div>
                            <div style="position: absolute; top: -13px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                            <div style="position: absolute; top: ${((group.sem || 0) / maxValue) * 200 - 3}px; left: 50%; transform: translateX(-50%); width: 10px; height: 2px; background: #333;"></div>
                        </div>
                        <div style="margin-top: 10px; font-weight: bold;">${group.name}</div>
                        <div style="font-size: 12px; color: #666;">${(group.mean || 0).toFixed(3)} ± ${(group.sem || 0).toFixed(3)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 保存qPCR结果到实验记录
    saveQPCRResults() {
        if (!this.lastQPCRResults) {
            alert('没有可保存的qPCR结果');
            return;
        }

        const results = this.lastQPCRResults;
        
        // 处理3组比较结果
        if (results.is3GroupComparison) {
            this.save3GroupQPCRResults(results);
            return;
        }
        
        // 处理多基因结果
        if (results.isMultiGene) {
            this.saveMultiGeneQPCRResults(results);
            return;
        }
        
        // 生成美观的HTML格式记录
        const recordContent = this.generateQPCRReportHTML(results);

        // 创建一个新的实验记录
        const record = {
            id: this.generateId(),
            experimentId: '', // 用户需要手动选择实验
            date: new Date().toISOString().split('T')[0],
            content: recordContent,
            parameters: `参考基因: ${results.referenceGene}, 目标基因: ${results.targetGene}, 分组: ${results.controlGroup} vs ${results.experimentalGroup}`,
            results: `相对表达量变化: ${results.foldChange.toFixed(3)}倍 (${results.significance.text})`,
            createdAt: new Date().toISOString(),
            type: 'qpcr_analysis' // 标记为qPCR分析结果
        };

        // 如果有实验，让用户选择
        if (this.experiments.length > 0) {
            this.showExperimentSelectionModal(record, 'qPCR分析结果');
        } else {
            // 没有实验项目，直接保存
            this.records.push(record);
            this.saveData();
            alert('qPCR结果已保存到实验记录！');
        }
    }

    // 生成qPCR分析报告HTML
    generateQPCRReportHTML(results) {
        const reportHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 1.5rem;">🧬 qPCR相对定量分析报告</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">生成时间: ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 1.2rem;">📊 实验基本信息</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="margin: 5px 0;"><strong>目标基因:</strong> ${results.targetGene}</p>
                            <p style="margin: 5px 0;"><strong>参考基因:</strong> ${results.referenceGene}</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;"><strong>对照组:</strong> ${results.controlGroup || '对照组'}</p>
                            <p style="margin: 5px 0;"><strong>实验组:</strong> ${results.experimentalGroup || '实验组'}</p>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 1.2rem;">📋 原始数据表格</h3>
                    <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" rowspan="2">组别</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" colspan="2">Ct值</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" colspan="2">ΔCt值</th>
                                    <th style="padding: 12px; text-align: center;" rowspan="2">2^(-ΔΔCt)<br><small>(相对表达量)</small></th>
                                </tr>
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">${results.referenceGene}</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">${results.targetGene}</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">ΔCt</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">ΔΔCt</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateHTMLDataRows(results, 'control', '对照组')}
                                ${this.generateHTMLDataRows(results, 'experimental', '实验组')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                        <h4 style="color: #667eea; margin: 0 0 10px 0;">对照组统计</h4>
                        <p style="margin: 5px 0; font-size: 0.9rem;">样本数: ${results.statistics.control.n}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">平均ΔCt: ${results.deltaCt.control.mean.toFixed(3)} ± ${results.deltaCt.control.sem.toFixed(3)}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">相对表达量: ${results.statistics.control.mean.toFixed(3)} ± ${results.statistics.control.sem.toFixed(3)}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">变异系数: ${results.statistics.control.cv.toFixed(2)}%</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                        <h4 style="color: #ff6b6b; margin: 0 0 10px 0;">实验组统计</h4>
                        <p style="margin: 5px 0; font-size: 0.9rem;">样本数: ${results.statistics.experimental.n}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">平均ΔCt: ${results.deltaCt.experimental.mean.toFixed(3)} ± ${results.deltaCt.experimental.sem.toFixed(3)}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">相对表达量: ${results.statistics.experimental.mean.toFixed(3)} ± ${results.statistics.experimental.sem.toFixed(3)}</p>
                        <p style="margin: 5px 0; font-size: 0.9rem;">变异系数: ${results.statistics.experimental.cv.toFixed(2)}%</p>
                    </div>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                    <h3 style="color: #1976D2; margin: 0 0 15px 0;">📈 分析结果</h3>
                    <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                        <div>
                            <span style="font-size: 1.2rem; font-weight: bold; color: ${results.foldChange > 1 ? '#d32f2f' : '#1976d2'};">
                                倍数变化: ${results.foldChange.toFixed(3)}倍
                            </span>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                                (${results.foldChange > 1 ? '上调' : '下调'})
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 1.2rem; font-weight: bold; color: ${results.significance.level !== 'ns' ? '#388e3c' : '#666'};">
                                ${results.significance.text}
                            </span>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                                p = ${results.tTest.pValue < 0.001 ? '<0.001' : results.tTest.pValue.toFixed(4)}
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <h4 style="color: #666; margin: 0 0 10px 0; font-size: 1rem;">统计检验详情</h4>
                    <p style="margin: 5px 0; font-size: 0.9rem;">t统计量: ${results.tTest.tStatistic.toFixed(4)}</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">自由度: ${results.tTest.degreesOfFreedom}</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">p值: ${results.tTest.pValue < 0.001 ? '<0.001' : results.tTest.pValue.toFixed(4)}</p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #ddd; border-top: none; font-size: 0.8rem; color: #666;">
                本报告由实验管理系统自动生成 | qPCR相对定量分析基于2^(-ΔΔCt)方法
            </div>
        </div>
        `;
        
        return reportHtml;
    }

    // 生成多基因qPCR分析报告HTML
    generateMultiGeneQPCRReportHTML(multiResults) {
        const timestamp = Date.now(); // 生成一个时间戳用于创建唯一ID
        const reportHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 1.5rem;">🧬 多基因qPCR相对定量分析报告</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">生成时间: ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 1.2rem;">📊 实验基本信息</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="margin: 5px 0;"><strong>参考基因:</strong> ${multiResults.referenceGene}</p>
                            <p style="margin: 5px 0;"><strong>目标基因:</strong> ${multiResults.results.map(r => r.targetGene).join(', ')}</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;"><strong>对照组:</strong> ${multiResults.controlGroup || '对照组'}</p>
                            <p style="margin: 5px 0;"><strong>实验组:</strong> ${multiResults.experimentalGroup || '实验组'}</p>
                        </div>
                    </div>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
                    <h3 style="color: #1976D2; margin: 0 0 15px 0;">📈 统计汇总</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #1976D2;">${multiResults.results.length}</div>
                            <div style="font-size: 0.9rem; color: #666;">分析基因数</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #388e3c;">${multiResults.results.filter(r => r.significance.level !== 'ns').length}</div>
                            <div style="font-size: 0.9rem; color: #666;">显著变化基因</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #d32f2f;">${multiResults.results.filter(r => r.foldChange > 1 && r.significance.level !== 'ns').length}</div>
                            <div style="font-size: 0.9rem; color: #666;">上调基因</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #1976d2;">${multiResults.results.filter(r => r.foldChange < 1 && r.significance.level !== 'ns').length}</div>
                            <div style="font-size: 0.9rem; color: #666;">下调基因</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #667eea; margin: 0; font-size: 1.2rem;">📋 各基因分析结果</h3>
                        <div class="table-copy-options" style="display: flex; gap: 8px;">
                            <button class="btn btn-copy" onclick="app.copyTable('summary-table-${timestamp}', 'html')" 
                                style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;" 
                                title="复制汇总表格HTML代码">
                                🔗 复制HTML
                            </button>
                            <button class="btn btn-copy btn-copy-recommended" onclick="app.copyTable('summary-table-${timestamp}', 'text')" 
                                style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;" 
                                title="复制汇总表格为制表符分隔的文本格式">
                                📋 复制文本 (推荐)
                            </button>
                        </div>
                    </div>
                    <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                        <div id="summary-table-${timestamp}" class="table-content">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                <thead>
                                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">基因名称</th>
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">倍数变化</th>
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">变化趋势</th>
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">显著性</th>
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">p值</th>
                                        <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">对照组表达量</th>
                                        <th style="padding: 12px; text-align: center;">实验组表达量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${multiResults.results.map((result, index) => `
                                    <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-bottom: 1px solid #eee;">
                                        <td style="padding: 12px; text-align: center; font-weight: bold; color: #667eea;">${result.targetGene}</td>
                                        <td style="padding: 12px; text-align: center; font-weight: bold; color: ${result.foldChange > 1 ? '#d32f2f' : '#1976d2'};">
                                            ${result.foldChange.toFixed(3)}倍
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="background: ${result.foldChange > 1 ? '#ffebee' : '#e3f2fd'}; color: ${result.foldChange > 1 ? '#d32f2f' : '#1976d2'}; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">
                                                ${result.foldChange > 1 ? '↗ 上调' : '↘ 下调'}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; text-align: center; font-weight: bold; color: ${result.significance.level !== 'ns' ? '#388e3c' : '#666'};">
                                            ${result.significance.text}
                                        </td>
                                        <td style="padding: 12px; text-align: center; font-family: monospace;">
                                            ${result.tTest.pValue < 0.001 ? '<0.001' : result.tTest.pValue.toFixed(4)}
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            ${result.statistics.control.mean.toFixed(3)} ± ${result.statistics.control.sem.toFixed(3)}
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            ${result.statistics.experimental.mean.toFixed(3)} ± ${result.statistics.experimental.sem.toFixed(3)}
                                        </td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                ${multiResults.results.map((result, index) => `
                <div style="margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.1rem;">${result.targetGene} 详细数据表格</h4>
                        <div class="table-copy-options" style="display: flex; gap: 8px;">
                            <button class="btn btn-copy" onclick="app.copyTable('gene-table-${result.targetGene}-${timestamp}-${index}', 'html')" 
                                style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;" 
                                title="复制${result.targetGene}表格HTML代码">
                                🔗 HTML
                            </button>
                            <button class="btn btn-copy btn-copy-recommended" onclick="app.copyTable('gene-table-${result.targetGene}-${timestamp}-${index}', 'text')" 
                                style="background: rgba(255,255,255,0.9); color: #667eea; border: none; padding: 4px 8px; border-radius: 3px; font-size: 0.7rem; cursor: pointer; font-weight: bold;" 
                                title="复制${result.targetGene}表格为制表符分隔的文本格式">
                                📋 文本
                            </button>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; background: white;">
                        <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                            <div id="gene-table-${result.targetGene}-${timestamp}-${index}" class="table-content">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" rowspan="2">组别</th>
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" colspan="2">Ct值</th>
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);" colspan="2">ΔCt值</th>
                                            <th style="padding: 12px; text-align: center;" rowspan="2">2^(-ΔΔCt)<br><small>(相对表达量)</small></th>
                                        </tr>
                                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">${multiResults.referenceGene}</th>
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">${result.targetGene}</th>
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">ΔCt</th>
                                            <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">ΔΔCt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.generateHTMLDataRows(result, 'control', '对照组')}
                                        ${this.generateHTMLDataRows(result, 'experimental', '实验组')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                                <h4 style="color: #667eea; margin: 0 0 10px 0;">对照组统计</h4>
                                <p style="margin: 5px 0; font-size: 0.9rem;">样本数: ${result.statistics.control.n}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">平均ΔCt: ${result.deltaCt.control.mean.toFixed(3)} ± ${result.deltaCt.control.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">相对表达量: ${result.statistics.control.mean.toFixed(3)} ± ${result.statistics.control.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">变异系数: ${result.statistics.control.cv.toFixed(2)}%</p>
                            </div>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                                <h4 style="color: #ff6b6b; margin: 0 0 10px 0;">实验组统计</h4>
                                <p style="margin: 5px 0; font-size: 0.9rem;">样本数: ${result.statistics.experimental.n}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">平均ΔCt: ${result.deltaCt.experimental.mean.toFixed(3)} ± ${result.deltaCt.experimental.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">相对表达量: ${result.statistics.experimental.mean.toFixed(3)} ± ${result.statistics.experimental.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">变异系数: ${result.statistics.experimental.cv.toFixed(2)}%</p>
                            </div>
                        </div>

                        <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px;">
                            <h4 style="color: #1976D2; margin: 0 0 15px 0;">📈 ${result.targetGene} 分析结果</h4>
                            <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                                <div>
                                    <span style="font-size: 1.2rem; font-weight: bold; color: ${result.foldChange > 1 ? '#d32f2f' : '#1976d2'};">
                                        倍数变化: ${result.foldChange.toFixed(3)}倍
                                    </span>
                                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                                        (${result.foldChange > 1 ? '上调' : '下调'})
                                    </div>
                                </div>
                                <div>
                                    <span style="font-size: 1.2rem; font-weight: bold; color: ${result.significance.level !== 'ns' ? '#388e3c' : '#666'};">
                                        ${result.significance.text}
                                    </span>
                                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                                        p = ${result.tTest.pValue < 0.001 ? '<0.001' : result.tTest.pValue.toFixed(4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <h4 style="color: #666; margin: 0 0 10px 0; font-size: 1rem;">统计检验详情</h4>
                            <p style="margin: 5px 0; font-size: 0.9rem;">t统计量: ${result.tTest.tStatistic.toFixed(4)}</p>
                            <p style="margin: 5px 0; font-size: 0.9rem;">自由度: ${result.tTest.degreesOfFreedom}</p>
                            <p style="margin: 5px 0; font-size: 0.9rem;">p值: ${result.tTest.pValue < 0.001 ? '<0.001' : result.tTest.pValue.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
                `).join('')}

                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <h4 style="color: #666; margin: 0 0 10px 0; font-size: 1rem;">方法说明</h4>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• qPCR相对定量分析基于2^(-ΔΔCt)方法</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• ΔCt = 目标基因Ct - 参考基因Ct</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• ΔΔCt = 实验组ΔCt - 对照组ΔCt平均值</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• 统计检验: 独立样本t检验</p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #ddd; border-top: none; font-size: 0.8rem; color: #666;">
                本报告由实验管理系统自动生成 | 多基因qPCR相对定量分析
            </div>
        </div>
        `;
        
        return reportHtml;
    }

    // 生成HTML格式的数据行
    generateHTMLDataRows(results, groupType, groupName) {
        const refCt = results.rawData[groupType === 'control' ? 'controlRefCt' : 'expRefCt'];
        const targetCt = results.rawData[groupType === 'control' ? 'controlTargetCt' : 'expTargetCt'];
        const deltaCt = results.deltaCt[groupType === 'control' ? 'control' : 'experimental'].values;
        const relativeExp = results.relativeExpression[groupType === 'control' ? 'control' : 'experimental'];
        
        let rows = '';
        const maxLength = Math.max(refCt.length, targetCt.length);
        const rowStyle = groupType === 'control' ? 'background-color: #f8f9fa;' : 'background-color: #fff3e0;';
        
        for (let i = 0; i < maxLength; i++) {
            const ref = refCt[i] || refCt[0];
            const target = targetCt[i] || targetCt[0];
            const delta = deltaCt[i];
            const relative = relativeExp[i];
            
            // 计算ΔΔCt (相对于对照组均值)
            const controlMean = results.deltaCt.control.mean;
            const deltaDelta = delta - controlMean;
            
            rows += `
                <tr style="${rowStyle}">
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${groupName} ${i + 1}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${ref.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${target.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${delta.toFixed(3)}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${deltaDelta.toFixed(3)}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${relative.toFixed(3)}</td>
                </tr>
            `;
        }
        
        return rows;
    }

    // 生成3组比较中单个比较的数据行
    generate3GroupDataRows(comparison, refGeneName, targetGeneName) {
        const rows = [];
        
        // 添加对照组数据
        const controlRefCt = comparison.rawData.controlRefCt;
        const controlTargetCt = comparison.rawData.controlTargetCt;
        for (let i = 0; i < controlRefCt.length; i++) {
            const refCt = controlRefCt[i];
            const targetCt = controlTargetCt[i] || controlTargetCt[0];
            const deltaCt = comparison.deltaCt.control.values[i];
            const deltaDeltaCt = deltaCt - comparison.deltaCt.control.mean;
            const relativeExp = Math.pow(2, -deltaDeltaCt);
            
            rows.push(`
                <tr>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${comparison.controlGroup} ${i + 1}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${refCt.toFixed(2)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${targetCt.toFixed(2)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaCt.toFixed(3)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaDeltaCt.toFixed(3)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${relativeExp.toFixed(3)}</td>
                </tr>
            `);
        }
        
        // 添加实验组数据
        const expRefCt = comparison.rawData.expRefCt;
        const expTargetCt = comparison.rawData.expTargetCt;
        for (let i = 0; i < expRefCt.length; i++) {
            const refCt = expRefCt[i];
            const targetCt = expTargetCt[i] || expTargetCt[0];
            const deltaCt = comparison.deltaCt.experimental.values[i];
            const deltaDeltaCt = deltaCt - comparison.deltaCt.control.mean;
            const relativeExp = comparison.relativeExpression.experimental[i];
            
            rows.push(`
                <tr style="background-color: #f8f9fa;">
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${comparison.experimentalGroup} ${i + 1}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${refCt.toFixed(2)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${targetCt.toFixed(2)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaCt.toFixed(3)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaDeltaCt.toFixed(3)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px;">${relativeExp.toFixed(3)}</td>
                </tr>
            `);
        }
        
        return rows.join('');
    }

    // 生成所有3组的完整数据行
    generateAll3GroupsDataRows(results) {
        const rows = [];
        const processedGroups = new Set();
        
        // 从比较结果中提取所有组的数据
        results.comparisons.forEach(comp => {
            // 添加对照组数据（避免重复）
            if (!processedGroups.has(comp.controlGroup)) {
                processedGroups.add(comp.controlGroup);
                const controlRefCt = comp.rawData.controlRefCt;
                const controlTargetCt = comp.rawData.controlTargetCt;
                
                for (let i = 0; i < controlRefCt.length; i++) {
                    const refCt = controlRefCt[i];
                    const targetCt = controlTargetCt[i] || controlTargetCt[0];
                    const deltaCt = comp.deltaCt.control.values[i];
                    
                    // 对于组1（总是作为对照），相对表达量为1
                    const relativeExp = comp.controlGroup === results.comparisons[0].controlGroup ? 1 : 
                                      comp.statistics.control.mean;
                    
                    rows.push(`
                        <tr>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${comp.controlGroup}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${i + 1}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${refCt.toFixed(2)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${targetCt.toFixed(2)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaCt.toFixed(3)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${relativeExp.toFixed(3)}</td>
                        </tr>
                    `);
                }
            }
            
            // 添加实验组数据（避免重复）
            if (!processedGroups.has(comp.experimentalGroup)) {
                processedGroups.add(comp.experimentalGroup);
                const expRefCt = comp.rawData.expRefCt;
                const expTargetCt = comp.rawData.expTargetCt;
                
                for (let i = 0; i < expRefCt.length; i++) {
                    const refCt = expRefCt[i];
                    const targetCt = expTargetCt[i] || expTargetCt[0];
                    const deltaCt = comp.deltaCt.experimental.values[i];
                    const relativeExp = comp.relativeExpression.experimental[i];
                    
                    rows.push(`
                        <tr style="background-color: #f8f9fa;">
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${comp.experimentalGroup}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${i + 1}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${refCt.toFixed(2)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${targetCt.toFixed(2)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${deltaCt.toFixed(3)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${relativeExp.toFixed(3)}</td>
                        </tr>
                    `);
                }
            }
        });
        
        return rows.join('');
    }

    // 保存多基因qPCR结果
    saveMultiGeneQPCRResults(multiResults) {
        const genes = multiResults.results.map(r => r.targetGene).join(', ');
        // 使用HTML格式生成美观的报告
        const recordContent = this.generateMultiGeneQPCRReportHTML(multiResults);

        const record = {
            id: this.generateId(),
            experimentId: '',
            date: new Date().toISOString().split('T')[0],
            content: recordContent,
            parameters: `参考基因: ${multiResults.referenceGene}, 目标基因: ${genes}, 分组: ${multiResults.controlGroup} vs ${multiResults.experimentalGroup}`,
            results: `多基因分析: ${multiResults.results.length}个基因, ${multiResults.results.filter(r => r.significance.level !== 'ns').length}个显著变化`,
            createdAt: new Date().toISOString(),
            type: 'multi_gene_qpcr_analysis' // 标记为多基因qPCR分析结果
        };

        if (this.experiments.length > 0) {
            this.showExperimentSelectionModal(record, '多基因qPCR分析结果');
        } else {
            this.records.push(record);
            this.saveData();
            alert('多基因qPCR结果已保存到实验记录！');
        }
    }

    // 保存3组qPCR比较结果
    save3GroupQPCRResults(results) {
        // 生成3组比较报告
        const recordContent = this.generate3GroupQPCRReportHTML(results);
        
        const record = {
            id: this.generateId(),
            experimentId: '',
            date: new Date().toISOString().split('T')[0],
            content: recordContent,
            parameters: `参考基因: ${results.referenceGene}, 目标基因: ${results.targetGene}, 3组两两比较`,
            results: `3组比较: ${results.comparisons.filter(c => c.significance.level !== 'ns').length}/${results.comparisons.length}个显著差异`,
            createdAt: new Date().toISOString(),
            type: '3group_qpcr_analysis' // 标记为3组qPCR分析结果
        };
        
        if (this.experiments.length > 0) {
            this.showExperimentSelectionModal(record, '3组qPCR比较结果');
        } else {
            this.records.push(record);
            this.saveData();
            alert('3组qPCR比较结果已保存到实验记录！');
        }
    }

    // 生成3组qPCR比较报告HTML
    generate3GroupQPCRReportHTML(results) {
        const reportHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 1.5rem;">🧬 3组qPCR两两比较分析报告</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">生成时间: ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 1.2rem;">📊 实验基本信息</h3>
                    <p style="margin: 5px 0;"><strong>目标基因:</strong> ${results.targetGene}</p>
                    <p style="margin: 5px 0;"><strong>参考基因:</strong> ${results.referenceGene}</p>
                    <p style="margin: 5px 0;"><strong>分析类型:</strong> 3组两两比较</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 1.2rem;">📈 比较结果汇总</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #e9ecef;">
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">比较组</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">倍数变化</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">p值</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">显著性</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.comparisons.map(comp => `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${comp.comparisonName}</td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: ${comp.foldChange > 1 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                        ${comp.foldChange.toFixed(3)}倍
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                                        ${comp.tTest.pValue < 0.001 ? '<0.001' : comp.tTest.pValue.toFixed(4)}
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                                        <span style="color: ${comp.significance.level !== 'ns' ? '#28a745' : '#6c757d'};">
                                            ${comp.significance.text}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                ${results.comparisons.map(comp => `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="color: #495057; margin: 0 0 10px 0;">${comp.comparisonName} 详细分析</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p style="margin: 5px 0;"><strong>${comp.controlGroup}:</strong></p>
                                <p style="margin: 5px 0; padding-left: 20px;">ΔCt: ${comp.deltaCt.control.mean.toFixed(3)} ± ${comp.deltaCt.control.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; padding-left: 20px;">相对表达量: 1.000 ± ${comp.statistics.control.sem.toFixed(3)}</p>
                            </div>
                            <div>
                                <p style="margin: 5px 0;"><strong>${comp.experimentalGroup}:</strong></p>
                                <p style="margin: 5px 0; padding-left: 20px;">ΔCt: ${comp.deltaCt.experimental.mean.toFixed(3)} ± ${comp.deltaCt.experimental.sem.toFixed(3)}</p>
                                <p style="margin: 5px 0; padding-left: 20px;">相对表达量: ${comp.statistics.experimental.mean.toFixed(3)} ± ${comp.statistics.experimental.sem.toFixed(3)}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 1.2rem;">📋 原始数据表格</h3>
                    
                    ${results.comparisons.map(comp => `
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 1rem;">${comp.comparisonName} 详细数据</h4>
                            <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                            <th style="padding: 12px; text-align: center;">样本</th>
                                            <th style="padding: 12px; text-align: center;">${results.referenceGene} Ct</th>
                                            <th style="padding: 12px; text-align: center;">${results.targetGene} Ct</th>
                                            <th style="padding: 12px; text-align: center;">ΔCt</th>
                                            <th style="padding: 12px; text-align: center;">ΔΔCt</th>
                                            <th style="padding: 12px; text-align: center;">2^(-ΔΔCt)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.generate3GroupDataRows(comp, results.referenceGene, results.targetGene)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `).join('')}
                    
                    <div style="margin-top: 25px;">
                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 1rem;">所有组完整数据汇总</h4>
                        <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                <thead>
                                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                        <th style="padding: 12px; text-align: center;">组别</th>
                                        <th style="padding: 12px; text-align: center;">样本</th>
                                        <th style="padding: 12px; text-align: center;">${results.referenceGene} Ct</th>
                                        <th style="padding: 12px; text-align: center;">${results.targetGene} Ct</th>
                                        <th style="padding: 12px; text-align: center;">ΔCt</th>
                                        <th style="padding: 12px; text-align: center;">相对表达量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.generateAll3GroupsDataRows(results)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #666; margin: 0 0 10px 0; font-size: 1rem;">方法说明</h4>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• qPCR相对定量分析基于2^(-ΔΔCt)方法</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• 每个比较中，第一组作为对照组，第二组作为实验组</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• 统计检验: 独立样本t检验</p>
                    <p style="margin: 5px 0; font-size: 0.9rem;">• 显著性水平: *p<0.05, **p<0.01, ***p<0.001</p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #ddd; border-top: none; font-size: 0.8rem; color: #666;">
                本报告由实验管理系统自动生成 | 3组qPCR两两比较分析
            </div>
        </div>
        `;
        
        return reportHtml;
    }

    // 显示实验选择模态框
    showExperimentSelectionModal(record, title) {
        const experimentOptions = this.experiments.map(exp => 
            `<option value="${exp.id}">${exp.title}</option>`
        ).join('');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
            align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3>保存${title}</h3>
                <p>选择要关联的实验项目：</p>
                <select id="temp-experiment-select" style="width: 100%; padding: 8px; margin: 10px 0;">
                    <option value="">选择关联的实验项目</option>
                    ${experimentOptions}
                </select>
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn-cancel" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">取消</button>
                    <button class="btn-save" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        const saveBtn = modal.querySelector('.btn-save');
        const cancelBtn = modal.querySelector('.btn-cancel');
        
        saveBtn.addEventListener('click', () => {
            const selectedExperiment = document.getElementById('temp-experiment-select').value;
            
            if (selectedExperiment) {
                record.experimentId = selectedExperiment;
                this.records.push(record);
                this.saveData();
                
                modal.remove();
                alert(`${title}已保存到实验记录！`);
            } else {
                alert('请选择一个实验项目');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 导出qPCR结果
    exportQPCRResults() {
        if (!this.lastQPCRResults) {
            alert('没有可导出的qPCR结果');
            return;
        }

        const results = this.lastQPCRResults;
        let exportData;
        let filename;

        // 处理3组比较结果
        if (results.is3GroupComparison) {
            exportData = {
                分析类型: '3组qPCR两两比较分析',
                基本信息: {
                    参考基因: results.referenceGene,
                    目标基因: results.targetGene,
                    分析时间: new Date().toLocaleString(),
                    比较数量: results.comparisons.length
                },
                比较结果: results.comparisons.map(comp => ({
                    比较组: comp.comparisonName,
                    对照组: comp.controlGroup,
                    实验组: comp.experimentalGroup,
                    倍数变化: parseFloat(comp.foldChange.toFixed(3)),
                    统计检验: {
                        t统计量: parseFloat(comp.tTest.tStatistic.toFixed(4)),
                        自由度: comp.tTest.degreesOfFreedom,
                        p值: parseFloat(comp.tTest.pValue.toFixed(6)),
                        显著性: comp.significance.text
                    },
                    详细数据: {
                        对照组ΔCt: {
                            均值: parseFloat(comp.deltaCt.control.mean.toFixed(3)),
                            标准误: parseFloat(comp.deltaCt.control.sem.toFixed(3))
                        },
                        实验组ΔCt: {
                            均值: parseFloat(comp.deltaCt.experimental.mean.toFixed(3)),
                            标准误: parseFloat(comp.deltaCt.experimental.sem.toFixed(3))
                        },
                        对照组相对表达量: {
                            均值: 1.000,
                            标准误: parseFloat(comp.statistics.control.sem.toFixed(3))
                        },
                        实验组相对表达量: {
                            均值: parseFloat(comp.statistics.experimental.mean.toFixed(3)),
                            标准误: parseFloat(comp.statistics.experimental.sem.toFixed(3))
                        }
                    }
                })),
                统计汇总: {
                    总比较数: results.comparisons.length,
                    显著差异数: results.comparisons.filter(c => c.significance.level !== 'ns').length,
                    上调基因数: results.comparisons.filter(c => c.foldChange > 1 && c.significance.level !== 'ns').length,
                    下调基因数: results.comparisons.filter(c => c.foldChange < 1 && c.significance.level !== 'ns').length
                }
            };
            filename = `3组qPCR比较_${results.targetGene}_${new Date().toISOString().split('T')[0]}.json`;
        }
        // 处理多基因结果
        else if (results.isMultiGene) {
            exportData = {
                分析类型: '多基因qPCR相对定量分析',
                基本信息: {
                    参考基因: results.referenceGene,
                    目标基因: results.results.map(r => r.targetGene),
                    对照组: results.controlGroup,
                    实验组: results.experimentalGroup,
                    分析时间: new Date().toLocaleString(),
                    基因数量: results.results.length
                },
                各基因结果: results.results.map(result => ({
                    目标基因: result.targetGene,
                    倍数变化: parseFloat(result.foldChange.toFixed(3)),
                    显著性: result.significance.text,
                    p值: parseFloat(result.tTest.pValue.toFixed(6)),
                    对照组相对表达量: {
                        均值: parseFloat(result.statistics.control.mean.toFixed(3)),
                        标准误: parseFloat(result.statistics.control.sem.toFixed(3)),
                        样本数: result.statistics.control.n,
                        个体数据: result.relativeExpression.control.map(v => parseFloat(v.toFixed(3)))
                    },
                    实验组相对表达量: {
                        均值: parseFloat(result.statistics.experimental.mean.toFixed(3)),
                        标准误: parseFloat(result.statistics.experimental.sem.toFixed(3)),
                        样本数: result.statistics.experimental.n,
                        个体数据: result.relativeExpression.experimental.map(v => parseFloat(v.toFixed(3)))
                    },
                    原始数据: {
                        对照组参考基因Ct: result.rawData.controlRefCt,
                        对照组目标基因Ct: result.rawData.controlTargetCt,
                        实验组参考基因Ct: result.rawData.expRefCt,
                        实验组目标基因Ct: result.rawData.expTargetCt
                    }
                })),
                统计汇总: {
                    总基因数: results.results.length,
                    显著变化基因数: results.results.filter(r => r.significance.level !== 'ns').length,
                    上调基因数: results.results.filter(r => r.foldChange > 1 && r.significance.level !== 'ns').length,
                    下调基因数: results.results.filter(r => r.foldChange < 1 && r.significance.level !== 'ns').length
                }
            };
            filename = `多基因qPCR结果_${results.results.map(r => r.targetGene).join('_')}_${new Date().toISOString().split('T')[0]}.json`;
        } else {
            // 单基因结果
            exportData = {
                分析类型: 'qPCR相对定量分析',
                基本信息: {
                    目标基因: results.targetGene,
                    参考基因: results.referenceGene,
                    对照组: results.controlGroup || '对照组',
                    实验组: results.experimentalGroup || '实验组',
                    分析时间: new Date().toLocaleString()
                },
                原始数据: {
                    对照组参考基因Ct: results.rawData.controlRefCt,
                    对照组目标基因Ct: results.rawData.controlTargetCt,
                    实验组参考基因Ct: results.rawData.expRefCt,
                    实验组目标基因Ct: results.rawData.expTargetCt
                },
                个体数据: {
                    对照组相对表达量: results.relativeExpression.control.map(v => parseFloat(v.toFixed(3))),
                    实验组相对表达量: results.relativeExpression.experimental.map(v => parseFloat(v.toFixed(3)))
                },
                计算结果: {
                    对照组ΔCt: {
                        均值: parseFloat(results.deltaCt.control.mean.toFixed(3)),
                        标准差: parseFloat(results.deltaCt.control.std.toFixed(3)),
                        标准误: parseFloat(results.deltaCt.control.sem.toFixed(3)),
                        样本数: results.deltaCt.control.n
                    },
                    实验组ΔCt: {
                        均值: parseFloat(results.deltaCt.experimental.mean.toFixed(3)),
                        标准差: parseFloat(results.deltaCt.experimental.std.toFixed(3)),
                        标准误: parseFloat(results.deltaCt.experimental.sem.toFixed(3)),
                        样本数: results.deltaCt.experimental.n
                    },
                    对照组相对表达量统计: {
                        均值: parseFloat(results.statistics.control.mean.toFixed(3)),
                        标准误: parseFloat(results.statistics.control.sem.toFixed(3)),
                        变异系数: parseFloat(results.statistics.control.cv.toFixed(2))
                    },
                    实验组相对表达量统计: {
                        均值: parseFloat(results.statistics.experimental.mean.toFixed(3)),
                        标准误: parseFloat(results.statistics.experimental.sem.toFixed(3)),
                        变异系数: parseFloat(results.statistics.experimental.cv.toFixed(2))
                    },
                    倍数变化: parseFloat(results.foldChange.toFixed(3)),
                    变化方向: results.foldChange > 1 ? '上调' : '下调',
                    显著性水平: results.significance.text
                },
                统计检验: {
                    t值: parseFloat(results.tTest.tStatistic.toFixed(4)),
                    自由度: results.tTest.degreesOfFreedom,
                    p值: parseFloat(results.tTest.pValue.toFixed(6)),
                    显著性: results.significance.level
                }
            };
            filename = `qPCR结果_${results.targetGene}_${new Date().toISOString().split('T')[0]}.json`;
        }

        // 创建并下载文件
        try {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('qPCR结果已导出！文件包含了完整的原始数据、个体数据点和统计分析结果。');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请检查浏览器设置');
        }
    }

    // 导出qPCR数据表格为CSV
    exportQPCRResultsCSV() {
        if (!this.lastQPCRResults) {
            alert('没有可导出的qPCR数据');
            return;
        }

        const results = this.lastQPCRResults;
        let csvContent = '';
        let filename = '';

        // 处理3组比较结果
        if (results.is3GroupComparison) {
            csvContent = this.generate3GroupCSV(results);
            filename = `3组qPCR比较数据_${results.targetGene}_${new Date().toISOString().split('T')[0]}.csv`;
        }
        // 处理多基因结果
        else if (results.isMultiGene) {
            // 多基因CSV导出
            csvContent = this.generateMultiGeneCSV(results);
            filename = `多基因qPCR数据_${results.results.map(r => r.targetGene).join('_')}_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            // 单基因CSV导出
            csvContent = this.generateSingleGeneCSV(results);
            filename = `qPCR数据_${results.targetGene}_${new Date().toISOString().split('T')[0]}.csv`;
        }

        // 创建并下载CSV文件
        try {
            // 添加BOM以支持中文显示
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('qPCR数据表格已导出为CSV格式！可以直接用Excel或其他软件打开。');
        } catch (error) {
            console.error('CSV导出失败:', error);
            alert('CSV导出失败，请检查浏览器设置');
        }
    }

    // 生成单基因CSV数据
    generateSingleGeneCSV(results) {
        let csv = '';
        
        // 基本信息
        csv += `qPCR相对定量分析数据\n`;
        csv += `分析时间,${new Date().toLocaleString()}\n`;
        csv += `目标基因,${results.targetGene}\n`;
        csv += `参考基因,${results.referenceGene}\n`;
        csv += `对照组,${results.controlGroup || '对照组'}\n`;
        csv += `实验组,${results.experimentalGroup || '实验组'}\n`;
        csv += `\n`;

        // 原始数据表格
        csv += `原始数据表格\n`;
        csv += `组别,${results.referenceGene} Ct,${results.targetGene} Ct,ΔCt,ΔΔCt,相对表达量(2^-ΔΔCt)\n`;
        
        // 对照组数据
        const controlRefCt = results.rawData.controlRefCt;
        const controlTargetCt = results.rawData.controlTargetCt;
        const controlDeltaCt = results.deltaCt.control.values;
        const controlRelativeExp = results.relativeExpression.control;
        
        for (let i = 0; i < controlRefCt.length; i++) {
            const deltaDelta = controlDeltaCt[i] - results.deltaCt.control.mean;
            csv += `对照组 ${i + 1},${controlRefCt[i].toFixed(2)},${controlTargetCt[i].toFixed(2)},${controlDeltaCt[i].toFixed(3)},${deltaDelta.toFixed(3)},${controlRelativeExp[i].toFixed(3)}\n`;
        }
        
        // 实验组数据
        const expRefCt = results.rawData.expRefCt;
        const expTargetCt = results.rawData.expTargetCt;
        const expDeltaCt = results.deltaCt.experimental.values;
        const expRelativeExp = results.relativeExpression.experimental;
        
        for (let i = 0; i < expRefCt.length; i++) {
            const deltaDelta = expDeltaCt[i] - results.deltaCt.control.mean;
            csv += `实验组 ${i + 1},${expRefCt[i].toFixed(2)},${expTargetCt[i].toFixed(2)},${expDeltaCt[i].toFixed(3)},${deltaDelta.toFixed(3)},${expRelativeExp[i].toFixed(3)}\n`;
        }
        
        csv += `\n`;
        
        // 统计汇总
        csv += `统计汇总\n`;
        csv += `指标,对照组,实验组\n`;
        csv += `样本数,${results.statistics.control.n},${results.statistics.experimental.n}\n`;
        csv += `平均ΔCt,${results.deltaCt.control.mean.toFixed(3)},${results.deltaCt.experimental.mean.toFixed(3)}\n`;
        csv += `ΔCt标准误,${results.deltaCt.control.sem.toFixed(3)},${results.deltaCt.experimental.sem.toFixed(3)}\n`;
        csv += `相对表达量均值,${results.statistics.control.mean.toFixed(3)},${results.statistics.experimental.mean.toFixed(3)}\n`;
        csv += `相对表达量标准误,${results.statistics.control.sem.toFixed(3)},${results.statistics.experimental.sem.toFixed(3)}\n`;
        csv += `变异系数(%),${results.statistics.control.cv.toFixed(2)},${results.statistics.experimental.cv.toFixed(2)}\n`;
        csv += `\n`;
        
        // 分析结果
        csv += `分析结果\n`;
        csv += `倍数变化,${results.foldChange.toFixed(3)}\n`;
        csv += `变化方向,${results.foldChange > 1 ? '上调' : '下调'}\n`;
        csv += `t统计量,${results.tTest.tStatistic.toFixed(4)}\n`;
        csv += `自由度,${results.tTest.degreesOfFreedom}\n`;
        csv += `p值,${results.tTest.pValue < 0.001 ? '<0.001' : results.tTest.pValue.toFixed(4)}\n`;
        csv += `显著性,${results.significance.text}\n`;
        
        return csv;
    }

    // 生成3组比较CSV数据
    generate3GroupCSV(results) {
        let csv = '';
        
        // 基本信息
        csv += `3组qPCR两两比较分析数据\n`;
        csv += `分析时间,${new Date().toLocaleString()}\n`;
        csv += `目标基因,${results.targetGene}\n`;
        csv += `参考基因,${results.referenceGene}\n`;
        csv += `\n`;
        
        // 比较结果汇总表
        csv += `两两比较结果汇总\n`;
        csv += `比较组,倍数变化,t值,df,p值,显著性\n`;
        
        results.comparisons.forEach(comp => {
            csv += `${comp.comparisonName},${comp.foldChange.toFixed(3)},${comp.tTest.tStatistic.toFixed(4)},${comp.tTest.degreesOfFreedom},${comp.tTest.pValue < 0.001 ? '<0.001' : comp.tTest.pValue.toFixed(4)},${comp.significance.text}\n`;
        });
        
        csv += `\n`;
        csv += `详细统计数据\n`;
        
        // 各组详细数据
        results.comparisons.forEach(comp => {
            csv += `\n${comp.comparisonName}\n`;
            csv += `组别,ΔCt均值,ΔCt标准误,相对表达量均值,相对表达量标准误\n`;
            csv += `${comp.controlGroup},${comp.deltaCt.control.mean.toFixed(3)},${comp.deltaCt.control.sem.toFixed(3)},1.000,${comp.statistics.control.sem.toFixed(3)}\n`;
            csv += `${comp.experimentalGroup},${comp.deltaCt.experimental.mean.toFixed(3)},${comp.deltaCt.experimental.sem.toFixed(3)},${comp.statistics.experimental.mean.toFixed(3)},${comp.statistics.experimental.sem.toFixed(3)}\n`;
        });
        
        csv += `\n`;
        csv += `统计汇总\n`;
        csv += `总比较数,${results.comparisons.length}\n`;
        csv += `显著差异数,${results.comparisons.filter(c => c.significance.level !== 'ns').length}\n`;
        csv += `上调数,${results.comparisons.filter(c => c.foldChange > 1 && c.significance.level !== 'ns').length}\n`;
        csv += `下调数,${results.comparisons.filter(c => c.foldChange < 1 && c.significance.level !== 'ns').length}\n`;
        
        return csv;
    }

    // 生成多基因CSV数据
    generateMultiGeneCSV(multiResults) {
        let csv = '';
        
        // 基本信息
        csv += `多基因qPCR相对定量分析数据\n`;
        csv += `分析时间,${new Date().toLocaleString()}\n`;
        csv += `参考基因,${multiResults.referenceGene}\n`;
        csv += `对照组,${multiResults.controlGroup}\n`;
        csv += `实验组,${multiResults.experimentalGroup}\n`;
        csv += `分析基因数,${multiResults.results.length}\n`;
        csv += `\n`;
        
        // 汇总结果表格
        csv += `各基因分析结果汇总\n`;
        csv += `基因,倍数变化,变化方向,对照组表达量,实验组表达量,p值,显著性\n`;
        
        multiResults.results.forEach(result => {
            csv += `${result.targetGene},${result.foldChange.toFixed(3)},${result.foldChange > 1 ? '上调' : '下调'},${result.statistics.control.mean.toFixed(3)}±${result.statistics.control.sem.toFixed(3)},${result.statistics.experimental.mean.toFixed(3)}±${result.statistics.experimental.sem.toFixed(3)},${result.tTest.pValue < 0.001 ? '<0.001' : result.tTest.pValue.toFixed(4)},${result.significance.text}\n`;
        });
        
        csv += `\n`;
        
        // 为每个基因生成详细数据
        multiResults.results.forEach((result, index) => {
            csv += `${result.targetGene} 基因详细数据\n`;
            csv += `组别,${result.referenceGene} Ct,${result.targetGene} Ct,ΔCt,ΔΔCt,相对表达量(2^-ΔΔCt)\n`;
            
            // 对照组数据
            const controlRefCt = result.rawData.controlRefCt;
            const controlTargetCt = result.rawData.controlTargetCt;
            const controlDeltaCt = result.deltaCt.control.values;
            const controlRelativeExp = result.relativeExpression.control;
            
            for (let i = 0; i < controlRefCt.length; i++) {
                const deltaDelta = controlDeltaCt[i] - result.deltaCt.control.mean;
                csv += `对照组 ${i + 1},${controlRefCt[i].toFixed(2)},${controlTargetCt[i].toFixed(2)},${controlDeltaCt[i].toFixed(3)},${deltaDelta.toFixed(3)},${controlRelativeExp[i].toFixed(3)}\n`;
            }
            
            // 实验组数据
            const expRefCt = result.rawData.expRefCt;
            const expTargetCt = result.rawData.expTargetCt;
            const expDeltaCt = result.deltaCt.experimental.values;
            const expRelativeExp = result.relativeExpression.experimental;
            
            for (let i = 0; i < expRefCt.length; i++) {
                const deltaDelta = expDeltaCt[i] - result.deltaCt.control.mean;
                csv += `实验组 ${i + 1},${expRefCt[i].toFixed(2)},${expTargetCt[i].toFixed(2)},${expDeltaCt[i].toFixed(3)},${deltaDelta.toFixed(3)},${expRelativeExp[i].toFixed(3)}\n`;
            }
            
            csv += `\n`;
        });
        
        // 多基因汇总统计
        const significantGenes = multiResults.results.filter(r => r.significance.level !== 'ns');
        const upRegulated = significantGenes.filter(r => r.foldChange > 1);
        const downRegulated = significantGenes.filter(r => r.foldChange < 1);
        
        csv += `多基因分析汇总\n`;
        csv += `指标,数量\n`;
        csv += `总基因数,${multiResults.results.length}\n`;
        csv += `显著变化基因数,${significantGenes.length}\n`;
        csv += `上调基因数,${upRegulated.length}\n`;
        csv += `下调基因数,${downRegulated.length}\n`;
        
        if (upRegulated.length > 0) {
            csv += `\n上调基因列表\n`;
            csv += `基因,倍数变化,显著性\n`;
            upRegulated.forEach(result => {
                csv += `${result.targetGene},${result.foldChange.toFixed(3)},${result.significance.text}\n`;
            });
        }
        
        if (downRegulated.length > 0) {
            csv += `\n下调基因列表\n`;
            csv += `基因,倍数变化,显著性\n`;
            downRegulated.forEach(result => {
                csv += `${result.targetGene},${result.foldChange.toFixed(3)},${result.significance.text}\n`;
            });
        }
        
        return csv;
    }

    // 切换数据源
    switchDataSource(source) {
        // 更新标签状态
        document.querySelectorAll('.source-tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        // 切换显示内容
        if (source === 'manual') {
            document.getElementById('manual-input-source').style.display = 'block';
            document.getElementById('file-import-source').style.display = 'none';
        } else if (source === 'file') {
            document.getElementById('manual-input-source').style.display = 'none';
            document.getElementById('file-import-source').style.display = 'block';
            // 刷新qPCR文件列表
            this.refreshQPCRFileList();
        }
    }

    // 刷新qPCR文件列表
    refreshQPCRFileList() {
        const qpcrFiles = this.files.filter(file => file.isQPCRData);
        const listContainer = document.getElementById('qpcr-file-list');
        
        if (qpcrFiles.length === 0) {
            listContainer.innerHTML = '<p class="no-files">未检测到qPCR数据文件，请先在文件管理中上传包含qPCR数据的文件</p>';
            return;
        }
        
        let html = '<div class="qpcr-files-grid">';
        qpcrFiles.forEach(file => {
            const genes = [...new Set(file.qpcrData.map(row => row.Target))].slice(0, 3);
            const geneText = genes.length > 3 ? `${genes.join(', ')} 等${genes.length}个基因` : genes.join(', ');
            
            html += `
                <div class="qpcr-file-card" onclick="app.selectQPCRFile('${file.id}')">
                    <div class="file-info">
                        <h5>📄 ${file.name}</h5>
                        <p><strong>数据行数:</strong> ${file.qpcrData.length}</p>
                        <p><strong>基因:</strong> ${geneText}</p>
                        <p><strong>检测列:</strong> ${Object.keys(file.qpcrColumns).join(', ')}</p>
                    </div>
                    <button class="btn btn-primary">选择此文件</button>
                </div>
            `;
        });
        html += '</div>';
        
        listContainer.innerHTML = html;
    }

    // 选择qPCR文件并处理
    selectQPCRFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file || !file.isQPCRData) {
            alert('文件不存在或不是有效的qPCR数据文件');
            return;
        }
        
        // 解析qPCR数据并切换到文件处理界面
        this.processQPCRFile(file);
    }

    // 处理qPCR文件数据
    processQPCRFile(file) {
        try {
            const data = file.qpcrData;
            const columns = file.qpcrColumns;
            
            // 提取基因信息
            const allTargets = [...new Set(data.map(row => row.Target))];
            const allGroups = [...new Set(data.map(row => row['Biological Set Name'] || row['Sample'] || 'Default'))];
            
            // 创建文件数据处理界面
            this.createFileDataInterface(file, allTargets, allGroups, data);
            
        } catch (error) {
            console.error('处理qPCR文件出错:', error);
            alert('处理qPCR文件时出错，请检查文件格式');
        }
    }

    // 创建文件数据处理界面
    createFileDataInterface(file, targets, groups, data) {
        const fileSourceDiv = document.getElementById('file-import-source');
        
        const html = `
            <div class="file-data-processor">
                <h4>📊 ${file.name} - 数据分析设置</h4>
                
                <div class="file-settings">
                    <!-- 分析类型选择 -->
                    <div class="setting-group">
                        <label>选择分析类型:</label>
                        <div class="analysis-type-tabs">
                            <button class="analysis-type-btn active" onclick="app.switchFileAnalysisType('2groups')">2组比较</button>
                            <button class="analysis-type-btn" onclick="app.switchFileAnalysisType('3groups')">3组两两比较</button>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <label>选择参考基因 (内参):</label>
                        <select id="file-reference-gene">
                            ${targets.map(gene => `<option value="${gene}">${gene}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label>选择目标基因:</label>
                        <select id="file-target-gene" multiple>
                            ${targets.map(gene => `<option value="${gene}">${gene}</option>`).join('')}
                        </select>
                        <small>按住Ctrl键可多选</small>
                    </div>
                    
                    <!-- 2组比较选择 -->
                    <div id="file-2groups-selection" class="groups-selection">
                        <div class="setting-group">
                            <label>选择对照组:</label>
                            <select id="file-control-group">
                                <option value="">选择对照组</option>
                                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>选择实验组:</label>
                            <select id="file-experimental-group">
                                <option value="">选择实验组</option>
                                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- 3组比较选择 -->
                    <div id="file-3groups-selection" class="groups-selection" style="display: none;">
                        <div class="setting-group">
                            <label>选择组1 (对照组):</label>
                            <select id="file-group1">
                                <option value="">选择组1</option>
                                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>选择组2:</label>
                            <select id="file-group2">
                                <option value="">选择组2</option>
                                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>选择组3:</label>
                            <select id="file-group3">
                                <option value="">选择组3</option>
                                ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="app.calculateQPCRFromFile('${file.id}')">🧮 开始分析</button>
                        <button class="btn btn-secondary" onclick="app.refreshQPCRFileList()">🔙 返回文件列表</button>
                    </div>
                </div>
                
                <div class="data-preview">
                    <h5>数据预览 (前10行)</h5>
                    <div class="preview-table">
                        ${this.renderDataPreview(data.slice(0, 10), file.qpcrColumns)}
                    </div>
                </div>
            </div>
        `;
        
        fileSourceDiv.innerHTML = html;
        
        // 保存当前文件分析类型到实例变量
        this.currentFileAnalysisType = '2groups';
    }
    
    // 切换文件分析类型
    switchFileAnalysisType(type) {
        const twoGroupsBtn = document.querySelector('#file-import-source .analysis-type-btn[onclick*="2groups"]');
        const threeGroupsBtn = document.querySelector('#file-import-source .analysis-type-btn[onclick*="3groups"]');
        const twoGroupsSelection = document.getElementById('file-2groups-selection');
        const threeGroupsSelection = document.getElementById('file-3groups-selection');
        
        if (type === '2groups') {
            twoGroupsBtn.classList.add('active');
            threeGroupsBtn.classList.remove('active');
            twoGroupsSelection.style.display = 'block';
            threeGroupsSelection.style.display = 'none';
            this.currentFileAnalysisType = '2groups';
        } else if (type === '3groups') {
            twoGroupsBtn.classList.remove('active');
            threeGroupsBtn.classList.add('active');
            twoGroupsSelection.style.display = 'none';
            threeGroupsSelection.style.display = 'block';
            this.currentFileAnalysisType = '3groups';
        }
    }

    // 渲染数据预览表格
    renderDataPreview(data, columns) {
        if (!data || data.length === 0) return '<p>无数据</p>';
        
        const headers = Object.keys(columns);
        
        let html = '<table class="preview-table"><thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        data.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
    }


    // 从文件计算qPCR
    calculateQPCRFromFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) {
            alert('文件不存在');
            return;
        }
        
        const refGene = document.getElementById('file-reference-gene').value;
        const targetGeneSelect = document.getElementById('file-target-gene');
        const targetGenes = Array.from(targetGeneSelect.selectedOptions).map(option => option.value);
        
        if (!refGene || targetGenes.length === 0) {
            alert('请选择参考基因和至少一个目标基因');
            return;
        }
        
        if (targetGenes.includes(refGene)) {
            alert('参考基因不能同时作为目标基因');
            return;
        }
        
        // 根据分析类型进行不同处理
        const analysisType = this.currentFileAnalysisType || '2groups';
        
        if (analysisType === '2groups') {
            // 2组比较
            const controlGroup = document.getElementById('file-control-group').value;
            const experimentalGroup = document.getElementById('file-experimental-group').value;
            
            if (!controlGroup || !experimentalGroup) {
                alert('请选择对照组和实验组');
                return;
            }
            
            if (controlGroup === experimentalGroup) {
                alert('对照组和实验组不能相同');
                return;
            }
            
            // 单基因分析
            if (targetGenes.length === 1) {
                this.performFileBasedQPCRCalculation(file, refGene, targetGenes[0], controlGroup, experimentalGroup);
            } else {
                // 多基因分析
                this.performMultiGeneAnalysis(file, refGene, targetGenes, controlGroup, experimentalGroup);
            }
            
        } else if (analysisType === '3groups') {
            // 3组比较
            const group1 = document.getElementById('file-group1').value;
            const group2 = document.getElementById('file-group2').value;
            const group3 = document.getElementById('file-group3').value;
            
            if (!group1 || !group2 || !group3) {
                alert('请选择所有3个组');
                return;
            }
            
            if (group1 === group2 || group1 === group3 || group2 === group3) {
                alert('3个组必须各不相同');
                return;
            }
            
            // 单基因3组比较
            if (targetGenes.length === 1) {
                this.performFile3GroupQPCRCalculation(file, refGene, targetGenes[0], group1, group2, group3);
            } else {
                // 多基因3组比较
                alert('多基因的3组比较功能正在开发中，请选择单个目标基因');
            }
        }
    }
    
    // 执行文件3组qPCR比较计算
    performFile3GroupQPCRCalculation(file, refGene, targetGene, group1, group2, group3) {
        try {
            const data = file.qpcrData;
            
            // 提取各组的数据
            const extractGroupData = (groupName) => {
                const groupData = data.filter(row => 
                    (row['Biological Set Name'] || row['Sample'] || 'Default') === groupName
                );
                
                const refData = [];
                const targetData = [];
                
                groupData.forEach(row => {
                    // 动态检测CT列名（可能是CT, Ct, Cq等）
                    const ctValue = row.CT || row.Ct || row.Cq || row.CQ;
                    
                    if (row.Target === refGene && ctValue !== undefined && ctValue !== '') {
                        const value = parseFloat(ctValue);
                        if (!isNaN(value)) {
                            refData.push(value);
                        }
                    } else if (row.Target === targetGene && ctValue !== undefined && ctValue !== '') {
                        const value = parseFloat(ctValue);
                        if (!isNaN(value)) {
                            targetData.push(value);
                        }
                    }
                });
                
                return { refCt: refData, targetCt: targetData };
            };
            
            const group1Data = extractGroupData(group1);
            const group2Data = extractGroupData(group2);
            const group3Data = extractGroupData(group3);
            
            // 添加调试信息
            console.log('3组数据提取结果:', {
                group1: { name: group1, data: group1Data },
                group2: { name: group2, data: group2Data },
                group3: { name: group3, data: group3Data }
            });
            
            // 验证数据完整性
            if (group1Data.refCt.length === 0 || group1Data.targetCt.length === 0) {
                alert(`${group1}中缺少参考基因或目标基因数据\n参考基因数据: ${group1Data.refCt.length}个\n目标基因数据: ${group1Data.targetCt.length}个`);
                return;
            }
            if (group2Data.refCt.length === 0 || group2Data.targetCt.length === 0) {
                alert(`${group2}中缺少参考基因或目标基因数据\n参考基因数据: ${group2Data.refCt.length}个\n目标基因数据: ${group2Data.targetCt.length}个`);
                return;
            }
            if (group3Data.refCt.length === 0 || group3Data.targetCt.length === 0) {
                alert(`${group3}中缺少参考基因或目标基因数据\n参考基因数据: ${group3Data.refCt.length}个\n目标基因数据: ${group3Data.targetCt.length}个`);
                return;
            }
            
            // 执行3组比较计算
            const results = this.perform3GroupQPCRCalculation({
                referenceGene: refGene,
                targetGene: targetGene,
                group1: { 
                    refCt: group1Data.refCt, 
                    targetCt: group1Data.targetCt, 
                    name: group1 
                },
                group2: { 
                    refCt: group2Data.refCt, 
                    targetCt: group2Data.targetCt, 
                    name: group2 
                },
                group3: { 
                    refCt: group3Data.refCt, 
                    targetCt: group3Data.targetCt, 
                    name: group3 
                }
            });
            
            // 显示结果
            this.display3GroupQPCRResults(results);
            
        } catch (error) {
            console.error('3组qPCR计算出错:', error);
            alert(`计算过程中出现错误: ${error.message}`);
        }
    }

    // 执行多比较分析（简化版）
    performMultiComparisonAnalysis(file, refGene, targetGenes, groupPairs) {
        try {
            const allResults = [];
            
            // 对每个比较对和每个目标基因进行分析
            for (const pair of groupPairs) {
                for (const targetGene of targetGenes) {
                    try {
                        // 执行单个比较的计算
                        const result = this.performSingleComparisonCalculation(
                            file, refGene, targetGene, pair.controlGroup, pair.experimentalGroup
                        );
                        
                        if (result) {
                            allResults.push({
                                comparison: `${pair.controlGroup} vs ${pair.experimentalGroup}`,
                                targetGene: targetGene,
                                referenceGene: refGene,
                                controlGroup: pair.controlGroup,
                                experimentalGroup: pair.experimentalGroup,
                                ...result
                            });
                        }
                    } catch (error) {
                        console.error(`分析 ${pair.controlGroup} vs ${pair.experimentalGroup} - ${targetGene} 时出错:`, error);
                        allResults.push({
                            comparison: `${pair.controlGroup} vs ${pair.experimentalGroup}`,
                            targetGene: targetGene,
                            error: error.message
                        });
                    }
                }
            }
            
            // 显示多比较结果
            this.displayMultiComparisonResults(allResults);
            
        } catch (error) {
            console.error('多比较分析出错:', error);
            alert('分析过程中出现错误: ' + error.message);
        }
    }
    
    // 显示多比较结果（简化版）
    displayMultiComparisonResults(allResults) {
        try {
            // 显示结果区域
            document.getElementById('qpcr-results').style.display = 'block';
            document.getElementById('qpcr-results').scrollIntoView({ behavior: 'smooth' });
            
            const summaryContainer = document.getElementById('results-summary');
            const detailsContainer = document.getElementById('results-details');
            const chartContainer = document.getElementById('results-chart');
            
            // 概览摘要
            summaryContainer.innerHTML = `
                <div class="multi-comparison-summary">
                    <h4>📊 多组比较分析结果</h4>
                    <p>共完成 ${allResults.length} 个比较分析</p>
                </div>
            `;
            
            // 详细结果
            let detailsHtml = '<div class="multi-results">';
            allResults.forEach((result, index) => {
                if (result.error) {
                    detailsHtml += `
                        <div class="result-item error">
                            <h5>❌ ${result.comparison} - ${result.targetGene}</h5>
                            <p>${result.error}</p>
                        </div>
                    `;
                } else {
                    const significance = this.getSignificanceLevel(result.tTest?.pValue || 1);
                    detailsHtml += `
                        <div class="result-item success">
                            <h5>🧬 ${result.comparison} - ${result.targetGene}</h5>
                            <div class="result-summary">
                                <p><strong>倍数变化:</strong> ${(result.foldChange || 1).toFixed(2)}倍</p>
                                <p><strong>显著性:</strong> ${significance.text}</p>
                                <p><strong>p值:</strong> ${(result.tTest?.pValue || 0) < 0.001 ? '<0.001' : (result.tTest?.pValue || 0).toFixed(4)}</p>
                            </div>
                        </div>
                    `;
                }
            });
        } catch (error) {
            console.error('显示结果时出错:', error);
        }
    }

    // 基于文件数据执行qPCR计算
    performFileBasedQPCRCalculation(file, refGene, targetGene, controlGroup, expGroup) {
        try {
            const data = file.qpcrData;
            console.log('开始qPCR计算，数据:', data);
            console.log('参数:', { refGene, targetGene, controlGroup, expGroup });
            
            // 提取各组数据
            const controlRefData = data.filter(row => {
                const targetMatch = row.Target === refGene;
                const groupMatch = (row['Biological Set Name'] === controlGroup || row['Sample'] === controlGroup);
                console.log(`对照组参考基因筛选 - Target: ${row.Target}, Group: ${row['Biological Set Name'] || row['Sample']}, 匹配: ${targetMatch && groupMatch}`);
                return targetMatch && groupMatch;
            }).map(row => {
                const value = parseFloat(row.Cq);
                console.log(`对照组参考基因Cq值: ${row.Cq} -> ${value}`);
                return value;
            }).filter(value => !isNaN(value)); // 过滤无效值
            
            const controlTargetData = data.filter(row => {
                const targetMatch = row.Target === targetGene;
                const groupMatch = (row['Biological Set Name'] === controlGroup || row['Sample'] === controlGroup);
                console.log(`对照组目标基因筛选 - Target: ${row.Target}, Group: ${row['Biological Set Name'] || row['Sample']}, 匹配: ${targetMatch && groupMatch}`);
                return targetMatch && groupMatch;
            }).map(row => {
                const value = parseFloat(row.Cq);
                console.log(`对照组目标基因Cq值: ${row.Cq} -> ${value}`);
                return value;
            }).filter(value => !isNaN(value)); // 过滤无效值
            
            const expRefData = data.filter(row => {
                const targetMatch = row.Target === refGene;
                const groupMatch = (row['Biological Set Name'] === expGroup || row['Sample'] === expGroup);
                console.log(`实验组参考基因筛选 - Target: ${row.Target}, Group: ${row['Biological Set Name'] || row['Sample']}, 匹配: ${targetMatch && groupMatch}`);
                return targetMatch && groupMatch;
            }).map(row => {
                const value = parseFloat(row.Cq);
                console.log(`实验组参考基因Cq值: ${row.Cq} -> ${value}`);
                return value;
            }).filter(value => !isNaN(value)); // 过滤无效值
            
            const expTargetData = data.filter(row => {
                const targetMatch = row.Target === targetGene;
                const groupMatch = (row['Biological Set Name'] === expGroup || row['Sample'] === expGroup);
                console.log(`实验组目标基因筛选 - Target: ${row.Target}, Group: ${row['Biological Set Name'] || row['Sample']}, 匹配: ${targetMatch && groupMatch}`);
                return targetMatch && groupMatch;
            }).map(row => {
                const value = parseFloat(row.Cq);
                console.log(`实验组目标基因Cq值: ${row.Cq} -> ${value}`);
                return value;
            }).filter(value => !isNaN(value)); // 过滤无效值
            
            console.log('提取的数据:', {
                controlRefData,
                controlTargetData,
                expRefData,
                expTargetData
            });
            
            // 验证数据
            if (controlRefData.length === 0) {
                alert(`对照组中未找到参考基因"${refGene}"的数据，请检查基因名称和分组设置`);
                return;
            }
            if (controlTargetData.length === 0) {
                alert(`对照组中未找到目标基因"${targetGene}"的数据，请检查基因名称和分组设置`);
                return;
            }
            if (expRefData.length === 0) {
                alert(`实验组中未找到参考基因"${refGene}"的数据，请检查基因名称和分组设置`);
                return;
            }
            if (expTargetData.length === 0) {
                alert(`实验组中未找到目标基因"${targetGene}"的数据，请检查基因名称和分组设置`);
                return;
            }
            
            // 执行qPCR计算
            const results = this.performQPCRCalculation({
                referenceGene: refGene,
                targetGene: targetGene,
                controlGroup: controlGroup,
                experimentalGroup: expGroup,
                controlRefCt: controlRefData,
                controlTargetCt: controlTargetData,
                expRefCt: expRefData,
                expTargetCt: expTargetData
            });
            
            // 显示结果
            this.displayQPCRResults(results);
            
        } catch (error) {
            console.error('qPCR计算详细错误:', error);
            console.error('错误堆栈:', error.stack);
            alert(`qPCR计算过程中出现错误: ${error.message}\n请检查浏览器控制台查看详细信息`);
        }
    }  

    // 执行多基因分析
    performMultiGeneAnalysis(file, refGene, targetGenes, controlGroup, experimentalGroup) {
        this.performMultiGeneQPCRCalculation(file, refGene, targetGenes, controlGroup, experimentalGroup);
    }

    // 多基因qPCR分析
    performMultiGeneQPCRCalculation(file, refGene, targetGenes, controlGroup, experimentalGroup) {
        try {
            console.log('开始多基因qPCR分析:', targetGenes);
            
            const multiResults = [];
            
            // 为每个目标基因计算结果
            for (const targetGene of targetGenes) {
                const data = file.qpcrData;
                
                // 提取各组数据
                const controlRefData = data.filter(row => {
                    const targetMatch = row.Target === refGene;
                    const groupMatch = (row['Biological Set Name'] === controlGroup || row['Sample'] === controlGroup);
                    return targetMatch && groupMatch;
                }).map(row => parseFloat(row.Cq)).filter(value => !isNaN(value));
                
                const controlTargetData = data.filter(row => {
                    const targetMatch = row.Target === targetGene;
                    const groupMatch = (row['Biological Set Name'] === controlGroup || row['Sample'] === controlGroup);
                    return targetMatch && groupMatch;
                }).map(row => parseFloat(row.Cq)).filter(value => !isNaN(value));
                
                const expRefData = data.filter(row => {
                    const targetMatch = row.Target === refGene;
                    const groupMatch = (row['Biological Set Name'] === experimentalGroup || row['Sample'] === experimentalGroup);
                    return targetMatch && groupMatch;
                }).map(row => parseFloat(row.Cq)).filter(value => !isNaN(value));
                
                const expTargetData = data.filter(row => {
                    const targetMatch = row.Target === targetGene;
                    const groupMatch = (row['Biological Set Name'] === experimentalGroup || row['Sample'] === experimentalGroup);
                    return targetMatch && groupMatch;
                }).map(row => parseFloat(row.Cq)).filter(value => !isNaN(value));
                
                // 验证数据
                if (controlRefData.length === 0 || controlTargetData.length === 0 || 
                    expRefData.length === 0 || expTargetData.length === 0) {
                    console.warn(`基因 ${targetGene} 数据不完整，跳过`);
                    continue;
                }
                
                // 执行单基因qPCR计算
                const singleResult = this.performQPCRCalculation({
                    referenceGene: refGene,
                    targetGene: targetGene,
                    controlGroup: controlGroup,
                    experimentalGroup: experimentalGroup,
                    controlRefCt: controlRefData,
                    controlTargetCt: controlTargetData,
                    expRefCt: expRefData,
                    expTargetCt: expTargetData
                });
                
                multiResults.push(singleResult);
            }
            
            if (multiResults.length === 0) {
                alert('没有找到有效的基因数据，请检查数据格式和选择');
                return;
            }
            
            // 显示多基因结果
            this.displayMultiGeneResults(multiResults);
            
        } catch (error) {
            console.error('多基因qPCR计算出错:', error);
            alert(`多基因qPCR计算过程中出现错误: ${error.message}`);
        }
    }

    // 显示多基因结果
    displayMultiGeneResults(results) {
        // 保存结果供后续保存使用
        this.lastQPCRResults = {
            isMultiGene: true,
            results: results,
            referenceGene: results[0].referenceGene,
            controlGroup: results[0].controlGroup,
            experimentalGroup: results[0].experimentalGroup
        };
        
        // 显示结果区域
        document.getElementById('qpcr-results').style.display = 'block';
        
        // 滚动到结果区域
        document.getElementById('qpcr-results').scrollIntoView({ behavior: 'smooth' });
        
        // 填充多基因结果内容
        this.fillMultiGeneResults(results);
    }

    // 填充多基因结果内容
    fillMultiGeneResults(results) {
        const summaryContainer = document.getElementById('results-summary');
        const detailsContainer = document.getElementById('results-details');
        const chartContainer = document.getElementById('results-chart');
        
        // 多基因摘要卡片
        let summaryHtml = `
            <div class="multi-gene-summary">
                <h4>🧬 多基因qPCR分析结果</h4>
                <div class="basic-info">
                    <p><strong>参考基因:</strong> ${results[0].referenceGene}</p>
                    <p><strong>对照组:</strong> ${results[0].controlGroup} | <strong>实验组:</strong> ${results[0].experimentalGroup}</p>
                    <p><strong>分析基因数:</strong> ${results.length} 个</p>
                </div>
                <div class="summary-cards">
        `;
        
        results.forEach(result => {
            summaryHtml += `
                <div class="summary-card multi-gene-card">
                    <h5>${result.targetGene}</h5>
                    <p class="fold-change ${result.foldChange > 1 ? 'up' : 'down'}">${result.foldChange.toFixed(2)}倍</p>
                    <p class="significance ${result.significance.level !== 'ns' ? 'significant' : 'not-significant'}">${result.significance.text}</p>
                </div>
            `;
        });
        
        summaryHtml += '</div></div>';
        summaryContainer.innerHTML = summaryHtml;
        
        // 为每个基因生成详细数据表格
        let detailsHtml = `
            <div class="multi-gene-details">
                <h5>📊 各基因详细分析结果</h5>
        `;
        
        results.forEach((result, index) => {
            detailsHtml += `
                <div class="gene-detail-section" style="margin-bottom: 30px;">
                    <h6 style="color: #667eea; font-size: 1.2rem; margin-bottom: 15px;">
                        🧬 ${result.targetGene} 基因分析
                    </h6>
                    
                    <div class="raw-data-section">
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th rowspan="2">组别</th>
                                        <th colspan="2">Ct值</th>
                                        <th colspan="2">ΔCt值</th>
                                        <th rowspan="2">2^(-ΔΔCt)<br><small>(相对表达量)</small></th>
                                    </tr>
                                    <tr>
                                        <th>${result.referenceGene}</th>
                                        <th>${result.targetGene}</th>
                                        <th>ΔCt</th>
                                        <th>ΔΔCt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.generateRawDataRows(result, 'control', '对照组')}
                                    ${this.generateRawDataRows(result, 'experimental', '实验组')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="summary-stats" style="margin-top: 15px;">
                        <div class="group-stats">
                            <h6>对照组统计</h6>
                            <p>样本数: ${result.statistics.control.n}</p>
                            <p>平均ΔCt: ${result.deltaCt.control.mean.toFixed(3)} ± ${result.deltaCt.control.sem.toFixed(3)}</p>
                            <p>相对表达量: ${result.statistics.control.mean.toFixed(3)} ± ${result.statistics.control.sem.toFixed(3)}</p>
                            <p>变异系数: ${result.statistics.control.cv.toFixed(2)}%</p>
                        </div>
                        <div class="group-stats">
                            <h6>实验组统计</h6>
                            <p>样本数: ${result.statistics.experimental.n}</p>
                            <p>平均ΔCt: ${result.deltaCt.experimental.mean.toFixed(3)} ± ${result.deltaCt.experimental.sem.toFixed(3)}</p>
                            <p>相对表达量: ${result.statistics.experimental.mean.toFixed(3)} ± ${result.statistics.experimental.sem.toFixed(3)}</p>
                            <p>变异系数: ${result.statistics.experimental.cv.toFixed(2)}%</p>
                        </div>
                    </div>
                    
                    <div class="stats-results" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h6>统计检验结果</h6>
                        <p>t统计量: ${result.tTest.tStatistic.toFixed(4)} | 自由度: ${result.tTest.degreesOfFreedom} | p值: ${result.tTest.pValue < 0.001 ? '<0.001' : result.tTest.pValue.toFixed(4)}</p>
                        <p>倍数变化: <span class="fold-change ${result.foldChange > 1 ? 'up' : 'down'}">${result.foldChange.toFixed(3)}倍 (${result.foldChange > 1 ? '上调' : '下调'})</span></p>
                        <p>显著性: <span class="significance ${result.significance.level !== 'ns' ? 'significant' : 'not-significant'}">${result.significance.text}</span></p>
                    </div>
                </div>
            `;
        });
        
        // 添加汇总统计
        const significantGenes = results.filter(r => r.significance.level !== 'ns');
        const upRegulated = significantGenes.filter(r => r.foldChange > 1);
        const downRegulated = significantGenes.filter(r => r.foldChange < 1);
        
        detailsHtml += `
                <div class="multi-gene-summary-stats" style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <h5>📈 多基因分析汇总</h5>
                    <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                        <div class="stat-item" style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <h6 style="color: #1976D2;">总基因数</h6>
                            <span style="font-size: 1.5rem; font-weight: bold; color: #1976D2;">${results.length}</span>
                        </div>
                        <div class="stat-item" style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <h6 style="color: #388E3C;">显著变化</h6>
                            <span style="font-size: 1.5rem; font-weight: bold; color: #388E3C;">${significantGenes.length}</span>
                        </div>
                        <div class="stat-item" style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <h6 style="color: #D32F2F;">上调基因</h6>
                            <span style="font-size: 1.5rem; font-weight: bold; color: #D32F2F;">${upRegulated.length}</span>
                        </div>
                        <div class="stat-item" style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <h6 style="color: #1976D2;">下调基因</h6>
                            <span style="font-size: 1.5rem; font-weight: bold; color: #1976D2;">${downRegulated.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        detailsContainer.innerHTML = detailsHtml;
        
        // 生成多基因对比图表
        this.generateMultiGeneChart(results, chartContainer);
    }

    // 生成多基因对比图表
    generateMultiGeneChart(results, container) {
        try {
            // 清空容器
            container.innerHTML = '';
            
            // 创建多基因对比柱状图
            let chartHtml = `
                <div class="multi-gene-chart">
                    <h5>多基因相对表达量对比图</h5>
                    <div class="chart-container">
                        <div class="multi-chart-bars">
            `;
            
            results.forEach(result => {
                const maxHeight = 200;
                const controlHeight = Math.min(result.statistics.control.mean * 100, maxHeight);
                const expHeight = Math.min(result.statistics.experimental.mean * 100, maxHeight);
                
                chartHtml += `
                    <div class="gene-bar-group">
                        <div class="gene-name">${result.targetGene}</div>
                        <div class="bar-pair">
                            <div class="bar control-bar" style="height: ${controlHeight}px;">
                                <span class="bar-value">${result.statistics.control.mean.toFixed(2)}</span>
                            </div>
                            <div class="bar experimental-bar" style="height: ${expHeight}px;">
                                <span class="bar-value">${result.statistics.experimental.mean.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="fold-info">
                            <span class="fold-change ${result.foldChange > 1 ? 'up' : 'down'}">${result.foldChange.toFixed(2)}倍</span>
                        </div>
                    </div>
                `;
            });
            
            chartHtml += `
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <div class="legend-color control-color"></div>
                                <span>对照组 (${results[0].controlGroup})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color experimental-color"></div>
                                <span>实验组 (${results[0].experimentalGroup})</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = chartHtml;
            
        } catch (error) {
            console.error('生成多基因图表时出错:', error);
            container.innerHTML = '<p>图表生成失败</p>';
        }
    }

    // 显示分析进度
    showAnalysisProgress(message, current, total) {
        const progressDiv = document.getElementById('analysis-progress') || this.createProgressDiv();
        progressDiv.style.display = 'block';
        
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        progressDiv.innerHTML = `
            <div class="progress-container">
                <div class="progress-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-text">${current}/${total} (${percentage}%)</div>
            </div>
        `;
    }
    
    // 更新分析进度
    updateAnalysisProgress(current, total) {
        const progressDiv = document.getElementById('analysis-progress');
        if (progressDiv) {
            const percentage = Math.round((current / total) * 100);
            const fillElement = progressDiv.querySelector('.progress-fill');
            const textElement = progressDiv.querySelector('.progress-text');
            
            if (fillElement) fillElement.style.width = `${percentage}%`;
            if (textElement) textElement.textContent = `${current}/${total} (${percentage}%)`;
        }
    }
    
    // 隐藏分析进度
    hideAnalysisProgress() {
        const progressDiv = document.getElementById('analysis-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
    }
    
    // 创建进度显示元素
    createProgressDiv() {
        let progressDiv = document.getElementById('analysis-progress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'analysis-progress';
            progressDiv.className = 'analysis-progress';
            progressDiv.style.display = 'none';
            
            const resultsContainer = document.getElementById('qpcr-results');
            if (resultsContainer && resultsContainer.parentNode) {
                resultsContainer.parentNode.insertBefore(progressDiv, resultsContainer);
            } else {
                console.error('无法创建进度条：找不到qpcr-results容器或其父元素');
                // 创建到body中作为后备
                document.body.appendChild(progressDiv);
            }
        }
        return progressDiv;
    }
    
    // 显示多组比较结果
    displayMultiGroupResults(allResults, refGene) {
        try {
            console.log('显示多组比较结果:', allResults);
            
            // 显示结果区域
            const resultsSection = document.getElementById('qpcr-results');
            if (!resultsSection) {
                console.error('找不到qpcr-results元素');
                alert('无法显示结果：找不到结果容器');
                return;
            }
            
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
            // 获取容器
            const summaryContainer = document.getElementById('results-summary');
            const detailsContainer = document.getElementById('results-details');
            const chartContainer = document.getElementById('results-chart');
            
            if (!summaryContainer || !detailsContainer || !chartContainer) {
                console.error('找不到必要的结果容器');
                alert('无法显示结果：结果容器不完整');
                return;
            }
            
            // 生成概览摘要
            const totalComparisons = allResults.length;
            const totalGenes = allResults[0]?.geneResults?.length || 0;
            const successfulAnalyses = allResults.reduce((count, pair) => 
                count + pair.geneResults.filter(gene => !gene.error).length, 0);
            
            summaryContainer.innerHTML = `
                <div class="multi-group-overview">
                    <h4>🔬 多组qPCR比较分析概览</h4>
                    <div class="overview-cards">
                        <div class="summary-card">
                            <h5>参考基因</h5>
                            <p>${refGene}</p>
                        </div>
                        <div class="summary-card">
                            <h5>比较组数</h5>
                            <p>${totalComparisons}</p>
                        </div>
                        <div class="summary-card">
                            <h5>目标基因数</h5>
                            <p>${totalGenes}</p>
                        </div>
                        <div class="summary-card ${successfulAnalyses === totalComparisons * totalGenes ? 'success' : 'warning'}">
                            <h5>成功分析</h5>
                            <p>${successfulAnalyses}/${totalComparisons * totalGenes}</p>
                        </div>
                    </div>
                </div>
            `;
            
            // 生成详细结果
            this.generateMultiGroupDetails(allResults, refGene, detailsContainer);
            
            // 生成图表
            this.generateMultiGroupCharts(allResults, refGene, chartContainer);
            
            // 保存结果供后续使用
            this.lastMultiGroupResults = {
                results: allResults,
                refGene: refGene,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('显示多组比较结果时出错:', error);
            alert('显示结果时出现错误: ' + error.message);
        }
    }

    // 生成多组比较的详细结果
    generateMultiGroupDetails(allResults, refGene, container) {
        let html = '<div class="multi-group-details">';
        
        // 为每个比较对生成详细结果
        allResults.forEach((pairResult, pairIndex) => {
            html += `
                <div class="comparison-detail-section">
                    <h4>📊 ${pairResult.comparison} - 详细分析</h4>
                    <div class="comparison-meta">
                        <span class="meta-item">对照组: <strong>${pairResult.controlGroup}</strong></span>
                        <span class="meta-item">实验组: <strong>${pairResult.experimentalGroup}</strong></span>
                        <span class="meta-item">参考基因: <strong>${refGene}</strong></span>
                    </div>
            `;
            
            // 为该比较对的每个基因生成详细结果
            pairResult.geneResults.forEach((geneResult, geneIndex) => {
                if (geneResult.error) {
                    html += `
                        <div class="gene-detail-error">
                            <h5>❌ ${geneResult.targetGene} - 分析失败</h5>
                            <p class="error-message">${geneResult.error}</p>
                        </div>
                    `;
                } else if (geneResult.statistics && geneResult.rawData) {
                    html += this.generateSingleGeneDetail(geneResult, pairResult, refGene);
                }
            });
            
            html += '</div>'; // 结束 comparison-detail-section
        });
        
        html += '</div>'; // 结束 multi-group-details
        container.innerHTML = html;
    }
    
    // 生成单个基因的详细结果（仿照原格式）
    generateSingleGeneDetail(geneResult, pairResult, refGene) {
        const significance = this.getSignificanceLevel(geneResult.statistics?.pValue || 1);
        
        return `
            <div class="gene-detail-success">
                <div class="gene-detail-header">
                    <h5>🧬 ${geneResult.targetGene} 基因分析</h5>
                    <div class="significance-badge ${significance.level}">
                        ${significance.level === 'significant-3' ? '***' : 
                          significance.level === 'significant-2' ? '**' : 
                          significance.level === 'significant-1' ? '*' : 'ns'} ${significance.text}
                    </div>
                </div>
                
                <div class="gene-detail-content">
                    <h6>📊 原始数据 (每次重复)</h6>
                    <div class="raw-data-section">
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th rowspan="2">组别</th>
                                        <th colspan="2">Ct值</th>
                                        <th colspan="2">ΔCt值</th>
                                        <th rowspan="2">2^(-ΔΔCt)<br><small>(相对表达量)</small></th>
                                    </tr>
                                    <tr>
                                        <th>${refGene}</th>
                                        <th>${geneResult.targetGene}</th>
                                        <th>ΔCt</th>
                                        <th>ΔΔCt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.generateMultiGroupRawDataRows(geneResult, pairResult.controlGroup, 'control')}
                                    ${this.generateMultiGroupRawDataRows(geneResult, pairResult.experimentalGroup, 'experimental')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <h6>📈 统计汇总</h6>
                    <div class="summary-stats">
                        <div class="group-stats">
                            <h6>${pairResult.controlGroup}统计</h6>
                            <p>样本数: ${geneResult.statistics?.control?.n || 0}</p>
                            <p>平均ΔCt: ${(geneResult.deltaCt?.control?.mean || 0).toFixed(3)} ± ${(geneResult.deltaCt?.control?.sem || 0).toFixed(3)}</p>
                            <p>相对表达量: ${(geneResult.statistics?.control?.mean || 0).toFixed(3)} ± ${(geneResult.statistics?.control?.sem || 0).toFixed(3)}</p>
                            <p>变异系数: ${(geneResult.statistics?.control?.cv || 0).toFixed(2)}%</p>
                        </div>
                        <div class="group-stats">
                            <h6>${pairResult.experimentalGroup}统计</h6>
                            <p>样本数: ${geneResult.statistics?.experimental?.n || 0}</p>
                            <p>平均ΔCt: ${(geneResult.deltaCt?.experimental?.mean || 0).toFixed(3)} ± ${(geneResult.deltaCt?.experimental?.sem || 0).toFixed(3)}</p>
                            <p>相对表达量: ${(geneResult.statistics?.experimental?.mean || 0).toFixed(3)} ± ${(geneResult.statistics?.experimental?.sem || 0).toFixed(3)}</p>
                            <p>变异系数: ${(geneResult.statistics?.experimental?.cv || 0).toFixed(2)}%</p>
                        </div>
                    </div>
                    
                    <h6>📋 统计检验</h6>
                    <div class="stats-results">
                        <p>t统计量: ${(geneResult.statistics?.tStatistic || 0).toFixed(4)}</p>
                        <p>自由度: ${geneResult.statistics?.degreesOfFreedom || 0}</p>
                        <p>p值: ${(geneResult.statistics?.pValue || 0) < 0.001 ? '<0.001' : (geneResult.statistics?.pValue || 0).toFixed(4)}</p>
                        <p>倍数变化: ${(geneResult.foldChange || 1).toFixed(3)}倍 (${(geneResult.foldChange || 1) > 1 ? '上调' : '下调'})</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 生成多组比较的原始数据行
    generateMultiGroupRawDataRows(geneResult, groupName, groupType) {
        if (!geneResult.rawData) return '';
        
        const refCt = geneResult.rawData[groupType === 'control' ? 'controlRefCt' : 'expRefCt'] || [];
        const targetCt = geneResult.rawData[groupType === 'control' ? 'controlTargetCt' : 'expTargetCt'] || [];
        const deltaCt = geneResult.deltaCt?.[groupType === 'control' ? 'control' : 'experimental']?.values || [];
        const relativeExp = geneResult.relativeExpression?.[groupType === 'control' ? 'control' : 'experimental'] || [];
        
        let rows = '';
        const maxLength = Math.max(refCt.length, targetCt.length, deltaCt.length, relativeExp.length);
        
        for (let i = 0; i < maxLength; i++) {
            const ref = refCt[i] || refCt[0] || 0;
            const target = targetCt[i] || targetCt[0] || 0;
            const delta = deltaCt[i] || 0;
            const relative = relativeExp[i] || 0;
            
            // 计算ΔΔCt (相对于对照组均值)
            const controlMean = geneResult.deltaCt?.control?.mean || 0;
            const deltaDelta = delta - controlMean;
            
            rows += `
                <tr>
                    <td>${groupName} ${i + 1}</td>
                    <td>${ref.toFixed(2)}</td>
                    <td>${target.toFixed(2)}</td>
                    <td>${delta.toFixed(3)}</td>
                    <td>${deltaDelta.toFixed(3)}</td>
                    <td>${relative.toFixed(3)}</td>
                </tr>
            `;
        }
        
        return rows;
    }
    
    // 生成多组比较的图表
    generateMultiGroupCharts(allResults, refGene, container) {
        try {
            let html = `
                <div class="multi-group-charts">
                    <h4>🧬 多组qPCR相对表达量分析</h4>
                    <div class="chart-description">
                        <p>各目标基因相对于 <strong>${refGene}</strong> 的表达量变化对比</p>
                    </div>
            `;
            
            // 为每个比较对生成图表
            allResults.forEach((pairResult, pairIndex) => {
                html += `
                    <div class="comparison-chart-section">
                        <h5>📊 ${pairResult.comparison}</h5>
                        <div class="comparison-charts">
                `;
                
                // 为每个基因生成小图表
                pairResult.geneResults.forEach((geneResult, geneIndex) => {
                    if (!geneResult.error && geneResult.statistics) {
                        html += this.generateSingleGeneChart(geneResult, pairResult);
                    }
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
        } catch (error) {
            console.error('生成多组图表时出错:', error);
            container.innerHTML = '<p>图表生成失败</p>';
        }
    }
    
    // 生成单个基因的图表
    generateSingleGeneChart(geneResult, pairResult) {
        const controlMean = geneResult.statistics?.control?.mean || 0;
        const expMean = geneResult.statistics?.experimental?.mean || 0;
        const controlSem = geneResult.statistics?.control?.sem || 0;
        const expSem = geneResult.statistics?.experimental?.sem || 0;
        
        const maxValue = Math.max(controlMean + controlSem, expMean + expSem) * 1.2;
        const chartHeight = 200;
        const barWidth = 60;
        
        const controlHeight = (controlMean / maxValue) * chartHeight;
        const expHeight = (expMean / maxValue) * chartHeight;
        const controlErrorHeight = (controlSem / maxValue) * chartHeight;
        const expErrorHeight = (expSem / maxValue) * chartHeight;
        
        return `
            <div class="gene-chart">
                <div class="gene-chart-title">${geneResult.targetGene}</div>
                <div class="mini-chart" style="height: ${chartHeight + 50}px;">
                    <div class="chart-bars">
                        <div class="bar-group">
                            <div class="bar control-bar" style="height: ${controlHeight}px; width: ${barWidth}px;">
                                <div class="error-bar" style="height: ${controlErrorHeight}px; top: -${controlErrorHeight/2}px;"></div>
                                <div class="bar-value">${controlMean.toFixed(2)}</div>
                            </div>
                            <div class="bar-label">${pairResult.controlGroup}</div>
                        </div>
                        <div class="bar-group">
                            <div class="bar experimental-bar" style="height: ${expHeight}px; width: ${barWidth}px;">
                                <div class="error-bar" style="height: ${expErrorHeight}px; top: -${expErrorHeight/2}px;"></div>
                                <div class="bar-value">${expMean.toFixed(2)}</div>
                            </div>
                            <div class="bar-label">${pairResult.experimentalGroup}</div>
                        </div>
                    </div>
                    <div class="chart-significance">
                        ${geneResult.statistics?.pValue < 0.05 ? 
                            `<span class="significant">*${geneResult.statistics.pValue < 0.01 ? '*' : ''}${geneResult.statistics.pValue < 0.001 ? '*' : ''}</span>` : 
                            '<span class="not-significant">ns</span>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // 跳转到qPCR分析并选择文件
    jumpToQPCRAnalysis(fileId) {
        // 切换到数据分析标签
        this.switchTab('analysis');
        
        // 切换到qPCR分析子标签
        this.switchAnalysisTab('qpcr');
        
        // 切换到文件导入数据源
        this.switchDataSource('file');
        
        // 自动选择该文件
        setTimeout(() => {
            this.selectQPCRFile(fileId);
        }, 100);
    }

    // 显示qPCR结果
    displayQPCRResults(results) {
        // 保存结果供后续保存使用
        this.lastQPCRResults = results;
        
        // 显示结果区域
        document.getElementById('qpcr-results').style.display = 'block';
        
        // 滚动到结果区域
        document.getElementById('qpcr-results').scrollIntoView({ behavior: 'smooth' });
        
        // 填充结果内容（使用现有的结果显示逻辑）
        this.fillQPCRResults(results);
    }

    // 填充qPCR结果内容
    fillQPCRResults(results) {
        const summaryContainer = document.getElementById('results-summary');
        const detailsContainer = document.getElementById('results-details');
        const chartContainer = document.getElementById('results-chart');
        
        // 结果摘要
        summaryContainer.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <h5>参考基因</h5>
                    <p>${results.referenceGene}</p>
                </div>
                <div class="summary-card">
                    <h5>目标基因</h5>
                    <p>${results.targetGene}</p>
                </div>
                <div class="summary-card">
                    <h5>倍数变化</h5>
                    <p>${results.foldChange.toFixed(2)}倍</p>
                </div>
                <div class="summary-card ${results.significance.isSignificant ? 'significant' : 'not-significant'}">
                    <h5>显著性</h5>
                    <p>${results.significance.text}</p>
                </div>
            </div>
        `;
        
        // 详细结果 - 显示每次重复的具体数据
        detailsContainer.innerHTML = `
            <div class="details-section">
                <h5>📊 原始数据 (每次重复)</h5>
                <div class="raw-data-section">
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th rowspan="2">组别</th>
                                    <th colspan="2">Ct值</th>
                                    <th colspan="2">ΔCt值</th>
                                    <th rowspan="2">2^(-ΔΔCt)<br><small>(相对表达量)</small></th>
                                </tr>
                                <tr>
                                    <th>${results.referenceGene}</th>
                                    <th>${results.targetGene}</th>
                                    <th>ΔCt</th>
                                    <th>ΔΔCt</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateRawDataRows(results, 'control', '对照组')}
                                ${this.generateRawDataRows(results, 'experimental', '实验组')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <h5>📈 统计汇总</h5>
                <div class="summary-stats">
                    <div class="group-stats">
                        <h6>对照组统计</h6>
                        <p>样本数: ${results.statistics.control.n}</p>
                        <p>平均ΔCt: ${results.deltaCt.control.mean.toFixed(3)} ± ${results.deltaCt.control.sem.toFixed(3)}</p>
                        <p>相对表达量: ${results.statistics.control.mean.toFixed(3)} ± ${results.statistics.control.sem.toFixed(3)}</p>
                        <p>变异系数: ${results.statistics.control.cv.toFixed(2)}%</p>
                    </div>
                    <div class="group-stats">
                        <h6>实验组统计</h6>
                        <p>样本数: ${results.statistics.experimental.n}</p>
                        <p>平均ΔCt: ${results.deltaCt.experimental.mean.toFixed(3)} ± ${results.deltaCt.experimental.sem.toFixed(3)}</p>
                        <p>相对表达量: ${results.statistics.experimental.mean.toFixed(3)} ± ${results.statistics.experimental.sem.toFixed(3)}</p>
                        <p>变异系数: ${results.statistics.experimental.cv.toFixed(2)}%</p>
                    </div>
                </div>
                
                <h5>📋 统计检验</h5>
                <div class="stats-results">
                    <p>t统计量: ${results.tTest.tStatistic.toFixed(4)}</p>
                    <p>自由度: ${results.tTest.degreesOfFreedom}</p>
                    <p>p值: ${results.tTest.pValue < 0.001 ? '<0.001' : results.tTest.pValue.toFixed(4)}</p>
                    <p>倍数变化: ${results.foldChange.toFixed(3)}倍 (${results.foldChange > 1 ? '上调' : '下调'})</p>
                </div>
            </div>
        `;
        
        // 生成带散点和误差棒的图表
        this.generateScatterBarChart(results, chartContainer);
    }

    // 生成原始数据行
    generateRawDataRows(results, groupType, groupName) {
        const refCt = results.rawData[groupType === 'control' ? 'controlRefCt' : 'expRefCt'];
        const targetCt = results.rawData[groupType === 'control' ? 'controlTargetCt' : 'expTargetCt'];
        const deltaCt = results.deltaCt[groupType === 'control' ? 'control' : 'experimental'].values;
        const relativeExp = results.relativeExpression[groupType === 'control' ? 'control' : 'experimental'];
        
        let rows = '';
        const maxLength = Math.max(refCt.length, targetCt.length);
        
        for (let i = 0; i < maxLength; i++) {
            const ref = refCt[i] || refCt[0]; // 如果长度不匹配，使用第一个值
            const target = targetCt[i] || targetCt[0];
            const delta = deltaCt[i];
            const relative = relativeExp[i];
            
            // 计算ΔΔCt (相对于对照组均值)
            const controlMean = results.deltaCt.control.mean;
            const deltaDelta = delta - controlMean;
            
            rows += `
                <tr>
                    <td>${groupName} ${i + 1}</td>
                    <td>${ref.toFixed(2)}</td>
                    <td>${target.toFixed(2)}</td>
                    <td>${delta.toFixed(3)}</td>
                    <td>${deltaDelta.toFixed(3)}</td>
                    <td>${relative.toFixed(3)}</td>
                </tr>
            `;
        }
        
        return rows;
    }

    // 生成带散点和误差棒的图表
    generateScatterBarChart(results, container) {
        try {
            // 清空容器
            container.innerHTML = '';
            
            const controlValues = results.relativeExpression.control;
            const expValues = results.relativeExpression.experimental;
            const controlMean = results.statistics.control.mean;
            const expMean = results.statistics.experimental.mean;
            const controlSem = results.statistics.control.sem;
            const expSem = results.statistics.experimental.sem;
            
            // 计算图表尺寸
            const maxValue = Math.max(...controlValues, ...expValues) * 1.2;
            const chartHeight = 300;
            const barWidth = 80;
            
            // 创建SVG图表
            const svgContent = `
                <div class="scatter-bar-chart">
                    <h5>🧬 qPCR相对表达量分析</h5>
                    <div class="chart-description">
                        <p><strong>${results.targetGene}</strong> 相对于 <strong>${results.referenceGene}</strong> 的表达量变化</p>
                        <div class="result-summary">
                            <span class="fold-change ${results.foldChange > 1 ? 'up' : 'down'}">
                                倍数变化: ${results.foldChange.toFixed(2)}倍 (${results.foldChange > 1 ? '上调' : '下调'})
                            </span>
                            <span class="significance ${results.significance.level !== 'ns' ? 'significant' : 'not-significant'}">
                                ${results.significance.text}
                            </span>
                        </div>
                    </div>
                    
                    <div class="chart-container-svg" style="position: relative; width: 100%; height: ${chartHeight + 60}px; margin: 20px 0;">
                        <svg width="100%" height="${chartHeight + 60}" viewBox="0 0 400 ${chartHeight + 60}" style="background: white; border: 1px solid #ddd; border-radius: 8px;">
                            <!-- Y轴 -->
                            <line x1="60" y1="20" x2="60" y2="${chartHeight + 20}" stroke="#333" stroke-width="2"/>
                            <!-- X轴 -->
                            <line x1="60" y1="${chartHeight + 20}" x2="380" y2="${chartHeight + 20}" stroke="#333" stroke-width="2"/>
                            
                            <!-- Y轴刻度和标签 -->
                            ${this.generateYAxisLabels(maxValue, chartHeight)}
                            
                            <!-- 对照组柱状图 -->
                            <rect x="90" y="${chartHeight + 20 - (controlMean / maxValue) * chartHeight}" 
                                  width="${barWidth}" height="${(controlMean / maxValue) * chartHeight}" 
                                  fill="rgba(102, 126, 234, 0.7)" stroke="rgba(102, 126, 234, 1)" stroke-width="2"/>
                            
                            <!-- 对照组误差棒 -->
                            <line x1="${90 + barWidth/2}" y1="${chartHeight + 20 - ((controlMean + controlSem) / maxValue) * chartHeight}"
                                  x2="${90 + barWidth/2}" y2="${chartHeight + 20 - ((controlMean - controlSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                            <line x1="${90 + barWidth/2 - 8}" y1="${chartHeight + 20 - ((controlMean + controlSem) / maxValue) * chartHeight}"
                                  x2="${90 + barWidth/2 + 8}" y2="${chartHeight + 20 - ((controlMean + controlSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                            <line x1="${90 + barWidth/2 - 8}" y1="${chartHeight + 20 - ((controlMean - controlSem) / maxValue) * chartHeight}"
                                  x2="${90 + barWidth/2 + 8}" y2="${chartHeight + 20 - ((controlMean - controlSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                                  
                            <!-- 对照组散点 -->
                            ${controlValues.map((value, i) => 
                                `<circle cx="${90 + barWidth/2 + (i - (controlValues.length-1)/2) * 12}" 
                                         cy="${chartHeight + 20 - (value / maxValue) * chartHeight}" 
                                         r="4" fill="rgba(102, 126, 234, 0.9)" stroke="white" stroke-width="2"/>`
                            ).join('')}
                            
                            <!-- 实验组柱状图 -->
                            <rect x="230" y="${chartHeight + 20 - (expMean / maxValue) * chartHeight}" 
                                  width="${barWidth}" height="${(expMean / maxValue) * chartHeight}" 
                                  fill="rgba(255, 107, 107, 0.7)" stroke="rgba(255, 107, 107, 1)" stroke-width="2"/>
                            
                            <!-- 实验组误差棒 -->
                            <line x1="${230 + barWidth/2}" y1="${chartHeight + 20 - ((expMean + expSem) / maxValue) * chartHeight}"
                                  x2="${230 + barWidth/2}" y2="${chartHeight + 20 - ((expMean - expSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                            <line x1="${230 + barWidth/2 - 8}" y1="${chartHeight + 20 - ((expMean + expSem) / maxValue) * chartHeight}"
                                  x2="${230 + barWidth/2 + 8}" y2="${chartHeight + 20 - ((expMean + expSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                            <line x1="${230 + barWidth/2 - 8}" y1="${chartHeight + 20 - ((expMean - expSem) / maxValue) * chartHeight}"
                                  x2="${230 + barWidth/2 + 8}" y2="${chartHeight + 20 - ((expMean - expSem) / maxValue) * chartHeight}"
                                  stroke="#333" stroke-width="2"/>
                                  
                            <!-- 实验组散点 -->
                            ${expValues.map((value, i) => 
                                `<circle cx="${230 + barWidth/2 + (i - (expValues.length-1)/2) * 12}" 
                                         cy="${chartHeight + 20 - (value / maxValue) * chartHeight}" 
                                         r="4" fill="rgba(255, 107, 107, 0.9)" stroke="white" stroke-width="2"/>`
                            ).join('')}
                            
                            <!-- X轴标签 -->
                            <text x="${90 + barWidth/2}" y="${chartHeight + 45}" text-anchor="middle" font-size="14" font-weight="bold">
                                对照组<tspan x="${90 + barWidth/2}" dy="15" font-size="12" font-weight="normal">${results.controlGroup || 'Control'}</tspan>
                            </text>
                            <text x="${230 + barWidth/2}" y="${chartHeight + 45}" text-anchor="middle" font-size="14" font-weight="bold">
                                实验组<tspan x="${230 + barWidth/2}" dy="15" font-size="12" font-weight="normal">${results.experimentalGroup || 'Treatment'}</tspan>
                            </text>
                            
                            <!-- Y轴标题 -->
                            <text x="25" y="${chartHeight/2 + 20}" text-anchor="middle" font-size="12" font-weight="bold" 
                                  transform="rotate(-90, 25, ${chartHeight/2 + 20})">相对表达量</text>
                                  
                            <!-- 显著性标记 -->
                            ${results.significance.level !== 'ns' ? 
                                `<line x1="${90 + barWidth/2}" y1="${30}" x2="${230 + barWidth/2}" y2="${30}" stroke="#333" stroke-width="1"/>
                                 <line x1="${90 + barWidth/2}" y1="${25}" x2="${90 + barWidth/2}" y2="${35}" stroke="#333" stroke-width="1"/>
                                 <line x1="${230 + barWidth/2}" y1="${25}" x2="${230 + barWidth/2}" y2="${35}" stroke="#333" stroke-width="1"/>
                                 <text x="${(90 + 230 + barWidth)/2}" y="${22}" text-anchor="middle" font-size="16" font-weight="bold">${results.significance.level}</text>`
                                : ''
                            }
                        </svg>
                    </div>
                    
                    <div class="chart-legend">
                        <div class="legend-items">
                            <div class="legend-item">
                                <div class="legend-symbol">
                                    <svg width="30" height="20">
                                        <rect x="2" y="5" width="12" height="10" fill="rgba(102, 126, 234, 0.7)" stroke="rgba(102, 126, 234, 1)"/>
                                        <circle cx="20" cy="10" r="3" fill="rgba(102, 126, 234, 0.9)" stroke="white" stroke-width="1"/>
                                    </svg>
                                </div>
                                <span>对照组 (n=${controlValues.length})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-symbol">
                                    <svg width="30" height="20">
                                        <rect x="2" y="5" width="12" height="10" fill="rgba(255, 107, 107, 0.7)" stroke="rgba(255, 107, 107, 1)"/>
                                        <circle cx="20" cy="10" r="3" fill="rgba(255, 107, 107, 0.9)" stroke="white" stroke-width="1"/>
                                    </svg>
                                </div>
                                <span>实验组 (n=${expValues.length})</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-symbol">
                                    <svg width="30" height="20">
                                        <line x1="10" y1="5" x2="10" y2="15" stroke="#333" stroke-width="2"/>
                                        <line x1="6" y1="5" x2="14" y2="5" stroke="#333" stroke-width="2"/>
                                        <line x1="6" y1="15" x2="14" y2="15" stroke="#333" stroke-width="2"/>
                                    </svg>
                                </div>
                                <span>误差棒 (SEM)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-symbol">
                                    <svg width="30" height="20">
                                        <circle cx="10" cy="7" r="2" fill="#666"/>
                                        <circle cx="15" cy="10" r="2" fill="#666"/>
                                        <circle cx="20" cy="13" r="2" fill="#666"/>
                                    </svg>
                                </div>
                                <span>个体数据点</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = svgContent;
            
        } catch (error) {
            console.error('生成散点柱状图时出错:', error);
            container.innerHTML = '<p>图表生成失败</p>';
        }
    }

    // 生成Y轴刻度标签
    generateYAxisLabels(maxValue, chartHeight) {
        const steps = 5;
        let labels = '';
        
        for (let i = 0; i <= steps; i++) {
            const value = (maxValue / steps) * i;
            const y = chartHeight + 20 - (i / steps) * chartHeight;
            
            labels += `
                <line x1="55" y1="${y}" x2="65" y2="${y}" stroke="#333" stroke-width="1"/>
                <text x="50" y="${y + 4}" text-anchor="end" font-size="10">${value.toFixed(1)}</text>
            `;
        }
        
        return labels;
    }

    // 更新实验过滤器选项
    updateExperimentFilter() {
        const select = document.getElementById('experiment-filter');
        select.innerHTML = '<option value=\"\">所有实验</option>';
        
        this.experiments.forEach(experiment => {
            const option = document.createElement('option');
            option.value = experiment.id;
            option.textContent = experiment.title;
            select.appendChild(option);
        });

        // 同时更新记录表单中的实验选择
        const recordSelect = document.getElementById('record-experiment');
        recordSelect.innerHTML = '<option value=\"\">请选择实验</option>';
        
        this.experiments.forEach(experiment => {
            const option = document.createElement('option');
            option.value = experiment.id;
            option.textContent = experiment.title;
            recordSelect.appendChild(option);
        });
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'active': '进行中',
            'completed': '已完成',
            'planned': '计划中'
        };
        return statusMap[status] || status;
    }

    // 获取文件图标
    getFileIcon(previewType) {
        const icons = {
            'image': '🖼️',
            'csv': '📊',
            'excel': '📈',
            'text': '📝',
            'pdf': '📄',
            'unknown': '📎'
        };
        return icons[previewType] || '📎';
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 过滤记录
    filterRecords() {
        this.renderRecords();
    }

    // 切换记录的折叠/展开状态
    toggleRecord(recordId) {
        const content = document.getElementById(`record-content-${recordId}`);
        const recordCard = content ? content.closest('.record-card') : null;
        const toggleIcon = recordCard ? recordCard.querySelector('.toggle-icon') : null;
        
        if (content && toggleIcon) {
            if (content.style.display === 'none' || content.style.display === '') {
                content.style.display = 'block';
                toggleIcon.textContent = '▲';
                // 添加展开动画
                content.style.animation = 'slideDown 0.3s ease-out';
            } else {
                content.style.display = 'none';
                toggleIcon.textContent = '▼';
            }
        }
    }

    // 处理内容并添加表格复制功能
    processContentWithTableCopy(content, recordId, contentType) {
        if (!content) return '';
        
        // 检查内容是否包含HTML表格
        if (this.containsTable(content)) {
            const tableId = `table-${recordId}-${contentType}`;
            return `
                <div class="table-container">
                    <div id="${tableId}" class="table-content">
                        ${content}
                    </div>
                </div>
            `;
        } else {
            // 如果不包含表格，直接返回原内容
            return `<p>${content}</p>`;
        }
    }

    // 渲染记录内容，并在标题左侧添加复制按钮
    renderRecordContent(content, recordId, contentType, title) {
        if (!content) return '';
        
        if (this.containsTable(content)) {
            const tableId = `table-${recordId}-${contentType}`;
            return `
                <div class="content-with-table">
                    <div class="content-header">
                        <h5>${title}</h5>
                        <div class="table-copy-options">
                            <button class="btn btn-copy" onclick="app.copyTable('${tableId}', 'html')" title="复制HTML表格代码">
                                🔗 复制HTML
                            </button>
                            <button class="btn btn-copy btn-copy-recommended" onclick="app.copyTable('${tableId}', 'text')" title="复制为制表符分隔的文本格式">
                                📋 复制文本 (推荐)
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <div id="${tableId}" class="table-content">
                            ${content}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <h5>${title}</h5>
                <p>${content}</p>
            `;
        }
    }

    // 检查内容是否包含表格
    containsTable(content) {
        if (typeof content !== 'string') return false;
        
        // 检查HTML表格标签
        if (content.includes('<table') || content.includes('<Table')) {
            return true;
        }
        
        // 检查文本表格格式（例如：用 | 分隔的表格）
        const lines = content.split('\n');
        let tableLines = 0;
        for (const line of lines) {
            if (line.trim().includes('|') && line.split('|').length >= 3) {
                tableLines++;
                if (tableLines >= 2) return true; // 至少2行包含表格分隔符
            }
        }
        
        return false;
    }

    // 复制表格内容
    async copyTable(tableId, format) {
        try {
            const tableContainer = document.getElementById(tableId);
            if (!tableContainer) {
                this.showCopyMessage('表格未找到', 'error');
                return;
            }

            let textToCopy = '';
            
            switch (format) {
                case 'text':
                    textToCopy = this.extractTableAsText(tableContainer);
                    break;
                case 'html':
                    textToCopy = this.extractTableAsHTML(tableContainer);
                    break;
                default:
                    textToCopy = this.extractTableAsText(tableContainer);
            }

            // 使用现代剪贴板API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
                this.showCopyMessage(`表格已复制为${this.getFormatName(format)}格式`, 'success');
            } else {
                // 降级到传统方法
                this.fallbackCopyTextToClipboard(textToCopy);
                this.showCopyMessage(`表格已复制为${this.getFormatName(format)}格式`, 'success');
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.showCopyMessage('复制失败，请手动选择并复制', 'error');
        }
    }

    // 提取表格为纯文本格式
    extractTableAsText(container) {
        const tables = container.querySelectorAll('table');
        if (tables.length > 0) {
            return this.htmlTableToText(tables[0]);
        } else {
            // 处理文本格式的表格
            return this.textTableToText(container.textContent || container.innerText);
        }
    }

    // 提取表格为HTML格式
    extractTableAsHTML(container) {
        const tables = container.querySelectorAll('table');
        if (tables.length > 0) {
            return tables[0].outerHTML;
        } else {
            // 将文本表格转换为HTML表格
            return this.textTableToHTML(container.textContent || container.innerText);
        }
    }

    // HTML表格转纯文本
    htmlTableToText(table) {
        const rows = table.querySelectorAll('tr');
        const textRows = [];
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const cellTexts = Array.from(cells).map(cell => 
                (cell.textContent || cell.innerText).trim()
            );
            textRows.push(cellTexts.join('\t'));
        });
        
        return textRows.join('\n');
    }

    // 文本表格转纯文本
    textTableToText(content) {
        const lines = content.split('\n');
        const tableLines = lines.filter(line => line.trim().includes('|'));
        
        return tableLines.map(line => {
            return line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell.length > 0)
                .join('\t');
        }).join('\n');
    }

    // 文本表格转HTML
    textTableToHTML(content) {
        const lines = content.split('\n');
        const tableLines = lines.filter(line => line.trim().includes('|'));
        
        if (tableLines.length === 0) return content;
        
        let html = '<table class="generated-table">';
        
        tableLines.forEach((line, index) => {
            const cells = line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell.length > 0);
            
            html += '<tr>';
            cells.forEach(cell => {
                const tag = index === 0 ? 'th' : 'td'; // 第一行作为表头
                html += `<${tag}>${cell}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 降级复制方法（兼容旧浏览器）
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('降级复制方法也失败了:', err);
            throw err;
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 显示复制结果消息
    showCopyMessage(message, type = 'info') {
        // 创建临时提示框
        const toast = document.createElement('div');
        toast.className = `copy-toast copy-toast-${type}`;
        toast.textContent = message;
        
        // 添加样式
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        if (type === 'success') {
            toast.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#dc3545';
        } else {
            toast.style.backgroundColor = '#17a2b8';
        }
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    }

    // 获取格式名称
    getFormatName(format) {
        const names = {
            'text': '文本',
            'html': 'HTML'
        };
        return names[format] || '文本';
    }

    // ========== RNA反转录计算相关方法 ==========
    
    // 设置RNA样本组
    setupRNAGroups() {
        const totalAmount = parseFloat(document.getElementById('rna-total-amount').value);
        const groupCount = parseInt(document.getElementById('rna-group-count').value);
        
        if (!totalAmount || totalAmount <= 0) {
            alert('请输入有效的RNA总量');
            return;
        }
        
        if (!groupCount || groupCount <= 0 || groupCount > 20) {
            alert('请输入有效的样本组数（1-20）');
            return;
        }
        
        this.targetRNAAmount = totalAmount;
        this.rnaGroupCount = groupCount;
        
        // 预设组别名称
        const presetGroups = [
            "对照组1", "对照组2", "对照组3",
            "实验组100浓度", "实验组300浓度", "实验组500浓度",
            "实验组1", "实验组2", "实验组3", "实验组4",
            "处理组A", "处理组B", "处理组C", "处理组D"
        ];
        
        // 生成样本组输入界面
        const container = document.getElementById('rna-groups-container');
        let html = `
            <div class="rna-groups-header">
                <div class="header-item">组别名称</div>
                <div class="header-item">RNA浓度测量值(ng/μL)</div>
            </div>
        `;
        
        for (let i = 0; i < groupCount; i++) {
            html += `
                <div class="rna-group-row">
                    <div class="group-name-section">
                        <select class="group-preset" onchange="app.updateGroupName(${i}, this.value)">
                            <option value="">自定义</option>
                            ${presetGroups.map(name => `<option value="${name}">${name}</option>`).join('')}
                        </select>
                        <input type="text" id="rna-group-name-${i}" placeholder="第${i+1}组名称" class="group-name-input" />
                    </div>
                    <div class="concentration-section">
                        <input type="number" id="rna-conc-${i}-1" placeholder="测量值1" class="concentration-input" step="0.01" />
                        <input type="number" id="rna-conc-${i}-2" placeholder="测量值2" class="concentration-input" step="0.01" />
                        <input type="number" id="rna-conc-${i}-3" placeholder="测量值3" class="concentration-input" step="0.01" />
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        document.getElementById('rna-groups-section').style.display = 'block';
        document.getElementById('rna-groups-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    // 更新组别名称
    updateGroupName(groupIndex, selectedName) {
        const nameInput = document.getElementById(`rna-group-name-${groupIndex}`);
        if (selectedName && nameInput) {
            nameInput.value = selectedName;
        }
    }
    
    // 计算RNA反转录体系
    calculateRNA() {
        try {
            const groups = [];
            
            // 收集每组数据
            for (let i = 0; i < this.rnaGroupCount; i++) {
                const name = document.getElementById(`rna-group-name-${i}`).value.trim() || `第${i+1}组`;
                const concentrations = [];
                
                // 获取浓度测量值
                for (let j = 1; j <= 3; j++) {
                    const input = document.getElementById(`rna-conc-${i}-${j}`);
                    const value = parseFloat(input.value);
                    if (!isNaN(value) && value > 0) {
                        concentrations.push(value);
                    }
                }
                
                if (concentrations.length === 0) {
                    alert(`${name} 至少需要一个有效的RNA浓度测量值`);
                    return;
                }
                
                // 计算平均浓度
                const avgConcentration = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
                
                groups.push({
                    name: name,
                    concentrations: concentrations,
                    avgConcentration: avgConcentration,
                    rnaVolume: this.targetRNAAmount / avgConcentration,
                    depctWaterVolume: 20 - 2 - 4 - (this.targetRNAAmount / avgConcentration)
                });
            }
            
            // 显示计算结果
            this.displayRNAResults(groups);
            
        } catch (error) {
            console.error('RNA计算出错:', error);
            alert('计算过程中出现错误: ' + error.message);
        }
    }
    
    // 显示RNA计算结果
    displayRNAResults(groups) {
        const resultsContainer = document.getElementById('rna-results-table');
        
        let html = `
            <div class="rna-results-info">
                <h5>📋 反转录体系配制方案</h5>
                <p><strong>目标RNA总量:</strong> ${this.targetRNAAmount} ng | <strong>样本组数:</strong> ${groups.length}</p>
            </div>
            
            <div class="results-table-container">
                <table class="rna-results-table">
                    <thead>
                        <tr>
                            <th>样本组</th>
                            <th>RNA浓度<br>(ng/μL)</th>
                            <th>RNA体积<br>(μL)</th>
                            <th>8x gDNA Eraser<br>(μL)</th>
                            <th>DEPC水<br>(μL)</th>
                            <th>预反应后加入<br>5x RT Premix (μL)</th>
                            <th>总体积<br>(μL)</th>
                            <th>备注</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        groups.forEach((group, index) => {
            const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
            const warning = group.depctWaterVolume < 0 ? '⚠️ RNA浓度过低' : '';
            
            html += `
                <tr style="background-color: ${bgColor};">
                    <td style="font-weight: bold; color: #667eea;">${group.name}</td>
                    <td>${group.avgConcentration.toFixed(2)}</td>
                    <td>${group.rnaVolume.toFixed(2)}</td>
                    <td>2.00</td>
                    <td>${Math.max(group.depctWaterVolume, 0).toFixed(2)}</td>
                    <td>4.00</td>
                    <td>20.00</td>
                    <td style="color: ${warning ? '#dc3545' : '#28a745'}; font-weight: bold;">
                        ${warning || '✅ 正常'}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="rna-protocol-info">
                <h6>📝 操作说明</h6>
                <ol>
                    <li><strong>第一步：</strong>依次加入RNA样本、8x gDNA Eraser和DEPC水，混匀</li>
                    <li><strong>预反应：</strong>42°C孵育2分钟（去除基因组DNA）</li>
                    <li><strong>第二步：</strong>加入5x RT Premix，充分混匀</li>
                    <li><strong>逆转录反应：</strong>37°C 15分钟，85°C 5分钟灭活酶</li>
                    <li>反应完成后可直接用于qPCR或-20°C保存</li>
                    <li>如显示RNA浓度过低警告，建议浓缩RNA或调整目标总量</li>
                </ol>
                
                <div class="components-info">
                    <h6>🧪 试剂组成</h6>
                    <div class="component-grid">
                        <div class="component-item">
                            <strong>8x gDNA Eraser (2μL):</strong>
                            <span>去除基因组DNA污染</span>
                        </div>
                        <div class="component-item">
                            <strong>5x RT Premix (4μL):</strong>
                            <span>逆转录酶预混液</span>
                        </div>
                        <div class="component-item">
                            <strong>RNA样本:</strong>
                            <span>根据浓度调整体积</span>
                        </div>
                        <div class="component-item">
                            <strong>DEPC水:</strong>
                            <span>补充至总体积20μL</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
        document.getElementById('rna-results-section').style.display = 'block';
        document.getElementById('rna-results-section').scrollIntoView({ behavior: 'smooth' });
        
        // 保存结果供后续使用
        this.lastRNAResults = {
            targetAmount: this.targetRNAAmount,
            groups: groups,
            timestamp: new Date().toISOString()
        };
    }
    
    // 保存RNA结果到实验记录
    saveRNAResults() {
        if (!this.lastRNAResults) {
            alert('没有可保存的RNA计算结果');
            return;
        }
        
        const results = this.lastRNAResults;
        
        // 生成详细的实验记录内容
        const recordContent = this.generateRNAReportHTML(results);
        
        const record = {
            id: this.generateId(),
            experimentId: '',
            date: new Date().toISOString().split('T')[0],
            content: recordContent,
            parameters: `目标RNA总量: ${results.targetAmount}ng, 样本组数: ${results.groups.length}`,
            results: `反转录体系计算完成，共${results.groups.length}个样本组`,
            createdAt: new Date().toISOString(),
            type: 'rna_reverse_transcription'
        };
        
        if (this.experiments.length > 0) {
            this.showExperimentSelectionModal(record, 'RNA反转录计算结果');
        } else {
            this.records.push(record);
            this.saveData();
            alert('RNA反转录计算结果已保存到实验记录！');
        }
    }
    
    // 生成RNA实验报告HTML
    generateRNAReportHTML(results) {
        return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h2 style="margin: 0; font-size: 1.5rem;">🧬 RNA反转录反应体系计算报告</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">生成时间: ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0;">📊 实验参数</h3>
                    <p><strong>目标RNA总量:</strong> ${results.targetAmount} ng</p>
                    <p><strong>样本组数:</strong> ${results.groups.length}</p>
                    <p><strong>计算时间:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #667eea; margin: 0 0 15px 0;">📋 反转录体系配制表</h3>
                    <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">样本组</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">RNA浓度(ng/μL)</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">RNA体积(μL)</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">8x gDNA Eraser(μL)</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">DEPC水(μL)</th>
                                    <th style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3);">预反应后加入<br>5x RT Premix(μL)</th>
                                    <th style="padding: 12px; text-align: center;">总体积(μL)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.groups.map((group, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px; text-align: center; font-weight: bold; color: #667eea;">${group.name}</td>
                                    <td style="padding: 12px; text-align: center;">${group.avgConcentration.toFixed(2)}</td>
                                    <td style="padding: 12px; text-align: center;">${group.rnaVolume.toFixed(2)}</td>
                                    <td style="padding: 12px; text-align: center;">2.00</td>
                                    <td style="padding: 12px; text-align: center;">${Math.max(group.depctWaterVolume, 0).toFixed(2)}</td>
                                    <td style="padding: 12px; text-align: center;">4.00</td>
                                    <td style="padding: 12px; text-align: center;">20.00</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #1976D2; margin: 0 0 15px 0;">🧪 试剂组成说明</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <p style="margin: 5px 0;"><strong>8x gDNA Eraser (2μL):</strong></p>
                            <p style="margin: 5px 0; color: #666;">去除基因组DNA污染，确保cDNA合成特异性</p>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <p style="margin: 5px 0;"><strong>5x RT Premix (4μL):</strong></p>
                            <p style="margin: 5px 0; color: #666;">包含逆转录酶和必要的缓冲液体系</p>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <h4 style="color: #666; margin: 0 0 10px 0;">📝 操作要点</h4>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>所有试剂使用前充分混匀，避免反复冻融</li>
                        <li>RNA样本应保存在-80°C，使用前在冰上快速解冻</li>
                        <li><strong>第一步：</strong>依次加入RNA样本、8x gDNA Eraser和DEPC水，混匀</li>
                        <li><strong>预反应：</strong>42°C孵育2分钟（去除基因组DNA）</li>
                        <li><strong>第二步：</strong>加入5x RT Premix，充分混匀</li>
                        <li><strong>逆转录反应：</strong>37°C 15分钟，85°C 5分钟灭活酶</li>
                        <li>反应完成后可直接用于qPCR或-20°C保存</li>
                    </ol>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #ddd; border-top: none; font-size: 0.8rem; color: #666;">
                本报告由实验管理系统自动生成 | RNA反转录体系计算基于标准20μL反应体系
            </div>
        </div>
        `;
    }
    
    // 导出RNA结果
    exportRNAResults() {
        if (!this.lastRNAResults) {
            alert('没有可导出的RNA计算结果');
            return;
        }
        
        const results = this.lastRNAResults;
        const exportData = {
            计算类型: 'RNA反转录反应体系计算',
            基本信息: {
                目标RNA总量: results.targetAmount,
                样本组数: results.groups.length,
                计算时间: new Date(results.timestamp).toLocaleString()
            },
            样本组详情: results.groups.map(group => ({
                组名: group.name,
                RNA浓度测量值: group.concentrations,
                平均RNA浓度: parseFloat(group.avgConcentration.toFixed(2)),
                RNA体积: parseFloat(group.rnaVolume.toFixed(2)),
                DEPC水体积: parseFloat(Math.max(group.depctWaterVolume, 0).toFixed(2)),
                总体积: 20.0,
                试剂组成: {
                    'RNA样本': `${group.rnaVolume.toFixed(2)} μL`,
                    '8x gDNA Eraser': '2.00 μL',
                    '5x RT Premix': '4.00 μL',
                    'DEPC水': `${Math.max(group.depctWaterVolume, 0).toFixed(2)} μL`
                }
            }))
        };
        
        const filename = `RNA反转录计算结果_${new Date().toISOString().split('T')[0]}.json`;
        
        try {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('RNA计算结果已导出！');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请检查浏览器设置');
        }
    }
    
    // 清空RNA输入
    clearRNAInputs() {
        document.getElementById('rna-total-amount').value = '';
        document.getElementById('rna-group-count').value = '';
        document.getElementById('rna-groups-section').style.display = 'none';
        document.getElementById('rna-results-section').style.display = 'none';
        document.getElementById('rna-groups-container').innerHTML = '';
        
        this.targetRNAAmount = null;
        this.rnaGroupCount = null;
        this.lastRNAResults = null;
    }
    
    // ========== RNA反转录计算方法结束 ==========

    // 加载数据
    loadData() {
        const savedData = localStorage.getItem('experimentData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.experiments = data.experiments || [];
            this.records = data.records || [];
            this.files = data.files || [];
            // 转换所有计划为ExperimentPlan实例
            if (data.plans) {
                this.plans = data.plans.map(plan => {
                    if (plan instanceof ExperimentPlan) {
                        // 已经是ExperimentPlan实例
                        return plan;
                    } else if (plan && typeof plan === 'object') {
                        // 转换为ExperimentPlan实例
                        return new ExperimentPlan(plan);
                    } else {
                        // 处理旧格式计划
                        const newPlan = new ExperimentPlan({
                            id: plan.id,
                            title: plan.title,
                            status: plan.status,
                            createdAt: plan.createdAt,
                            updatedAt: plan.updatedAt,
                            modules: plan.modules || []
                        });
                        
                        // 添加默认模块（如果是旧格式）
                        if (plan.overview?.background) {
                            const section = newPlan.addModule(null, MODULE_TYPES.SECTION);
                            section.title = '研究概述';
                            section.content = plan.overview.background;
                        }
                        
                        if (plan.overview?.objectives?.length > 0) {
                            plan.overview.objectives.forEach(obj => {
                                const module = newPlan.addModule(null, MODULE_TYPES.OBJECTIVE);
                                module.content = obj;
                            });
                        }
                        
                        return newPlan;
                    }
                });
            } else {
                this.plans = [];
            }
        }
    }

    // 保存数据
    saveData() {
        const data = {
            experiments: this.experiments,
            records: this.records,
            files: this.files,
            plans: this.plans.map(plan => {
                // 检查plan是否有toJSON方法
                if (plan && typeof plan.toJSON === 'function') {
                    return plan.toJSON();
                } else {
                    // 处理旧格式的plan对象，直接返回原对象
                    return plan;
                }
            })
        };
        localStorage.setItem('experimentData', JSON.stringify(data));
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ========== 实验计划相关方法 ==========
    
    // 渲染计划列表
    renderPlans() {
        const container = document.getElementById('plans-list');
        let filteredPlans = [...this.plans];
        
        // 应用过滤器
        const statusFilter = document.getElementById('plan-status-filter').value;
        const searchFilter = document.getElementById('plan-search-filter').value.toLowerCase();
        
        if (statusFilter) {
            filteredPlans = filteredPlans.filter(plan => plan.status === statusFilter);
        }
        
        if (searchFilter) {
            filteredPlans = filteredPlans.filter(plan => 
                plan.title.toLowerCase().includes(searchFilter)
            );
        }
        
        if (filteredPlans.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>暂无计划</h3><p>点击上方按钮创建你的第一个实验计划</p></div>';
            return;
        }
        
        // 按创建时间倒序排列
        filteredPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = filteredPlans.map(plan => `
            <div class="plan-card" onclick="app.showPlanDetail('${plan.id}')" style="cursor: pointer;">
                <h4>${plan.title}</h4>
                <div class="plan-meta">
                    <span class="plan-status status-${plan.status}">${this.getPlanStatusText(plan.status)}</span>
                    <span class="plan-date">${new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="plan-summary">
                    <small>包含 ${(plan.modules || []).length} 个模块</small>
                </div>
            </div>
        `).join('');
    }

    // 显示计划详情
    showPlanDetail(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;
        
        this.currentPlanId = planId;
        this.currentPlan = plan;
        
        // 修改：直接进入编辑模式，不再使用只读模式
        this.openPlanEditor(plan, false);
    }
    
    // 打开计划编辑器
    openPlanEditor(plan, isReadOnly = false) {
        currentEditingPlan = plan;
        this.currentPlan = plan;
        // 修改：去掉只读模式，强制设为false
        isReadOnlyMode = false;
        
        // 修改：始终设置为编辑计划
        document.getElementById('plan-modal-title').textContent = '编辑计划';
        
        // 填充基本信息
        document.getElementById('plan-title').value = plan.title;
        document.getElementById('plan-status').value = plan.status;
        
        // 修改：始终允许编辑
        document.getElementById('plan-title').readOnly = false;
        document.getElementById('plan-status').disabled = false;
        document.querySelector('.add-module-btn').style.display = 'flex';
        document.querySelector('.form-actions').style.display = 'block';
        
        // 始终显示删除按钮
        const deleteBtn = document.getElementById('delete-plan-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }
        
        // 渲染模块
        renderPlanModules();
        
        // 显示模态框
        document.getElementById('add-plan-modal').style.display = 'block';
    }
    
    // 显示旧版计划详情（备用）
    showPlanDetailLegacy(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;
        
        this.currentPlanId = planId;
        
        document.getElementById('plan-detail-title').textContent = plan.title;
        
        const content = document.getElementById('plan-detail-content');
        content.innerHTML = `
            <div class="plan-meta">
                <span class="plan-status status-${plan.status}">${plan.getStatusText()}</span>
                <span class="plan-date">创建于: ${new Date(plan.createdAt).toLocaleDateString()}</span>
                <span class="plan-date">更新于: ${new Date(plan.updatedAt).toLocaleDateString()}</span>
            </div>
            
            ${plan.methodology && (plan.methodology.approach || plan.methodology.techniques) ? `
                <div class="plan-section">
                    <h4>研究方法</h4>
                    ${plan.methodology.approach ? `
                        <h5>研究方法</h5>
                        <p>${plan.methodology.approach.replace(/\n/g, '<br>')}</p>
                    ` : ''}
                    ${plan.methodology.techniques && plan.methodology.techniques.length > 0 ? `
                        <h5>技术手段</h5>
                        <ul>
                            ${plan.methodology.techniques.map(tech => `<li>${tech}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            ` : ''}
            
            ${plan.resources && (plan.resources.equipment || plan.resources.materials) ? `
                <div class="plan-section">
                    <h4>资源需求</h4>
                    ${plan.resources.equipment && plan.resources.equipment.length > 0 ? `
                        <h5>所需设备</h5>
                        <ul>
                            ${plan.resources.equipment.map(equip => `<li>${equip}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${plan.resources.materials && plan.resources.materials.length > 0 ? `
                        <h5>所需材料</h5>
                        <ul>
                            ${plan.resources.materials.map(mat => `<li>${mat}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            ` : ''}
            
            ${plan.expectedOutcomes ? `
                <div class="plan-section">
                    <h4>预期成果</h4>
                    <p>${plan.expectedOutcomes.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${plan.notes ? `
                <div class="plan-section">
                    <h4>备注</h4>
                    <p>${plan.notes.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
        `;
        
        document.getElementById('plan-detail-modal').style.display = 'block';
    }

    // 获取计划状态文本
    getPlanStatusText(status) {
        const statusTexts = {
            'draft': '草稿',
            'active': '进行中',
            'completed': '已完成'
        };
        return statusTexts[status] || status;
    }

    // 添加计划 - 已迁移到 plan-editor.js

    // 编辑计划
    editPlan() {
        const plan = this.plans.find(p => p.id === this.currentPlanId);
        if (!plan) return;
        
        this.openPlanEditor(plan, false);
    }

    // 更新计划 - 已迁移到 plan-editor.js

    // 从计划创建实验
    createExperimentFromPlan() {
        const plan = this.plans.find(p => p.id === this.currentPlanId);
        if (!plan) return;
        
        // 关闭计划详情模态框
        closeModal('plan-detail-modal');
        
        // 填充实验表单
        document.getElementById('experiment-title').value = plan.title;
        document.getElementById('experiment-description').value = 
            `基于实验计划《${plan.title}》创建的实验项目。\n\n${plan.overview.background || ''}`;
        
        // 显示新建实验模态框
        showAddExperimentModal();
    }

    // 删除计划
    deletePlan(planId) {
        // 如果没有传入planId，使用当前计划ID
        const idToDelete = planId || this.currentPlanId;
        
        if (!idToDelete) return;
        
        if (confirm('确定要删除这个计划吗？此操作不可恢复。')) {
            const index = this.plans.findIndex(p => p.id === idToDelete);
            if (index !== -1) {
                this.plans.splice(index, 1);
                this.saveData();
                
                // 如果在计划详情模态框中删除，关闭模态框
                if (!planId) {
                    closeModal('plan-detail-modal');
                }
                
                // 刷新计划列表
                if (this.currentTab === 'plans') {
                    this.renderPlans();
                }
                
                this.showToast('计划已删除', 'success');
            }
        }
    }

    // 过滤计划
    filterPlans() {
        this.renderPlans();
    }
}

// 模态框管理函数
function showAddExperimentModal() {
    document.getElementById('add-experiment-modal').style.display = 'block';
}

function showAddRecordModal() {
    document.getElementById('add-record-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function editPlan() {
    if (app) app.editPlan();
}

function createExperimentFromPlan() {
    if (app) app.createExperimentFromPlan();
}

function deletePlan() {
    if (app) app.deletePlan();
}

// 初始化应用程序
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ExperimentApp();
    // 将 app 暴露到全局作用域，供计划编辑器使用
    window.app = app;
});