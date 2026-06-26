import { z } from "zod";

/**
 * Deck 데이터 계약 — 생성파이프라인 §1.2/1.3 과 1:1.
 * generateDeck()의 출력이자 render-deck의 입력이자 `decks` 테이블 저장 단위.
 * 글자수 "권장 최대"는 현행 sharp+SVG 렌더가 안 깨지는 상한(§1.3 표).
 * Playwright 렌더로 가면 auto-fit이 쉬워져 이 상한은 완화될 수 있다.
 */

export const SLIDE_LIMITS = {
  cover: { kicker: 10, title: 24, sub: 34 },
  body: { head: 24, body: 48 },
  outro: { title: 22, sub: 40, cta: 14 },
} as const;

const coverSlide = z.object({
  kind: z.literal("cover"),
  kicker: z.string().max(SLIDE_LIMITS.cover.kicker),
  title: z.string().max(SLIDE_LIMITS.cover.title), // '\n' 줄나눔 허용
  sub: z.string().max(SLIDE_LIMITS.cover.sub),
});

const bodySlide = z.object({
  kind: z.literal("body"),
  index: z.string().regex(/^\d{2}$/), // "01","02"…
  head: z.string().max(SLIDE_LIMITS.body.head),
  body: z.string().max(SLIDE_LIMITS.body.body),
});

const outroSlide = z.object({
  kind: z.literal("outro"),
  title: z.string().max(SLIDE_LIMITS.outro.title),
  sub: z.string().max(SLIDE_LIMITS.outro.sub),
  cta: z.string().max(SLIDE_LIMITS.outro.cta), // 리드마그넷 키워드와 일치(§4)
});

export const slideSchema = z.discriminatedUnion("kind", [coverSlide, bodySlide, outroSlide]);
export type Slide = z.infer<typeof slideSchema>;

export const riskLevelSchema = z.enum(["low", "high"]);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const deckSchema = z
  .object({
    conceptId: z.string().min(1),
    topic: z.string().min(1),
    strategy: z.string().min(1),
    // 구성 규칙: 1 cover + N body + 1 outro (전체 3~10장)
    slides: z.array(slideSchema).min(3).max(10),
    caption: z.string().max(2200),
    hashtags: z.array(z.string().regex(/^#\S+$/)).min(5).max(10),
    ai_flags: z.array(z.string()).default([]),
    risk_level: riskLevelSchema,
  })
  .superRefine((deck, ctx) => {
    const first = deck.slides[0];
    const last = deck.slides[deck.slides.length - 1];
    if (first?.kind !== "cover") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "첫 슬라이드는 cover여야 함", path: ["slides", 0] });
    }
    if (last?.kind !== "outro") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "마지막 슬라이드는 outro여야 함", path: ["slides"] });
    }
  });

export type Deck = z.infer<typeof deckSchema>;
