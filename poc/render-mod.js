// 디저트/맛집 카드뉴스 — 모던 3스타일 렌더러 (Playwright + Pretendard)
// 명조/베이지 폐기. 요즘 인스타 감성(모던·미니멀)으로 3개 레인 제시 → 하나 고르기.
//   minimal : 화이트 여백 + 큰 사진 + 깔끔한 산세리프 (언더스테이트)
//   mag     : 하이콘트라스트 볼드 매거진 + 강조색 + 풀블리드 헤드라인
//   dark    : 시크 차콜 + 골드 포인트 + 풀블리드 사진
// 폰트 Pretendard(요즘 한국 디자인 표준). 사진은 실사 자산(base64 임베드).
//
// 실행:  node render-mod.js <컨셉> <deck> <minimal|mag|dark> [local|mealdb|none]
// 예:    node render-mod.js concepts/dessert.json decks/foodtour-v2.json minimal local
// 출력:  out/dessert/mod-<STYLE>/slide_N.png

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const conceptFile = process.argv[2], deckFile = process.argv[3];
const STYLE = (process.argv[4] || "minimal").toLowerCase();
const SOURCE = (process.argv[5] || "local").toLowerCase();
if (!conceptFile || !deckFile) { console.error("사용법: node render-mod.js <컨셉> <deck> <minimal|mag|dark> [local|mealdb|none]"); process.exit(1); }
const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const NAME = concept.account;
const W = 1080, H = 1350;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const br = (s) => esc(s).replace(/\n/g, "<br>");

