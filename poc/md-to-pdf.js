// Markdown -> styled HTML -> PDF (headless Chrome). Usage: node md-to-pdf.js <input.md> [output.pdf]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { marked } = require('marked');

const input = process.argv[2];
if (!input) { console.error('usage: node md-to-pdf.js <input.md> [output.pdf]'); process.exit(1); }
const output = process.argv[3] || input.replace(/\.md$/, '.pdf');
const htmlPath = output.replace(/\.pdf$/, '.tmp.html');

marked.setOptions({ gfm: true, breaks: false });
const body = marked.parse(fs.readFileSync(input, 'utf8'));

const css = `
  @page { size: A4; margin: 18mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif;
         font-size: 10.5pt; line-height: 1.6; color: #1a1a1a; max-width: 100%; }
  h1 { font-size: 19pt; border-bottom: 2px solid #222; padding-bottom: 6px; margin: 0 0 14px; }
  h2 { font-size: 14pt; margin: 22px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 12pt; margin: 16px 0 6px; color: #333; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-left: 22px; }
  li { margin: 2px 0; }
  code { background: #f3f3f3; padding: 1px 4px; border-radius: 3px; font-size: 9pt;
         font-family: "SF Mono", Menlo, monospace; }
  pre { background: #f6f8fa; padding: 10px 12px; border-radius: 6px; overflow-x: auto; font-size: 9pt; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 8px 0; padding: 6px 14px; border-left: 3px solid #b0b0b0;
               background: #fafafa; color: #444; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt; }
  th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; }
  tr { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
  hr { border: none; border-top: 1px solid #ddd; margin: 18px 0; }
  strong { font-weight: 600; }
`;

const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
fs.writeFileSync(htmlPath, html);

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
execFileSync(chrome, [
  '--headless', '--disable-gpu', '--no-pdf-header-footer',
  `--print-to-pdf=${path.resolve(output)}`,
  'file://' + path.resolve(htmlPath),
], { stdio: 'inherit' });

fs.unlinkSync(htmlPath);
console.log('PDF created:', output);
