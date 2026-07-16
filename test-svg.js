const fs = require('fs');
const sharp = require('sharp');

const svgCode = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="none">
  <text x="0" y="38" font-family="'Geist', 'Inter', sans-serif" font-size="44" font-weight="700" letter-spacing="-2" fill="#ffffff">munshi</text>
  <circle cx="154" cy="26" r="7" fill="#4ae176"/>
</svg>
`;

fs.writeFileSync('test-logo.svg', svgCode);

sharp(Buffer.from(svgCode))
  .png()
  .toFile('test-logo.png')
  .then(() => console.log('Generated test-logo.png'))
  .catch(err => console.error(err));
