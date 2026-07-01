# LLM 카드뉴스 품질 비교 — 계획 초안

> 상태: **초안(미착수)**. 구체 계획·실행은 추후. 이 문서는 방향만 잡아둔 메모다.
> 관련: [생성 파이프라인 설계](Kup_생성파이프라인_설계.md) · [프롬프트 설계](Kup_프롬프트_설계.md) · 공급자 자리 = `lib/env.ts`(`OPENAI_API_KEY`/`GOOGLE_API_KEY`), `lib/workspace/ai.ts`

## 1. 목적 (무엇을 재나)
"어떤 모델이 **우리 카드뉴스 생성에** 가장 좋은가"를 3축으로 비교:
- **품질** — 후킹·구성·톤 준수·CTA·금지어 회피
- **비용** — 건당 $
- **지연** — 건당 응답 시간

## 2. 참가 모델 4종

| 모델 | API/접근 | 키 | 비용 |
|---|---|---|---|
| **Claude** | Anthropic API (`claude-opus-4-8`) | `ANTHROPIC_API_KEY` | 유료 |
| **ChatGPT** | OpenAI API (최신 GPT) | `OPENAI_API_KEY` | 유료 |
| **Gemini** | Google AI API (Gemini 2.x) | `GOOGLE_API_KEY` | 무료 티어 있음 |
| **NVIDIA 무료** | build.nvidia.com (NIM, OpenAI 호환 API) | `NVIDIA_API_KEY` | 무료 티어 |

- ⚠️ **미확정**: "엔비디아 무료 버전"의 정확한 모델명(Nemotron 계열 등 추정). NIM은 OpenAI 호환이라 OpenAI 어댑터 재활용 가능.

## 3. 하버스 설계 (레포에 맞춤)
- `lib/workspace/ai.ts`의 `generateCard(survey, input)`가 이미 **공급자 무관 인터페이스**.
- 여기에 **공급자 어댑터**만 추가: `lib/llm/{anthropic,openai,google,nvidia}.ts` — 동일 입출력(JSON deck) 반환.
- `LLM_PROVIDER` env로 스위치(기본 anthropic 유지 → 프로덕션 안 깨짐).
- **동일 프롬프트·동일 입력**으로 4모델 요청 → 공정 비교.

## 4. 테스트 세트 (고정)
- 설문 프로필 3~5개(카페/피트니스/재테크 등 니치 다양화) × 주제 5개 = 15~25건.
- 민감 도메인(재테크) 1개 포함 → **금지어·단정 표현 회피** 검증.

## 5. 평가 방법
- **자동 1차**: LLM-as-judge로 루브릭 채점(후킹/구성/톤/CTA/금지어).
- **사람 2차**: 상위 후보만 팀 눈검수(자동 점수 보정).
- **정량**: 건당 토큰·비용·지연 자동 로깅.
- 결과 = 표 1개: 모델 × (품질점수/비용/지연).

## 6. 산출물
- `scripts/llm-bench.ts` (CLI, 키 있는 것만 자동 스킵) + `out/llm-bench.json`.
- 요약 리포트 → `docs/tech/LLM_벤치.md`.

## 7. 착수 전 확정할 것
1. **NVIDIA 모델 정확한 이름.**
2. **평가 기준 가중치** — 품질 우선? 비용 우선? (라우팅 결정에 영향).
3. **심판 모델** — 자기채점 편향 회피(참가 안 하는 모델로, 또는 해당 후보 제외).
