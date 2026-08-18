const path = require('path');

const ICONS_DIR = path.join(__dirname, '../../public/report-assets/icons');

const TYPE_DEFS = {
    環形紋: { label: '環形紋', icon: '環形紋.png' },
    正箕紋: { label: '正箕紋', icon: '正箕形紋.png' },
    反箕紋: { label: '反箕紋', icon: '反箕形紋.png' },
    弧形紋: { label: '弧形紋', icon: '弧形紋.png' },
    孔雀紋: { label: '孔雀紋', icon: '孔雀形紋.png' },
    伸長紋: { label: '伸長紋', icon: '伸長形紋.png' },
    雙箕形紋: { label: '雙箕形紋', icon: '雙箕形紋.png' }
};

const ALIASES = {
    whorl: '環形紋',
    concentric: '環形紋',
    'concentric whorl': '環形紋',
    獨核紋: '環形紋',
    螺旋紋: '環形紋',
    loop: '正箕紋',
    'ulnar loop': '正箕紋',
    正箕形紋: '正箕紋',
    'reverse peacock': '反箕紋',
    'radial loop': '反箕紋',
    反箕形紋: '反箕紋',
    逆向孔雀紋: '反箕紋',
    arch: '弧形紋',
    peacock: '孔雀紋',
    'peacock eye': '孔雀紋',
    "peacock's eye": '孔雀紋',
    孔雀形紋: '孔雀紋',
    孔雀眼紋: '孔雀紋',
    elongated: '伸長紋',
    'elongated whorl': '伸長紋',
    伸長形紋: '伸長紋',
    伸延華紋: '伸長紋',
    '伸長紋+': '伸長紋',
    '伸長紋-': '伸長紋',
    txt_whorl_23: '伸長紋',
    txt_whorl_29: '伸長紋',
    'double loop': '雙箕形紋',
    雙箕紋: '雙箕形紋',
    雙箕斗紋: '雙箕形紋',
    '雙箕斗紋+': '雙箕形紋',
    '雙箕斗紋-': '雙箕形紋',
    txt_whorl_22: '雙箕形紋',
    txt_whorl_28: '雙箕形紋'
};

function normalizeTypeKey(raw) {
    if (raw == null) return '';
    return String(raw).trim().replace(/\s+/g, ' ');
}

function resolveFingerprintType(raw) {
    const original = normalizeTypeKey(raw);
    if (!original) {
        return { key: '', label: '未分類', iconPath: null };
    }

    const lower = original.toLowerCase();
    const stripped = original.replace(/[＋+\-－]$/, '');
    const key = ALIASES[original]
        || ALIASES[lower]
        || ALIASES[stripped]
        || ALIASES[stripped.toLowerCase()]
        || (TYPE_DEFS[original] ? original : null)
        || (TYPE_DEFS[stripped] ? stripped : null);

    if (!key || !TYPE_DEFS[key]) {
        return { key: original, label: original, iconPath: null };
    }

    const def = TYPE_DEFS[key];
    return {
        key,
        label: def.label,
        iconPath: path.join(ICONS_DIR, def.icon)
    };
}

module.exports = {
    resolveFingerprintType,
    TYPE_DEFS
};
