// 카드뉴스 Playwright(HTML/CSS) 렌더러 — §8.3 "승급 경로 / 준비된 비상구" 실증·대비 코드
// 목적: 같은 deck을 HTML/CSS로 디자인 → 보이지 않는 브라우저(Chromium)로 스크린샷 → PNG.
//       SVG 대비 [자동 줄바꿈/text-balance/그림자/블러/flex정렬] 등 "디자인 자유도" 확보.
//
// ▶ 워커에서 쓰는 법(전환 시):  const { renderDeck } = require("./render-playwright");
//     await renderDeck({ concept, deck, outDir, sharedBrowser });  // 현행 render-deck.js와 동일 입력 호환
// ▶ CLI 테스트:  node render-playwright.js concepts/playlist.json decks/playlist-001.json
//     출력: out/playwright/slide_N.png  +  out/playwright/vs_slideN.png (SVG-A vs Playwright)

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { chromium } = require("playwright");

const W = 1080, H = 1350;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = (s) => esc(s).replace(/\n/g, "<br>");

// concept.visual → 브랜드 토큰
function brandOf(concept) {
  const v = concept.visual;
  return {
    name: concept.account,
    primary: v.primary, primary2: v.primary2 || v.primary,
    accent: v.accent, light: v.light, font: v.font,
  };
}

// ── 슬라이드 1장 → HTML 조각 (디자인은 전부 CSS가 담당) ──
function footer(b, p, total) {
  return `<div class="foot"><span class="ai">AI 생성 · 검수됨</span><span class="meta">${esc(b.name)} &nbsp;·&nbsp; ${p} / ${total}</span></div>`;
}
function slideHTML(b, s, p, total) {
  if (s.kind === "cover") {
    return `<div class="card cover">
      <span class="kicker">${esc(s.kicker)}</span>
      <h1 class="title">${nl(s.title)}</h1>
      <div class="rule"></div>
      <p class="sub">${nl(s.sub)}</p>
      ${footer(b, p, total)}
    </div>`;
  }
  if (s.kind === "body") {
    return `<div class="card body">
      <div class="bignum">${esc(s.index)}</div>
      <div class="content">
        <div class="idx">${esc(s.index)}</div>
        <h2 class="head">${nl(s.head)}</h2>
        <p class="text">${nl(s.body)}</p>
      </div>
      ${footer(b, p, total)}
    </div>`;
  }
  return `<div class="card outro">
    <h2 class="otitle">${nl(s.title)}</h2>
    <p class="sub">${nl(s.sub)}</p>
    <span class="cta">${esc(s.cta)}</span>
    ${footer(b, p, total)}
  </div>`;
}

function buildCss(b) {
  return `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; }
  .card {
    position:relative; width:${W}px; height:${H}px; overflow:hidden;
    font-family:${b.font}; color:${b.light};
    background:
      radial-gradient(900px 700px at 88% 8%, ${b.accent}38, transparent 60%),
      radial-gradient(800px 800px at 5% 100%, ${b.accent}22, transparent 55%),
      linear-gradient(135deg, ${b.primary} 0%, ${b.primary2} 100%);
    padding:120px 96px; display:flex; flex-direction:column;
  }
  /* 떠 있는 블러 오브 — SVG로는 번거로운 표현 */
  .card::after {
    content:""; position:absolute; width:520px; height:520px; right:-120px; top:120px;
    background:${b.accent}; opacity:0.18; border-radius:50%; filter:blur(90px);
  }
  .foot {
    position:absolute; left:96px; right:96px; bottom:72px;
    display:flex; justify-content:space-between; align-items:center;
    font-size:28px; color:${b.light}; opacity:0.5;
    border-top:1px solid ${b.light}33; padding-top:28px;
  }
  /* ── COVER ── */
  .cover { justify-content:center; }
  .kicker {
    align-self:flex-start; background:${b.accent}; color:#fff; font-weight:700;
    font-size:30px; padding:14px 30px; border-radius:999px; letter-spacing:1px;
    box-shadow:0 12px 30px ${b.accent}55;
  }
  .title {
    font-size:108px; font-weight:800; line-height:1.12; margin-top:40px;
    text-wrap:balance; letter-spacing:-1px;
    text-shadow:0 6px 30px rgba(0,0,0,0.25);
  }
  .rule { width:96px; height:8px; border-radius:4px; background:${b.accent}; margin:40px 0 36px; }
  .sub { font-size:42px; line-height:1.5; opacity:0.82; font-weight:400; max-width:760px; }
  /* ── BODY ── */
  .body { justify-content:center; }
  .bignum {
    position:absolute; right:40px; top:240px; font-size:420px; font-weight:800;
    color:${b.accent}; opacity:0.14; line-height:1;
  }
  .content { position:relative; z-index:2; }
  .idx {
    display:inline-flex; align-items:center; justify-content:center;
    width:88px; height:88px; border-radius:24px; background:${b.accent};
    color:#fff; font-size:46px; font-weight:800; box-shadow:0 14px 30px ${b.accent}55;
  }
  .head {
    font-size:74px; font-weight:800; line-height:1.18; margin:36px 0 28px;
    text-wrap:balance; letter-spacing:-1px;
  }
  .text {
    font-size:48px; line-height:1.55; opacity:0.86; max-width:820px;
    border-left:4px solid ${b.light}33; padding-left:32px;
  }
  /* ── OUTRO ── */
  .outro { justify-content:center; }
  .otitle { font-size:80px; font-weight:800; line-height:1.18; text-wrap:balance; letter-spacing:-1px; }
  .outro .sub { margin-top:32px; }
  .cta {
    align-self:flex-start; margin-top:56px; background:${b.accent}; color:#fff;
    font-size:46px; font-weight:700; padding:26px 48px; border-radius:999px;
    box-shadow:0 16px 40px ${b.accent}66;
  }`;
}

