import fs from "node:fs";
import path from "node:path";
import { conceptSchema } from "@/lib/concept-schema";
import { generateDeck } from "@/lib/generate/pipeline";
import { renderDeck } from "@/lib/render/deck-renderer";

/**
 * 생성 파이프라인 엔드투엔드 CLI — 컨셉만 주면 deck JSON + 슬라이드 PNG 가 로컬에서 나온다.
 * (Phase 2 완료 기준: 입구→렌더 완전 연결. 기본 mock 공급자라 API 키 불필요.)
 *
 *   npm run gen                              # poc/concepts/playlist.json
 *   npm run gen -- <concept.json>
 *   npm run gen -- <concept.json> --topic "직접 지정한 주제" --out out/test
 *   LLM_PROVIDER=mock npm run gen            # 공급자 선택(현재 mock만)
 */

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const conceptPath = positional[0] ?? "poc/concepts/playlist.json";

  if (!fs.existsSync(conceptPath)) {
    console.error(`❌ 컨셉 파일 없음: ${conceptPath}`);
    process.exit(1);
  }

  const concept = conceptSchema.parse(JSON.parse(fs.readFileSync(conceptPath, "utf8")));
  console.log(`📋 컨셉: ${concept.account} (${concept.id}) — ${concept.persona}`);
  console.log(`   공급자: ${process.env.LLM_PROVIDER ?? "mock"}\n`);

  const { deck, usage, timings } = await generateDeck(concept, { topic: flags.topic });

  const outDir = flags.out ?? path.join("out", deck.conceptId);
  fs.mkdirSync(outDir, { recursive: true });
  const deckPath = path.join(outDir, "deck.json");
  fs.writeFileSync(deckPath, JSON.stringify(deck, null, 2), "utf8");

  const { files } = await renderDeck(concept, deck, outDir);

  console.log(`✅ [${deck.conceptId}] 카드뉴스 ${deck.slides.length}장 생성·렌더 완료`);
  console.log(`   주제   : ${deck.topic}`);
  console.log(`   전략   : ${deck.strategy}`);
  console.log(`   리드키 : ${deck.leadKeyword}`);
  console.log(`   deck   : ${deckPath}`);
  files.forEach((f) => console.log("   - " + path.relative(process.cwd(), f)));

  console.log(`\n── 검수 리포트 ──`);
  console.log(`   리스크 : ${deck.risk_level === "high" ? "🔴 고위험 (사람 검수 필수)" : "🟢 저위험"}`);
  if (deck.ai_flags.length === 0) console.log("   플래그 : (없음)");
  deck.ai_flags.forEach((f) => console.log("   ⚠️  " + f));

  console.log(`\n── 계측(벤치 입력) ──`);
  console.log(`   토큰   : in ${usage.inputTokens} / out ${usage.outputTokens} (mock 추정치)`);
  console.log(`   시간   : 총 ${timings.totalMs}ms ${JSON.stringify(timings.perStageMs)}`);
}

main().catch((e) => {
  console.error("❌ 생성 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
