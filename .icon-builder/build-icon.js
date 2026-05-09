const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = `
<svg viewBox="0 0 88 88" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="logoGrad" x1="10" y1="10" x2="78" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="50%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient>
        <linearGradient id="logoFillGrad" x1="10" y1="10" x2="78" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.1"/>
        </linearGradient>
    </defs>
    <!-- Background to make it a solid icon for PWA -->
    <rect width="88" height="88" rx="20" fill="#06060a"/>
    <rect class="logo-fill" x="14" y="12" width="60" height="64" rx="18" fill="url(#logoFillGrad)"/>
    <rect class="logo-shape" x="14" y="12" width="60" height="64" rx="18" fill="none" stroke="url(#logoGrad)" stroke-width="2.5"/>
    <!-- Chart line -->
    <path class="logo-shape" d="M28 58 L38 48 L48 54 L60 34" stroke="url(#logoGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Arrow tip -->
    <path class="logo-shape" d="M54 32 L62 32 L62 40" stroke="url(#logoGrad)" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" fill="none"/>
</svg>`;

const outputPath = path.join(__dirname, '..', 'fintrackr_logo_1772046881316.png');

sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputPath)
    .then(info => {
        console.log('Icon generated:', info);
    })
    .catch(err => {
        console.error('Error:', err);
    });
