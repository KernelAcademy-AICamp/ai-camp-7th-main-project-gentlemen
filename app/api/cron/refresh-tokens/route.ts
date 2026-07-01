import { mutateDB } from "@/lib/workspace/db";
import { guardCron } from "@/lib/workspace/cron";
import { refreshLongLivedToken } from "@/lib/workspace/ig";
import { sealToken } from "@/lib/workspace/crypto";
import { isLiveAccount } from "@/lib/workspace/types";

// ─────────────────────────────────────────────────────────────────────────────
// IG 장기 토큰 자동 갱신 크론 — 만료(약 60일) 임박한 정식 계정 토큰을 미리 갱신한다.
// 갱신을 안 하면 60일 뒤 연동이 끊긴다(재로그인 필요). 하루 1회면 충분 → Hobby 무료 크론으로 가능.
//
// 상태: dark(vercel.json 미등록). 활성화 = CRON_SECRET 세팅 +
//   vercel.json 에 { "path": "/api/cron/refresh-tokens", "schedule": "0 3 * * *" } 추가(매일 새벽 3시).
// (Pro 불필요 — 분단위가 아니므로)
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 60; // 초 — 계정 수만큼 Graph 호출(각 ~1초)이라 여유
const RENEW_WINDOW_MS = 10 * 24 * 60 * 60 * 1000; // 만료 10일 이내면 갱신

export async function GET(req: Request) {
  const denied = guardCron(req);
  if (denied) return denied;

  // 갱신 대상: 정식(라이브) + instagram 로그인 + 만료 임박(or 만료시각 미상)
  const now = Date.now();
  const targets = await mutateDB((db) =>
    db.users.flatMap((u) =>
      u.igAccounts
        .filter(
          (a) =>
            isLiveAccount(a) &&
            a.loginType !== "facebook" &&
            (a.tokenExpiresAt === undefined || a.tokenExpiresAt - now <= RENEW_WINDOW_MS)
        )
        .map((a) => ({ userId: u.id, accountId: a.id, account: a }))
    )
  );

  let refreshed = 0;
  const errors: string[] = [];

  for (const t of targets) {
    try {
      const { accessToken, expiresAt } = await refreshLongLivedToken(t.account);
      const sealed = sealToken(accessToken);
      await mutateDB((db) => {
        const acc = db.users.find((u) => u.id === t.userId)?.igAccounts.find((a) => a.id === t.accountId);
        if (acc) {
          acc.accessToken = sealed;
          acc.tokenExpiresAt = expiresAt;
        }
      });
      refreshed += 1;
    } catch (e) {
      errors.push(`${t.accountId}: ${(e as Error).message}`);
    }
  }

  return Response.json({ scanned: targets.length, refreshed, errors });
}
