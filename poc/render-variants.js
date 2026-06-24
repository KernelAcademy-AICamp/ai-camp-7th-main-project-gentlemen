// 카드뉴스 "디자인 다양성" 테스트 렌더러 (SVG 다양화, 비용 0)
// 목적: 같은 deck을 [뼈대가 다른 레이아웃 4종]으로 렌더해 "SVG만으로 어디까지 다양해지나" 확인.
//       프롬프트(글)는 그대로, 디자인=템플릿 종류로 다양성을 낸다는 원칙(§9)의 실증.
//
// 실행:  node render-variants.js <컨셉파일> <deck파일>
// 예:    node render-variants.js concepts/playlist.json decks/playlist-001.json
// 출력:  out/variants/<style>/slide_N.png  +  out/variants/compare_slideN.png(4종 나란히)

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const conceptFile = process.argv[2];
const deckFile = process.argv[3];
if (!conceptFile || !deckFile) {
  console.error("사용법: node render-variants.js <컨셉파일> <deck파일>");
  process.exit(1);
}
const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const v = concept.visual;
const brand = {
  name: concept.account,
  primary: v.primary, primary2: v.primary2 || v.primary,
  accent: v.accent, light: v.light, font: v.font,
};

// ── 공통 헬퍼 ──
const W = 1080, H = 1350, MX = 96;
function clen(s) { return [...String(s)].length; }
function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}
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
        for (const ch of [...w]) { if (clen(chunk) >= maxChars) { out.push(chunk); chunk = ""; } chunk += ch; }
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
const F = brand.font;
const svgDoc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`;

// ════════════════════════════════════════════════════════════════
// STYLE A — 현행(그라데이션 + 모서리 숫자). baseline.
// ════════════════════════════════════════════════════════════════
function styleA(s, p, total) {
  const defs = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${brand.primary}"/><stop offset="100%" stop-color="${brand.primary2}"/></linearGradient></defs>`;
  const chrome = defs +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    `<circle cx="940" cy="170" r="320" fill="${brand.accent}" opacity="0.10"/>` +
    `<circle cx="120" cy="1180" r="240" fill="${brand.accent}" opacity="0.08"/>` +
    `<text x="${MX}" y="112" font-family="${F}" font-size="24" fill="${brand.light}" opacity="0.5">AI 생성 · 검수됨</text>` +
    `<text x="${MX}" y="${H - 72}" font-family="${F}" font-size="30" fill="${brand.light}" opacity="0.55">${escapeXml(brand.name)}</text>` +
    `<text x="${W - MX}" y="${H - 72}" font-family="${F}" font-size="30" fill="${brand.light}" opacity="0.55" text-anchor="end">${p} / ${total}</text>`;
  let body = "";
  if (s.kind === "cover") {
    const t = wrap(s.title, 9), ty = 560;
    body = `<rect x="${MX}" y="400" width="${clen(s.kicker) * 28 + 64}" height="70" rx="35" fill="${brand.accent}"/>
      <text x="${MX + (clen(s.kicker) * 28 + 64) / 2}" y="445" font-family="${F}" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">${escapeXml(s.kicker)}</text>
      <text font-family="${F}" font-size="104" font-weight="800" fill="${brand.light}">${tspans(t, MX, ty, 128)}</text>
      <rect x="${MX}" y="${ty + t.length * 128 - 30}" width="96" height="8" rx="4" fill="${brand.accent}"/>
      <text font-family="${F}" font-size="42" fill="${brand.light}" opacity="0.82">${tspans(wrap(s.sub, 20), MX, ty + t.length * 128 + 56, 58)}</text>`;
  } else if (s.kind === "body") {
    const h = wrap(s.head, 13);
    body = `<text x="${W - 40}" y="520" font-family="${F}" font-size="380" font-weight="800" fill="${brand.accent}" opacity="0.14" text-anchor="end">${escapeXml(s.index)}</text>
      <rect x="${MX}" y="430" width="84" height="84" rx="20" fill="${brand.accent}"/>
      <text x="${MX + 42}" y="490" font-family="${F}" font-size="44" font-weight="800" fill="#fff" text-anchor="middle">${escapeXml(s.index)}</text>
      <text font-family="${F}" font-size="70" font-weight="800" fill="${brand.light}">${tspans(h, MX, 640, 88)}</text>
      <rect x="${MX}" y="${640 + h.length * 88 - 6}" width="700" height="2" fill="${brand.light}" opacity="0.2"/>
      <text font-family="${F}" font-size="46" fill="${brand.light}" opacity="0.85">${tspans(wrap(s.body, 17), MX, 640 + h.length * 88 + 80, 68)}</text>`;
  } else {
    const t = wrap(s.title, 12);
    body = `<text font-family="${F}" font-size="78" font-weight="800" fill="${brand.light}">${tspans(t, MX, 500, 96)}</text>
      <text font-family="${F}" font-size="44" fill="${brand.light}" opacity="0.85">${tspans(wrap(s.sub, 20), MX, 500 + t.length * 96 + 50, 62)}</text>
      <rect x="${MX}" y="980" width="${clen(s.cta) * 44 + 64}" height="86" rx="43" fill="${brand.accent}"/>
      <text x="${MX + (clen(s.cta) * 44 + 64) / 2}" y="1035" font-family="${F}" font-size="46" font-weight="700" fill="#fff" text-anchor="middle">${escapeXml(s.cta)}</text>`;
  }
  return svgDoc(chrome + body);
}

