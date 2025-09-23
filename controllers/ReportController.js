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

        // 生成 PDF 報告
        const pdfBuffer = await generatePDFReport(clientProfile);

        // 設定回應標頭
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="client-report-${clientProfile.name}-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // 返回 PDF 檔案
        res.send(pdfBuffer);

    } catch (error) {
        console.error('生成報告時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 生成 PDF 報告的函數
async function generatePDFReport(clientProfile) {
    let browser;
    
    try {
        // 啟動瀏覽器
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 生成 HTML 內容
        const htmlContent = generateHTMLReport(clientProfile);

        // 設定 HTML 內容
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // 生成 PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
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
    
    // 計算指紋統計
    const fingerprintStats = calculateFingerprintStats(clientProfile.fingerprints);
    
    return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>客戶指紋分析報告</title>
        <style>
            body {
                font-family: 'Microsoft JhengHei', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #2c3e50;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 28px;
            }
            .header p {
                color: #7f8c8d;
                margin: 5px 0 0 0;
            }
            .section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            .section h2 {
                color: #34495e;
                border-left: 4px solid #3498db;
                padding-left: 15px;
                margin-bottom: 15px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }
            .info-label {
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            .info-value {
                color: #34495e;
            }
            .fingerprint-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .fingerprint-table th,
            .fingerprint-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .fingerprint-table th {
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }
            .fingerprint-table tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 14px;
                opacity: 0.9;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #7f8c8d;
                font-size: 12px;
                border-top: 1px solid #ecf0f1;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>客戶指紋分析報告</h1>
            <p>報告生成日期：${currentDate}</p>
        </div>

        <div class="section">
            <h2>客戶基本資料</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">姓名</div>
                    <div class="info-value">${clientProfile.name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">性別</div>
                    <div class="info-value">${clientProfile.gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">出生日期</div>
                    <div class="info-value">${new Date(clientProfile.birth).toLocaleDateString('zh-TW')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">年齡</div>
                    <div class="info-value">${clientProfile.age} 歲</div>
                </div>
                <div class="info-item">
                    <div class="info-label">選項</div>
                    <div class="info-value">${clientProfile.dropdownSelection}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">檔案建立日期</div>
                    <div class="info-value">${new Date(clientProfile.createdAt).toLocaleDateString('zh-TW')}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>指紋資料</h2>
            <table class="fingerprint-table">
                <thead>
                    <tr>
                        <th>手部</th>
                        <th>手號</th>
                        <th>指紋類型</th>
                        <th>圖像狀態</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientProfile.fingerprints.map(fp => `
                        <tr>
                            <td>${fp.hand === 'left' ? '左手' : '右手'}</td>
                            <td>${fp.ring}</td>
                            <td>${fp.fingerType || '未分類'}</td>
                            <td>${fp.img ? '已上傳' : '未上傳'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>統計分析</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${fingerprintStats.total}</div>
                    <div class="stat-label">總指紋數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${fingerprintStats.leftCount}</div>
                    <div class="stat-label">左手指紋</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${fingerprintStats.rightCount}</div>
                    <div class="stat-label">右手指紋</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${fingerprintStats.typedCount}</div>
                    <div class="stat-label">已分類指紋</div>
                </div>
            </div>
        </div>

        ${clientProfile.TRC || clientProfile.leftTotal || clientProfile.rightTotal ? `
        <div class="section">
            <h2>數值分析</h2>
            <div class="info-grid">
                ${clientProfile.TRC ? `
                <div class="info-item">
                    <div class="info-label">TRC 數值</div>
                    <div class="info-value">${clientProfile.TRC}</div>
                </div>
                ` : ''}
                ${clientProfile.leftTotal ? `
                <div class="info-item">
                    <div class="info-label">左手總數</div>
                    <div class="info-value">${clientProfile.leftTotal}</div>
                </div>
                ` : ''}
                ${clientProfile.rightTotal ? `
                <div class="info-item">
                    <div class="info-label">右手總數</div>
                    <div class="info-value">${clientProfile.rightTotal}</div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>此報告由 KAPO 指紋分析系統自動生成</p>
            <p>報告 ID: ${clientProfile._id}</p>
        </div>
    </body>
    </html>
    `;
}

// 計算指紋統計資料
function calculateFingerprintStats(fingerprints) {
    const stats = {
        total: fingerprints.length,
        leftCount: 0,
        rightCount: 0,
        typedCount: 0
    };

    fingerprints.forEach(fp => {
        if (fp.hand === 'left') {
            stats.leftCount++;
        } else if (fp.hand === 'right') {
            stats.rightCount++;
        }
        
        if (fp.fingerType) {
            stats.typedCount++;
        }
    });

    return stats;
}
