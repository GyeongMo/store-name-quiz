const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// Register Korean fonts
GlobalFonts.registerFromPath('C:/Windows/Fonts/NanumBarunpenR.ttf', 'NanumBarunpen');
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgunbd.ttf', 'MalgunBold');

const buildDir = path.join(__dirname, '..', 'build');
const pngPath = path.join(buildDir, 'icon.png');
const icoPath = path.join(buildDir, 'icon.ico');

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 256;

  // --- Pastel gradient background ---
  roundedRect(ctx, 0, 0, size, size, 56 * s);
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#FFD1E8');
  bgGrad.addColorStop(0.5, '#E8D5F5');
  bgGrad.addColorStop(1, '#D1E8FF');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // --- Decorative dots ---
  ctx.fillStyle = '#FFFFFF';
  [[40,35,6],[75,22,4],[200,28,5],[225,60,4],[30,200,4],[215,210,5],[185,235,3],[55,230,4]]
    .forEach(([x, y, r]) => {
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill();
    });
  ctx.globalAlpha = 1.0;

  // --- "ANIMATION" background text (repeating pattern) ---
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#7B5EA7';
  ctx.rotate(-0.2);
  const aniFontSize = Math.round(30 * s);
  ctx.font = `900 ${aniFontSize}px "Arial Black", Impact, sans-serif`;
  const lineH = 34 * s;
  for (let row = -3; row < 10; row++) {
    const offset = (row % 2) * 60 * s;
    for (let col = -1; col < 4; col++) {
      ctx.fillText('ANIMATION', -40 * s + col * 200 * s + offset, row * lineH);
    }
  }
  ctx.restore();

  // --- Cute cat face ---
  const cx = 128 * s;
  const cy = 100 * s;
  const headR = 50 * s;

  // Ears
  ctx.fillStyle = '#FFB5C5';
  ctx.beginPath();
  ctx.moveTo(cx - 40 * s, cy - 30 * s);
  ctx.lineTo(cx - 54 * s, cy - 68 * s);
  ctx.lineTo(cx - 12 * s, cy - 46 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 40 * s, cy - 30 * s);
  ctx.lineTo(cx + 54 * s, cy - 68 * s);
  ctx.lineTo(cx + 12 * s, cy - 46 * s);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  ctx.fillStyle = '#FFDAE8';
  ctx.beginPath();
  ctx.moveTo(cx - 38 * s, cy - 34 * s);
  ctx.lineTo(cx - 48 * s, cy - 60 * s);
  ctx.lineTo(cx - 18 * s, cy - 44 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 38 * s, cy - 34 * s);
  ctx.lineTo(cx + 48 * s, cy - 60 * s);
  ctx.lineTo(cx + 18 * s, cy - 44 * s);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 8 * s;
  ctx.shadowOffsetY = 3 * s;
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Eyes
  ctx.fillStyle = '#3D3D3D';
  ctx.beginPath(); ctx.ellipse(cx - 17 * s, cy - 6 * s, 6 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 17 * s, cy - 6 * s, 6 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(cx - 14 * s, cy - 9 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 20 * s, cy - 9 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = '#FFB5C5';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 6 * s);
  ctx.lineTo(cx - 4 * s, cy + 12 * s);
  ctx.lineTo(cx + 4 * s, cy + 12 * s);
  ctx.closePath();
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#D4A0AA';
  ctx.lineWidth = 1.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 12 * s);
  ctx.quadraticCurveTo(cx - 8 * s, cy + 20 * s, cx - 14 * s, cy + 16 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 12 * s);
  ctx.quadraticCurveTo(cx + 8 * s, cy + 20 * s, cx + 14 * s, cy + 16 * s);
  ctx.stroke();

  // Blush
  ctx.fillStyle = '#FFD1E8';
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.ellipse(cx - 30 * s, cy + 8 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 30 * s, cy + 8 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1.0;

  // Whiskers
  ctx.strokeStyle = '#D4A0AA';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath(); ctx.moveTo(cx - 19 * s, cy + 10 * s); ctx.lineTo(cx - 46 * s, cy + 4 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 19 * s, cy + 14 * s); ctx.lineTo(cx - 46 * s, cy + 18 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 19 * s, cy + 10 * s); ctx.lineTo(cx + 46 * s, cy + 4 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 19 * s, cy + 14 * s); ctx.lineTo(cx + 46 * s, cy + 18 * s); ctx.stroke();

  // Paws
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.06)';
  ctx.shadowBlur = 4 * s;
  ctx.beginPath(); ctx.ellipse(cx - 20 * s, cy + headR - 2 * s, 13 * s, 9 * s, 0, 0, Math.PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20 * s, cy + headR - 2 * s, 13 * s, 9 * s, 0, 0, Math.PI); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  // Paw pads
  ctx.fillStyle = '#FFD1E8';
  [[cx - 20 * s, cy + headR + 1 * s, 3.5 * s],
   [cx - 27 * s, cy + headR - 2 * s, 2 * s],
   [cx - 13 * s, cy + headR - 2 * s, 2 * s],
   [cx + 20 * s, cy + headR + 1 * s, 3.5 * s],
   [cx + 27 * s, cy + headR - 2 * s, 2 * s],
   [cx + 13 * s, cy + headR - 2 * s, 2 * s]]
    .forEach(([px, py, pr]) => {
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    });

  // --- "초성퀴즈" text with cute bubbly style (1.5x larger) ---
  const textY = 205 * s;
  const fontSize = Math.round(66 * s);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px NanumBarunpen, sans-serif`;

  // White outline (bubbly effect)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8 * s;
  ctx.lineJoin = 'round';
  ctx.strokeText('\uCD08\uC131\uD034\uC988', cx, textY);

  // Colored fill
  ctx.fillStyle = '#8B6FC0';
  ctx.fillText('\uCD08\uC131\uD034\uC988', cx, textY);

  return canvas.toBuffer('image/png');
}

async function generate() {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const pngBuffer = drawIcon(256);
  fs.writeFileSync(pngPath, pngBuffer);
  console.log('PNG icon generated:', pngPath);

  const sizes = [16, 32, 48, 128, 256];
  const pngBuffers = sizes.map(size => drawIcon(size));

  const toIco = (await import('to-ico')).default;
  const icoBuffer = await toIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('ICO icon generated:', icoPath);
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
