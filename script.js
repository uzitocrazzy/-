const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 定义区域 - 两个相叠加的椭圆
const leftEllipse = { x: 300, y: 300, rx: 200, ry: 150 };
const rightEllipse = { x: 500, y: 300, rx: 200, ry: 150 };

// 生成随机位置（避开椭圆区域、文字标签和已放置的成分）
function getRandomPosition(components) {
    let x, y;
    let isValidPosition = false;
    const minDistance = 80; // 成分之间的最小距离
    const labelHeight = 30; // 文字标签的高度
    
    while (!isValidPosition) {
        // 在画布范围内生成随机位置
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        
        // 检查是否在椭圆内
        const inLeft = Math.pow((x - leftEllipse.x) / leftEllipse.rx, 2) + 
                      Math.pow((y - leftEllipse.y) / leftEllipse.ry, 2) <= 1;
        const inRight = Math.pow((x - rightEllipse.x) / rightEllipse.rx, 2) + 
                       Math.pow((y - rightEllipse.y) / rightEllipse.ry, 2) <= 1;
        
        // 检查是否在文字标签区域内
        const inLeftLabel = x > leftEllipse.x - 50 && x < leftEllipse.x + 50 && 
                           y > leftEllipse.y - leftEllipse.ry - 40 && y < leftEllipse.y - leftEllipse.ry;
        const inRightLabel = x > rightEllipse.x - 50 && x < rightEllipse.x + 50 && 
                            y > rightEllipse.y - rightEllipse.ry - 40 && y < rightEllipse.y - rightEllipse.ry;
        
        if (!inLeft && !inRight && !inLeftLabel && !inRightLabel) {
            // 检查是否与其他成分重叠
            let hasOverlap = false;
            for (const comp of components) {
                if (comp.x && comp.y) {
                    const distance = Math.sqrt(Math.pow(x - comp.x, 2) + Math.pow(y - comp.y, 2));
                    if (distance < minDistance) {
                        hasOverlap = true;
                        break;
                    }
                }
            }
            if (!hasOverlap) {
                isValidPosition = true;
            }
        }
    }
    
    return { x, y };
}

// 定义可拖拽的成分
const components = [
    { name: '脱氧核糖', color: '#FF6B6B', allowedIn: ['left'] },
    { name: 'T', color: '#4ECDC4', allowedIn: ['left'] },
    { name: '核糖', color: '#45B7D1', allowedIn: ['right'] },
    { name: 'U', color: '#96CEB4', allowedIn: ['right'] },
    { name: '磷酸', color: '#FFEEAD', allowedIn: ['middle'] },
    { name: 'A', color: '#D4A5A5', allowedIn: ['middle'] },
    { name: 'G', color: '#9B59B6', allowedIn: ['middle'] },
    { name: 'C', color: '#3498DB', allowedIn: ['middle'] }
];

// 为每个成分生成随机位置
components.forEach((comp, index) => {
    const pos = getRandomPosition(components.slice(0, index));
    comp.x = pos.x;
    comp.y = pos.y;
    comp.originalX = pos.x;
    comp.originalY = pos.y;
});

let draggedComponent = null;
let offsetX, offsetY;
let feedbackText = '';
let feedbackTimer = null;

// 绘制椭圆区域
function drawEllipses() {
    ctx.save();
    
    // 绘制左椭圆
    ctx.beginPath();
    ctx.ellipse(leftEllipse.x, leftEllipse.y, leftEllipse.rx, leftEllipse.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制右椭圆
    ctx.beginPath();
    ctx.ellipse(rightEllipse.x, rightEllipse.y, rightEllipse.rx, rightEllipse.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(69, 183, 209, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#45B7D1';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 添加区域标签
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FF6B6B';
    ctx.textAlign = 'center';
    ctx.fillText('DNA', leftEllipse.x, leftEllipse.y - leftEllipse.ry - 20);
    ctx.fillStyle = '#45B7D1';
    ctx.fillText('RNA', rightEllipse.x, rightEllipse.y - rightEllipse.ry - 20);
    
    ctx.restore();
}

// 绘制成分
function drawComponents() {
    components.forEach(comp => {
        ctx.save();
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 绘制圆形
        ctx.beginPath();
        ctx.arc(comp.x, comp.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = comp.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制文字
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(comp.name, comp.x, comp.y);
        
        ctx.restore();
    });
}

// 绘制反馈信息
function drawFeedback() {
    if (feedbackText) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = feedbackText.includes('成功') ? '#4CAF50' : '#F44336';
        ctx.fillText(feedbackText, canvas.width / 2, 50);
        ctx.restore();
    }
}

// 检查点是否在椭圆内
function isPointInEllipse(x, y, ellipse) {
    return Math.pow((x - ellipse.x) / ellipse.rx, 2) + 
           Math.pow((y - ellipse.y) / ellipse.ry, 2) <= 1;
}

// 检查成分是否在允许的区域
function isComponentInAllowedArea(comp) {
    const inLeft = isPointInEllipse(comp.x, comp.y, leftEllipse);
    const inRight = isPointInEllipse(comp.x, comp.y, rightEllipse);
    
    // 中间区域是两个椭圆的交集
    const inMiddle = inLeft && inRight;
    
    if (comp.allowedIn.includes('left') && inLeft && !inRight) return true;
    if (comp.allowedIn.includes('right') && inRight && !inLeft) return true;
    if (comp.allowedIn.includes('middle') && inMiddle) return true;
    
    return false;
}

// 显示反馈信息
function showFeedback(text) {
    feedbackText = text;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
        feedbackText = '';
    }, 2000);
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEllipses();
    drawComponents();
    drawFeedback();
    requestAnimationFrame(animate);
}

// 事件处理
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    components.forEach(comp => {
        const distance = Math.sqrt(Math.pow(x - comp.x, 2) + Math.pow(y - comp.y, 2));
        if (distance <= 30) {
            draggedComponent = comp;
            offsetX = x - comp.x;
            offsetY = y - comp.y;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (draggedComponent) {
        const rect = canvas.getBoundingClientRect();
        draggedComponent.x = e.clientX - rect.left - offsetX;
        draggedComponent.y = e.clientY - rect.top - offsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    if (draggedComponent) {
        if (isComponentInAllowedArea(draggedComponent)) {
            showFeedback('放置成功！');
        } else {
            showFeedback('放置失败，请放入正确区域！');
            draggedComponent.x = draggedComponent.originalX;
            draggedComponent.y = draggedComponent.originalY;
        }
        draggedComponent = null;
    }
});

// 开始动画
animate(); 