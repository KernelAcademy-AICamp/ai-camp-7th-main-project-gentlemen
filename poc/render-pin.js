// 디저트 카드뉴스 — 핀터레스트 에디토리얼 감성 렌더러 (Playwright)
// album/playlist의 "앱 UI"(점·뱃지·진행바)를 걷어내고, 잡지/무드보드 느낌으로:
//   크림 톤 배경 · 명조(세리프) 타이포 · 풀블리드 사진 · 통일된 따뜻한 필름 보정 · 여백.
// 사진은 여전히 '생성'이 아니라 '실존 자산 가져오기'. 소스 4모드 동일.
//
// 실행:  node render-pin.js <컨셉> <deck> [mealdb|local|pexels|none]
// 예:    node render-pin.js concepts/dessert.json decks/dessert-album.json mealdb
//        node render-pin.js concepts/dessert.json decks/dessert-album.json local   ← 내 사진 버전
// 출력:  out/dessert/pin-<SOURCE>/slide_N.png

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(function loadEnv() {
  const p = path.join(__dirname, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
})();

const conceptFile = process.argv[2], deckFile = process.argv[3];
const SOURCE = (process.argv[4] || "mealdb").toLowerCase();
if (!conceptFile || !deckFile) { console.error("사용법: node render-pin.js <컨셉> <deck> [mealdb|local|pexels|none]"); process.exit(1); }
const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));

const W = 1080, H = 1350;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 핀터레스트 디저트 무드 — 크림/에스프레소/뮤트 테라코타
const C = {
  cream: "#F3EADD", cream2: "#EBDFCE", paper: "#F7F0E6",
  ink: "#43352A", inkSoft: "#6E5A49", line: "#D8C9B4",
  accent: "#B07A4E",           // 뮤트 카라멜
  name: concept.account,
};

// ── 사진 소스(4모드) ──
async function mealdb(query) {
  try {
    const j = await (await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(query))).json();
    const hit = j.meals && j.meals[0];
    if (hit) return { img: hit.strMealThumb };
  } catch (_) {}
  return { img: null };
}
async function pexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return { img: null, skip: true };
  try {
    const j = await (await fetch("https://api.pexels.com/v1/search?per_page=1&query=" + encodeURIComponent(query + " dessert"), { headers: { Authorization: key } })).json();
    const hit = j.photos && j.photos[0];
    if (hit) return { img: hit.src.large2x || hit.src.large };
  } catch (_) {}
  return { img: null };
}
function local(idx) {
  const dir = path.join(__dirname, "assets", "dessert");
  // setContent 페이지는 file:// 하위리소스를 못 읽음(보안) + 경로에 공백/한글 → data URI로 임베드.
  const mime = { jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp" };
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const f = path.join(dir, String(idx).padStart(2, "0") + "." + ext);
    if (fs.existsSync(f)) return { img: `data:image/${mime[ext]};base64,` + fs.readFileSync(f).toString("base64") };
  }
  return { img: null };
}
async function getImg(slide, bodyIdx) {
  const q = slide.query || slide.head;
  if (SOURCE === "none") return { img: null };
  if (SOURCE === "local") return local(bodyIdx);
  if (SOURCE === "pexels") return await pexels(q);
  return await mealdb(q);
}