function pageHTML(b, css, s, p, total) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body>${slideHTML(b, s, p, total)}</body></html>`;
}

// ────────────────────────────────────────────────────────────────
// 재사용 렌더 함수 (워커 진입점) — 현행 render-deck.js와 동일 입력(concept, deck) 호환.
//   전환 시 호출부만 render-deck → renderDeck 으로 스왑하면 됨.
//   ⚠️ 프로덕션 주의: 브라우저 기동은 비싸다. 워커는 chromium.launch()를 1번만 하고
//      sharedBrowser로 주입해 재사용할 것. 동시성은 큐(BullMQ)로 제한. 카드마다 page만 새로 연다.
//   반환: 생성된 PNG 경로 배열.
// ────────────────────────────────────────────────────────────────
async function renderDeck({ concept, deck, outDir, sharedBrowser } = {}) {
  const b = brandOf(concept);
  const css = buildCss(b);
  fs.mkdirSync(outDir, { recursive: true });
  const total = deck.slides.length;
  const browser = sharedBrowser || (await chromium.launch());
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const files = [];
  try {
    for (let i = 0; i < total; i++) {
      await page.setContent(pageHTML(b, css, deck.slides[i], i + 1, total), { waitUntil: "networkidle" });
      const file = path.join(outDir, `slide_${i + 1}.png`);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
      files.push(file);
    }
  } finally {
    await page.close();
    if (!sharedBrowser) await browser.close();   // 주입받은 브라우저는 호출자가 닫는다
  }
  return files;
}

module.exports = { renderDeck, brandOf };

// ── 아래는 CLI 실행 시에만 동작(테스트·비교 시트). 워커가 require하면 실행 안 됨. ──
if (require.main === module) {
  (async () => {
    const conceptFile = process.argv[2], deckFile = process.argv[3];
    if (!conceptFile || !deckFile) {
      console.error("사용법: node render-playwright.js <컨셉파일> <deck파일>");
      process.exit(1);
    }
    const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
    const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
    const b = brandOf(concept);
    const dir = path.join(__dirname, "out", "playwright");
    await renderDeck({ concept, deck, outDir: dir });
    const total = deck.slides.length;

    // 비교 시트: SVG(A 현행, render-variants.js 산출물) vs Playwright
    const svgDir = path.join(__dirname, "out", "variants", "A_gradient");
    const haveSvg = fs.existsSync(svgDir);
    const cardW = 480, cardH = Math.round((H / W) * cardW), gap = 40, pad = 30, labelH = 56;
    for (let i = 0; i < total; i++) {
      const cols = [];
      if (haveSvg) cols.push({ label: "SVG (현행)", file: path.join(svgDir, `slide_${i + 1}.png`) });
      cols.push({ label: "Playwright (HTML/CSS)", file: path.join(dir, `slide_${i + 1}.png`) });
      const sheetW = pad * 2 + cols.length * cardW + (cols.length - 1) * gap;
      const sheetH = pad * 2 + labelH + cardH;
      const comp = [];
      let lab = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${labelH}">`;
      for (let j = 0; j < cols.length; j++) {
        const x = pad + j * (cardW + gap);
        const buf = await sharp(cols[j].file).resize(cardW, cardH).png().toBuffer();
        comp.push({ input: buf, left: x, top: pad + labelH });
        lab += `<text x="${x + cardW / 2}" y="${labelH - 16}" font-family="${b.font}" font-size="28" font-weight="700" fill="#222" text-anchor="middle">${esc(cols[j].label)}</text>`;
      }
      lab += `</svg>`;
      comp.push({ input: Buffer.from(lab), left: 0, top: pad });
      await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#ffffff" } })
        .composite(comp).png().toFile(path.join(dir, `vs_slide${i + 1}.png`));
    }

    console.log(`\n✅ [${deck.conceptId}] Playwright 렌더 완료 — ${total}장`);
    console.log(`   - out/playwright/slide_1~${total}.png`);
    console.log(`   - out/playwright/vs_slide1~${total}.png  (SVG vs Playwright 비교)`);
  })();
}
