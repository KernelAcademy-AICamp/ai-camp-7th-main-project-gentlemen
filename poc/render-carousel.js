// 카드뉴스(캐러셀) 렌더링 PoC
// 흐름: [AI가 생성했다고 가정한 슬라이드 텍스트] -> [브랜드컬러 HTML/SVG 템플릿] -> [PNG 이미지]
// 실제 서비스에서는 아래 `deck` 자리에 Claude API 출력이 들어간다.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ── 1) 채널 컨셉(잠금됨)에서 오는 브랜드 설정 ──────────────────
const brand = {
  name: "@money_rookie",
  primary: "#1A1A2E", // 배경
  accent: "#E94560",  // 포인트(브랜드 컬러)
  light: "#F5F5F7",
  font: "Apple SD Gothic Neo, AppleGothic, sans-serif",
};

// ── 2) "사회초년생 재테크" 주제로 AI가 생성했다고 가정한 카드 덱 ──
const deck = {
  topic: "사회초년생이 첫 월급에서 꼭 해야 할 3가지",
  slides: [
    { kind: "cover", kicker: "첫 월급 가이드", title: "첫 월급,\n이것부터 하세요", sub: "사회초년생 재테크 3단계" },
    { kind: "body", index: "01", head: "비상금 통장 분리", body: "월급의 10%를 자동이체로\n'못 건드리는' 통장에 모으세요." },
    { kind: "body", index: "02", head: "고정지출 자동화", body: "월세·구독료는 월급일\n다음날 자동결제로 묶어두기." },
    { kind: "outro", title: "더 알고 싶다면?", sub: "댓글에 '가이드' 라고 남기면\nDM으로 체크리스트를 보내드려요", cta: "💬 댓글: 가이드" },
  ],
};

// ── 3) 텍스트 줄바꿈 헬퍼 (SVG는 자동 줄바꿈이 없어서 직접 처리) ──
function wrap(text, maxChars) {
  const out = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of para) {
      if (line.length >= maxChars) { out.push(line); line = ""; }
      line += ch;
    }
    out.push(line);
  }
  return out;
}

function tspans(lines, x, startY, lineH) {
  return lines
    .map((l, i) => `<tspan x="${x}" y="${startY + i * lineH}">${escapeXml(l)}</tspan>`)
    .join("");
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

// ── 4) 슬라이드 1장 -> SVG (인스타 4:5 = 1080x1350) ──
const W = 1080, H = 1350;

function slideSVG(s, pageNo, total) {
  const bg = `<rect width="${W}" height="${H}" fill="${brand.primary}"/>`;
  const bar = `<rect x="0" y="0" width="16" height="${H}" fill="${brand.accent}"/>`;
  const footer = `
    <text x="80" y="${H - 70}" font-family="${brand.font}" font-size="30" fill="${brand.light}" opacity="0.6">${brand.name}</text>
    <text x="${W - 80}" y="${H - 70}" font-family="${brand.font}" font-size="30" fill="${brand.light}" opacity="0.6" text-anchor="end">${pageNo} / ${total}</text>`;
  const aiLabel = `<text x="80" y="80" font-family="${brand.font}" font-size="24" fill="${brand.light}" opacity="0.45">AI 생성 · 검수됨</text>`;

  let body = "";
  if (s.kind === "cover") {
    body = `
      <text font-family="${brand.font}" font-size="34" font-weight="700" fill="${brand.accent}" letter-spacing="2">
        ${tspans([s.kicker], 80, 360, 0)}
      </text>
      <text font-family="${brand.font}" font-size="96" font-weight="800" fill="${brand.light}">
        ${tspans(wrap(s.title, 8), 80, 500, 120)}
      </text>
      <text font-family="${brand.font}" font-size="40" fill="${brand.light}" opacity="0.8">
        ${tspans(wrap(s.sub, 18), 80, 820, 56)}
      </text>`;
  } else if (s.kind === "body") {
    body = `
      <text font-family="${brand.font}" font-size="140" font-weight="800" fill="${brand.accent}" opacity="0.9">
        ${tspans([s.index], 80, 420, 0)}
      </text>
      <text font-family="${brand.font}" font-size="64" font-weight="800" fill="${brand.light}">
        ${tspans(wrap(s.head, 12), 80, 560, 80)}
      </text>
      <text font-family="${brand.font}" font-size="44" fill="${brand.light}" opacity="0.85">
        ${tspans(wrap(s.body, 16), 80, 720, 64)}
      </text>`;
  } else if (s.kind === "outro") {
    body = `
      <text font-family="${brand.font}" font-size="72" font-weight="800" fill="${brand.light}">
        ${tspans(wrap(s.title, 12), 80, 480, 90)}
      </text>
      <text font-family="${brand.font}" font-size="42" fill="${brand.light}" opacity="0.85">
        ${tspans(wrap(s.sub, 18), 80, 640, 60)}
      </text>
      <rect x="80" y="850" width="520" height="110" rx="55" fill="${brand.accent}"/>
      <text x="340" y="920" font-family="${brand.font}" font-size="46" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(s.cta)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${bg}${bar}${aiLabel}${body}${footer}
  </svg>`;
}

// ── 5) 렌더 실행: 각 슬라이드 PNG 저장 ──
(async () => {
  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const total = deck.slides.length;
  const files = [];
  for (let i = 0; i < total; i++) {
    const svg = slideSVG(deck.slides[i], i + 1, total);
    const file = path.join(outDir, `slide_${i + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(file);
    files.push(file);
  }
  console.log(`✅ 카드뉴스 ${total}장 렌더 완료 (주제: "${deck.topic}")`);
  files.forEach((f) => console.log("   -", path.relative(process.cwd(), f)));
  console.log("\n다음 단계: 이 PNG들을 스토리지에 올리고 그 URL을 인스타 캐러셀 발행 API에 넘기면 됩니다.");
})();
