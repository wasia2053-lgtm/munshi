const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brandingDir = path.join(__dirname, 'public', 'branding');
const publicDir = path.join(__dirname, 'public');

const iconSvg = fs.readFileSync(path.join(brandingDir, 'icon.svg'));

async function generate() {
  try {
    // Generate exactly what the user asked for in /public/
    await sharp(iconSvg).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(iconSvg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(iconSvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
    await sharp(iconSvg).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
    fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));

    // Also update the ones in /public/branding/ to ensure the app doesn't break
    await sharp(iconSvg).resize(16, 16).png().toFile(path.join(brandingDir, 'favicon-16.png'));
    await sharp(iconSvg).resize(32, 32).png().toFile(path.join(brandingDir, 'favicon-32.png'));
    await sharp(iconSvg).resize(180, 180).png().toFile(path.join(brandingDir, 'apple-touch-icon.png'));
    await sharp(iconSvg).resize(192, 192).png().toFile(path.join(brandingDir, 'android-chrome-192.png'));
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(brandingDir, 'android-chrome-512.png'));
    fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(brandingDir, 'favicon.ico'));

    console.log('All branding assets generated successfully.');
  } catch (error) {
    console.error('Error generating assets:', error);
  }
}

generate();