// ── 사진 소스 ──
async function mealdb(q) { try { const j = await (await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(q))).json(); const h = j.meals && j.meals[0]; if (h) return { img: h.strMealThumb }; } catch (_) {} return { img: null }; }
function local(idx) {
  const dir = path.join(__dirname, "assets", "dessert"); const mime = { jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp" };
  for (const ext of ["jpg", "jpeg", "png", "webp"]) { const f = path.join(dir, String(idx).padStart(2, "0") + "." + ext); if (fs.existsSync(f)) return { img: `data:image/${mime[ext]};base64,` + fs.readFileSync(f).toString("base64") }; }
  return { img: null };
}
async function getImg(slide, bodyIdx) {
  if (SOURCE === "none") return { img: null };
  if (SOURCE === "local") return local(bodyIdx);
  return await mealdb(slide.query || slide.head);
}

// ── 스타일별 팔레트 ──
const STYLES = {
  minimal: { bg: "#FFFFFF", ink: "#111111", sub: "#9A9A9A", accent: "#111111", coverInk: "#141414", kicker: "#8A8A8A",
    scrim: "linear-gradient(180deg,rgba(255,255,255,0) 42%,rgba(255,255,255,0.96) 100%)",
    radius: 22, weight: 800, filter: "saturate(1.04) contrast(1.02)",
    idxSize: 28, idxColor: "#B5B5B5", idxWeight: 700, ruleW: 56,
    ctaBg: "#111111", ctaInk: "#FFFFFF", ctaBorder: "none", sign: "#BdBdBd" },
  mag: { bg: "#FFFFFF", ink: "#0A0A0A", sub: "#6B6B6B", accent: "#FF3D2E", coverInk: "#FFFFFF", kicker: "#FF3D2E",
    scrim: "linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,0.62) 100%)",
    radius: 0, weight: 900, filter: "saturate(1.07) contrast(1.05)",
    idxSize: 72, idxColor: "#FF3D2E", idxWeight: 900, ruleW: 80,
    ctaBg: "#FF3D2E", ctaInk: "#FFFFFF", ctaBorder: "none", sign: "#9A9A9A" },
  dark: { bg: "#131217", ink: "#F4F4F6", sub: "#9FA0AA", accent: "#E6B95C", coverInk: "#FFFFFF", kicker: "#E6B95C",
    scrim: "linear-gradient(180deg,rgba(19,18,23,0) 28%,rgba(19,18,23,0.88) 100%)",
    radius: 22, weight: 800, filter: "saturate(1.03) brightness(0.99)",
    idxSize: 34, idxColor: "#E6B95C", idxWeight: 800, ruleW: 60,
    ctaBg: "transparent", ctaInk: "#E6B95C", ctaBorder: "1.5px solid #E6B95C", sign: "#5C5C66" },
};
const v = STYLES[STYLE] || STYLES.minimal;

function css() {
  return `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${W}px;height:${H}px;}
  .card{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${v.bg};color:${v.ink};
        font-family:'Pretendard',sans-serif;-webkit-font-smoothing:antialiased;}
  .shot{position:relative;overflow:hidden;background:#eee;}
  .shot .img{position:absolute;inset:0;background-size:cover;background-position:center;filter:${v.filter};}
  .ph{display:flex;align-items:center;justify-content:center;font-size:140px;background:#e7e7e7;}
  .sign{position:absolute;left:0;right:0;bottom:46px;text-align:center;font-size:22px;letter-spacing:3px;
        color:${v.sign};font-weight:500;}

  /* COVER (풀블리드 + 하단 페이드 + 캡션) */
  .cover .hero,.cover .hero .shot{position:absolute;inset:0;width:100%;height:100%;}
  .cover .scrim{position:absolute;inset:0;background:${v.scrim};}
  .cover .cap{position:absolute;left:90px;right:90px;bottom:140px;color:${v.coverInk};}
  .cover .kicker{font-size:25px;font-weight:700;letter-spacing:6px;color:${v.kicker};margin-bottom:24px;}
  .cover h1{font-size:98px;font-weight:${v.weight};line-height:1.12;letter-spacing:-2.5px;}
  .cover .sub{margin-top:24px;font-size:34px;font-weight:500;opacity:0.92;line-height:1.45;}
  .cover .sign{color:${STYLE === "minimal" ? "#9A9A9A" : "rgba(255,255,255,0.7)"};}

  /* BODY (사진 위 + 카피 아래) */
  .body{padding:78px 80px 0;display:flex;flex-direction:column;}
  .body .meta{display:flex;align-items:baseline;gap:20px;margin-bottom:30px;}
  .body .idx{font-size:${v.idxSize}px;font-weight:${v.idxWeight};color:${v.idxColor};letter-spacing:-1px;line-height:1;}
  .body .tag{font-size:24px;font-weight:600;letter-spacing:3px;color:${v.sub};text-transform:uppercase;}
  .body .shot{width:100%;height:680px;border-radius:${v.radius}px;
              box-shadow:${STYLE === "minimal" ? "0 20px 50px rgba(0,0,0,0.10)" : STYLE === "dark" ? "0 24px 60px rgba(0,0,0,0.5)" : "none"};}
  .body .title{font-size:66px;font-weight:${v.weight};line-height:1.14;letter-spacing:-2px;margin-top:42px;}
  .body .rule{width:${v.ruleW}px;height:3px;background:${v.accent};margin:26px 0 24px;border-radius:2px;}
  .body .copy{font-size:35px;font-weight:400;line-height:1.62;color:${v.sub};max-width:900px;}

  /* OUTRO (중앙 정렬) */
  .outro{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px;}
  .outro .deco{width:46px;height:4px;background:${v.accent};border-radius:2px;margin-bottom:34px;}
  .outro h2{font-size:80px;font-weight:${v.weight};line-height:1.18;letter-spacing:-2px;}
  .outro .sub{margin-top:30px;font-size:36px;font-weight:400;line-height:1.6;color:${v.sub};}
  .outro .cta{margin-top:50px;background:${v.ctaBg};color:${v.ctaInk};border:${v.ctaBorder};
              font-size:38px;font-weight:700;padding:24px 50px;border-radius:999px;letter-spacing:0.5px;}`;
}

function shotEl(img, full) {
  if (!img) return `<div class="shot ph">🍽️</div>`;
  return `<div class="shot"${full ? "" : ""}><div class="img" style="background-image:url('${img}')"></div></div>`;
}

function slideHTML(s, p, total, arts) {
  if (s.kind === "cover") {
    const hero = arts.filter(Boolean)[0];
    return `<div class="card cover">
      <div class="hero">${shotEl(hero, true)}</div><div class="scrim"></div>
      <div class="cap"><div class="kicker">${esc(s.kicker)}</div><h1>${br(s.title)}</h1><div class="sub">${br(s.sub)}</div></div>
      <div class="sign">${esc(NAME)}</div></div>`;
  }
  if (s.kind === "body") {
    const art = arts[p - 1];
    return `<div class="card body">
      <div class="meta"><span class="idx">${esc(s.index)}</span><span class="tag">${esc(s.tag || "")}</span></div>
      ${shotEl(art)}
      <div class="title">${esc(s.head)}</div><div class="rule"></div><div class="copy">${br(s.body)}</div>
      <div class="sign">${esc(NAME)}</div></div>`;
  }
  return `<div class="card outro">
    <div class="deco"></div><h2>${br(s.title)}</h2><div class="sub">${br(s.sub)}</div><div class="cta">${esc(s.cta)}</div>
    <div class="sign">${esc(NAME)}</div></div>`;
}

(async () => {
  const total = deck.slides.length;
  console.log(`🎨 스타일: ${STYLE} · 사진: ${SOURCE}`);
  const arts = []; let bodyIdx = 0, got = 0, bc = 0;
  for (const s of deck.slides) {
    if (s.kind === "body") { bodyIdx++; bc++; const r = await getImg(s, bodyIdx); arts.push(r.img); if (r.img) got++; if (SOURCE !== "none") console.log(`   ${r.img ? "✅" : "❌"} ${s.head}`); }
    else arts.push(null);
  }
  const bodyArts = arts.filter(Boolean);
  const coverHero = (SOURCE === "local" ? local(0).img : null) || bodyArts[0] || null;

  const dir = path.join(__dirname, "out", "dessert", "mod-" + STYLE);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (let i = 0; i < total; i++) {
    const artsForSlide = deck.slides[i].kind === "cover" ? [coverHero] : arts;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${slideHTML(deck.slides[i], i + 1, total, artsForSlide)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all(Array.from(document.images).map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))));
    await page.screenshot({ path: path.join(dir, `slide_${i + 1}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();
  console.log(`\n✅ ${STYLE} ${total}장 → out/dessert/mod-${STYLE}/slide_1~${total}.png (사진 ${got}/${bc})`);
})();
