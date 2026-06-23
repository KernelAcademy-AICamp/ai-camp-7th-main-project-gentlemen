// Extract every markdown table -> tight high-res PNG. Usage: node tables-to-img.js <input.md> <outDir>
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const input = process.argv[2];
const outDir = process.argv[3] || path.join(path.dirname(input), '표_이미지');
if (!input) { console.error('usage: node tables-to-img.js <input.md> <outDir>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

marked.setOptions({ gfm: true, breaks: false });
const body = marked.parse(fs.readFileSync(input, 'utf8'));

const css = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
         color: #1a1a1a; margin: 0; background: #fff; }
  .shot { display: inline-block; padding: 20px 22px; background: #fff; }
  .shot .label { font-size: 15px; font-weight: 700; margin: 0 0 10px; color: #111; }
  table { border-collapse: collapse; font-size: 13px; line-height: 1.5; }
  th, td { border: 1px solid #ccc; padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; }
  strong { font-weight: 600; }
  code { background: #f3f3f3; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
`;

const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Label each table with the nearest preceding heading, then wrap in a padded .shot box.
  const labels = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.map((t) => {
      let el = t.previousElementSibling, label = '';
      while (el) {
        if (/^H[1-3]$/.test(el.tagName)) { label = el.textContent.trim(); break; }
        el = el.previousElementSibling;
      }
      const wrap = document.createElement('div');
      wrap.className = 'shot';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
      return label;
    });
  });

  const shots = await page.$$('.shot');
  const sani = (s, i) => String(i + 1).padStart(2, '0') + '_' +
    (s || 'table').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 28);

  for (let i = 0; i < shots.length; i++) {
    const file = path.join(outDir, `표_${sani(labels[i], i)}.png`);
    await shots[i].screenshot({ path: file });
    console.log('saved:', path.basename(file));
  }
  await browser.close();
  console.log(`\n총 ${shots.length}개 표 이미지 생성 -> ${outDir}`);
})();
