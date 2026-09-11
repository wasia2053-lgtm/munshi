const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brandingDir = path.join(__dirname, 'public', 'branding');
const publicDir = path.join(__dirname, 'public');

const iconSvg = fs.readFileSync(path.join(brandingDir, 'icon.svg'));

function pngToIco(images) {
  const numImages = images.length;
  const headerLen = 6;
  const entryLen = 16;
  const dirLen = headerLen + entryLen * numImages;

  let totalSize = dirLen;
  for (const img of images) totalSize += img.buffer.length;

  const buf = Buffer.alloc(totalSize);

  // ICONDIR header
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // 1 = ICO
  buf.writeUInt16LE(numImages, 4); // count

  let currentOffset = dirLen;
  for (let i = 0; i < numImages; i++) {
    const img = images[i];
    const entryOffset = headerLen + i * entryLen;

    buf.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset);
    buf.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1);
    buf.writeUInt8(0, entryOffset + 2); // color palette count
    buf.writeUInt8(0, entryOffset + 3); // reserved
    buf.writeUInt16LE(1, entryOffset + 4); // color planes
    buf.writeUInt16LE(32, entryOffset + 6); // bpp
    buf.writeUInt32LE(img.buffer.length, entryOffset + 8); // image size
    buf.writeUInt32LE(currentOffset, entryOffset + 12); // image offset

    img.buffer.copy(buf, currentOffset);
    currentOffset += img.buffer.length;
  }

  return buf;
}

async function generate() {
  try {
    const png16 = await sharp(iconSvg).resize(16, 16).png().toBuffer();
    const png32 = await sharp(iconSvg).resize(32, 32).png().toBuffer();

    // Generate exactly what the user asked for in /public/
    await sharp(png16).toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(png32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(iconSvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
    await sharp(iconSvg).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));

    const icoBuffer = pngToIco([
      { width: 16, height: 16, buffer: png16 },
      { width: 32, height: 32, buffer: png32 }
    ]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

    // Also update the ones in /public/branding/ to ensure the app doesn't break
    await sharp(png16).toFile(path.join(brandingDir, 'favicon-16.png'));
    await sharp(png32).toFile(path.join(brandingDir, 'favicon-32.png'));
    await sharp(iconSvg).resize(180, 180).png().toFile(path.join(brandingDir, 'apple-touch-icon.png'));
    await sharp(iconSvg).resize(192, 192).png().toFile(path.join(brandingDir, 'android-chrome-192.png'));
    await sharp(iconSvg).resize(512, 512).png().toFile(path.join(brandingDir, 'android-chrome-512.png'));
    fs.writeFileSync(path.join(brandingDir, 'favicon.ico'), icoBuffer);

    console.log('All branding assets generated successfully.');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exitCode = 1;
  }
}

generate();
