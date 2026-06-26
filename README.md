# Kup

갓 시작한 1인 인플루언서를 위한 인스타 카드뉴스 AI. (제품 뼈대 — 작업트랙 Task 3)

> 스택 근거: [docs/tech/Kup_기술스택_개발계획.md](docs/tech/Kup_기술스택_개발계획.md) §7 ·
> 데이터모델: [docs/tech/Kup_데이터모델.md](docs/tech/Kup_데이터모델.md)

## 구조

```
app/        Next.js (App Router) — 검수 UI·대시보드. Vercel 배포
lib/        공통 모듈 (Vercel·워커 공유)
  env.ts             환경변수 zod 검증 (public vs server 분리)
  deck-schema.ts     Deck 데이터 계약(파이프라인 §1.2/1.3) — 생성·렌더·DB 공유
  sentry.ts          관측 스텁 (Phase 5에서 @sentry/nextjs 교체)
  supabase/          client(브라우저) · server(SSR) · admin(service_role)
  db/database.types.ts  DB 타입(임시 수기 → Task 6에서 supabase gen types 교체)
workers/    BullMQ 워커 — 발행·웹훅·인사이트. Railway 등 상시 서버 배포
  index.ts           엔트리(`npm run worker`)
  queue.ts           큐 정의 + Redis 연결 (데이터모델 §7)
  jobs/publish.ts    예약 발행 잡 스텁 (Phase 5에서 PoC ig-test 이식)
supabase/   로컬 CLI 설정 + 마이그레이션(0001 스키마 / 0002 RLS)
poc/        검증 완료 PoC (발행·DM·렌더). 제품 코드와 분리 유지
```

**프론트(Vercel) / 워커(Railway) 분리**: 같은 레포·같은 `lib/`를 공유하되 배포는 둘로.
Vercel은 `app/`만 빌드, Railway는 `npm run worker`로 BullMQ 프로세스 상시 가동.

## 개발

```bash
npm install
cp .env.example .env.local      # 키 채우기 (절대 커밋 금지)
npm run dev                     # 프론트+API  → http://localhost:3000
npm run worker:dev              # 워커(REDIS_URL 필요)
npm run typecheck && npm run lint
```

### Supabase (로컬)

```bash
# supabase CLI 설치 후
supabase start                  # 로컬 Postgres+Studio
supabase db reset               # 마이그레이션(0001/0002) 적용
# 원격: supabase link --project-ref <ref> && supabase db push
# 타입 재생성: supabase gen types typescript --local > lib/db/database.types.ts
```

## Task 3 범위 / 한계

- ✅ Next.js+Tailwind+TS(strict) 뼈대, `app/·lib/·workers/` 구조, lint, Sentry 스텁
- ✅ Supabase 로컬 CLI 설정 + 데이터모델 마이그레이션 초안(0001/0002)
- ⏳ **계정 필요(미수행)**: 원격 Supabase 프로젝트 생성, Vercel/Railway/Upstash 연결 — 키 발급 후 `.env.local`/호스트 시크릿에 주입
- ⏭ Task 4(LLM 벤치)·Task 5(생성)·Task 6(영속화 적용)는 별도 트랙
