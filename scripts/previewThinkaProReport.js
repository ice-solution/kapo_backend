const fs = require('fs');
const path = require('path');
const { generateThinkaProPdf } = require('../services/report/generatePdf');

const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const fingerprints = [
    { hand: 'Left thumb', ring: 14, img: placeholderImage, fingerType: '雙箕斗紋+' },
    { hand: 'Left index finger', ring: 13, img: placeholderImage, fingerType: 'loop' },
    { hand: 'Left middle finger', ring: 24, img: placeholderImage, fingerType: '伸長紋+' },
    { hand: 'Left ring finger', ring: 25, img: placeholderImage, fingerType: 'txt_whorl_23' },
    { hand: 'Left little finger', ring: 22, img: placeholderImage, fingerType: 'txt_whorl_22' },
    { hand: 'Right thumb', ring: 17, img: placeholderImage, fingerType: 'whorl' },
    { hand: 'Right index finger', ring: 20, img: placeholderImage, fingerType: '伸長紋-' },
    { hand: 'Right middle finger', ring: 22, img: placeholderImage, fingerType: '雙箕斗紋-' },
    { hand: 'Right ring finger', ring: 28, img: placeholderImage, fingerType: 'arch' },
    { hand: 'Right little finger', ring: 22, img: placeholderImage, fingerType: 'txt_whorl_29' }
];

const totalRing = fingerprints.reduce((sum, fp) => sum + fp.ring, 0);

const mockProfile = {
    _id: 'preview',
    name: '測試客戶',
    gender: 'male',
    birth: new Date('1990-01-01'),
    age: 34,
    fingerprints,
    TRC: totalRing,
    leftTotal: fingerprints.slice(0, 5).reduce((sum, fp) => sum + fp.ring, 0),
    rightTotal: fingerprints.slice(5).reduce((sum, fp) => sum + fp.ring, 0)
};

(async () => {
    try {
        const out = path.join(__dirname, '../tmp/thinkapro-preview.pdf');
        fs.mkdirSync(path.dirname(out), { recursive: true });
        console.log('Generating preview PDF, TRC=', mockProfile.TRC);
        const buf = await generateThinkaProPdf(mockProfile);
        fs.writeFileSync(out, buf);
        console.log('Wrote', out, buf.length, 'bytes');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
