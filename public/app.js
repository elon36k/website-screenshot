// 网站截图服务 - 前端脚本

const form = document.getElementById('screenshotForm');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultContent = document.getElementById('resultContent');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }
    
    // 显示加载状态
    loading.style.display = 'block';
    result.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = '生成中...';
    
    try {
        const response = await fetch(`/api/screenshot?${params}`);
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.data);
        } else {
            showError(data.error || '截图生成失败');
        }
    } catch (error) {
        showError('网络请求失败: ' + error.message);
    } finally {
        // 隐藏加载状态
        loading.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = '📸 生成截图';
    }
});

function showSuccess(data) {
    result.className = 'result success';
    result.style.display = 'block';
    
    resultContent.innerHTML = `
        <h3>✅ 截图生成成功${data.cached ? ' (使用缓存)' : ''}</h3>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">网站标题</div>
                <div class="info-value">${data.title || '无'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">尺寸</div>
                <div class="info-value">${data.width} × ${data.height}px</div>
            </div>
            <div class="info-item">
                <div class="info-label">模式</div>
                <div class="info-value">${data.fullPage ? '全页截图' : '视窗截图'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">生成时间</div>
                <div class="info-value">${new Date(data.createdAt).toLocaleString()}</div>
            </div>
        </div>
        
        ${data.description ? `
            <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">网站描述</div>
                <div class="info-value">${data.description}</div>
            </div>
        ` : ''}
        
        ${data.keywords ? `
            <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">关键词</div>
                <div class="info-value">${data.keywords}</div>
            </div>
        ` : ''}
        
        <div class="screenshot-preview">
            <img src="${data.screenshotUrl || `data:image/png;base64,${data.screenshot}`}" alt="网站截图" />
        </div>
    `;
}

function showError(message) {
    result.className = 'result error';
    result.style.display = 'block';
    resultContent.innerHTML = `
        <h3>❌ 截图生成失败</h3>
        <p>${message}</p>
    `;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 预填充一些示例URL
    const examples = [
        'https://www.baidu.com',
        'https://github.com',
        'https://www.google.com',
        'https://stackoverflow.com'
    ];
    
    // 随机选择一个示例URL作为placeholder
    const urlInput = document.getElementById('url');
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    urlInput.placeholder = randomExample;
});