function fonts() {
  return `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=Gowun+Batang:wght@400;700&family=Playfair+Display:ital@0;1&display=swap');`;
}
function css() {
  return `
  ${fonts()}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${W}px;height:${H}px;}
  .card{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${C.paper};
        color:${C.ink};font-family:'Noto Serif KR',serif;}
  /* 사진 공통: 따뜻한 필름 보정 + 통일 틴트로 무드 일관 */
  .shot{position:relative;overflow:hidden;background:${C.cream2};}
  .shot .img{position:absolute;inset:0;background-size:cover;background-position:center;
             filter:saturate(1.06) contrast(1.03) brightness(1.02);}
  .shot .tint{position:absolute;inset:0;mix-blend-mode:multiply;
              background:linear-gradient(180deg,rgba(176,122,78,0.10),rgba(120,84,58,0.16));}
  .shot .grain{position:absolute;inset:0;opacity:0.05;
    background-image:radial-gradient(rgba(0,0,0,.6) 1px,transparent 1px);background-size:3px 3px;}
  .ph{display:flex;align-items:center;justify-content:center;font-size:150px;background:${C.cream2};color:${C.accent}88;}

  .label{font-family:'Playfair Display',serif;font-style:italic;color:${C.accent};}
  .kicker{font-size:26px;letter-spacing:9px;text-transform:uppercase;color:${C.accent};font-family:'Noto Serif KR',serif;}
  .sign{position:absolute;left:0;right:0;bottom:48px;text-align:center;font-size:24px;letter-spacing:4px;
        color:${C.inkSoft};text-transform:uppercase;font-family:'Playfair Display',serif;}

  /* COVER — 풀블리드 히어로 + 크림 하단 + 얇은 키라인 프레임 */
  .cover .hero{position:absolute;inset:0;}
  .cover .hero .shot{position:absolute;inset:0;width:100%;height:100%;}
  .cover .scrim{position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(60,40,28,0.18) 0%,rgba(60,40,28,0) 35%,rgba(40,28,20,0.62) 100%);}
  .cover .frame{position:absolute;inset:46px;border:1.5px solid rgba(247,240,230,0.7);border-radius:6px;pointer-events:none;}
  .cover .cap{position:absolute;left:96px;right:96px;bottom:150px;color:${C.paper};}
  .cover .kicker{color:rgba(247,240,230,0.92);}
  .cover h1{font-size:108px;font-weight:700;line-height:1.14;letter-spacing:-1px;margin-top:26px;
            text-shadow:0 4px 26px rgba(30,18,10,0.45);text-wrap:balance;}
  .cover .sub{font-size:38px;margin-top:22px;opacity:0.92;font-weight:400;line-height:1.45;}
  .cover .sign{color:rgba(247,240,230,0.8);}

  /* BODY — 잡지 레시피 카드: 사진(위) + 크림 카피(아래) */
  .body{padding:70px 76px 0;background:${C.paper};display:flex;flex-direction:column;}
  .body .num{font-family:'Playfair Display',serif;font-size:40px;color:${C.accent};letter-spacing:2px;}
  .body .head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:26px;}
  .body .kk{font-size:24px;letter-spacing:7px;text-transform:uppercase;color:${C.inkSoft};}
  .body .shot{width:100%;height:720px;border-radius:20px;box-shadow:0 26px 54px rgba(67,53,42,0.20);}
  .body .title{font-size:74px;font-weight:700;line-height:1.14;letter-spacing:-1px;margin-top:46px;}
  .body .rule{width:64px;height:2px;background:${C.accent};margin:30px 0 26px;opacity:0.8;}
  .body .reason{font-family:'Gowun Batang',serif;font-size:39px;line-height:1.62;color:${C.inkSoft};max-width:880px;}

  /* OUTRO — 크림 종이 + 중앙 정렬 + 부드러운 CTA */
  .outro{background:${C.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;
         text-align:center;padding:0 120px;}
  .outro .deco{font-family:'Playfair Display',serif;font-style:italic;font-size:46px;color:${C.accent};margin-bottom:24px;}
  .outro h2{font-size:84px;font-weight:700;line-height:1.2;letter-spacing:-1px;text-wrap:balance;}
  .outro .sub{font-family:'Gowun Batang',serif;font-size:40px;line-height:1.6;color:${C.inkSoft};margin-top:30px;}
  .outro .cta{margin-top:54px;border:1.5px solid ${C.accent};color:${C.accent};font-size:40px;font-weight:500;
              padding:24px 52px;border-radius:999px;letter-spacing:1px;}`;
}

function shot(img, ph) {
  if (!img) return `<div class="shot ph">${ph || "🍰"}</div>`;
  return `<div class="shot"><div class="img" style="background-image:url('${img}')"></div><div class="tint"></div><div class="grain"></div></div>`;
}

function slideHTML(s, p, total, arts) {
  if (s.kind === "cover") {
    const hero = arts.filter(Boolean)[0];
    return `<div class="card cover">
      <div class="hero">${shot(hero)}</div>
      <div class="scrim"></div><div class="frame"></div>
      <div class="cap">
        <div class="kicker">${esc(s.kicker)}</div>
        <h1>${esc(s.title).replace(/\n/g, "<br>")}</h1>
        <div class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</div>
      </div>
      <div class="sign">${esc(C.name)}</div></div>`;
  }
  if (s.kind === "body") {
    const art = arts[p - 1];
    return `<div class="card body">
      <div class="head"><span class="kk">오늘의 픽</span><span class="num">${esc(s.index)}</span></div>
      ${shot(art)}
      <div class="title">${esc(s.head)}</div>
      <div class="rule"></div>
      <div class="reason">${esc(s.body).replace(/\n/g, "<br>")}</div>
      <div class="sign" style="color:${C.inkSoft}">${esc(C.name)}</div></div>`;
  }
  return `<div class="card outro">
    <div class="deco">~</div>
    <h2>${esc(s.title).replace(/\n/g, "<br>")}</h2>
    <div class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</div>
    <div class="cta">${esc(s.cta)}</div>
    <div class="sign" style="color:${C.inkSoft}">${esc(C.name)}</div></div>`;
}

(async () => {
  const total = deck.slides.length;
  console.log(`🔎 사진 소스: ${SOURCE}`);
  const arts = []; let got = 0, bodyCount = 0, bodyIdx = 0, skip = false;
  for (const s of deck.slides) {
    if (s.kind === "body") {
      bodyIdx++; bodyCount++;
      const r = await getImg(s, bodyIdx);
      arts.push(r.img); if (r.skip) skip = true;
      if (SOURCE !== "none") console.log(`   ${r.img ? "✅" : "❌"} ${s.head}${r.img ? "" : " (사진 없음)"}`);
      if (r.img) got++;
    } else arts.push(null);
  }
  if (skip) console.log("   ⚠️ PEXELS_API_KEY 없음 → poc/.env 에 키 필요.");
  if (SOURCE === "local" && got === 0) console.log("   ⚠️ assets/dessert/01.jpg … 에 사진을 넣어주세요.");
  const bodyArts = arts.filter(Boolean);
  // 커버 전용 히어로: local 모드는 00.* 우선, 없으면 첫 본문 사진으로 폴백
  const coverHero = (SOURCE === "local" ? local(0).img : null) || bodyArts[0] || null;

  const dir = path.join(__dirname, "out", "dessert", "pin-" + SOURCE);
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
  console.log(`\n✅ 핀터레스트풍 디저트 카드 ${total}장 렌더 완료 (사진 ${got}/${bodyCount})`);
  console.log(`   - out/dessert/pin-${SOURCE}/slide_1~${total}.png`);
})();