// ════════════════════════════════════════════════════════════════
// STYLE B — 에디토리얼(단색 배경 + 좌측 악센트 레일 + 헤어라인). 잡지 느낌.
// ════════════════════════════════════════════════════════════════
function styleB(s, p, total) {
  const RX = MX;                       // 좌측 레일 x
  const TX = MX + 56;                  // 텍스트 시작 x
  const chrome =
    `<rect width="${W}" height="${H}" fill="${brand.primary}"/>` +
    `<rect x="${RX}" y="150" width="10" height="${H - 300}" fill="${brand.accent}"/>` +
    `<text x="${TX}" y="135" font-family="${F}" font-size="26" font-weight="700" fill="${brand.accent}" letter-spacing="6">${escapeXml(brand.name.toUpperCase())}</text>` +
    `<line x1="${TX}" y1="155" x2="${W - MX}" y2="155" stroke="${brand.light}" stroke-opacity="0.18"/>` +
    `<line x1="${TX}" y1="${H - 150}" x2="${W - MX}" y2="${H - 150}" stroke="${brand.light}" stroke-opacity="0.18"/>` +
    `<text x="${TX}" y="${H - 110}" font-family="${F}" font-size="26" fill="${brand.light}" opacity="0.5">AI 생성 · 검수됨</text>` +
    `<text x="${W - MX}" y="${H - 110}" font-family="${F}" font-size="26" fill="${brand.light}" opacity="0.5" text-anchor="end">${p} / ${total}</text>`;
  let body = "";
  if (s.kind === "cover") {
    const t = wrap(s.title, 8), ty = 520;
    body = `<text x="${TX}" y="400" font-family="${F}" font-size="32" font-weight="700" fill="${brand.accent}" letter-spacing="3">${escapeXml(s.kicker)}</text>
      <text font-family="${F}" font-size="112" font-weight="800" fill="${brand.light}">${tspans(t, TX, ty, 132)}</text>
      <text font-family="${F}" font-size="40" fill="${brand.light}" opacity="0.7">${tspans(wrap(s.sub, 22), TX, ty + t.length * 132 + 60, 56)}</text>`;
  } else if (s.kind === "body") {
    const h = wrap(s.head, 12);
    body = `<text x="${TX}" y="420" font-family="${F}" font-size="120" font-weight="800" fill="${brand.accent}">${escapeXml(s.index)}</text>
      <text font-family="${F}" font-size="72" font-weight="800" fill="${brand.light}">${tspans(h, TX, 560, 90)}</text>
      <text font-family="${F}" font-size="46" fill="${brand.light}" opacity="0.78">${tspans(wrap(s.body, 18), TX, 560 + h.length * 90 + 60, 66)}</text>`;
  } else {
    const t = wrap(s.title, 11);
    body = `<text font-family="${F}" font-size="80" font-weight="800" fill="${brand.light}">${tspans(t, TX, 480, 98)}</text>
      <text font-family="${F}" font-size="44" fill="${brand.light}" opacity="0.78">${tspans(wrap(s.sub, 20), TX, 480 + t.length * 98 + 50, 62)}</text>
      <text x="${TX}" y="1010" font-family="${F}" font-size="50" font-weight="800" fill="${brand.accent}">${escapeXml(s.cta)} →</text>`;
  }
  return svgDoc(chrome + body);
}

