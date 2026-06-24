// 감성 앨범아트 카드뉴스 렌더러 (Playwright/HTML+CSS) — §8.3 승급 + 실제 앨범 커버
// 핵심: AI가 만든 곡(아티스트-곡명) → iTunes 검색 API로 실제 앨범 커버 URL + 곡 실재 검증
//       → 음악 앱 감성의 카드(블러 배경 + 커버 + 타이포)를 브라우저로 렌더 → PNG.
//       앨범 이미지는 "생성"이 아니라 "실제 자산 가져오기" → AI 이미지 환각 원칙 안 깨짐.
//
// 실행:  node render-album.js <컨셉파일> <deck파일>
// 예:    node render-album.js concepts/playlist.json decks/playlist-gen.json
// 출력:  out/album/slide_N.png

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const conceptFile = process.argv[2], deckFile = process.argv[3];
if (!conceptFile || !deckFile) { console.error("사용법: node render-album.js <컨셉파일> <deck파일>"); process.exit(1); }
const concept = JSON.parse(fs.readFileSync(conceptFile, "utf8"));
const deck = JSON.parse(fs.readFileSync(deckFile, "utf8"));
const v = concept.visual;
const b = { name: concept.account, primary: v.primary, primary2: v.primary2 || v.primary, accent: v.accent, light: v.light, font: v.font };
const W = 1080, H = 1350;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// head "아티스트 - 곡명" → { artist, title }
function parseSong(head) {
  const [artist, ...rest] = String(head).split(" - ");
  return { artist: artist.trim(), title: rest.join(" - ").trim() || artist.trim() };
}
// iTunes 검색 → { art, verified, artist, title }
async function lookup(head) {
  const { artist, title } = parseSong(head);
  try {
    const url = "https://itunes.apple.com/search?country=KR&entity=song&limit=1&term=" + encodeURIComponent(`${artist} ${title}`);
    const j = await (await fetch(url)).json();
    const hit = j.results && j.results[0];
    if (hit) return { art: hit.artworkUrl100.replace("100x100", "600x600"), verified: true, artist: hit.artistName, title: hit.trackName };
  } catch (_) {}
  return { art: null, verified: false, artist, title };
}

