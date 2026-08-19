const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const { pathToFileURL } = require('url');
const { buildReportModel } = require('./assessment');
const { renderThinkaProHtml } = require('./htmlTemplate');

const PROTOCOL_TIMEOUT = 180000;

function launchOptions() {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    return {
        headless: executablePath ? true : 'shell',
        executablePath,
        protocolTimeout: PROTOCOL_TIMEOUT,
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

async function waitForFonts(page) {
    // 逾時必須發生在瀏覽器內，否則 Node 端 Promise.race 無法取消
    // 仍在進行的 Runtime.callFunctionOn，後續 page.pdf() 會被拖到 protocolTimeout。
    try {
        await page.evaluate(async () => {
            if (!document.fonts || !document.fonts.ready) return;
            await Promise.race([
                document.fonts.ready.then(() => undefined, () => undefined),
                new Promise((resolve) => setTimeout(resolve, 4000))
            ]);
        });
    } catch (error) {
        console.warn('等待字型時略過:', error.message);
    }
}

async function openReportPage(browser, htmlPath) {
    const page = await browser.newPage();
    page.setDefaultTimeout(PROTOCOL_TIMEOUT);
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
    await waitForFonts(page);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return page;
}

async function printPdf(page, simplified = false) {
    const options = {
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        timeout: PROTOCOL_TIMEOUT
    };
    if (simplified) {
        return page.pdf({
            ...options,
            width: '210mm',
            height: '297mm'
        });
    }
    return page.pdf({
        ...options,
        format: 'A4',
        preferCSSPageSize: false
    });
}

async function generateThinkaProPdf(clientProfile) {
    const model = buildReportModel(clientProfile);
    const html = renderThinkaProHtml(model);
    const htmlPath = path.join(os.tmpdir(), `thinkapro-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    let browser;
    let page;
    try {
        browser = await launchBrowser();
        page = await openReportPage(browser, htmlPath);
        try {
            return Buffer.from(await printPdf(page));
        } catch (error) {
            console.warn('第一次 PDF 列印失敗，改用新分頁與簡化參數重試:', error.message);
            await page.close().catch(() => {});
            page = await openReportPage(browser, htmlPath);
            await page.emulateMediaType('print');
            return Buffer.from(await printPdf(page, true));
        }
    } finally {
        if (page) await page.close().catch(() => {});
        if (browser) await browser.close();
        fs.unlink(htmlPath, () => {});
    }
}

module.exports = {
    generateThinkaProPdf,
    buildReportModel
};