// ════════════════════════════════════════════════════════════════
// STYLE C — 센터 미니멀(전체 중앙정렬 + 큰 워터마크 인덱스 + 여백). 절제미.
// ════════════════════════════════════════════════════════════════
function styleC(s, p, total) {
  const CX = W / 2;
  const chrome =
    `<rect width="${W}" height="${H}" fill="${brand.primary2}"/>` +
    `<text x="${CX}" y="120" font-family="${F}" font-size="24" fill="${brand.light}" opacity="0.45" text-anchor="middle" letter-spacing="4">AI 생성 · 검수됨</text>` +
    `<text x="${CX}" y="${H - 90}" font-family="${F}" font-size="28" fill="${brand.light}" opacity="0.5" text-anchor="middle">${escapeXml(brand.name)}　·　${p} / ${total}</text>`;
  let body = "";
  if (s.kind === "cover") {
    const t = wrap(s.title, 9), ty = 540;
    body = `<text x="${CX}" y="420" font-family="${F}" font-size="34" font-weight="700" fill="${brand.accent}" text-anchor="middle" letter-spacing="2">${escapeXml(s.kicker)}</text>
      <text font-family="${F}" font-size="100" font-weight="800" fill="${brand.light}" text-anchor="middle">${tspans(t, CX, ty, 124, "middle")}</text>
      <rect x="${CX - 40}" y="${ty + t.length * 124 + 20}" width="80" height="6" rx="3" fill="${brand.accent}"/>
      <text font-family="${F}" font-size="40" fill="${brand.light}" opacity="0.72" text-anchor="middle">${tspans(wrap(s.sub, 22), CX, ty + t.length * 124 + 90, 56, "middle")}</text>`;
  } else if (s.kind === "body") {
    const h = wrap(s.head, 12);
    body = `<text x="${CX}" y="640" font-family="${F}" font-size="300" font-weight="800" fill="${brand.accent}" opacity="0.16" text-anchor="middle">${escapeXml(s.index)}</text>
      <text font-family="${F}" font-size="74" font-weight="800" fill="${brand.light}" text-anchor="middle">${tspans(h, CX, 720, 92, "middle")}</text>
      <text font-family="${F}" font-size="46" fill="${brand.light}" opacity="0.78" text-anchor="middle">${tspans(wrap(s.body, 18), CX, 720 + h.length * 92 + 70, 66, "middle")}</text>`;
  } else {
    const t = wrap(s.title, 12);
    body = `<text font-family="${F}" font-size="76" font-weight="800" fill="${brand.light}" text-anchor="middle">${tspans(t, CX, 500, 94, "middle")}</text>
      <text font-family="${F}" font-size="42" fill="${brand.light}" opacity="0.78" text-anchor="middle">${tspans(wrap(s.sub, 20), CX, 500 + t.length * 94 + 50, 60, "middle")}</text>
      <rect x="${CX - (clen(s.cta) * 44 + 80) / 2}" y="980" width="${clen(s.cta) * 44 + 80}" height="88" rx="44" fill="none" stroke="${brand.accent}" stroke-width="3"/>
      <text x="${CX}" y="1037" font-family="${F}" font-size="46" font-weight="700" fill="${brand.accent}" text-anchor="middle">${escapeXml(s.cta)}</text>`;
  }
  return svgDoc(chrome + body);
}