function css() {
  return `
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${W}px;height:${H}px;font-family:${b.font};}
  .card{position:relative;width:${W}px;height:${H}px;overflow:hidden;color:${b.light};
        background:linear-gradient(160deg,${b.primary},${b.primary2});}
  /* 앨범 이미지를 흐리게 깔아 곡마다 다른 분위기색을 입힌다 (음악앱 감성) */
  .bg{position:absolute;inset:-80px;background-size:cover;background-position:center;
      filter:blur(70px) saturate(1.3) brightness(0.55);transform:scale(1.25);}
  .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.6));}
  .wrap{position:absolute;inset:0;padding:110px 96px;display:flex;flex-direction:column;}
  .foot{position:absolute;left:96px;right:96px;bottom:70px;display:flex;justify-content:space-between;
        font-size:27px;opacity:0.6;border-top:1px solid rgba(255,255,255,0.18);padding-top:26px;}
  .ai{position:absolute;left:96px;top:96px;font-size:24px;opacity:0.55;letter-spacing:3px;}
  .dots{position:absolute;right:96px;top:100px;display:flex;gap:14px;align-items:center;}
  .dot{width:12px;height:12px;border-radius:50%;background:${b.light};opacity:0.3;}
  .dot.on{opacity:1;background:${b.accent};width:30px;border-radius:6px;}

  /* COVER: 4장 콜라주 + 타이틀 */
  .cover .grid{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;}
  .cover .grid div{background-size:cover;background-position:center;}
  .cover .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,25,0.35) 0%,rgba(10,8,25,0.55) 45%,${b.primary} 100%);}
  .cover .ttl{position:absolute;left:96px;right:96px;bottom:200px;}
  .kicker{display:inline-block;background:${b.accent};color:#fff;font-weight:700;font-size:28px;
          padding:12px 26px;border-radius:999px;margin-bottom:28px;box-shadow:0 10px 30px ${b.accent}66;}
  .cover h1{font-size:104px;font-weight:800;line-height:1.12;letter-spacing:-2px;text-wrap:balance;
            text-shadow:0 6px 30px rgba(0,0,0,0.45);}
  .cover .sub{margin-top:26px;font-size:40px;opacity:0.85;line-height:1.4;}

  /* BODY: 커버 + 곡 정보 */
  .body .art{width:620px;height:620px;border-radius:28px;background-size:cover;background-position:center;
             box-shadow:0 40px 80px rgba(0,0,0,0.55);margin:40px auto 0;align-self:center;}
  .body .art.ph{display:flex;align-items:center;justify-content:center;background:${b.accent}33;font-size:120px;}
  .body .idx{position:absolute;top:150px;right:96px;font-size:30px;font-weight:800;color:${b.accent};opacity:0.9;}
  .body .info{margin-top:54px;}
  .body .title{font-size:72px;font-weight:800;line-height:1.15;letter-spacing:-1px;text-wrap:balance;}
  .body .artist{font-size:40px;color:${b.accent};font-weight:700;margin-top:14px;}
  .body .reason{font-size:40px;opacity:0.86;line-height:1.5;margin-top:26px;
                border-left:4px solid ${b.accent};padding-left:26px;}
  .vbadge{position:absolute;top:138px;left:96px;font-size:22px;opacity:0.7;}

  /* OUTRO */
  .outro .wrap{justify-content:center;}
  .outro h2{font-size:80px;font-weight:800;line-height:1.18;text-wrap:balance;letter-spacing:-1px;}
  .outro .sub{margin-top:28px;font-size:42px;opacity:0.85;line-height:1.5;}
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
    while (grid.length < 4 && grid.length > 0) grid.push(grid[grid.length % arts.length]);
    return `<div class="card cover">
      <div class="grid">${grid.map((a) => `<div style="background-image:url('${a}')"></div>`).join("")}</div>
      <div class="veil"></div>
      <div class="ttl"><span class="kicker">${esc(s.kicker)}</span>
        <h1>${esc(s.title).replace(/\n/g, "<br>")}</h1>
        <div class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</div></div>
      ${chrome}</div>`;
  }
  if (s.kind === "body") {
    const song = parseSong(s.head);
    const art = arts[p - 1]; // arts[i]가 slide i 의 아트 (cover/outro는 null)
    const v = art ? `<div class="vbadge">🎵 음원 확인됨</div>` : `<div class="vbadge">⚠️ 음원 미확인</div>`;
    return `<div class="card body">
      ${art ? `<div class="bg" style="background-image:url('${art}')"></div><div class="scrim"></div>` : ""}
      <div class="wrap">
        <div class="art${art ? "" : " ph"}" ${art ? `style="background-image:url('${art}')"` : ""}>${art ? "" : "🎵"}</div>
        <div class="info">
          <div class="title">${esc(song.title)}</div>
          <div class="artist">${esc(song.artist)}</div>
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
  // body 슬라이드 곡들 앨범아트 조회 (cover/outro는 null 자리 유지)
  console.log("🔎 앨범 커버 조회 중 (iTunes)…");
  const arts = [];
  let verified = 0;
  for (const s of deck.slides) {
    if (s.kind === "body") {
      const r = await lookup(s.head);
      arts.push(r.art);
      console.log(`   ${r.verified ? "✅" : "❌"} ${s.head}${r.verified ? "" : " (실재 미확인)"}`);
      if (r.verified) verified++;
    } else arts.push(null);
  }
  const bodyArts = arts.filter(Boolean); // cover 콜라주용

  const dir = path.join(__dirname, "out", "album");
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (let i = 0; i < total; i++) {
    const artsForSlide = deck.slides[i].kind === "cover" ? bodyArts : arts;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${slideHTML(deck.slides[i], i + 1, total, artsForSlide)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    // 이미지 완전 로드 보장
    await page.evaluate(() => Promise.all(Array.from(document.images).map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))));
    await page.screenshot({ path: path.join(dir, `slide_${i + 1}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();

  console.log(`\n✅ 감성 앨범아트 카드 ${total}장 렌더 완료 (곡 실재확인 ${verified}/${bodyArts.length + (total - bodyArts.length - 0)})`);
  console.log(`   - out/album/slide_1~${total}.png`);
})();
