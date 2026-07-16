const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '..', 'public', 'branding');

// Icon SVG for small sizes
const iconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#121314"/>
  <text x="8" y="48" font-family="'Geist', 'Inter', Arial, sans-serif" font-size="40" font-weight="700" letter-spacing="-1" fill="#ffffff">m</text>
  <circle cx="55" cy="44" r="6" fill="#4ae176"/>
</svg>`);

// OG image SVG (1200x630)
const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#121314"/>
  <!-- Background pattern -->
  <radial-gradient id="g1" cx="50%" cy="50%" r="60%">
    <stop offset="0%" stop-color="#1a2e1a"/>
    <stop offset="100%" stop-color="#121314"/>
  </radial-gradient>
  <ellipse cx="600" cy="315" rx="500" ry="300" fill="#0d1f0d" opacity="0.6"/>
  <!-- Logo wordmark -->
  <text x="200" y="370" font-family="'Geist', 'Inter', Arial, sans-serif" font-size="200" font-weight="700" letter-spacing="-8" fill="#ffffff">munshi</text>
  <circle cx="1070" cy="340" r="28" fill="#4ae176"/>
  <!-- Tagline -->
  <text x="200" y="430" font-family="'Geist', 'Inter', Arial, sans-serif" font-size="28" font-weight="400" fill="rgba(255,255,255,0.4)">WhatsApp Business Operating System</text>
</svg>`);

async function generate() {
  const tasks = [
    { svg: iconSvg, size: 16, output: 'favicon-16.png' },
    { svg: iconSvg, size: 32, output: 'favicon-32.png' },
    { svg: iconSvg, size: 180, output: 'apple-touch-icon.png' },
    { svg: iconSvg, size: 192, output: 'android-chrome-192.png' },
    { svg: iconSvg, size: 512, output: 'android-chrome-512.png' },
  ];

  for (const task of tasks) {
    const outPath = path.join(brandingDir, task.output);
    await sharp(task.svg)
      .resize(task.size, task.size)
      .png()
      .toFile(outPath);
    console.log('Generated:', task.output, task.size + 'x' + task.size);
  }

  // OG image
  const ogPath = path.join(brandingDir, 'og-image.png');
  await sharp(ogSvg)
    .resize(1200, 630)
    .png()
    .toFile(ogPath);
  console.log('Generated: og-image.png 1200x630');

  console.log('All PNG assets generated successfully!');
}

generate().catch(console.error);
