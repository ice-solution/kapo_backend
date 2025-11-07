// controllers/ReportController.js
const ClientProfile = require('../models/clientProfile');
const puppeteer = require('puppeteer');

exports.generateClientReport = async (req, res) => {
    const owner = req.session.userId; // 從 session 中獲取 owner ID
    const { id } = req.params; // 從路由參數中獲取 clientProfile ID

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    try {
        // 查找該 clientProfile
        const clientProfile = await ClientProfile.findById(id);

        // 檢查該 clientProfile 是否存在
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }

        // 檢查 owner 是否匹配
        if (clientProfile.owner.toString() !== owner) {
            return res.status(403).json({ message: '您無權存取此客戶檔案' });
        }

        // 輸出實際數據結構供調試
        console.log('=== ClientProfile 數據結構 (ID: ' + id + ') ===');
        console.log('ringPercent 原始數據:', JSON.stringify(clientProfile.ringPercent, null, 2));
        console.log('ringPercent 數量:', clientProfile.ringPercent?.length || 0);
        if (clientProfile.ringPercent && clientProfile.ringPercent.length > 0) {
            console.log('ringPercent 第一個條目:', JSON.stringify(clientProfile.ringPercent[0], null, 2));
            console.log('ringPercent 所有 finger 值:', clientProfile.ringPercent.map(rp => rp.finger));
        }
        console.log('fingerprints 數量:', clientProfile.fingerprints?.length || 0);
        if (clientProfile.fingerprints && clientProfile.fingerprints.length > 0) {
            console.log('fingerprints 詳情:', JSON.stringify(clientProfile.fingerprints.map(f => ({
                ring: f.ring,
                hand: f.hand,
                fingerType: f.fingerType
            })), null, 2));
        }
        console.log('TRC:', clientProfile.TRC);
        console.log('leftTotal:', clientProfile.leftTotal);
        console.log('rightTotal:', clientProfile.rightTotal);
        
        // 計算並輸出計算結果
        const calculatedData = calculateBrainAssessment(clientProfile);
        console.log('=== 計算結果 ===');
        console.log(JSON.stringify(calculatedData, null, 2));

        // 生成 PDF 報告
        const pdfBuffer = await generatePDFReport(clientProfile);

        // 清理文件名，移除所有非 ASCII 字符以避免 HTTP 標頭問題
        // 只保留字母、數字、連字符和下劃線
        const safeName = (clientProfile.name || 'client')
            .replace(/[^\x00-\x7F]/g, '') // 移除所有非 ASCII 字符（包括中文）
            .replace(/[^\w\s-]/g, '') // 移除特殊字符
            .replace(/\s+/g, '-') // 空格轉換為連字符
            .substring(0, 50) || 'client'; // 限制長度
        
        // 如果名稱被完全清除（全中文），使用 ID 作為後備
        const finalName = safeName || `client-${clientProfile._id.toString().substring(0, 8)}`;
        const fileName = `client-report-${finalName}-${Date.now()}.pdf`;
        
        // 設定回應標頭（只使用 ASCII 字符）
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // 返回 PDF 檔案
        res.send(pdfBuffer);

    } catch (error) {
        console.error('生成報告時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 添加調試端點來查看數據結構
exports.getClientProfileData = async (req, res) => {
    const { id } = req.params;
    
    try {
        const clientProfile = await ClientProfile.findById(id);
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }
        
        // 詳細分析 ringPercent 數據結構
        const ringPercentAnalysis = {
            totalCount: clientProfile.ringPercent?.length || 0,
            hasHandField: clientProfile.ringPercent?.some(rp => rp.hand !== undefined) || false,
            fingerValues: clientProfile.ringPercent?.map(rp => rp.finger) || [],
            fingerRange: clientProfile.ringPercent?.length > 0 ? {
                min: Math.min(...clientProfile.ringPercent.map(rp => rp.finger)),
                max: Math.max(...clientProfile.ringPercent.map(rp => rp.finger))
            } : null,
            sampleEntries: clientProfile.ringPercent?.slice(0, 3) || []
        };
        
        // 返回結構化的數據供調試
        return res.status(200).json({
            name: clientProfile.name,
            rawData: {
                ringPercent: clientProfile.ringPercent,
                fingerprints: clientProfile.fingerprints,
                TRC: clientProfile.TRC,
                leftTotal: clientProfile.leftTotal,
                rightTotal: clientProfile.rightTotal
            },
            ringPercentAnalysis: ringPercentAnalysis,
            processedData: {
                fingerprints: clientProfile.fingerprints?.map(f => ({
                    ring: f.ring,
                    hand: f.hand,
                    fingerType: f.fingerType
                })) || [],
                ringPercentSummary: clientProfile.ringPercent?.map(rp => ({
                    finger: rp.finger,
                    percent: rp.percent,
                    hand: rp.hand || 'N/A'
                })) || []
            },
            calculatedData: calculateBrainAssessment(clientProfile)
        });
    } catch (error) {
        console.error('獲取數據時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
};

// 生成 PDF 報告的函數
async function generatePDFReport(clientProfile) {
    let browser;
    
    try {
        // 啟動瀏覽器
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

        const page = await browser.newPage();

        // 生成 HTML 內容
        const htmlContent = generateHTMLReport(clientProfile);

        // 設定 HTML 內容
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // 生成 PDF（橫向佈局以容納大腦圖表）
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        return pdfBuffer;

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 生成 HTML 報告內容
function generateHTMLReport(clientProfile) {
    const currentDate = new Date().toLocaleDateString('zh-TW');
    
    // 計算大腦區域數據
    const brainData = calculateBrainAssessment(clientProfile);
    
    return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>大腦區總報表</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Microsoft JhengHei', 'Microsoft YaHei', Arial, sans-serif;
                color: #333;
                background: #fff;
                font-size: 12px;
                line-height: 1.4;
            }
            .report-container {
                width: 100%;
                padding: 10px;
            }
            .report-header {
                text-align: center;
                margin-bottom: 5px;
                padding-bottom: 5px;
                border-bottom: 2px solid #000;
            }
            .personal-info {
                margin-bottom: 5px;
                padding: 8px;
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .personal-info-title {
                font-size: 15px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 3px;
            }
            .personal-info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .personal-info-item {
                background: #fff;
                padding: 6px;
                border-radius: 4px;
                border-left: 3px solid #3498db;
            }
            .personal-info-label {
                font-size: 11px;
                color: #666;
                margin-bottom: 2px;
            }
            .personal-info-value {
                font-size: 14px;
                font-weight: bold;
                color: #2c3e50;
            }
            .report-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .report-subtitle {
                font-size: 18px;
                color: #666;
            }
            .report-body {
                display: flex;
                gap: 15px;
                margin-top: 5px;
            }
            .brain-regions {
                flex: 1;
            }
            .brain-diagram {
                width: 300px;
                height: 400px;
                position: relative;
                flex-shrink: 0;
            }
            .region-section {
                margin-bottom: 10px;
                border: 1px solid #ddd;
                background: #fff;
            }
            .region-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #f5f5f5;
                border-bottom: 2px solid #333;
                font-weight: bold;
            }
            .region-title {
                font-size: 14px;
            }
            .region-percentage {
                font-size: 16px;
                color: #d32f2f;
            }
            .region-content {
                display: flex;
            }
            .region-left, .region-right {
                flex: 1;
                padding: 10px;
                min-height: 120px;
            }
            .region-left {
                border-right: 1px solid #ddd;
            }
            .region-label {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 13px;
            }
            .region-sub-percentage {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #1976d2;
            }
            .abilities-list {
                list-style: none;
                margin-bottom: 8px;
            }
            .abilities-list li {
                margin-bottom: 3px;
                font-size: 11px;
                line-height: 1.5;
            }
            .fingerprint-count {
                margin-top: 8px;
                font-size: 11px;
                color: #666;
            }
            .fingerprint-type {
                font-weight: bold;
            }
            /* 區域顏色 */
            .region-1 .region-left { background: #fff5f5; }
            .region-1 .region-right { background: #ffe5e5; }
            .region-2 .region-left { background: #f0f8ff; }
            .region-2 .region-right { background: #e0f0ff; }
            .region-3 .region-left { background: #e8f5e9; }
            .region-3 .region-right { background: #c8e6c9; }
            .region-4 .region-left { background: #fffde7; }
            .region-4 .region-right { background: #fff9c4; }
            .region-5 .region-left { background: #f1f8e9; }
            .region-5 .region-right { background: #dcedc8; }
            
            /* SVG 大腦圖表樣式 */
            .brain-svg {
                width: 100%;
                height: 100%;
            }
            .brain-outline {
                fill: #e0e0e0;
                stroke: #999;
                stroke-width: 2;
            }
            .brain-region {
                opacity: 0.8;
            }
            .brain-region-1 { fill: #ff5252; }
            .brain-region-2 { fill: #2196f3; }
            .brain-region-3 { fill: #4caf50; }
            .brain-region-4 { fill: #ffc107; }
            .brain-region-5 { fill: #ff9800; }
            .brain-number {
                fill: white;
                font-size: 24px;
                font-weight: bold;
                text-anchor: middle;
                dominant-baseline: central;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="report-header">
                <div class="report-title">大腦區總報表</div>
                <div class="report-subtitle">Brain Assessment</div>
            </div>
            
            <div class="personal-info">
                <div class="personal-info-title">個人資料</div>
                <div class="personal-info-grid">
                    <div class="personal-info-item">
                        <div class="personal-info-label">姓名</div>
                        <div class="personal-info-value">${clientProfile.name}</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">性別</div>
                        <div class="personal-info-value">${clientProfile.gender === 'male' ? '男' : clientProfile.gender === 'female' ? '女' : clientProfile.gender}</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">出生日期</div>
                        <div class="personal-info-value">${new Date(clientProfile.birth).toLocaleDateString('zh-TW')}</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">年齡</div>
                        <div class="personal-info-value">${clientProfile.age} 歲</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">指紋總數 (TRC)</div>
                        <div class="personal-info-value">${clientProfile.TRC || 'N/A'}</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">左手總數</div>
                        <div class="personal-info-value">${clientProfile.leftTotal || 'N/A'}</div>
                    </div>
                    <div class="personal-info-item">
                        <div class="personal-info-label">右手總數</div>
                        <div class="personal-info-value">${clientProfile.rightTotal || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-body">
                <div class="brain-regions">
                    ${generateBrainRegions(brainData)}
                </div>
                
                <div class="brain-diagram">
                    ${generateBrainDiagram()}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 定義手指對應的能力
const fingerAbilities = {
    1: { // 拇指 - 精神功能
        left: {
            title: "人際關係、目標",
            abilities: ["人際關係、目標", "人際溝通、創造力", "目標反應、好奇心", "應變及領導能力", "自信心"]
        },
        right: {
            title: "自省、管理能力",
            abilities: ["自省、管理能力", "自我要求及管理", "自我反省及意志力", "計劃及堅持能力", "自尊感"]
        }
    },
    2: { // 食指 - 思維功能
        left: {
            title: "綜合/空間想像能力",
            abilities: ["空間思考及規劃", "想像及聯想能力", "將事物組合記憶", "3D 辨識及創意"]
        },
        right: {
            title: "邏輯分析/推理能力",
            abilities: ["概念理解", "分析能力", "時間管理", "數學語言邏輯"]
        }
    },
    3: { // 中指 - 體覺功能
        left: {
            title: "藝術/律動能力",
            abilities: ["大肌肉四肢協調", "肢體感受與律動", "運動能力", "行動力"]
        },
        right: {
            title: "肢體操作/理解能力",
            abilities: ["小肌肉操作", "體覺辨識操控", "高階數學能力", "細微動作辨識力"]
        }
    },
    4: { // 無名指 - 聽覺功能
        left: {
            title: "音樂/情緒感受能力",
            abilities: ["情緒表達", "對聲音、音樂、旋律等聽力", "喜怒哀樂的感受能力", "音樂鑒賞力"]
        },
        right: {
            title: "語言/記憶能力",
            abilities: ["分辨聲音大小、快慢", "音質及音階的能力", "聲音記憶力", "語言理解能力"]
        }
    },
    5: { // 小指 - 視覺功能
        left: {
            title: "認知/圖像能力",
            abilities: ["視覺美感", "對人事物之聯想", "2D 視覺力", "形像、圖畫聯想力"]
        },
        right: {
            title: "閱讀/觀察能力",
            abilities: ["視覺辨識力", "觀察能力", "文字及符號的閱讀力", "分辨距離、速度快慢"]
        }
    }
};

// 指紋類型中文對照
function getFingerprintTypeName(type) {
    if (!type) return '未分類';
    
    const typeLower = type.toLowerCase().trim();
    const typeMap = {
        'whorl': '螺旋紋',
        'loop': '環形紋',
        'arch': '正箕紋',
        '正箕紋': '正箕紋',
        'reverse peacock': '逆向孔雀紋',
        'reversepeacock': '逆向孔雀紋',
        'peacock': '孔雀紋',
        '孔雀紋': '孔雀紋',
        '螺旋紋': '螺旋紋',
        '環形紋': '環形紋',
        '逆向孔雀紋': '逆向孔雀紋'
    };
    
    return typeMap[typeLower] || type;
}

// 計算大腦區域評估數據
function calculateBrainAssessment(clientProfile) {
    const regions = {};
    
    // 初始化5個區域 (1=拇指, 2=食指, 3=中指, 4=無名指, 5=小指)
    for (let i = 1; i <= 5; i++) {
        regions[i] = {
            left: { percent: 0, fingerprintCount: 0, fingerprintType: '', ring: 0 },
            right: { percent: 0, fingerprintCount: 0, fingerprintType: '', ring: 0 },
            totalPercent: 0
        };
    }
    
    // 處理指紋數據，建立左右手對應關係
    // hand 字段格式: "Left thumb", "Right thumb", "Left index finger", "Right index finger" 等
    const handToFingerMap = {
        'left thumb': 1,
        'right thumb': 1,
        'left index finger': 2,
        'right index finger': 2,
        'left middle finger': 3,
        'right middle finger': 3,
        'left ring finger': 4,
        'right ring finger': 4,
        'left little finger': 5,
        'right little finger': 5
    };
    
    const fingerMap = {}; // {finger: {left: {...}, right: {...}}}
    
    // 計算總 ring 值（用於百分比計算）
    let totalRing = 0;
    clientProfile.fingerprints.forEach(fp => {
        if (fp.ring && typeof fp.ring === 'number') {
            totalRing += fp.ring;
        }
    });
    
    // 如果沒有 ring 值，使用 TRC 或 leftTotal + rightTotal
    if (totalRing === 0) {
        totalRing = clientProfile.TRC || (clientProfile.leftTotal || 0) + (clientProfile.rightTotal || 0) || 227; // 默認值 227
    }
    
    clientProfile.fingerprints.forEach(fp => {
        const handLower = (fp.hand || '').toLowerCase().trim();
        const finger = handToFingerMap[handLower];
        
        if (finger) {
            if (!fingerMap[finger]) {
                fingerMap[finger] = { left: null, right: null };
            }
            
            // 判斷是左手還是右手
            if (handLower.includes('left')) {
                fingerMap[finger].left = fp;
                regions[finger].left.fingerprintCount++;
                if (fp.fingerType) {
                    regions[finger].left.fingerprintType = fp.fingerType;
                }
                // 保存 ring 值
                if (fp.ring && typeof fp.ring === 'number') {
                    regions[finger].left.ring = fp.ring;
                    // 計算百分比：left thumb 的 ring / totalRing * 100%
                    regions[finger].left.percent = (fp.ring / totalRing) * 100;
                }
            } else if (handLower.includes('right')) {
                fingerMap[finger].right = fp;
                regions[finger].right.fingerprintCount++;
                if (fp.fingerType) {
                    regions[finger].right.fingerprintType = fp.fingerType;
                }
                // 保存 ring 值
                if (fp.ring && typeof fp.ring === 'number') {
                    regions[finger].right.ring = fp.ring;
                    // 計算百分比：right thumb 的 ring / totalRing * 100%
                    regions[finger].right.percent = (fp.ring / totalRing) * 100;
                }
            }
        }
    });
    
    // 處理 ringPercent 數據
    // ringPercent 的 finger 值：0,1,2,3,4 代表5隻手指（0=拇指，1=食指，2=中指，3=無名指，4=小指）
    // ringPercent 的 percent 是該手指的總百分比（left + right）
    // 實際的左右手百分比已經從 fingerprints 的 ring 值計算出來
    
    // 計算總百分比（從已計算的左右手百分比）
    for (let i = 1; i <= 5; i++) {
        regions[i].totalPercent = regions[i].left.percent + regions[i].right.percent;
    }
    
    // 如果 ringPercent 存在，可以用來驗證或補充數據
    if (clientProfile.ringPercent && Array.isArray(clientProfile.ringPercent)) {
        clientProfile.ringPercent.forEach(rp => {
            const fingerIndex = rp.finger; // 0-4 對應手指 1-5
            const totalPercentFromRingPercent = rp.percent || 0;
            
            if (fingerIndex >= 0 && fingerIndex <= 4) {
                const finger = fingerIndex + 1; // 轉換為 1-5
                
                // 如果從 fingerprints 計算的百分比為0，但 ringPercent 有值，則使用 ringPercent
                // 並平均分配給左右手
                if (regions[finger].totalPercent === 0 && totalPercentFromRingPercent > 0) {
                    regions[finger].left.percent = totalPercentFromRingPercent / 2;
                    regions[finger].right.percent = totalPercentFromRingPercent / 2;
                    regions[finger].totalPercent = totalPercentFromRingPercent;
                } else if (regions[finger].totalPercent > 0 && totalPercentFromRingPercent > 0) {
                    // 如果兩者都有值，優先使用從 fingerprints 計算的值
                    // ringPercent 可以用來驗證
                    regions[finger].totalPercent = regions[finger].left.percent + regions[finger].right.percent;
                }
            }
        });
    }
    
    // 輸出調試信息（在開發環境）
    if (process.env.NODE_ENV !== 'production') {
        console.log('計算結果:', JSON.stringify(regions, null, 2));
        console.log('ringPercent 數據:', JSON.stringify(clientProfile.ringPercent, null, 2));
    }
    
    return regions;
}

// 生成大腦區域 HTML
function generateBrainRegions(brainData) {
    const regionNames = {
        1: '拇指 - 精神功能',
        2: '食指 - 思維功能',
        3: '中指 - 體覺功能',
        4: '無名指 - 聽覺功能',
        5: '小指 - 視覺功能'
    };
    
    let html = '';
    
    for (let i = 1; i <= 5; i++) {
        const region = brainData[i];
        const abilities = fingerAbilities[i];
        
        html += `
        <div class="region-section region-${i}">
            <div class="region-header">
                <span class="region-title">${regionNames[i]}</span>
                <span class="region-percentage">${region.totalPercent.toFixed(2)}%</span>
            </div>
            <div class="region-content">
                <div class="region-left">
                    <div class="region-label">L${i}</div>
                    <div class="region-sub-percentage">${region.left.percent.toFixed(2)}%</div>
                    <div class="region-label">${abilities.left.title}</div>
                    <ul class="abilities-list">
                        ${abilities.left.abilities.map(ability => `<li>${ability}</li>`).join('')}
                    </ul>
                    <div class="fingerprint-count">
                        <span class="fingerprint-type">${getFingerprintTypeName(region.left.fingerprintType)}</span> 
                        ${region.left.ring > 0 ? region.left.ring : region.left.fingerprintCount}
                    </div>
                </div>
                <div class="region-right">
                    <div class="region-label">R${i}</div>
                    <div class="region-sub-percentage">${region.right.percent.toFixed(2)}%</div>
                    <div class="region-label">${abilities.right.title}</div>
                    <ul class="abilities-list">
                        ${abilities.right.abilities.map(ability => `<li>${ability}</li>`).join('')}
                    </ul>
                    <div class="fingerprint-count">
                        <span class="fingerprint-type">${getFingerprintTypeName(region.right.fingerprintType)}</span> 
                        ${region.right.ring > 0 ? region.right.ring : region.right.fingerprintCount}
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    return html;
}

// 生成大腦圖表 SVG
function generateBrainDiagram() {
    return `
    <svg class="brain-svg" viewBox="0 0 280 360" xmlns="http://www.w3.org/2000/svg">
        <!-- 頭部輪廓 -->
        <ellipse cx="140" cy="180" rx="110" ry="160" class="brain-outline"/>
        
        <!-- 區域 1: 額葉 (紅色) - 拇指 - 前額區域 -->
        <path d="M 70 50 Q 80 60 90 75 Q 100 90 110 100 Q 120 110 140 115 Q 160 110 170 100 Q 180 90 190 75 Q 200 60 210 50 Q 195 45 170 42 Q 140 40 110 42 Q 85 45 70 50 Z" 
              class="brain-region brain-region-1"/>
        <text x="140" y="70" class="brain-number">1</text>
        
        <!-- 區域 2: 上額葉/頂葉 (藍色) - 食指 - 前頂部區域 -->
        <path d="M 85 100 Q 95 110 105 125 Q 115 140 125 150 Q 135 160 140 165 Q 145 160 155 150 Q 165 140 175 125 Q 185 110 195 100 Q 185 95 175 90 Q 165 85 140 85 Q 115 85 105 90 Q 95 95 85 100 Z" 
              class="brain-region brain-region-2"/>
        <text x="140" y="125" class="brain-number">2</text>
        
        <!-- 區域 3: 上頂葉 (綠色) - 中指 - 頂部中央區域 -->
        <path d="M 100 155 Q 110 165 120 175 Q 130 185 135 195 Q 140 205 145 195 Q 150 185 160 175 Q 170 165 180 155 Q 175 150 165 145 Q 155 140 140 140 Q 125 140 115 145 Q 105 150 100 155 Z" 
              class="brain-region brain-region-3"/>
        <text x="140" y="170" class="brain-number">3</text>
        
        <!-- 區域 4: 顳葉 (黃色) - 無名指 - 左右兩側 -->
        <path d="M 50 120 Q 45 140 42 160 Q 40 180 42 200 Q 45 220 50 235 Q 55 230 58 220 Q 60 200 60 180 Q 60 160 58 140 Q 55 130 50 120 Z" 
              class="brain-region brain-region-4"/>
        <text x="50" y="175" class="brain-number">4</text>
        <path d="M 230 120 Q 235 130 242 140 Q 245 160 245 180 Q 245 200 242 220 Q 238 230 230 235 Q 235 220 238 200 Q 240 180 240 160 Q 238 140 235 130 Q 232 125 230 120 Z" 
              class="brain-region brain-region-4"/>
        <text x="230" y="175" class="brain-number">4</text>
        
        <!-- 區域 5: 枕葉 (橘色) - 小指 - 後腦區域 -->
        <path d="M 110 220 Q 120 230 130 240 Q 140 250 150 240 Q 160 230 170 220 Q 165 215 155 212 Q 145 210 140 210 Q 135 210 125 212 Q 115 215 110 220 Z" 
              class="brain-region brain-region-5"/>
        <text x="140" y="235" class="brain-number">5</text>
    </svg>
    `;
}
