const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const logoPath = path.join(rootDir, 'public', 'logo-1.png');
  const bgPath = path.join(rootDir, 'public', 'og-bg.jpg');

  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo not found at ' + logoPath);
  }
  if (!fs.existsSync(bgPath)) {
    throw new Error('Background not found at ' + bgPath);
  }

  const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
  const bgBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(bgPath).toString('base64');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LK Textiles OG Image</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #FAF8F5;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .canvas {
      position: relative;
      width: 1200px;
      height: 630px;
      display: flex;
      background: #FAF8F5;
      overflow: hidden;
    }

    /* Left Editorial Content Area */
    .left-panel {
      position: relative;
      width: 640px;
      height: 630px;
      padding: 48px 52px 44px 58px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #FAF8F5;
      border-right: 1px solid rgba(212, 155, 42, 0.22);
      box-shadow: 14px 0 35px rgba(7, 37, 93, 0.06);
      z-index: 10;
    }

    /* Subtle decorative background watermark */
    .left-panel::before {
      content: '';
      position: absolute;
      top: -100px;
      left: -100px;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(244, 168, 12, 0.08) 0%, rgba(250, 248, 245, 0) 70%);
      pointer-events: none;
      z-index: -1;
    }

    /* Top Heritage Row */
    .top-badge-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #FFFFFF;
      border: 1px solid rgba(7, 37, 93, 0.12);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #07255D;
      box-shadow: 0 2px 6px rgba(7, 37, 93, 0.04);
    }

    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #F4A80C;
      box-shadow: 0 0 10px rgba(244, 168, 12, 0.85);
    }

    .badge-secondary {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #64748B;
    }

    /* Brand Logo */
    .logo-container {
      margin: 10px 0 14px 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      height: 142px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 4px 14px rgba(7, 37, 93, 0.07));
    }

    /* Content Group */
    .content-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 6px;
    }

    .company-sub-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #D9940A;
    }

    .headline {
      font-family: 'Outfit', sans-serif;
      font-size: 42px;
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.025em;
      color: #07255D;
    }

    .headline-gold {
      color: #D9940A;
    }

    .tagline {
      font-size: 16px;
      line-height: 1.55;
      font-weight: 500;
      color: #475569;
      max-width: 530px;
    }

    /* Trust & Stats Bar */
    .metrics-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(7, 37, 93, 0.1);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-value {
      font-family: 'Outfit', sans-serif;
      font-size: 23px;
      font-weight: 800;
      color: #07255D;
      letter-spacing: -0.01em;
      line-height: 1;
    }

    .metric-value span {
      color: #F4A80C;
      font-weight: 700;
      margin-left: 1px;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .metric-divider {
      width: 1px;
      height: 32px;
      background: rgba(7, 37, 93, 0.12);
    }

    /* Right Panel - Photography */
    .right-panel {
      position: relative;
      width: 560px;
      height: 630px;
      overflow: hidden;
      background: #081220;
    }

    .fabric-photo {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 45% center;
    }

    /* Subtle dark vignette on photo */
    .photo-vignette {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(7, 37, 93, 0.35) 0%, rgba(8, 18, 32, 0.05) 45%, rgba(7, 37, 93, 0.85) 100%);
      pointer-events: none;
    }

    /* Floating Credibility Glass Card */
    .floating-card {
      position: absolute;
      bottom: 40px;
      left: 36px;
      right: 44px;
      background: rgba(7, 26, 61, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(244, 168, 12, 0.35);
      border-radius: 16px;
      padding: 18px 22px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #F4A80C;
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 16.5px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.1px;
    }

    .card-desc {
      font-size: 12.5px;
      color: #CBD5E1;
      line-height: 1.45;
    }

    /* Corner Luxury Watermark Pill */
    .photo-tag {
      position: absolute;
      top: 36px;
      right: 36px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(7, 26, 61, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 9999px;
      color: #F1F5F9;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .tag-sparkle {
      color: #F4A80C;
    }

    /* Outer delicate hairline border */
    .outer-border {
      position: absolute;
      inset: 0;
      border: 1px solid rgba(7, 37, 93, 0.12);
      pointer-events: none;
      z-index: 50;
    }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="outer-border"></div>

    <!-- Left Editorial Panel -->
    <div class="left-panel">
      <!-- Top Heritage Row -->
      <div class="top-badge-row">
        <div class="badge">
          <span class="badge-dot"></span>
          <span>Since 1995</span>
        </div>
        <span class="badge-secondary">Surat, India • Global Export</span>
      </div>

      <!-- Official Logo Lockup -->
      <div class="logo-container">
        <img src="${logoBase64}" alt="LK Textiles" class="brand-logo" />
      </div>

      <!-- Core Content -->
      <div class="content-group">
        <div class="company-sub-badge">
          Enterprise Textile Manufacturing & Management
        </div>
        <h1 class="headline">
          Weave Your Legacy <br/>
          <span class="headline-gold">in Fabric.</span>
        </h1>
        <p class="tagline">
          Premier manufacturers of art silk cloth and advanced digital textile operations engineered for modern textile traders and global brands.
        </p>
      </div>

      <!-- Credibility Metrics -->
      <div class="metrics-row">
        <div class="metric-item">
          <div class="metric-value">25<span>+</span></div>
          <div class="metric-label">Years Mastery</div>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <div class="metric-value">30<span>+</span></div>
          <div class="metric-label">Export Markets</div>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <div class="metric-value">10M<span>+</span></div>
          <div class="metric-label">Meters Annually</div>
        </div>
      </div>
    </div>

    <!-- Right Fabric Photography Showcase -->
    <div class="right-panel">
      <img src="${bgBase64}" alt="Luxury Silk Weave" class="fabric-photo" />
      <div class="photo-vignette"></div>

      <!-- Top corner pill -->
      <div class="photo-tag">
        <span class="tag-sparkle">✦</span>
        <span>Art Silk Mill</span>
      </div>

      <!-- Floating Credibility Glass Card -->
      <div class="floating-card">
        <div class="card-tag">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#F4A80C" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          Precision Craftsmanship
        </div>
        <div class="card-title">Art Silk & Precision Wovens</div>
        <div class="card-desc">Suits, shirts, and luxury fabrics engineered with precision craftsmanship and enterprise taka stock management.</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const tempHtmlPath = path.join(rootDir, 'scripts', 'temp-og.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  const outputPath = path.join(rootDir, 'public', 'og-image.png');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Rendering refined 1200x630 screenshot via Headless Chrome...');
  const cmd = `"${chromePath}" --headless=new --screenshot="${outputPath}" --window-size=1200,630 --hide-scrollbars --run-all-compositor-stages-before-draw --virtual-time-budget=3000 "file:///${tempHtmlPath.replace(/\\\\/g, '/')}"`;

  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }

  const metadata = await sharp(outputPath).metadata();
  console.log('Rendered OG image:', metadata.width, 'x', metadata.height, 'Format:', metadata.format);

  if (metadata.width !== 1200 || metadata.height !== 630) {
    console.log('Adjusting to exact 1200x630 with Sharp...');
    await sharp(outputPath)
      .resize(1200, 630, { fit: 'cover' })
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(path.join(rootDir, 'public', 'og-image-exact.png'));
    fs.renameSync(path.join(rootDir, 'public', 'og-image-exact.png'), outputPath);
  }

  const appOgPath = path.join(rootDir, 'app', 'opengraph-image.png');
  fs.copyFileSync(outputPath, appOgPath);
  console.log('Successfully updated', outputPath, 'and', appOgPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
