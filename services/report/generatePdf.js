const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const { pathToFileURL } = require('url');
const { buildReportModel } = require('./assessment');
const { renderThinkaProHtml } = require('./htmlTemplate');

async function generateThinkaProPdf(clientProfile) {
    const model = buildReportModel(clientProfile);
    const html = renderThinkaProHtml(model);
    const htmlPath = path.join(os.tmpdir(), `thinkapro-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--allow-file-access-from-files'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

        const page = await browser.newPage();
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.evaluateHandle('document.fonts.ready');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        if (browser) await browser.close();
        fs.unlink(htmlPath, () => {});
    }
}

module.exports = {
    generateThinkaProPdf,
    buildReportModel
};
