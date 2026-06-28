import type { LlmProvider } from "@/lib/llm/types";
import { MockProvider } from "@/lib/llm/mock";

export type { LlmProvider, LlmCall, LlmResult, Stage, TokenUsage } from "@/lib/llm/types";

/**
 * 공급자 선택 — 기본 mock(키 불필요). 실 공급자는 Task 4에서 SDK 연결 후 여기 붙는다.
 * 선택: env LLM_PROVIDER ("mock" | "anthropic" | "openai" | "google"). 미지정 시 mock.
 * (serverEnv 를 거치지 않아 Supabase 키 없이도 생성 스크립트를 돌릴 수 있게 한다.)
 */
export function getProvider(name = process.env.LLM_PROVIDER ?? "mock"): LlmProvider {
  switch (name) {
    case "mock":
      return new MockProvider();
    case "anthropic":
    case "openai":
    case "google":
      throw new Error(
        `[llm] '${name}' 공급자 미구현 — Task 4(벤치)에서 SDK 연결 예정. 지금은 LLM_PROVIDER=mock 사용.`,
      );
    default:
      throw new Error(`[llm] 알 수 없는 LLM_PROVIDER='${name}' (mock|anthropic|openai|google)`);
  }
}
