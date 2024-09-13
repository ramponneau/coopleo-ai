const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [16, 32, 180];

async function generateFavicons() {
  const svgBuffer = await fs.readFile(path.join(__dirname, '../public/ai-avatar.svg'));

  // Generate PNGs
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/favicon-${size}x${size}.png`));
  }

  // Generate ICO (using 16x16 and 32x32)
  const icoSizes = [16, 32];
  const icoBuffers = await Promise.all(
    icoSizes.map(size => 
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  await sharp(icoBuffers[0])
    .ensureAlpha()
    .ico({
      sizes: icoSizes
    })
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  // Rename 180x180 to apple-touch-icon.png
  await fs.rename(
    path.join(__dirname, '../public/favicon-180x180.png'),
    path.join(__dirname, '../public/apple-touch-icon.png')
  );

  // Create webmanifest file
  const webmanifest = {
    "name": "Your App Name",
    "short_name": "App",
    "icons": [
      {
        "src": "/favicon-16x16.png",
        "sizes": "16x16",
        "type": "image/png"
      },
      {
        "src": "/favicon-32x32.png",
        "sizes": "32x32",
        "type": "image/png"
      },
      {
        "src": "/apple-touch-icon.png",
        "sizes": "180x180",
        "type": "image/png"
      }
    ],
    "theme_color": "#ffffff",
    "background_color": "#ffffff",
    "display": "standalone"
  };

  await fs.writeFile(
    path.join(__dirname, '../public/site.webmanifest'),
    JSON.stringify(webmanifest, null, 2)
  );

  console.log('Favicons generated successfully!');
}

generateFavicons().catch(console.error);