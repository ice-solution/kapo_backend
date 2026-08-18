const { resolveFingerprintType } = require('./fingerprintTypes');

const HAND_TO_FINGER = {
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

const REGION_META = {
    1: {
        letter: 'A',
        title: '拇指 - 精神功能',
        left: {
            title: '人際關係、目標',
            abilities: ['人際關係、目標', '人際溝通、創造力', '目標反應、好奇心', '應變及領導能力', '自信心']
        },
        right: {
            title: '自省、管理能力',
            abilities: ['自省、管理能力', '自我要求及管理', '自我反省及意志力', '計劃及堅持能力', '自尊感']
        }
    },
    2: {
        letter: 'B',
        title: '食指 - 思維功能',
        left: {
            title: '綜合/空間想像能力',
            abilities: ['空間思考及規劃', '想像及聯想能力', '將事物組合記憶', '3D 辨識及創意']
        },
        right: {
            title: '邏輯分析/推理能力',
            abilities: ['概念理解', '分析能力', '時間管理', '數學語言邏輯']
        }
    },
    3: {
        letter: 'C',
        title: '中指 - 體覺功能',
        left: {
            title: '藝術/律動能力',
            abilities: ['大肌肉四肢協調', '肢體感受與律動', '運動能力', '行動力']
        },
        right: {
            title: '肢體操作/理解能力',
            abilities: ['小肌肉操作', '體覺辨識操控', '高階數學能力', '細微動作辨識力']
        }
    },
    4: {
        letter: 'D',
        title: '無名指 - 聽覺功能',
        left: {
            title: '音樂/情緒感受能力',
            abilities: ['情緒表達', '對聲音、音樂、旋律等聽力', '喜怒哀樂的感受能力', '音樂鑒賞力']
        },
        right: {
            title: '語言/記憶能力',
            abilities: ['分辨聲音大小、快慢', '音質及音階的能力', '聲音記憶力', '語言理解能力']
        }
    },
    5: {
        letter: 'E',
        title: '小指 - 視覺功能',
        left: {
            title: '認知/圖像能力',
            abilities: ['視覺美感', '對人事物之聯想', '2D 視覺力', '形像、圖畫聯想力']
        },
        right: {
            title: '閱讀/觀察能力',
            abilities: ['視覺辨識力', '觀察能力', '文字及符號的閱讀力', '分辨距離、速度快慢']
        }
    }
};

const ABILITY_ROWS = [
    { finger: 1, side: 'left', rankName: '人際管理', rankDesc: '溝通、目標反應、創意、好奇心及領導能力', distEn: 'People Management', distZh: '人際管理' },
    { finger: 1, side: 'right', rankName: '自我管理', rankDesc: '安排、辨別及選擇正確事物；自主內省、處理及管理', distEn: 'Self Management', distZh: '自我管理' },
    { finger: 2, side: 'left', rankName: '三維想像', rankDesc: '空間思維、計劃、想像及聯想', distEn: '3D imagination', distZh: '三維想像' },
    { finger: 2, side: 'right', rankName: '邏輯及計劃', rankDesc: '運算、分析、分辨概念；搜尋及研究；解說能力', distEn: 'Logic & Evaluation', distZh: '邏輯及評估' },
    { finger: 3, side: 'left', rankName: '節律性運動', rankDesc: '觸感、肢體律動及全身協調', distEn: 'Body Movements', distZh: '肢體動作' },
    { finger: 3, side: 'right', rankName: '小肌肉運動', rankDesc: '體覺感受：動作理解及辨別', distEn: 'Movement Controls', distZh: '動作控制' },
    { finger: 4, side: 'left', rankName: '音樂及情感', rankDesc: '對聲音、音樂、情感的感受及辨別', distEn: 'Music & Emotions', distZh: '音樂及情感' },
    { finger: 4, side: 'right', rankName: '語言及記憶', rankDesc: '聲音辨別、記憶、語言學習及理解', distEn: 'Language', distZh: '語言' },
    { finger: 5, side: 'left', rankName: '圖像辨識', rankDesc: '對生物及死物的視覺感受、聯想及辨識；美感', distEn: '2D Visualization', distZh: '二維視像' },
    { finger: 5, side: 'right', rankName: '閱讀及觀察', rankDesc: '視像辨別；觀察及閱讀：距離與速度的分辨能力', distEn: 'Minute Observation', distZh: '細微觀察' }
];

const TRC_ZONES = [
    {
        id: 1,
        label: 'ZONE 1',
        title: '專注學習型',
        rangeText: '60 - 80',
        min: 60,
        max: 140,
        description: [
            '一般人常見到的類型',
            '適合專注在學習和研究1或2個領域',
            '能在某個領域，或某些技藝，或某些專業上成為專家'
        ],
        suggestions: [
            '成功的秘訣在於專注在某個特定的領域上並且成為專家（請參考8大智能）',
            '不適合同時應付多樣工作，或處理太多事情，或學習太多東西',
            '不適合承擔多項任務或者複雜性的工作'
        ]
    },
    {
        id: 2,
        label: 'ZONE 2',
        title: '多重訓練學習',
        rangeText: '141 - 180',
        min: 141,
        max: 180,
        description: ['具有多重訓練學習的潛能與發展能力'],
        suggestions: [
            '可同時提供多樣化的學習環境，例如參與課外活動及多種課程',
            '避免傳統式學習，可提供多樣化、多變化以及挑戰性高的課程以及學習方式',
            '可將課程依不同主題或者段落來做分類，並且把學習內容切分為許多部分使得學習更有效率',
            '在工作上多參與高階性質的研究，才能完全發揮潛能'
        ]
    },
    {
        id: 3,
        label: 'ZONE 3',
        title: '高度多重訓練學習型',
        rangeText: '> 180',
        min: 181,
        max: Infinity,
        description: ['具有高度多重訓練學習的潛能與發展能力'],
        suggestions: [
            '可同時提供多樣化的具深度的學習環境，須講求學習目標與理據',
            '避免傳統式學習，可提供多變化以及挑戰性高的課程以及學習方式',
            '可將課程依不同主題或者段落來做分類，宜探究式學習，須自我發現',
            '在工作上多參與高階性質的研究，具挑戰性才能完全發揮潛能'
        ]
    },
    {
        id: 4,
        label: 'ZONE 4',
        title: '具「A」型',
        rangeText: '',
        selectable: false,
        description: [
            '具有「A」型的人，會具有「無窮學習能力並且需要透過教育來開發他們的潛能」的特質',
            '需要透過生活化教育、單對單學習、重複輸入來開發他們的潛能的特質。'
        ],
        suggestions: []
    }
];

const SCALE_TICKS = [
    { value: 60, label: '60', y: 4 },
    { value: 140, label: '140', y: 32 },
    { value: 180, label: '180', y: 54 },
    { value: 200, label: '200', y: 72 },
    { value: 220, label: '220+', y: 90 }
];

function parseHand(hand) {
    return String(hand || '').toLowerCase().trim();
}

function getTotalRidgeCount(clientProfile) {
    if (clientProfile.TRC && Number(clientProfile.TRC) > 0) {
        return Number(clientProfile.TRC);
    }
    const fingerprints = clientProfile.fingerprints || [];
    const sum = fingerprints.reduce((acc, fp) => acc + (Number(fp.ring) || 0), 0);
    if (sum > 0) return sum;
    return (Number(clientProfile.leftTotal) || 0) + (Number(clientProfile.rightTotal) || 0);
}

function emptySide() {
    return { percent: 0, ring: 0, type: resolveFingerprintType('') };
}

function buildRegions(clientProfile) {
    const fingerprints = clientProfile.fingerprints || [];
    let totalRing = fingerprints.reduce((acc, fp) => acc + (Number(fp.ring) || 0), 0);
    if (totalRing === 0) {
        totalRing = getTotalRidgeCount(clientProfile) || 1;
    }

    const regions = {};
    for (let i = 1; i <= 5; i++) {
        regions[i] = {
            letter: REGION_META[i].letter,
            title: REGION_META[i].title,
            left: { ...REGION_META[i].left, ...emptySide() },
            right: { ...REGION_META[i].right, ...emptySide() },
            totalPercent: 0
        };
    }

    fingerprints.forEach((fp) => {
        const hand = parseHand(fp.hand);
        const finger = HAND_TO_FINGER[hand];
        if (!finger) return;
        const side = hand.includes('left') ? 'left' : hand.includes('right') ? 'right' : null;
        if (!side) return;
        const ring = Number(fp.ring) || 0;
        regions[finger][side].percent = (ring / totalRing) * 100;
        regions[finger][side].ring = ring;
        regions[finger][side].type = resolveFingerprintType(fp.fingerType);
    });

    if (clientProfile.ringPercent && Array.isArray(clientProfile.ringPercent)) {
        clientProfile.ringPercent.forEach((rp) => {
            const finger = Number(rp.finger) + 1;
            if (finger < 1 || finger > 5) return;
            const total = Number(rp.percent) || 0;
            if (regions[finger].left.percent + regions[finger].right.percent === 0 && total > 0) {
                regions[finger].left.percent = total / 2;
                regions[finger].right.percent = total / 2;
            }
        });
    }

    for (let i = 1; i <= 5; i++) {
        regions[i].totalPercent = regions[i].left.percent + regions[i].right.percent;
    }

    return regions;
}

function formatPercent(value) {
    return `${(Number(value) || 0).toFixed(2)}%`;
}

function buildAbilityScores(regions) {
    return ABILITY_ROWS.map((row) => {
        const percent = regions[row.finger][row.side].percent || 0;
        return { ...row, percent };
    });
}

function denseRank(items) {
    const sorted = [...items].sort((a, b) => b.percent - a.percent);
    let rank = 0;
    let prev = null;
    return sorted.map((item) => {
        const key = item.percent.toFixed(4);
        if (key !== prev) {
            rank += 1;
            prev = key;
        }
        return { ...item, rank };
    });
}

function selectedZoneId(trc) {
    if (trc <= 140) return 1;
    if (trc <= 180) return 2;
    return 3;
}

function scaleMarkerY(trc) {
    const value = Math.max(60, Number(trc) || 60);
    for (let i = 0; i < SCALE_TICKS.length - 1; i++) {
        const a = SCALE_TICKS[i];
        const b = SCALE_TICKS[i + 1];
        if (value <= b.value) {
            const t = (value - a.value) / (b.value - a.value);
            return a.y + t * (b.y - a.y);
        }
    }
    return SCALE_TICKS[SCALE_TICKS.length - 1].y;
}

function buildReportModel(clientProfile) {
    const regions = buildRegions(clientProfile);
    const abilities = buildAbilityScores(regions);
    const ranked = denseRank(abilities);
    const maxPercent = Math.max(...abilities.map((a) => a.percent), 0.01);
    const trc = getTotalRidgeCount(clientProfile);
    const zoneId = selectedZoneId(trc);

    return {
        regions,
        ranked,
        distribution: abilities.map((item) => ({
            ...item,
            bar: (item.percent / maxPercent) * 100
        })),
        rankedWithBar: ranked.map((item) => ({
            ...item,
            bar: (item.percent / maxPercent) * 100
        })),
        trc,
        zoneId,
        markerY: scaleMarkerY(trc),
        zones: TRC_ZONES.map((zone) => ({
            ...zone,
            selected: zone.id === zoneId
        }))
    };
}

module.exports = {
    buildReportModel,
    formatPercent,
    REGION_META,
    TRC_ZONES,
    SCALE_TICKS,
    getTotalRidgeCount
};
