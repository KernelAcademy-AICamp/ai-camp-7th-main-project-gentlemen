// 인스타그램 장기 토큰 자동 갱신 테스트 (Instagram API with Instagram Login)
// 60일짜리 장기 토큰을 refresh 엔드포인트로 "사용자 개입 없이" 연장할 수 있는지 검증.
// 성공 시 .env 의 IG_TOKEN 을 새 토큰으로 자동 덮어씀(실서비스의 token-refresh 잡 흉내).
//
// 실행 예 (.env 사용 시):  node --env-file=.env token-test.js
//
// ⚠️ 이 스크립트는 토큰을 "바꾼다". 호출하면 새 토큰을 받고 .env가 갱신된다.
//    (기존 토큰은 보통 원래 만료일까지 같이 살아있지만, 운영은 새 토큰으로 갈아끼우는 게 정석)
// ⚠️ 토큰은 절대 공개 저장소에 올리지 말 것.

const fs = require("fs");
const path = require("path");

const BASE = "https://graph.instagram.com"; // ig-test.js와 동일 호스트
const TOKEN = process.env.IG_TOKEN;
const ENV_PATH = path.join(__dirname, ".env");

if (!TOKEN) {
  console.error("❌ IG_TOKEN 환경변수가 없습니다.");
  process.exit(1);
}

async function api(path, params = {}) {
  const url = new URL(BASE + path);
  url.search = new URLSearchParams({ ...params }).toString();
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) {
    const e = json.error || json;
    const err = new Error(e.message || `HTTP ${res.status}`);
    err.detail = e;
    throw err;
  }
  return json;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

// .env 의 IG_TOKEN= 줄만 새 값으로 교체(나머지 줄 보존)
function overwriteEnvToken(newToken) {
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  const lines = raw.split("\n");
  let replaced = false;
  const out = lines.map((line) => {
    if (/^\s*IG_TOKEN\s*=/.test(line)) {
      replaced = true;
      return `IG_TOKEN=${newToken}`;
    }
    return line;
  });
  if (!replaced) out.push(`IG_TOKEN=${newToken}`);
  fs.writeFileSync(ENV_PATH, out.join("\n"));
  return replaced;
}

(async () => {
  try {
    // [1] 현재 토큰이 살아있는지 확인
    console.log("[1/4] 현재 토큰 확인...");
    const me = await api("/me", { fields: "user_id,username,account_type", access_token: TOKEN });
    console.log(`   ✅ 현재 토큰 유효 — @${me.username} (${me.account_type})`);

    // [2] 갱신(refresh) 호출 — 사용자 개입 없이 서버가 호출하는 바로 그것
    console.log("\n[2/4] 토큰 갱신 호출(refresh_access_token)...");
    const refreshed = await api("/refresh_access_token", {
      grant_type: "ig_refresh_token",
      access_token: TOKEN,
    });
    const newToken = refreshed.access_token;
    const expiresIn = refreshed.expires_in; // 초
    const days = Math.round(expiresIn / 86400);
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    console.log(`   ✅ 갱신 성공!`);
    console.log(`      새 토큰   : ${newToken.slice(0, 12)}…${newToken.slice(-6)} (길이 ${newToken.length})`);
    console.log(`      유효기간  : ${expiresIn}초 ≈ ${days}일`);
    console.log(`      새 만료일 : ${fmtDate(expiryDate)}`);
    console.log(`      바뀜 여부 : ${newToken === TOKEN ? "동일(값 변화 없음)" : "새 토큰으로 교체됨"}`);

    // [3] 새 토큰이 실제로 작동하는지 재확인
    console.log("\n[3/4] 새 토큰으로 재호출 검증...");
    const me2 = await api("/me", { fields: "username", access_token: newToken });
    console.log(`   ✅ 새 토큰 정상 작동 — @${me2.username}`);

    // [4] .env 자동 덮어쓰기 (실서비스의 'DB UPDATE'를 흉내)
    console.log("\n[4/4] .env 의 IG_TOKEN 자동 갱신...");
    const replaced = overwriteEnvToken(newToken);
    console.log(`   ✅ .env ${replaced ? "갱신 완료" : "에 IG_TOKEN 추가"} — 이후 발행/DM/인사이트 스크립트는 새 토큰 사용.`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 테스트6 통과: 토큰 자동 갱신 메커니즘 작동 확인.");
    console.log("   → 실서비스에선 이 호출을 매월 cron(token-refresh 잡)이 자동 수행하고,");
    console.log("     새 토큰을 ig_tokens.access_token_enc 에 암호화 UPDATE 하면 사용자 개입 0.");
  } catch (e) {
    console.error("\n❌ 중단:", e.message);
    if (e.detail) console.error("   상세:", JSON.stringify(e.detail, null, 2));
    console.error("\n   참고: 토큰이 만든 지 24시간 미만이거나 이미 만료됐으면 갱신이 거부됩니다.");
    console.error("        만료된 경우엔 자동 갱신 불가 → 사용자가 OAuth로 재연동해야 합니다.");
    process.exit(1);
  }
})();
