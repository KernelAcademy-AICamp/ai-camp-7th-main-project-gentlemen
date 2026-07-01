import { mutateDB } from "@/lib/workspace/db";
import { guardCron } from "@/lib/workspace/cron";
import { publishCard } from "@/lib/workspace/ig";
import { findIgAccount } from "@/lib/workspace/types";

// ─────────────────────────────────────────────────────────────────────────────
// 예약발행 크론 — 예약 시각이 지난 모든 사용자의 예약 건을 발행한다(전 유저 스캔).
//
// 기존 /api/schedule GET 은 "로그인한 그 유저"의 밀린 예약만 즉석 처리하는 lazy 데모 워커라
// 아무도 접속 안 하면 발행되지 않는다. 이 라우트는 로그인과 무관하게 크론이 주기적으로
// 호출해 cross-user 로 처리한다. Redis/Railway 워커 없이 Vercel Cron 만으로 동작.
//
// 상태: dark(vercel.json 미등록 → 자동 실행 안 함). 활성화 = Vercel Pro(분단위 크론) 전환 후
//   CRON_SECRET 세팅 + vercel.json 에 { "path": "/api/cron/publish", "schedule": "* * * * *" } 추가.
// (수동 시연은 CRON_SECRET 세팅 후 Authorization: Bearer 로 직접 호출)
// ─────────────────────────────────────────────────────────────────────────────

// publishCard 는 미디어 준비 폴링으로 카드당 최대 ~18초 걸린다. 서버리스 함수 시간제한 안에서
// 안전하게 끝내려 한 번에 처리할 건수를 제한한다(나머지는 다음 크론 주기에 처리).
export const maxDuration = 60; // 초 (Vercel: Hobby 최대 60 / Pro 300)
const BATCH = 3; // 60초 / 카드당 ~18초 ≈ 3건

export async function GET(req: Request) {
  const denied = guardCron(req);
  if (denied) return denied;

  // 1) 예약 시각 도래 + 상태 "예약"인 건을 전 유저에서 수집(오래된 예약부터). 배치 상한 적용.
  const allDue = await mutateDB((db) =>
    db.publishJobs
      .filter((j) => j.status === "예약" && j.scheduledAt <= Date.now())
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .map((j) => ({ jobId: j.id, userId: j.userId }))
  );
  const due = allDue.slice(0, BATCH);
  const deferred = allDue.length - due.length; // 이번 주기에 못 넘긴 건수

  let published = 0;
  const errors: string[] = [];

  for (const { jobId, userId } of due) {
    const ctx = await mutateDB((db) => {
      const job = db.publishJobs.find((j) => j.id === jobId);
      const card = job ? db.cards.find((c) => c.id === job.cardId) : undefined;
      const user = db.users.find((u) => u.id === userId);
      return job && card && user ? { card, account: findIgAccount(user) } : null;
    });
    if (!ctx) continue;

    const result = await publishCard(ctx.card, ctx.account).catch((e: unknown) => {
      errors.push(`${jobId}: ${(e as Error).message}`);
      return null;
    });

    await mutateDB((db) => {
      const job = db.publishJobs.find((j) => j.id === jobId);
      const card = job ? db.cards.find((c) => c.id === job.cardId) : undefined;
      if (job && result) {
        job.status = "발행완료";
        job.publishedAt = result.publishedAt;
        job.igPermalink = result.permalink;
      }
      if (card && result) {
        card.status = "업로드완료";
        card.approvalLog.push({ at: Date.now(), actor: "scheduler", action: "예약 시각 도래 → 발행(cron)" });
        card.updatedAt = Date.now();
      }
    });
    if (result) published += 1;
  }

  if (deferred > 0) console.log(`[cron-publish] ${deferred}건은 다음 주기로 이월(배치 상한 ${BATCH})`);
  return Response.json({ scanned: due.length, published, deferred, errors });
}
