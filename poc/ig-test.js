// 인스타그램 연동·발행 테스트 (Instagram API with Instagram Login)
// 토큰이 준비되면 실행. 단계별로 안전하게 확인.
//
// 실행 예 (.env 사용 시):  node --env-file=.env ig-test.js <명령>
//   verify          연결 확인 (계정 정보/ user_id 출력)
//   stage-image     [안전] 단일 이미지 컨테이너 생성까지만 — 실제 게시 안 함
//   stage-carousel  [안전] 카드뉴스 컨테이너 생성까지만 — 실제 게시 안 함
//   post-image      ⚠️ 단일 이미지 실제 발행(공개 게시)
//   post-carousel   ⚠️ 카드뉴스(캐러셀) 실제 발행(공개 게시)
//
// 이미지 URL은 .env 의 IMAGE_URL / IMAGE_URLS 로 전달.
//
// ⚠️ 토큰은 절대 공개 저장소에 올리지 말 것. 환경변수로만 전달.

const BASE = "https://graph.instagram.com"; // Instagram Login 방식 호스트
const TOKEN = process.env.IG_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const cmd = process.argv[2] || "verify";

if (!TOKEN) {
  console.error("❌ IG_TOKEN 환경변수가 없습니다. STEP 5에서 받은 토큰을 넣어주세요.");
  process.exit(1);
}

async function api(path, params = {}, method = "GET") {
  const url = new URL(BASE + path);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const opts = { method };
  if (method === "GET") url.search = body.toString();
  else { opts.body = body; opts.headers = { "Content-Type": "application/x-www-form-urlencoded" }; }
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!res.ok || json.error) {
    console.error(`❌ API 오류 (${res.status}):`, JSON.stringify(json.error || json, null, 2));
    throw new Error("API call failed");
  }
  return json;
}

// 컨테이너가 발행 준비(FINISHED) 될 때까지 대기
async function waitFinished(creationId, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const s = await api(`/${creationId}`, { fields: "status_code" });
    if (s.status_code === "FINISHED") return true;
    if (s.status_code === "ERROR") throw new Error("컨테이너 처리 실패(ERROR)");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("컨테이너가 시간 내 FINISHED 되지 않음");
}