// ════════════════════════════════════════════════════════════════
// STYLE D — 밴드 대비(상단 컬러밴드 + 하단 라이트영역). 강한 대비, 잡지 표지형.
// ════════════════════════════════════════════════════════════════
function styleD(s, p, total) {
  const BAND = 560;                    // 상단 밴드 높이
  const dark = brand.primary, ink = brand.primary;     // 하단 글자색(라이트 배경 위)
  const chrome =
    `<rect width="${W}" height="${H}" fill="${brand.light}"/>` +
    `<rect width="${W}" height="${BAND}" fill="${brand.primary}"/>` +
    `<rect y="${BAND}" width="${W}" height="10" fill="${brand.accent}"/>` +
    `<text x="${MX}" y="110" font-family="${F}" font-size="26" fill="${brand.light}" opacity="0.6" letter-spacing="3">AI 생성 · 검수됨</text>` +
    `<text x="${MX}" y="${H - 80}" font-family="${F}" font-size="28" fill="${ink}" opacity="0.55">${escapeXml(brand.name)}</text>` +
    `<text x="${W - MX}" y="${H - 80}" font-family="${F}" font-size="28" fill="${ink}" opacity="0.55" text-anchor="end">${p} / ${total}</text>`;
  let body = "";
  if (s.kind === "cover") {
    const t = wrap(s.title, 9);
    body = `<text x="${MX}" y="240" font-family="${F}" font-size="32" font-weight="700" fill="${brand.accent}" letter-spacing="3">${escapeXml(s.kicker)}</text>
      <text font-family="${F}" font-size="96" font-weight="800" fill="${brand.light}">${tspans(t, MX, 360, 116)}</text>
      <text font-family="${F}" font-size="44" fill="${ink}" opacity="0.78">${tspans(wrap(s.sub, 22), MX, BAND + 130, 60)}</text>`;
  } else if (s.kind === "body") {
    const h = wrap(s.head, 13);
    body = `<text x="${MX}" y="250" font-family="${F}" font-size="160" font-weight="800" fill="${brand.accent}">${escapeXml(s.index)}</text>
      <text font-family="${F}" font-size="64" font-weight="800" fill="${brand.light}">${tspans(h, MX, 420, 80)}</text>
      <text font-family="${F}" font-size="48" fill="${ink}" opacity="0.82">${tspans(wrap(s.body, 16), MX, BAND + 130, 70)}</text>`;
  } else {
    const t = wrap(s.title, 12);
    body = `<text font-family="${F}" font-size="72" font-weight="800" fill="${brand.light}">${tspans(t, MX, 300, 90)}</text>
      <text font-family="${F}" font-size="46" fill="${ink}" opacity="0.82">${tspans(wrap(s.sub, 20), MX, BAND + 120, 66)}</text>
      <rect x="${MX}" y="980" width="${clen(s.cta) * 44 + 72}" height="90" rx="16" fill="${brand.primary}"/>
      <text x="${MX + (clen(s.cta) * 44 + 72) / 2}" y="1040" font-family="${F}" font-size="46" font-weight="700" fill="${brand.light}" text-anchor="middle">${escapeXml(s.cta)}</text>`;
  }
  return svgDoc(chrome + body);
}

const STYLES = [
  { key: "A_gradient", label: "A 현행(그라데이션)", fn: styleA },
  { key: "B_editorial", label: "B 에디토리얼", fn: styleB },
  { key: "C_centered", label: "C 센터미니멀", fn: styleC },
  { key: "D_band", label: "D 밴드대비", fn: styleD },
];

(async () => {
  const root = path.join(__dirname, "out", "variants");
  const total = deck.slides.length;

  // 1) 스타일별 풀해상도 렌더
  for (const st of STYLES) {
    const dir = path.join(root, st.key);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < total; i++) {
      const svg = st.fn(deck.slides[i], i + 1, total);
      await sharp(Buffer.from(svg)).png().toFile(path.join(dir, `slide_${i + 1}.png`));
    }
  }

  // 2) 슬라이드별 비교 시트(4종 나란히)
  const cardW = 460, cardH = Math.round((H / W) * cardW), gap = 24, pad = 28, labelH = 56;
  const sheetW = pad * 2 + STYLES.length * cardW + (STYLES.length - 1) * gap;
  const sheetH = pad * 2 + labelH + cardH;
  for (let i = 0; i < total; i++) {
    const composites = [];
    let labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${labelH}">`;
    for (let j = 0; j < STYLES.length; j++) {
      const x = pad + j * (cardW + gap);
      const buf = await sharp(path.join(root, STYLES[j].key, `slide_${i + 1}.png`)).resize(cardW, cardH).png().toBuffer();
      composites.push({ input: buf, left: x, top: pad + labelH });
      labelSvg += `<text x="${x + cardW / 2}" y="${labelH - 16}" font-family="${F}" font-size="26" font-weight="700" fill="#222" text-anchor="middle">${escapeXml(STYLES[j].label)}</text>`;
    }
    labelSvg += `</svg>`;
    composites.push({ input: Buffer.from(labelSvg), left: 0, top: pad });
    await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#ffffff" } })
      .composite(composites).png().toFile(path.join(root, `compare_slide${i + 1}.png`));
  }

  console.log(`\n✅ [${deck.conceptId}] 다양성 테스트 렌더 완료 — 스타일 ${STYLES.length}종 × ${total}장`);
  STYLES.forEach((s) => console.log(`   - out/variants/${s.key}/  (${s.label})`));
  console.log(`   - out/variants/compare_slide1~${total}.png  (4종 나란히 비교)`);
})();
