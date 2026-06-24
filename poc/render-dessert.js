// 디저트 앨범풍 카드뉴스 렌더러 (Playwright/HTML+CSS) — render-album.js의 디저트 버전.
// 핵심: 음악(곡→iTunes 앨범커버)과 같은 원리로, "AI가 제안한 디저트 → 실사 사진을 가져와"
//       블러 배경 + 메인 컷 + 타이포의 음악앱 감성 카드를 렌더한다. AI 이미지 '생성' 아님.
//
// 사진 소스 4종(SOURCE 인자):
//   mealdb : TheMealDB 무료·무키 실사 디저트 사진 + 실존 검증 (기본)
//   local  : 본인이 찍은 사진 assets/dessert/01.jpg, 02.jpg … (실제 계정 운영용 정답)
//   pexels : Pexels 스톡 실사 (poc/.env 에 PEXELS_API_KEY 필요)
//   none   : 사진 없이 그라데이션+타이포만
//
// 실행:  node render-dessert.js <컨셉파일> <deck파일> [SOURCE]
// 예:    node render-dessert.js concepts/dessert.json decks/dessert-album.json mealdb
// 출력:  out/dessert/<SOURCE>/slide_N.png

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

// .env 자동 로드(pexels 키용)
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
if (!conceptFile || !deckFile) { console.error("사용법: node render-dessert.js <컨셉파일> <deck파일> [mealdb|local|pexels|none]"); process.exit(1); }
const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));

// 앨범 무드(어두운 배경+밝은 글씨)는 사진 위에서 가장 잘 읽힌다 → 따뜻한 다크 팔레트로 통일.
const accent = concept.visual.accent || "#E84A82";
const b = { name: concept.account, primary: "#241319", primary2: "#3E2230", accent, light: "#FBF3EE", font: concept.visual.font };
const W = 1080, H = 1350;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── 사진 소스별 조회 → { img, verified } ──
async function mealdb(query) {
  try {
    const url = "https://www.themealdb.com/api/json/v1/1/search.php?s=" + encodeURIComponent(query);
    const j = await (await fetch(url)).json();
    const hit = j.meals && j.meals[0];
    if (hit) return { img: hit.strMealThumb, verified: true };
  } catch (_) {}
  return { img: null, verified: false };
}
async function pexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return { img: null, verified: false, skip: true };
  try {
    const url = "https://api.pexels.com/v1/search?per_page=1&query=" + encodeURIComponent(query + " dessert");
    const j = await (await fetch(url, { headers: { Authorization: key } })).json();
    const hit = j.photos && j.photos[0];
    if (hit) return { img: hit.src.large2x || hit.src.large, verified: true };
  } catch (_) {}
  return { img: null, verified: false };
}
function local(idx) {
  const dir = path.join(__dirname, "assets", "dessert");
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const f = path.join(dir, String(idx).padStart(2, "0") + "." + ext);
    if (fs.existsSync(f)) return { img: "file:///" + f.replace(/\\/g, "/"), verified: true };
  }
  return { img: null, verified: false };
}
async function getImg(slide, bodyIdx) {
  const q = slide.query || slide.head;
  if (SOURCE === "none") return { img: null, verified: false };
  if (SOURCE === "local") return local(bodyIdx);
  if (SOURCE === "pexels") return await pexels(q);
  return await mealdb(q);
}

function css() {
  return `
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${W}px;height:${H}px;font-family:${b.font};}
  .card{position:relative;width:${W}px;height:${H}px;overflow:hidden;color:${b.light};
        background:linear-gradient(160deg,${b.primary},${b.primary2});}
  .bg{position:absolute;inset:-80px;background-size:cover;background-position:center;
      filter:blur(70px) saturate(1.35) brightness(0.5);transform:scale(1.25);}
  .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.62));}
  .wrap{position:absolute;inset:0;padding:110px 96px;display:flex;flex-direction:column;}
  .foot{position:absolute;left:96px;right:96px;bottom:70px;display:flex;justify-content:space-between;
        font-size:27px;opacity:0.6;border-top:1px solid rgba(255,255,255,0.18);padding-top:26px;}
  .ai{position:absolute;left:96px;top:96px;font-size:24px;opacity:0.55;letter-spacing:3px;}
  .dots{position:absolute;right:96px;top:100px;display:flex;gap:14px;align-items:center;}
  .dot{width:12px;height:12px;border-radius:50%;background:${b.light};opacity:0.3;}
  .dot.on{opacity:1;background:${b.accent};width:30px;border-radius:6px;}
  .vbadge{position:absolute;top:138px;left:96px;font-size:22px;opacity:0.72;}

  /* COVER */
  .cover .grid{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;}
  .cover .grid div{background-size:cover;background-position:center;}
  .cover .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,8,12,0.35) 0%,rgba(20,8,12,0.55) 45%,${b.primary} 100%);}
  .cover.nophoto .veil{background:linear-gradient(160deg,${b.primary},${b.primary2});}
  .cover .ttl{position:absolute;left:96px;right:96px;bottom:200px;}
  .kicker{display:inline-block;background:${b.accent};color:#fff;font-weight:700;font-size:28px;
          padding:12px 26px;border-radius:999px;margin-bottom:28px;box-shadow:0 10px 30px ${b.accent}66;}
  .cover h1{font-size:104px;font-weight:800;line-height:1.12;letter-spacing:-2px;text-wrap:balance;
            text-shadow:0 6px 30px rgba(0,0,0,0.45);}
  .cover .sub{margin-top:26px;font-size:40px;opacity:0.88;line-height:1.4;}

  /* BODY */
  .body .art{width:680px;height:680px;border-radius:28px;background-size:cover;background-position:center;
             box-shadow:0 40px 80px rgba(0,0,0,0.55);margin:30px auto 0;align-self:center;}
  .body .art.ph{display:flex;align-items:center;justify-content:center;background:${b.accent}33;font-size:140px;}
  .body .idx{position:absolute;top:150px;right:96px;font-size:30px;font-weight:800;color:${b.accent};opacity:0.95;}
  .body .info{margin-top:52px;}
  .body .pick{display:inline-block;font-size:30px;color:${b.accent};font-weight:700;letter-spacing:1px;margin-bottom:14px;}
  .body .title{font-size:78px;font-weight:800;line-height:1.12;letter-spacing:-1px;text-wrap:balance;}
  .body .reason{font-size:40px;opacity:0.88;line-height:1.5;margin-top:26px;
                border-left:4px solid ${b.accent};padding-left:26px;}

  /* OUTRO */
  .outro .wrap{justify-content:center;}
  .outro h2{font-size:84px;font-weight:800;line-height:1.16;text-wrap:balance;letter-spacing:-1px;}
  .outro .sub{margin-top:28px;font-size:42px;opacity:0.88;line-height:1.5;}
  .cta{align-self:flex-start;margin-top:52px;background:${b.accent};color:#fff;font-size:46px;font-weight:700;
       padding:26px 50px;border-radius:999px;box-shadow:0 18px 44px ${b.accent}66;}`;
}

