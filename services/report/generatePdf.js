const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const { pathToFileURL } = require('url');
const { buildReportModel } = require('./assessment');
const { renderThinkaProHtml } = require('./htmlTemplate');

function launchOptions() {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    return {
        headless: executablePath ? true : 'shell',
        executablePath,
        protocolTimeout: 120000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--font-render-hinting=none',
            '--run-all-compositor-stages-before-draw',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--no-first-run',
            '--disable-background-networking',
            '--disable-extensions',
            '--disable-sync',
            '--hide-scrollbars'
        ]
    };
}

async function launchBrowser() {
    try {
        return await puppeteer.launch(launchOptions());
    } catch (error) {
        console.warn('Puppeteer shell 啟動失敗，改用 headless:true 重試:', error.message);
        return puppeteer.launch({
            ...launchOptions(),
            headless: true
        });
    }
}
async function printPdf(page) {
    try {
        return await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            timeout: 120000
        });
    } catch (error) {
        console.warn('第一次 PDF 列印失敗，改用簡化參數重試:', error.message);
        await page.emulateMediaType('print');
        return page.pdf({
            width: '210mm',
            height: '297mm',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            timeout: 120000
        });
    }
}

async function generateThinkaProPdf(clientProfile) {
    const model = buildReportModel(clientProfile);
    const html = renderThinkaProHtml(model);
    const htmlPath = path.join(os.tmpdir(), `thinkapro-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
        await page.goto(pathToFileURL(htmlPath).href, {
            waitUntil: 'load',
            timeout: 60000
        });
        await Promise.race([
            page.evaluateHandle('document.fonts.ready'),
            new Promise((resolve) => setTimeout(resolve, 5000))
        ]);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const pdfBuffer = await printPdf(page);
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
