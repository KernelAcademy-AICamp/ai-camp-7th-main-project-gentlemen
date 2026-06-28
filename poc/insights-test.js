// 인스타그램 인사이트(성과지표) 수집 테스트 (Instagram API with Instagram Login)
// 전부 GET(읽기) 요청 — 계정에 아무것도 안 올라가고/안 바뀌고/안 지워짐. 100% 안전.
//
// 실행 예 (.env 사용 시):  node --env-file=.env insights-test.js <명령>
//   account   계정 단위 인사이트(팔로워·도달·조회수·프로필방문 등) 무엇이 내려오는지 탐지
//   media     최근 게시물 목록 + 게시물별 인사이트(도달·좋아요·댓글·저장·공유 등) 탐지
//   all       account + media 둘 다
//
// (선택) MEDIA_LIMIT 환경변수로 게시물 몇 개까지 볼지 지정. 기본 5.
//
// 목적: 이 계정/토큰에서 "실제로 어떤 지표 필드가 내려오는지" 확인하는 탐지 테스트.
//       지표를 하나씩 시도하며 되는 것(✅)/안 되는 것(❌+사유)을 표로 정리한다.
//
// ⚠️ 토큰은 절대 공개 저장소에 올리지 말 것. 환경변수로만 전달.

const BASE = "https://graph.instagram.com"; // Instagram Login 방식 호스트 (ig-test.js와 동일)
const TOKEN = process.env.IG_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const MEDIA_LIMIT = parseInt(process.env.MEDIA_LIMIT || "5", 10);
const cmd = process.argv[2] || "account";

if (!TOKEN) {
  console.error("❌ IG_TOKEN 환경변수가 없습니다. ig-test.js와 동일한 토큰을 .env에 넣어주세요.");
  process.exit(1);
}

// 던지는(throw) 호출 — 연결 확인 등 반드시 성공해야 하는 곳에 사용
async function api(path, params = {}) {
  const url = new URL(BASE + path);
  url.search = new URLSearchParams({ ...params, access_token: TOKEN }).toString();
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) {
    console.error(`❌ API 오류 (${res.status}):`, JSON.stringify(json.error || json, null, 2));
    throw new Error("API call failed");
  }
  return json;
}

