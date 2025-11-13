    // 打开计划编辑器
    openPlanEditor(plan, isReadOnly = false) {
        currentEditingPlan = plan;
        this.currentPlan = plan;
        
        // 设置模态框标题
        document.getElementById('plan-modal-title').textContent = isReadOnly ? '查看计划' : '编辑计划';
        
        // 填充基本信息
        document.getElementById('plan-title').value = plan.title;
        document.getElementById('plan-status').value = plan.status;
        
        // 只读模式设置
        if (isReadOnly) {
            document.getElementById('plan-title').readOnly = true;
            document.getElementById('plan-status').disabled = true;
            document.querySelector('.add-module-btn').style.display = 'none';
            document.querySelector('.form-actions').style.display = 'none';
        } else {
            document.getElementById('plan-title').readOnly = false;
            document.getElementById('plan-status').disabled = false;
            document.querySelector('.add-module-btn').style.display = 'flex';
            document.querySelector('.form-actions').style.display = 'block';
        }
        
        // 渲染模块
        renderPlanModules();
        
        // 显示模态框
        document.getElementById('add-plan-modal').style.display = 'block';
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

    // 编辑计划
    editPlan() {
        const plan = this.plans.find(p => p.id === this.currentPlanId);
        if (!plan) return;
        
        this.openPlanEditor(plan, false);
    }

    // 从计划创建实验
    createExperimentFromPlan() {
        const plan = this.plans.find(p => p.id === this.currentPlanId);
        if (!plan) return;
        
        // 关闭计划详情模态框
        closeModal('add-plan-modal');
        
        // 填充实验表单
        document.getElementById('experiment-title').value = plan.title;
        document.getElementById('experiment-description').value = 
            `基于实验计划《${plan.title}》创建的实验项目。`;
        
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
                closeModal('add-plan-modal');
                
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