import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { withUser } from "@/lib/workspace/api";
import { buildAuthorizeUrl, igOAuthConfigured } from "@/lib/workspace/ig";

// 인스타 OAuth 시작 — "인스타로 로그인" 버튼이 이 주소로 이동한다.
//  0) redirect_uri 사전 점검 — 흔한 오설정(경로 오타·http·localhost)을 인스타의
//     'Invalid redirect_uri' 흰 화면 대신 /app/accounts?ig_error= 안내로 되돌린다.
//  1) CSRF 방지용 state 생성 → httpOnly 쿠키에 저장
//  2) 인스타 authorize 화면으로 리다이렉트
const CALLBACK_PATH = "/api/ig/oauth/callback";

export async function GET(req: Request) {
  const guard = await withUser();
  if ("res" in guard) return guard.res;

  const origin = new URL(req.url).origin;
  const guide = (msg: string) =>
    Response.redirect(new URL(`/app/accounts?ig_error=${encodeURIComponent(msg)}`, origin).toString(), 302);

  if (!igOAuthConfigured())
    return guide("인스타 앱 자격증명(IG_APP_ID/IG_APP_SECRET)이 설정되지 않았어요.");

  // 등록된 redirect_uri 와 정확히 일치해야 함. env 우선, 없으면 현재 출처로 유도.
  const redirectUri = process.env.IG_OAUTH_REDIRECT_URI || new URL(CALLBACK_PATH, origin).toString();

  // ── 사전 점검: 흔한 오설정을 미리 잡는다(인스타 에러 페이지 대신 앱 안내) ──
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    return guide(`IG_OAUTH_REDIRECT_URI 형식이 올바르지 않아요: ${redirectUri}`);
  }
  if (parsed.pathname !== CALLBACK_PATH)
    return guide(
      `redirect_uri 경로는 ${CALLBACK_PATH} 여야 해요(현재 ${parsed.pathname}). .env.local 의 IG_OAUTH_REDIRECT_URI 와 Meta 앱 등록값을 동일하게 맞춰주세요.`
    );
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" || isLocal)
    return guide(
      `인스타 로그인은 HTTPS 공개 주소가 필요해요(http·localhost는 인스타가 거부). ngrok 등 HTTPS 주소의 ${CALLBACK_PATH} 를 Meta 앱 'Valid OAuth Redirect URIs'에 등록하고, IG_OAUTH_REDIRECT_URI 를 같은 값으로 맞춰주세요. 지금은 '테스터(시뮬레이션)'로 먼저 사용할 수 있어요.`
    );

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("ig_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10분
  });

  return Response.redirect(buildAuthorizeUrl(redirectUri, state), 302);
}