(async () => {
  try {
    // 1) 연결 확인 — 모든 명령 전에 공통
    const me = await api("/me", { fields: "user_id,username,account_type" });
    console.log("✅ 연결 성공! 계정 정보:");
    console.log("   사용자명 :", me.username);
    console.log("   계정유형 :", me.account_type, me.account_type === "BUSINESS" || me.account_type === "MEDIA_CREATOR" ? "(발행 가능)" : "(⚠️ 프로페셔널 전환 필요할 수 있음)");
    console.log("   user_id  :", me.user_id);

    if (cmd === "verify") {
      console.log("\n👉 연결 확인 완료. 발행을 테스트하려면 post-image 또는 post-carousel 로 실행하세요.");
      return;
    }

    const igId = USER_ID || me.user_id;

    // ── 안전 모드: 컨테이너 생성까지만(실제 게시 안 함) ──
    // 계정에 아무것도 안 올라감. 발행 파이프라인이 작동하는지만 검증.
    if (cmd === "stage-image") {
      const imageUrl = process.env.IMAGE_URL;
      if (!imageUrl) throw new Error("IMAGE_URL 환경변수가 필요합니다 (공개 접근 가능한 이미지 URL).");
      console.log("\n[1/2] 컨테이너 생성(게시 안 함)...");
      const c = await api(`/${igId}/media`, { image_url: imageUrl, caption: "Kup 스테이징 테스트" }, "POST");
      console.log("[2/2] 처리 대기(FINISHED)...");
      await waitFinished(c.id);
      console.log("✅ 컨테이너 준비 완료! (실제 게시 안 함) creation_id:", c.id);
      console.log("   → 이미지 URL 인식 + 처리까지 정상. 계정엔 아무것도 안 올라갔습니다.");
      return;
    }

    if (cmd === "stage-carousel") {
      const urls = (process.env.IMAGE_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (urls.length < 2) throw new Error("IMAGE_URLS 에 콤마로 구분된 2장 이상의 공개 이미지 URL이 필요합니다.");
      console.log(`\n[1/3] 자식 컨테이너 ${urls.length}개 생성...`);
      const children = [];
      for (const u of urls) {
        const c = await api(`/${igId}/media`, { image_url: u, is_carousel_item: "true" }, "POST");
        children.push(c.id);
        console.log("   - 슬라이드 컨테이너:", c.id);
      }
      console.log("[2/3] 부모 캐러셀 컨테이너 생성...");
      const parent = await api(`/${igId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption: "Kup 카드뉴스 스테이징 테스트" }, "POST");
      console.log("[3/3] 처리 대기(FINISHED)...");
      await waitFinished(parent.id);
      console.log("✅ 캐러셀 컨테이너 준비 완료! (실제 게시 안 함) creation_id:", parent.id);
      console.log("   → 카드 여러 장 인식 + 처리까지 정상. 계정엔 아무것도 안 올라갔습니다.");
      return;
    }

    if (cmd === "post-image") {
      const imageUrl = process.env.IMAGE_URL;
      if (!imageUrl) throw new Error("IMAGE_URL 환경변수가 필요합니다 (공개 접근 가능한 이미지 URL).");
      console.log("\n[1/3] 컨테이너 생성...");
      const c = await api(`/${igId}/media`, { image_url: imageUrl, caption: "Kup 테스트 게시물 · AI 생성/검수됨" }, "POST");
      console.log("[2/3] 처리 대기(FINISHED)...");
      await waitFinished(c.id);
      console.log("[3/3] 게시...");
      const pub = await api(`/${igId}/media_publish`, { creation_id: c.id }, "POST");
      console.log("✅ 단일 이미지 발행 성공! 게시물 ID:", pub.id);
      return;
    }

    if (cmd === "post-carousel") {
      const urls = (process.env.IMAGE_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (urls.length < 2) throw new Error("IMAGE_URLS 에 콤마로 구분된 2장 이상의 공개 이미지 URL이 필요합니다.");
      console.log(`\n[1/4] 자식 컨테이너 ${urls.length}개 생성...`);
      const children = [];
      for (const u of urls) {
        const c = await api(`/${igId}/media`, { image_url: u, is_carousel_item: "true" }, "POST");
        children.push(c.id);
        console.log("   - 슬라이드 컨테이너:", c.id);
      }
      console.log("[2/4] 부모 캐러셀 컨테이너 생성...");
      const parent = await api(`/${igId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption: "Kup 카드뉴스 테스트 · AI 생성/검수됨" }, "POST");
      console.log("[3/4] 처리 대기(FINISHED)...");
      await waitFinished(parent.id);
      console.log("[4/4] 게시...");
      const pub = await api(`/${igId}/media_publish`, { creation_id: parent.id }, "POST");
      console.log("✅ 카드뉴스(캐러셀) 발행 성공! 게시물 ID:", pub.id);
      return;
    }

    if (cmd === "delete-media") {
      const mediaId = process.env.MEDIA_ID || process.argv[3];
      if (!mediaId) throw new Error("MEDIA_ID 환경변수(또는 인자)가 필요합니다. 삭제할 게시물 ID.");
      console.log(`\n게시물 삭제 시도: ${mediaId}`);
      const url = new URL(`${BASE}/${mediaId}`);
      url.search = new URLSearchParams({ access_token: TOKEN }).toString();
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success === true || Object.keys(json).length === 0)) {
        console.log("✅ 삭제 성공 — API로 게시물 삭제됨:", JSON.stringify(json));
      } else {
        console.log(`⚠️ 삭제 실패/미지원 (HTTP ${res.status}):`, JSON.stringify(json.error || json, null, 2));
        console.log("   → 인스타 API가 미디어 삭제를 지원하지 않으면, 앱에서 수동 삭제해야 합니다.");
      }
      return;
    }

    console.error("알 수 없는 명령:", cmd, "(verify | stage-image | stage-carousel | post-image | post-carousel | delete-media)");
  } catch (e) {
    console.error("\n중단:", e.message);
    process.exit(1);
  }
})();
