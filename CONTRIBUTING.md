# 개발 규칙 (CONTRIBUTING)

3~4인이 서로 안 부딪히고 일하기 위한 최소 규칙. 처음이라도 이대로만 하면 안전하다.

## 1. 브랜치 전략

```
main      배포 가능한 안정 상태. 직접 push 금지. PR로만 머지.
dev       통합 브랜치. feature 들이 모이는 곳.
feature/* 각자 작업. dev에서 따고, dev로 PR.
```

- 새 작업: `git switch dev && git pull && git switch -c feature/<영역>-<요약>`
  - 예: `feature/backend-publish-worker`, `feature/front-review-ui`, `feature/quality-prompt-tuning`
- 작업 끝 → `dev`로 **PR** → 리뷰 1명 승인 → 머지.
- `spike/*` 는 버리는 실험용(머지 안 함).

## 2. 커밋 메시지

`<영역>: <한 일>` 형식. 한국어 OK.
```
backend: 예약 발행 잡 BullMQ 이식
front: 검수 화면 ai_flags 바인딩
quality: 디저트 고위험 프롬프트 보강
```
- 작게 자주 커밋. 한 커밋 = 한 가지 일.

## 3. PR 규칙

- PR 전 **로컬에서 반드시 통과**: `npm run typecheck && npm run lint && npm run build`
- PR 본문에 **무엇을·왜·어떻게 테스트했는지** 적기 (템플릿 자동 제공).
- **리뷰어 1명 승인** 후 머지. 본인 PR 셀프 머지 금지(급하면 구두 합의).
- CI(자동 검사)가 빨간불이면 머지 금지.

## 4. 영역 오너십 (충돌 방지의 핵심)

각자 자기 디렉토리 위주로. 남의 영역은 PR 리뷰로만 손댄다.

| 영역 | 담당 | 디렉토리 |
|---|---|---|
| 품질(A) | 카드뉴스 | `lib/generate/` `lib/llm/` `lib/render/` `poc/` |
| 백엔드(B) | 인프라 | `workers/` `supabase/` `lib/db/` `lib/supabase/` |
| 프론트(C) | UI | `app/` |
| 리드(D) | 통합 | 루트 설정·CI·배포·아래 공유 계약 |

### ⚠️ 공유 계약 (바꿀 땐 반드시 사전 공유)
아래 파일은 여러 영역이 함께 쓴다. 바꾸면 남의 코드가 깨질 수 있으니 **변경 전 팀에 알리고 PR 리뷰 필수**:
- `lib/deck-schema.ts` · `lib/concept-schema.ts` — 생성·렌더·DB·프론트 공유 데이터 계약
- `lib/db/database.types.ts` — DB 타입(스키마 변경 시 `supabase gen types`로 재생성)
- `supabase/migrations/*` — DB 스키마(추가만, 기존 마이그레이션 수정 금지 → 새 번호로)

## 5. 시크릿 / 환경변수

- **절대 커밋 금지**: `.env.local`, 실제 키. `.gitignore`로 막혀 있다.
- 새 환경변수 추가 시 **`.env.example`에 빈 값으로 추가** + `lib/env.ts` 스키마 반영.
- 실 키는 각자 로컬 `.env.local` / 호스트 시크릿(Vercel·Railway)에만.

## 6. 트러블슈팅

| 증상 | 해결 |
|---|---|
| `[env] 환경변수 검증 실패` | `.env.local` 에 Supabase 키 채웠는지 (`supabase start` 출력) |
| `permission denied for table ...` | `npx supabase db reset` (0003 권한 마이그레이션 적용) |
| 워커가 `REDIS_URL 미설정` | `.env.local`에 REDIS_URL, 또는 `spike-bullmq`에서 `npm run redis:up` |
| supabase 안 뜸 | Docker Desktop 켜졌는지 확인 |
| 타입 에러(DB) | 스키마 바꿨으면 `supabase gen types ... > lib/db/database.types.ts` |
