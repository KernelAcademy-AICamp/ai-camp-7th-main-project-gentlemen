// 크론 라우트 공통 가드.
//  - CRON_SECRET 미설정  → 비활성(503). MVP 기본값(dark): 라우트는 존재하나 실행 안 됨.
//  - 설정됨 + 헤더 불일치 → 401. (아무나 크론 URL 을 때려도 실행 못 함)
//  - 설정됨 + 일치        → null(통과). Vercel Cron 이 Authorization: Bearer <CRON_SECRET> 를 보낸다.
//
// ⚠️ 이 라우트들은 아직 vercel.json 에 등록하지 않는다(=자동 실행 안 됨).
//    예약발행은 분단위 크론이 필요해 Vercel Pro 유료. 토큰갱신은 하루1회라 Hobby 무료 가능.
//    활성화 절차: ① CRON_SECRET 세팅 ② vercel.json crons 에 경로+스케줄 추가 ③ 재배포.
export function guardCron(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("cron disabled (CRON_SECRET 미설정)", { status: 503 });
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return null;
}
