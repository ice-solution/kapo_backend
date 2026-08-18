const ClientProfile = require('../models/clientProfile');
const { generateThinkaProPdf, buildReportModel } = require('../services/report/generatePdf');

exports.generateClientReport = async (req, res) => {
    const owner = req.session.userId;
    const { id } = req.params;

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    try {
        const clientProfile = await ClientProfile.findById(id);
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }
        if (clientProfile.owner.toString() !== owner) {
            return res.status(403).json({ message: '您無權存取此客戶檔案' });
        }

        const pdfBuffer = await generateThinkaProPdf(clientProfile);
        const fileName = `thinkapro-report-${clientProfile._id.toString().substring(0, 8)}-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('生成報告時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.getClientProfileData = async (req, res) => {
    const { id } = req.params;

    try {
        const clientProfile = await ClientProfile.findById(id);
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }

        const model = buildReportModel(clientProfile);
        return res.status(200).json({
            name: clientProfile.name,
            trc: model.trc,
            zoneId: model.zoneId,
            ranked: model.ranked,
            distribution: model.distribution,
            regions: Object.fromEntries(
                Object.entries(model.regions).map(([key, region]) => [
                    key,
                    {
                        letter: region.letter,
                        title: region.title,
                        totalPercent: region.totalPercent,
                        left: {
                            percent: region.left.percent,
                            ring: region.left.ring,
                            type: region.left.type.label
                        },
                        right: {
                            percent: region.right.percent,
                            ring: region.right.ring,
                            type: region.right.type.label
                        }
                    }
                ])
            )
        });
    } catch (error) {
        console.error('獲取數據時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
};
