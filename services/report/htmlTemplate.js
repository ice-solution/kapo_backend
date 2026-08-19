const path = require('path');
const { pathToFileURL } = require('url');
const { formatPercent, SCALE_TICKS } = require('./assessment');

const ASSETS = path.join(__dirname, '../../public/report-assets');

function asset(rel) {
    return pathToFileURL(path.join(ASSETS, rel)).href;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function iconUrl(type) {
    if (type && type.iconPath) return pathToFileURL(type.iconPath).href;
    return '';
}

function typeFooter(side) {
    const src = iconUrl(side.type);
    const label = escapeHtml(side.type.label || '未分類');
    const ring = side.ring > 0 ? side.ring : '';
    return `
        <div class="fp-meta">
            ${src ? `<img class="fp-icon" src="${src}" alt="">` : ''}
            <span>${label} ${ring}</span>
        </div>
    `;
}

function regionCard(region, index) {
    const leftLabel = `L${index}`;
    const rightLabel = `R${index}`;
    return `
        <section class="region-card">
            <div class="region-head">
                <div class="region-total">${formatPercent(region.totalPercent)}</div>
                <div class="region-title">${region.letter}. ${escapeHtml(region.title)}</div>
            </div>
            <div class="region-split">
                <div class="region-col">
                    <div class="side-label">${leftLabel} <span>${formatPercent(region.left.percent)}</span></div>
                    <div class="side-title">${escapeHtml(region.left.title)}</div>
                    <ul>${region.left.abilities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                    ${typeFooter(region.left)}
                </div>
                <div class="region-col">
                    <div class="side-label">${rightLabel} <span>${formatPercent(region.right.percent)}</span></div>
                    <div class="side-title">${escapeHtml(region.right.title)}</div>
                    <ul>${region.right.abilities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                    ${typeFooter(region.right)}
                </div>
            </div>
        </section>
    `;
}

function pageHeader(title, subtitle) {
    return `
        <header class="page-header">
            <div class="page-title">
                <div class="zh">${escapeHtml(title)}</div>
                ${subtitle ? `<div class="en">${escapeHtml(subtitle)}</div>` : ''}
            </div>
            <div class="brand">
                <img class="brand-mark" src="${asset('logo_hand.png')}" alt="">
                <div class="brand-text"><span>紋</span> ThinkaPro <span>露</span><sup>TM</sup></div>
            </div>
        </header>
    `;
}

function page1(model) {
    return `
        <section class="page page-1">
            ${pageHeader('大腦區總報表', 'Brain Assessment')}
            <div class="page-fill">
                <div class="p1-top">
                    <div class="brain-wrap">
                        <img src="${asset('pic/Asset_7.png')}" alt="">
                    </div>
                    ${regionCard(model.regions[1], 1)}
                </div>
                <div class="p1-grid">
                    ${regionCard(model.regions[2], 2)}
                    ${regionCard(model.regions[3], 3)}
                    ${regionCard(model.regions[4], 4)}
                    ${regionCard(model.regions[5], 5)}
                </div>
            </div>
            <div class="page-no">1</div>
        </section>
    `;
}

function rankRows(items) {
    return items.map((item) => `
        <div class="rank-row">
            <div class="rank-num">${item.rank}</div>
            <div class="rank-copy">
                <div class="rank-name">${escapeHtml(item.rankName)}</div>
                <div class="rank-desc">${escapeHtml(item.rankDesc)}</div>
            </div>
            <div class="bar"><i style="width:${item.bar.toFixed(2)}%"></i></div>
            <div class="rank-pct">${formatPercent(item.percent)}</div>
        </div>
    `).join('');
}

function distRows(items) {
    return items.map((item) => `
        <div class="dist-row">
            <div class="dist-en">${escapeHtml(item.distEn)}</div>
            <div class="dist-zh">${escapeHtml(item.distZh)}</div>
            <div class="bar"><i style="width:${item.bar.toFixed(2)}%"></i></div>
            <div class="rank-pct">${formatPercent(item.percent)}</div>
        </div>
    `).join('');
}

function page2(model) {
    return `
        <section class="page page-2">
            ${pageHeader('腦區強度總結表', 'Brain Assessment Summary')}
            <div class="page-fill">
                <h2 class="section-gold">先天智能排序</h2>
                <div class="rank-list">
                    ${rankRows(model.rankedWithBar)}
                </div>
                <div class="dist-box">
                    <h2 class="section-gold inner">先天能力分佈</h2>
                    ${distRows(model.distribution)}
                </div>
            </div>
            <div class="page-no">2</div>
        </section>
    `;
}

function zoneBlock(zone) {
    const marker = zone.selected
        ? `<img class="zone-tick" src="${asset('pic/Asset_4.png')}" alt="">`
        : (zone.id === 4 ? `<img class="zone-diamond" src="${asset('pic/Asset_5.png')}" alt="">` : '');
    const suggestions = zone.suggestions.length
        ? `<div class="zone-suggest">建議：</div>
           <ul>${zone.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
    return `
        <article class="zone ${zone.selected ? 'is-selected' : ''}">
            <div class="zone-side">
                <div class="zone-label">${zone.label}</div>
                ${marker}
            </div>
            <div class="zone-body">
                <div class="zone-heading">
                    <h3>${escapeHtml(zone.title)}</h3>
                    ${zone.rangeText ? `<div class="zone-range">${escapeHtml(zone.rangeText)}</div>` : ''}
                </div>
                <ul>${zone.description.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                ${suggestions}
            </div>
        </article>
    `;
}

function page3(model) {
    const ticks = SCALE_TICKS.map((tick) => `
        <div class="tick" style="top:${tick.y}%">
            <span>${tick.label}</span>
        </div>
    `).join('');
    return `
        <section class="page page-3">
            ${pageHeader('先天學習潛量值 TRC Total Ridge Count', '')}
            <div class="page-fill p3-layout">
                <div class="zones">
                    ${model.zones.map(zoneBlock).join('')}
                </div>
                <div class="scale">
                    <img class="ruler" src="${asset('pic/Asset_6.png')}" alt="">
                    ${ticks}
                    <div class="marker" style="top:${model.markerY}%"></div>
                </div>
            </div>
            <div class="p3-foot">TRC = Total Ridge Count（十指指紋脊線總數）</div>
            <div class="page-no">3</div>
        </section>
    `;
}

function renderThinkaProHtml(model) {
    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<title>ThinkaPro Report</title>
<style>
@font-face {
    font-family: 'Noto Sans TC';
    src: url('${asset('fonts/NotoSansTC-VF.ttf')}') format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
    width: 210mm;
    background: #fff;
    color: #2b2b2b;
    font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    background: #f7f4ee url('${asset('paper.jpg')}') center / cover no-repeat;
    page-break-after: always;
}
.page:last-child { page-break-after: auto; }
.page-header {
    position: absolute;
    top: 8mm;
    left: 9mm;
    right: 9mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.page-fill {
    position: absolute;
    top: 21mm;
    left: 9mm;
    right: 9mm;
    bottom: 12mm;
    display: flex;
    flex-direction: column;
}
.page-3 .page-fill {
    bottom: 18mm;
}
.page-title .zh {
    font-size: 18px;
    font-weight: 500;
    color: #c4a06a;
    letter-spacing: 0.04em;
}
.page-title .en {
    font-size: 13px;
    font-weight: 400;
    color: #c4a06a;
    margin-top: 1px;
}
.brand { display: flex; align-items: center; gap: 7px; }
.brand-mark { width: 22px; height: auto; }
.brand-text {
    font-size: 14px;
    color: #c4a06a;
    letter-spacing: 0.18em;
    font-weight: 500;
}
.brand-text span { letter-spacing: 0; margin: 0 2px; }
.brand-text sup { font-size: 7px; letter-spacing: 0; }
.page-no {
    position: absolute;
    right: 9mm;
    bottom: 5.5mm;
    color: #c4a06a;
    font-size: 12px;
}
.page-3 .page-no { bottom: 7mm; }

.p1-top {
    display: grid;
    grid-template-columns: 82mm 1fr;
    gap: 4mm;
    min-height: 0;
    align-items: stretch;
}
.page-1 .page-fill {
    display: grid;
    grid-template-rows: minmax(78mm, 0.92fr) minmax(0, 1.88fr);
    gap: 3.2mm;
}
.brain-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
}
.brain-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.p1-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 3.2mm;
    min-height: 0;
}

.region-card {
    border: 1.2px solid #56c5d0;
    border-radius: 10px;
    padding: 3.5mm 4mm 3mm;
    background: rgba(255,255,255,0.18);
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.region-head { text-align: center; margin-bottom: 2mm; flex-shrink: 0; }
.region-total { font-size: 22px; font-weight: 700; color: #3bb8c4; line-height: 1.1; }
.region-title {
    margin-top: 1.2mm;
    padding: 1.2mm 0;
    border-top: 1px solid #d7b07a;
    border-bottom: 1px solid #d7b07a;
    color: #c4a06a;
    font-size: 14px;
    font-weight: 600;
}
.region-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    min-height: 0;
}
.region-col {
    padding: 2.2mm 3mm 0;
    display: flex;
    flex-direction: column;
}
.region-col:first-child { border-right: 1px solid #e3c8a0; }
.side-label { font-size: 14px; font-weight: 700; color: #1d3a63; margin-bottom: 0.8mm; }
.side-label span { color: #3bb8c4; margin-left: 2px; }
.side-title { font-size: 13px; font-weight: 700; margin-bottom: 1mm; }
.region-col ul {
    list-style: disc;
    padding-left: 4.2mm;
    margin: 0;
}
.region-col li { font-size: 12.5px; line-height: 1.32; color: #333; }
.fp-meta {
    display: flex;
    align-items: center;
    gap: 2.2mm;
    margin-top: auto;
    padding-top: 2mm;
    color: #c47a3a;
    font-size: 11px;
    font-weight: 600;
}
.fp-icon { width: 9mm; height: 9mm; object-fit: contain; }

.page-2 .page-fill {
    display: grid;
    grid-template-rows: auto minmax(0, 1.12fr) minmax(0, 1fr);
    gap: 3mm;
}
.page-2 .section-gold { margin-top: 0; }
.section-gold {
    color: #c4a06a;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    flex-shrink: 0;
}
.section-gold.inner { margin: 0 0 2mm; }
.rank-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
}
.rank-row, .dist-row {
    display: grid;
    align-items: center;
    gap: 3.5mm;
    flex: 1;
    border-bottom: 1px solid rgba(196,160,106,0.28);
}
.rank-row { grid-template-columns: 10mm 62mm 1fr 18mm; }
.dist-row { grid-template-columns: 46mm 30mm 1fr 18mm; }
.rank-num { font-size: 18px; font-weight: 700; color: #3bb8c4; }
.rank-name { font-size: 13.5px; font-weight: 700; color: #2a2a2a; }
.rank-desc { font-size: 10px; color: #777; margin-top: 0.8mm; line-height: 1.4; }
.bar {
    height: 5.5mm;
    background: #ececec;
    border-radius: 1px;
    overflow: hidden;
}
.bar i {
    display: block;
    height: 100%;
    background: #56c5d0;
}
.rank-pct { text-align: right; font-size: 12px; color: #888; }
.dist-box {
    border: 1.2px solid #56c5d0;
    border-radius: 10px;
    padding: 4.5mm 5.5mm 3.5mm;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.dist-en { font-size: 13px; font-weight: 700; }
.dist-zh { font-size: 13px; font-weight: 500; }

.p3-layout {
    display: grid;
    grid-template-columns: 1fr 28mm;
    gap: 2mm;
    height: 100%;
    align-content: start;
}
.zones {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    justify-content: space-between;
}
.zone {
    display: grid;
    grid-template-columns: 20mm 1fr;
    border-top: 1px solid #d7b07a;
    padding: 3mm 0 3.2mm;
    flex: 0 0 auto;
}
.zone:last-child {
    border-bottom: 1px solid #d7b07a;
    padding-bottom: 3mm;
}
.zone-side {
    position: relative;
    padding-right: 3mm;
    border-right: 3.5px solid #56c5d0;
}
.zone-label { color: #3bb8c4; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
.zone-tick, .zone-diamond { width: 7mm; margin-top: 2.5mm; display: block; }
.zone-body {
    padding-left: 5.5mm;
    padding-right: 2mm;
    position: relative;
}
.zone-heading { position: relative; margin-bottom: 1.2mm; }
.zone-heading h3 { color: #3bb8c4; font-size: 15px; font-weight: 700; margin: 0; padding-right: 32mm; line-height: 1.25; }
.zone-range {
    position: absolute;
    right: 0;
    top: 0;
    font-size: 20px;
    font-weight: 700;
    color: rgba(160,160,160,0.38);
    line-height: 1.2;
    white-space: nowrap;
}
.zone-body ul {
    padding-left: 5mm;
    margin: 0;
}
.zone-body li { font-size: 11px; line-height: 1.38; margin-bottom: 0.5mm; }
.zone-suggest { color: #3bb8c4; font-size: 12px; font-weight: 700; margin: 1.6mm 0 0.7mm; }
.scale { position: relative; }
.ruler {
    position: absolute;
    right: 8mm;
    top: 0;
    bottom: 0;
    height: 100%;
    width: auto;
}
.tick {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    font-size: 9px;
    color: #b0b0b0;
}
.marker {
    position: absolute;
    right: 9.2mm;
    width: 4.6mm;
    height: 4.6mm;
    border-radius: 50%;
    background: #56c5d0;
    transform: translate(50%, -50%);
}
.p3-foot {
    position: absolute;
    left: 9mm;
    bottom: 7mm;
    color: #c4a06a;
    font-size: 10px;
}
</style>
</head>
<body>
${page1(model)}
${page2(model)}
${page3(model)}
</body>
</html>`;
}

module.exports = { renderThinkaProHtml };
