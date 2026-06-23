// 인스타그램 댓글 → DM 자동화 (Instagram API with Instagram Login)
// 누군가 내 게시물에 댓글을 달면 → 그 사람에게 자동으로 DM(비공개 답장)을 보냅니다.
//
// 발행(ig-test.js)은 "내가 호출"이지만, 댓글→DM은 "인스타가 나를 호출"하는 구조라
// 계속 떠서 인스타의 웹훅(알림)을 받는 작은 서버가 필요합니다.
//
// 실행 예 (.env 사용 시):
//   node --env-file=.env ig-webhook.js           서버 실행 (웹훅 대기 + 실제 DM 발송)
//   node --env-file=.env ig-webhook.js dry-run   [안전] DM 실제 발송 안 함. 흐름/로그만 확인
//
// 로컬에서 인스타와 연결하려면 공개 HTTPS URL이 필요합니다 (cloudflared 사용):
//   1) brew install cloudflared
//   2) (다른 터미널) cloudflared tunnel --url http://localhost:3000
//      → https://xxxx.trycloudflare.com 주소가 나옵니다
//   3) 앱 대시보드 → Webhooks → Instagram →
//        콜백 URL:  https://xxxx.trycloudflare.com/webhook
//        Verify token: .env 의 VERIFY_TOKEN 과 동일하게 입력
//      → "comments" 필드 구독(Subscribe)
//
// ⚠️ 토큰/시크릿은 절대 공개 저장소에 올리지 말 것. 환경변수로만 전달.

const http = require("http");
const crypto = require("crypto");

const GRAPH = "https://graph.instagram.com/v21.0"; // Instagram Login 방식 호스트
const TOKEN = process.env.IG_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const APP_SECRET = process.env.IG_APP_SECRET;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PORT = process.env.PORT || 3000;
const KEYWORD = (process.env.DM_KEYWORD || "").trim(); // 비우면 모든 댓글에 반응
const DM_MESSAGE =
  process.env.DM_MESSAGE ||
  "안녕하세요! 댓글 감사합니다 🙌 자세한 안내 도와드릴게요. 잠시만 기다려 주세요!";

const DRY_RUN = process.argv[2] === "dry-run";

if (!TOKEN) {
  console.error("❌ IG_TOKEN 환경변수가 없습니다.");
  process.exit(1);
}
if (!VERIFY_TOKEN) {
  console.error("❌ VERIFY_TOKEN 환경변수가 없습니다. (아무 문자열이나 정해서 .env 에 넣고, 웹훅 등록 시 동일하게 입력)");
  process.exit(1);
}
if (!APP_SECRET) {
  console.warn("⚠️ IG_APP_SECRET 이 없어 웹훅 서명 검증을 건너뜁니다. (테스트는 되지만 운영에선 꼭 설정)");
}

// 이미 응답한 댓글 재처리 방지 (재시작하면 초기화 — PoC 수준)
const handled = new Set();

// 댓글에 대한 비공개 답장(DM) 발송 — Private Replies API
async function sendPrivateReply(commentId, text) {
  // access_token은 URL 쿼리로, 본문은 순수 JSON (검증된 방식)
  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(TOKEN)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(JSON.stringify(json.error || json));
  }
  return json;
}

// 댓글 1건 처리
async function handleComment(value) {
  const commentId = value.id;
  const text = value.text || "";
  const from = value.from || {};
  const fromId = from.id;
  const username = from.username || "(알수없음)";

  // 내 계정이 단 댓글은 무시 (무한루프 방지)
  if (fromId && USER_ID && String(fromId) === String(USER_ID)) {
    console.log(`↩︎  내 댓글 무시: "${text}"`);
    return;
  }
  // 중복 처리 방지
  if (handled.has(commentId)) {
    console.log(`↩︎  이미 처리한 댓글 무시: ${commentId}`);
    return;
  }
  // 키워드 필터 (DM_KEYWORD 가 설정된 경우에만 반응)
  if (KEYWORD && !text.toLowerCase().includes(KEYWORD.toLowerCase())) {
    console.log(`↩︎  키워드("${KEYWORD}") 미포함 댓글 무시: "${text}"`);
    return;
  }

  handled.add(commentId);
  console.log(`💬 댓글 수신 @${username}: "${text}" (comment_id: ${commentId})`);

  if (DRY_RUN) {
    console.log(`   [dry-run] 실제 발송 안 함. 보낼 DM 내용 → "${DM_MESSAGE}"`);
    return;
  }

  try {
    const r = await sendPrivateReply(commentId, DM_MESSAGE);
    console.log(`   ✅ DM 발송 성공:`, JSON.stringify(r));
  } catch (e) {
    console.error(`   ❌ DM 발송 실패:`, e.message);
    handled.delete(commentId); // 실패 시 재시도 가능하도록 해제
  }
}

// 웹훅 페이로드 처리 (object=instagram, entry[].changes[])
async function processWebhook(payload) {
  if (payload.object !== "instagram") return;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === "comments" && change.value) {
        await handleComment(change.value);
      }
    }
  }
}

// 서명 검증 (X-Hub-Signature-256: sha256=...)
function verifySignature(rawBody, signatureHeader) {
  if (!APP_SECRET) return true; // 시크릿 없으면 검증 생략 (경고는 위에서 함)
  if (!signatureHeader) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // 1) 웹훅 검증 (앱 대시보드에서 콜백 URL 등록 시 인스타가 호출)
  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ 웹훅 검증 성공 (challenge 응답)");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(challenge);
    } else {
      console.warn("⚠️ 웹훅 검증 실패 — VERIFY_TOKEN 불일치");
      res.writeHead(403).end("Forbidden");
    }
    return;
  }

  // 2) 이벤트 수신 (댓글 등)
  if (req.method === "POST" && url.pathname === "/webhook") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      if (!verifySignature(raw, req.headers["x-hub-signature-256"])) {
        console.warn("⚠️ 서명 검증 실패 — 요청 거부");
        res.writeHead(403).end("Forbidden");
        return;
      }
      // 인스타엔 즉시 200 응답 (재전송 방지), 처리는 비동기로
      res.writeHead(200).end("EVENT_RECEIVED");
      try {
        await processWebhook(JSON.parse(raw));
      } catch (e) {
        console.error("처리 중 오류:", e.message);
      }
    });
    return;
  }

  // 헬스체크
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200).end("ig-webhook ok");
    return;
  }

  res.writeHead(404).end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🚀 ig-webhook 서버 실행 중 — 포트 ${PORT}${DRY_RUN ? "  [dry-run 모드: 실제 DM 미발송]" : ""}`);
  console.log(`   콜백 경로: /webhook   (cloudflared 로 외부 노출 후 앱 대시보드에 등록)`);
  if (KEYWORD) console.log(`   키워드 필터: "${KEYWORD}" 포함 댓글에만 반응`);
  else console.log(`   키워드 필터: 없음 (모든 댓글에 반응)`);
});
