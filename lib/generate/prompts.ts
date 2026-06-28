import type { Concept } from "@/lib/concept-schema";
import type { StrategyResult } from "@/lib/llm/types";

/**
 * 생성 프롬프트 — docs/tech/Kup_프롬프트_설계.md(운영본) 1:1 이식.
 * 시스템 프롬프트(§1)는 채널마다 고정 → 실 공급자에서 prompt caching 앵커.
 * 유저 프롬프트(§2)는 단계마다 런타임 주입.
 */

export function systemPrompt(c: Concept): string {
  return `너는 인스타그램 카드뉴스 전문 카피라이터다. 아래 "채널 컨셉"을 절대 규칙으로 삼아,
한국어로 카드뉴스 콘텐츠를 생성한다. 출력은 항상 지정된 JSON 스키마만 반환한다.

[채널 컨셉]  ← 이 채널의 불변 정체성. 모든 문장이 여기서 벗어나면 안 된다.
- 페르소나: ${c.persona}
- 톤: ${c.tone}
- 콘텐츠 기둥(주제는 반드시 이 안에서): ${c.pillars.join(", ")}
- 발행 주기: ${c.cadence}

[불변 규칙]
1. 톤·페르소나를 모든 문장에 일관되게 반영한다.
   과장·클릭베이트·낚시성 표현, 이모지 남발을 금지한다.
2. 사실로 단정할 수 없는 것(수치·효능·통계·실존 인물/매장/브랜드/곡명·날짜)은
   지어내지 않는다. 불확실하면 일반화하거나 ai_flags에 기록한다.
3. 규제·광고 표현을 쓰지 않는다.
   - 금융: 수익 보장, 원금 보장, 투자 권유·단정
   - 의료/건강: 치료·효능 단정, 부작용 없음 단정
   - 공통: "반드시", "무조건", 강요·압박형 권유
4. 출력은 지정 JSON 스키마를 정확히 따른다. 글자수 제약을 절대 초과하지 않는다.
   (글자수는 카드 레이아웃이 깨지지 않는 물리적 상한이다.)
5. 너는 AI다. 확신할 수 없는 주장을 단정조로 쓰지 않는다.

[슬라이드 구조 규칙]
- 1장 cover + N장 body(1~8) + 1장 outro. 전체 3~10장.
- outro의 cta에는 리드마그넷 키워드(leadKeyword)를 포함한다.`;
}

export function topicUserPrompt(opts: { n?: number; recentTopics?: string[] } = {}): string {
  const n = opts.n ?? 5;
  const recent = opts.recentTopics?.length ? opts.recentTopics.join(", ") : "(없음)";
  return `[작업] 이 채널의 다음 카드뉴스 주제를 ${n}개 제안하라.
- 각 주제는 pillars 중 하나에 속한다.
- "정보성 + 공감"으로 저장·공유를 부르는 앵글을 우선한다.
- 최근 다룬 주제와 겹치지 않게: ${recent}

[출력 JSON]
{ "topics": [ { "title": string, "pillar": string, "angle": string } ] }`;
}

export function strategyUserPrompt(opts: { topic: string }): string {
  return `[작업] 선택 주제 "${opts.topic}"로 카드뉴스 1세트 구성을 설계하라.
- 슬라이드 장수 결정(cover 1 + body 3~6 + outro 1 권장).
- cover에서 멈추게 할 후킹 앵글(hook) 1문장.
- 각 body가 말할 내용을 한 줄 요약(아직 카피 아님).
- outro 리드마그넷 후킹: 무엇을 댓글로 받게 할지 + leadKeyword(짧은 단어).

[출력 JSON]
{
  "strategy": string,
  "hook": string,
  "slidePlan": [ { "kind": "cover"|"body"|"outro", "purpose": string } ],
  "leadKeyword": string
}`;
}

export function copyUserPrompt(opts: {
  conceptId: string;
  topic: string;
  strategy: StrategyResult;
  exemplars?: string;
}): string {
  const { conceptId, topic, strategy } = opts;
  const exemplars = opts.exemplars?.length ? opts.exemplars : "(없음)";
  return `[작업] 아래 구성에 맞춰 실제 카드뉴스 카피를 작성하라.
주제: ${topic} / 앵글: ${strategy.hook} / 구성: ${JSON.stringify(strategy.slidePlan)} / 리드키워드: ${strategy.leadKeyword}

[글자수 제약 — 초과 금지, 공백 포함]
- cover : kicker ≤10 / title ≤24(줄바꿈 \\n 허용) / sub ≤34
- body  : index "01"부터 2자리 / head ≤24 / body ≤48(\\n 허용)
- outro : title ≤22 / sub ≤40 / cta ≤14 (cta에 리드키워드 포함, 예 "💬 댓글: ${strategy.leadKeyword}")
- caption ≤300 / hashtags 5~10개(각 '#'으로 시작, 공백 없음)

[참고 모범 예시]
${exemplars}

[출력 JSON]  // deck 스키마의 topic·strategy·slides·caption·hashtags·leadKeyword까지. ai_flags·risk_level은 비워서 출력.
{
  "conceptId": "${conceptId}",
  "topic": "${topic}",
  "strategy": "${strategy.strategy}",
  "leadKeyword": "${strategy.leadKeyword}",
  "slides": [ ... ],
  "caption": string,
  "hashtags": [ string ],
  "ai_flags": [],
  "risk_level": "low"
}`;
}

export function reviewUserPrompt(opts: { deckJson: string }): string {
  return `[작업] 아래 deck을 검수자 입장에서 비판적으로 점검하라. 네 생성물을 의심하라.
${opts.deckJson}

[점검 항목]
- 검증이 필요한 주장(수치·효능·통계·실존 인물/매장/브랜드/곡명·날짜)
- 규제·광고 표현(금융 권유·보장, 의료 효능 단정, 과장 보장)
- 톤/페르소나 일탈, 강요·압박형 표현

[판정 규칙]
- 위 위험이 하나라도 있으면 risk_level="high", 해당 지점을 ai_flags에 구체적으로 기록.
- 전혀 없으면 risk_level="low", ai_flags=[].

[출력 JSON]
{ "ai_flags": [ string ], "risk_level": "low"|"high" }`;
}
