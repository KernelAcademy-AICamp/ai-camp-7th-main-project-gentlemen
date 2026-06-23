// 범용 카드뉴스 렌더러 v2 (서비스 로직대로: 컨셉 + deck → PNG)
// 흐름: [채널 컨셉(잠금)] + [Claude가 생성한 deck] → 브랜드 템플릿 → PNG
// 실제 서비스에서 deck 은 Claude API 출력으로 교체된다. (지금은 사람이 생성)
//
// 실행:  node render-deck.js <컨셉파일> <deck파일>
// 예:    node render-deck.js concepts/playlist.json decks/playlist-001.json

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const conceptFile = process.argv[2];
const deckFile = process.argv[3];
if (!conceptFile || !deckFile) {
  console.error("사용법: node render-deck.js <컨셉파일> <deck파일>");
  process.exit(1);
}

const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const v = concept.visual;
const brand = {
  name: concept.account,
  primary: v.primary,
  primary2: v.primary2 || v.primary,
  accent: v.accent,
  light: v.light,
  font: v.font,
};

// ── 텍스트 줄바꿈: 단어(공백) 우선, 너무 길면 글자 단위 분할 ──
function clen(s) { return [...String(s)].length; }
function wrap(text, maxChars) {
  const out = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const cand = line ? line + " " + w : w;
      if (clen(cand) <= maxChars) { line = cand; continue; }
      if (line) out.push(line);
      if (clen(w) > maxChars) {
        let chunk = "";
        for (const ch of [...w]) {
          if (clen(chunk) >= maxChars) { out.push(chunk); chunk = ""; }
          chunk += ch;
        }
        line = chunk;
      } else line = w;
    }
    out.push(line);
  }
  return out;
}
function tspans(lines, x, startY, lineH, anchor) {
  const a = anchor ? ` text-anchor="${anchor}"` : "";
  return lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineH}"${a}>${escapeXml(l)}</tspan>`).join("");
}
function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

const W = 1080, H = 1350;
const MX = 96; // 좌우 여백

// 캐러셀 진행 점 (상단 우측 정렬)
function progressDots(current, total) {
  let s = "";
  const r = 8, gap = 30, endX = W - MX;
  for (let i = 0; i < total; i++) {
    const cx = endX - (total - 1 - i) * gap;
    const on = i === current;
    s += `<circle cx="${cx}" cy="104" r="${on ? r : r - 2}" fill="${brand.accent}" opacity="${on ? 1 : 0.3}"/>`;
  }
  return s;
}

// 공통 레이어 (그라데이션 배경 + 데코 원 + 라벨 + 점 + 푸터)
function chrome(pageNo, total) {
  const defs = `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${brand.primary}"/>
      <stop offset="100%" stop-color="${brand.primary2}"/>
    </linearGradient>
  </defs>`;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const blobs = `
    <circle cx="940" cy="170" r="320" fill="${brand.accent}" opacity="0.10"/>
    <circle cx="120" cy="1180" r="240" fill="${brand.accent}" opacity="0.08"/>`;
  const aiLabel = `<text x="${MX}" y="112" font-family="${brand.font}" font-size="24" fill="${brand.light}" opacity="0.5">AI 생성 · 검수됨</text>`;
  const footer = `
    <text x="${MX}" y="${H - 72}" font-family="${brand.font}" font-size="30" fill="${brand.light}" opacity="0.55">${escapeXml(brand.name)}</text>
    <text x="${W - MX}" y="${H - 72}" font-family="${brand.font}" font-size="30" fill="${brand.light}" opacity="0.55" text-anchor="end">${pageNo} / ${total}</text>`;
  return defs + bg + blobs + aiLabel + progressDots(pageNo - 1, total) + footer;
}

function pill(x, y, text, fontSize) {
  const w = clen(text) * (fontSize * 0.92) + 64;
  const h = fontSize + 40;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${brand.accent}"/>
    <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.36}" font-family="${brand.font}" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(text)}</text>`;
}

function slideSVG(s, pageNo, total) {
  let body = "";

  if (s.kind === "cover") {
    const titleLines = wrap(s.title, 9);
    const titleY = 560;
    body = `
      ${pill(MX, 400, s.kicker, 30)}
      <text font-family="${brand.font}" font-size="104" font-weight="800" fill="${brand.light}">${tspans(titleLines, MX, titleY, 128)}</text>
      <rect x="${MX}" y="${titleY + titleLines.length * 128 - 30}" width="96" height="8" rx="4" fill="${brand.accent}"/>
      <text font-family="${brand.font}" font-size="42" fill="${brand.light}" opacity="0.82">${tspans(wrap(s.sub, 20), MX, titleY + titleLines.length * 128 + 56, 58)}</text>`;
  } else if (s.kind === "body") {
    const headLines = wrap(s.head, 13);
    body = `
      <text x="${W - 40}" y="520" font-family="${brand.font}" font-size="380" font-weight="800" fill="${brand.accent}" opacity="0.14" text-anchor="end">${escapeXml(s.index)}</text>
      <rect x="${MX}" y="430" width="84" height="84" rx="20" fill="${brand.accent}"/>
      <text x="${MX + 42}" y="490" font-family="${brand.font}" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">${escapeXml(s.index)}</text>
      <text font-family="${brand.font}" font-size="70" font-weight="800" fill="${brand.light}">${tspans(headLines, MX, 640, 88)}</text>
      <rect x="${MX}" y="${640 + headLines.length * 88 - 6}" width="700" height="2" fill="${brand.light}" opacity="0.2"/>
      <text font-family="${brand.font}" font-size="46" fill="${brand.light}" opacity="0.85">${tspans(wrap(s.body, 17), MX, 640 + headLines.length * 88 + 80, 68)}</text>`;
  } else if (s.kind === "outro") {
    const titleLines = wrap(s.title, 12);
    body = `
      <text font-family="${brand.font}" font-size="78" font-weight="800" fill="${brand.light}">${tspans(titleLines, MX, 500, 96)}</text>
      <text font-family="${brand.font}" font-size="44" fill="${brand.light}" opacity="0.85">${tspans(wrap(s.sub, 20), MX, 500 + titleLines.length * 96 + 50, 62)}</text>
      ${pill(MX, 980, s.cta, 46)}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${chrome(pageNo, total)}${body}</svg>`;
}

(async () => {
  const outDir = path.join(__dirname, "out", deck.conceptId);
  fs.mkdirSync(outDir, { recursive: true });
  const total = deck.slides.length;
  const files = [];
  for (let i = 0; i < total; i++) {
    const svg = slideSVG(deck.slides[i], i + 1, total);
    const file = path.join(outDir, `slide_${i + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(file);
    files.push(path.relative(process.cwd(), file));
  }

  console.log(`\n✅ [${deck.conceptId}] 카드뉴스 ${total}장 렌더 완료`);
  console.log(`   주제 : ${deck.topic}`);
  files.forEach((f) => console.log("   -", f));
  console.log(`\n── 검수 리포트 ──`);
  console.log(`   리스크 등급 : ${deck.risk_level === "high" ? "🔴 고위험 (사람 검수 필수)" : "🟢 저위험"}`);
  (deck.ai_flags || []).forEach((f) => console.log("   ⚠️ 플래그:", f));
})();
