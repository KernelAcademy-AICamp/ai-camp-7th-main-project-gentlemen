# Kup

갓 시작한 1인 인플루언서를 위한 **인스타 카드뉴스 AI**. AI가 카드뉴스를 기획·생성하고,
사람이 빠르게 검수·승인한 뒤 예약 발행하며, 댓글 리드마그넷·성과까지 한 곳에서 돌린다.

> **프로젝트 성격**: 기획부터 구현까지 진행 중인 공개 사이드 프로젝트(WIP).
> 현재 동작 범위 = **생성 파이프라인**(컨셉 → deck JSON → 카드 PNG, mock LLM으로 키 없이 구동).
> 실 LLM 연결·영속화·검수 UI·발행 워커는 [docs/작업트랙.md](docs/작업트랙.md) 로드맵 참고.

> 무엇을: [docs/product/Kup_SPEC.md](docs/product/Kup_SPEC.md) · 어떻게: [docs/tech/Kup_기술설계.md](docs/tech/Kup_기술설계.md) ·
> 데이터모델: [docs/tech/Kup_데이터모델.md](docs/tech/Kup_데이터모델.md) · 작업현황: [docs/작업트랙.md](docs/작업트랙.md)
> **팀 개발 규칙: [CONTRIBUTING.md](CONTRIBUTING.md) · 역할 분담: [docs/팀_역할분담.md](docs/팀_역할분담.md)**

## 스택

TypeScript · Next.js 15(App Router)+Tailwind · Supabase(Postgres·Auth·Storage) ·
BullMQ+Redis(예약/cron) · Anthropic/OpenAI/Google SDK(생성) · sharp+SVG(렌더).
**프론트+API → Vercel / 워커 → Railway** (같은 레포·같은 `lib/` 공유, 배포만 둘로).

---

## 빠른 시작 (로컬 ~30분)

**사전 준비**: Node 20+ · [Docker Desktop](https://www.docker.com/products/docker-desktop/) · Git

```bash
# 1) 클론 + 의존성
git clone <repo-url> && cd kup
npm install

# 2) 로컬 Supabase 기동 (Docker 켜져 있어야 함)
npx supabase start            # Postgres+Auth+Storage+Studio (첫 실행은 이미지 다운로드)
npx supabase db reset         # 마이그레이션(0001 스키마 / 0002 RLS / 0003 권한) 적용

# 3) 환경변수 — supabase start 출력의 키를 .env.local에 채움
cp .env.example .env.local    # NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
                              # ⚠️ .env.local 은 절대 커밋 금지

# 4) 구동
npm run dev                   # 프론트+API → http://localhost:3000  (/api/health 로 확인)
```

**생성 파이프라인 돌려보기** (API 키 없이 mock으로 동작):
```bash
npm run gen                   # 컨셉 → deck JSON + 카드 PNG (out/ 에 생성)
npm run gen -- --save         # + 로컬 DB에 영속화(왕복 검증). supabase 기동 필요
```

**예약/cron 워커 스파이크** (BullMQ+Redis, 별도 폴더):
```bash
cd spike-bullmq && npm install
npm run redis:up && npm run worker        # 창1
npm run schedule -- 10 "테스트"           # 창2: 10초 뒤 발행
npm run cron -- "*/10 * * * * *"          # 창2: 반복(인사이트 04:00형)
```

> 막히면 [CONTRIBUTING.md](CONTRIBUTING.md)의 "트러블슈팅" 참고. Studio: http://127.0.0.1:54323

---

## 명령어 치트시트

| 명령 | 용도 |
|---|---|
| `npm run dev` | 프론트+API 개발 서버 |
| `npm run worker:dev` | BullMQ 워커(REDIS_URL 필요) |
| `npm run gen [-- --save]` | 생성 파이프라인 (deck→PNG[→DB]) |
| `npm run typecheck` / `lint` / `build` | **PR 전 필수 3종** (CI도 이걸 검사) |
| `npx supabase start` / `db reset` / `stop` | 로컬 DB 스택 |
| `npx supabase gen types typescript --local > lib/db/database.types.ts` | 스키마 변경 후 타입 재생성 |

---

## 디렉토리 & 역할 오너십

```
app/         Next.js 프론트+API           ← 프론트(C)
lib/
  generate/  생성 엔진(generateDeck)       ← 품질(A)
  llm/       LLM 어댑터(mock+공급자)        ← 품질(A)
  render/    카드 렌더(sharp+SVG)           ← 품질(A)
  db/        decks 저장·시드·DB타입         ← 백엔드(B)
  supabase/  client/server/admin           ← 백엔드(B)
  deck-schema.ts / concept-schema.ts  ⚠️ 공유 계약 — 변경 시 전체 조율
workers/     BullMQ 워커(발행·cron)         ← 백엔드(B)
supabase/    config + 마이그레이션          ← 백엔드(B)
scripts/     CLI(생성 등)
spike-bullmq/ 예약/cron 내구성 스파이크(참고용)
docs/        기획·기술 문서
```

자세한 역할·첫 태스크: [docs/팀_역할분담.md](docs/팀_역할분담.md)

---

## 배포 (요약)

- **프론트+API** → Vercel (`app/`만 빌드, 환경변수는 Vercel 시크릿)
- **워커** → Railway 등 상시 서버 (`npm run worker`, `REDIS_URL`=Upstash 등)
- 코드 변경 없이 `REDIS_URL`·Supabase URL/키만 호스트 시크릿으로 주입