// 조용한 호출 — 실패해도 throw 안 함. 지표 탐지용. { ok, json } 반환
async function tryApi(path, params = {}) {
  const url = new URL(BASE + path);
  url.search = new URLSearchParams({ ...params, access_token: TOKEN }).toString();
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || json.error) {
      const e = json.error || {};
      return { ok: false, reason: e.message || `HTTP ${res.status}`, code: e.code };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// 하나의 지표를 여러 파라미터 조합으로 시도 — 하나라도 성공하면 그 조합/값 반환
async function probeMetric(path, metric) {
  const variants = [
    { metric, metric_type: "total_value", period: "day" },
    { metric, period: "day" },
    { metric, metric_type: "total_value", period: "week" },
    { metric, metric_type: "total_value" },
    { metric, period: "lifetime" },
  ];
  let lastReason = "알 수 없음";
  for (const params of variants) {
    const r = await tryApi(path, params);
    if (r.ok && r.json.data && r.json.data.length) {
      const d = r.json.data[0];
      // 값 추출: total_value.value 또는 values[].value
      let value;
      if (d.total_value && d.total_value.value !== undefined) value = d.total_value.value;
      else if (d.values && d.values.length) value = d.values[d.values.length - 1].value;
      const usedPeriod = [params.period, params.metric_type].filter(Boolean).join("/");
      return { metric, ok: true, value, period: usedPeriod };
    }
    if (r.reason) lastReason = r.reason;
  }
  return { metric, ok: false, reason: lastReason };
}

function printTable(rows) {
  for (const r of rows) {
    if (r.ok) {
      const v = typeof r.value === "object" ? JSON.stringify(r.value) : r.value;
      console.log(`   ✅ ${r.metric.padEnd(24)} = ${v}   (${r.period})`);
    } else {
      console.log(`   ❌ ${r.metric.padEnd(24)} — ${r.reason}`);
    }
  }
}

// 계정 단위 인사이트 탐지
async function runAccount(igId) {
  console.log("\n━━━ 계정 단위 인사이트 ━━━");

  // 1) 프로필 기본 필드 — /me 또는 /{igId} 에서 직접 읽히는 값들
  console.log("\n[1] 프로필 기본 필드(직접 조회):");
  const fields = ["followers_count", "follows_count", "media_count"];
  for (const f of fields) {
    const r = await tryApi(`/${igId}`, { fields: f });
    if (r.ok && r.json[f] !== undefined) console.log(`   ✅ ${f.padEnd(24)} = ${r.json[f]}`);
    else console.log(`   ❌ ${f.padEnd(24)} — ${r.reason || "값 없음"}`);
  }

  // 2) 인사이트 엔드포인트 지표 — 하나씩 탐지
  console.log("\n[2] 인사이트 엔드포인트(/insights) 지표 탐지:");
  const metrics = [
    "reach", "views", "profile_views", "accounts_engaged",
    "total_interactions", "likes", "comments", "saves", "shares", "replies",
    "follower_count", "follows_and_unfollows", "profile_links_taps",
  ];
  const rows = [];
  for (const m of metrics) rows.push(await probeMetric(`/${igId}/insights`, m));
  printTable(rows);

  const okCount = rows.filter((r) => r.ok).length;
  console.log(`\n   → 인사이트 지표 ${rows.length}개 중 ${okCount}개 수집 가능.`);
  if (okCount === 0) {
    console.log("   ⚠️ 인사이트 지표가 0개입니다. 토큰에 instagram_business_manage_insights 권한이");
    console.log("      없을 가능성이 큽니다. 앱 대시보드에서 스코프 추가 후 토큰 재발급이 필요합니다.");
  }
}

// 게시물 단위 인사이트 탐지
async function runMedia(igId) {
  console.log("\n━━━ 게시물 단위 인사이트 ━━━");

  // 1) 최근 게시물 목록
  console.log(`\n[1] 최근 게시물 목록(최대 ${MEDIA_LIMIT}개):`);
  const list = await tryApi(`/${igId}/media`, {
    fields: "id,caption,media_type,media_product_type,timestamp,permalink",
    limit: String(MEDIA_LIMIT),
  });
  if (!list.ok) {
    console.log(`   ❌ 게시물 목록 조회 실패 — ${list.reason}`);
    return;
  }
  const items = list.json.data || [];
  if (!items.length) {
    console.log("   ⚠️ 게시물이 없습니다. 발행 테스트(ig-test.js post-*)로 먼저 게시물을 올린 뒤 다시 실행하세요.");
    return;
  }
  items.forEach((m, i) => {
    const cap = (m.caption || "").replace(/\n/g, " ").slice(0, 30);
    console.log(`   ${i + 1}. ${m.id}  [${m.media_type}/${m.media_product_type || "-"}]  ${m.timestamp}  "${cap}"`);
  });

  // 2) 게시물별 인사이트 지표 탐지
  console.log("\n[2] 게시물별 인사이트 지표 탐지:");
  const metrics = [
    "reach", "views", "likes", "comments", "saved", "shares",
    "total_interactions", "profile_visits", "follows", "profile_activity",
  ];
  for (const m of items) {
    console.log(`\n   ▸ 게시물 ${m.id} [${m.media_type}]`);
    const rows = [];
    for (const metric of metrics) rows.push(await probeMetric(`/${m.id}/insights`, metric));
    printTable(rows.map((r) => ({ ...r, metric: "  " + r.metric })));
  }
}

(async () => {
  try {
    // 연결 확인 — 모든 명령 공통 (ig-test.js와 동일)
    const me = await api("/me", { fields: "user_id,username,account_type" });
    console.log("✅ 연결 성공! 계정 정보:");
    console.log("   사용자명 :", me.username);
    console.log("   계정유형 :", me.account_type, me.account_type === "BUSINESS" || me.account_type === "MEDIA_CREATOR" ? "(프로페셔널 — 인사이트 가능)" : "(⚠️ 프로페셔널 전환 필요할 수 있음)");
    console.log("   user_id  :", me.user_id);

    const igId = USER_ID || me.user_id;

    if (cmd === "account") {
      await runAccount(igId);
    } else if (cmd === "media") {
      await runMedia(igId);
    } else if (cmd === "all") {
      await runAccount(igId);
      await runMedia(igId);
    } else {
      console.error("알 수 없는 명령:", cmd, "(account | media | all)");
      process.exit(1);
    }

    console.log("\n👉 탐지 완료. ✅로 표시된 지표가 이 계정/토큰에서 실제 수집 가능한 항목입니다.");
  } catch (e) {
    console.error("\n중단:", e.message);
    process.exit(1);
  }
})();