function dots(cur, total) {
  let s = '<div class="dots">';
  for (let i = 0; i < total; i++) s += `<div class="dot${i === cur ? " on" : ""}"></div>`;
  return s + "</div>";
}
function footer(p, total) {
  return `<div class="foot"><span>${esc(b.name)}</span><span>${p} / ${total}</span></div>`;
}

function slideHTML(s, p, total, arts) {
  const chrome = `<div class="ai">AI 생성 · 검수됨</div>${dots(p - 1, total)}${footer(p, total)}`;
  if (s.kind === "cover") {
    const grid = arts.filter(Boolean).slice(0, 4);
    while (grid.length < 4 && grid.length > 0) grid.push(grid[grid.length % grid.length]);
    const hasPhoto = grid.length > 0;
    return `<div class="card cover${hasPhoto ? "" : " nophoto"}">
      ${hasPhoto ? `<div class="grid">${grid.map((a) => `<div style="background-image:url('${a}')"></div>`).join("")}</div>` : ""}
      <div class="veil"></div>
      <div class="ttl"><span class="kicker">${esc(s.kicker)}</span>
        <h1>${esc(s.title).replace(/\n/g, "<br>")}</h1>
        <div class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</div></div>
      ${chrome}</div>`;
  }
  if (s.kind === "body") {
    const art = arts[p - 1];
    const v = SOURCE === "none" ? "" : (art ? `<div class="vbadge">🍰 메뉴 사진 확인</div>` : `<div class="vbadge">⚠️ 사진 미확인</div>`);
    return `<div class="card body">
      ${art ? `<div class="bg" style="background-image:url('${art}')"></div><div class="scrim"></div>` : ""}
      <div class="wrap">
        ${art ? `<div class="art" style="background-image:url('${art}')"></div>` : `<div class="art ph">🍰</div>`}
        <div class="info">
          <span class="pick">오늘의 픽</span>
          <div class="title">${esc(s.head)}</div>
          <div class="reason">${esc(s.body).replace(/\n/g, "<br>")}</div>
        </div>
      </div>
      <div class="idx">${esc(s.index)}</div>${v}${chrome}</div>`;
  }
  return `<div class="card outro">
    <div class="wrap"><h2>${esc(s.title).replace(/\n/g, "<br>")}</h2>
      <div class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</div>
      <span class="cta">${esc(s.cta)}</span></div>
    ${chrome}</div>`;
}

(async () => {
  const total = deck.slides.length;
  console.log(`🔎 사진 소스: ${SOURCE}`);
  const arts = [];
  let verified = 0, bodyCount = 0, skipped = false;
  let bodyIdx = 0;
  for (const s of deck.slides) {
    if (s.kind === "body") {
      bodyIdx++; bodyCount++;
      const r = await getImg(s, bodyIdx);
      arts.push(r.img);
      if (r.skip) skipped = true;
      if (SOURCE !== "none") console.log(`   ${r.img ? "✅" : "❌"} ${s.head}${r.img ? "" : " (사진 없음)"}`);
      if (r.img) verified++;
    } else arts.push(null);
  }
  if (skipped) console.log("   ⚠️ PEXELS_API_KEY 없음 → poc/.env 에 키를 넣어야 pexels 모드가 동작합니다.");
  if (SOURCE === "local" && verified === 0) console.log("   ⚠️ assets/dessert/01.jpg, 02.jpg … 에 사진을 넣어주세요.");
  const bodyArts = arts.filter(Boolean);

  const dir = path.join(__dirname, "out", "dessert", SOURCE);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (let i = 0; i < total; i++) {
    const artsForSlide = deck.slides[i].kind === "cover" ? bodyArts : arts;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${slideHTML(deck.slides[i], i + 1, total, artsForSlide)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => Promise.all(Array.from(document.images).map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))));
    await page.screenshot({ path: path.join(dir, `slide_${i + 1}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();
  console.log(`\n✅ 디저트 카드 ${total}장 렌더 완료 (사진 ${verified}/${bodyCount})`);
  console.log(`   - out/dessert/${SOURCE}/slide_1~${total}.png`);
})();
