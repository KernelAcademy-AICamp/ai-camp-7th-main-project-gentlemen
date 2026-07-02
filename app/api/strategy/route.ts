import { mutateDB, readDB } from "@/lib/workspace/db";
import { bad, json, withUser } from "@/lib/workspace/api";
import { generateStrategy } from "@/lib/workspace/ai";

// 최신 전략 조회
export async function GET() {
  const guard = await withUser();
  if ("res" in guard) return guard.res;
  const strategy = (await readDB()).strategies[guard.user.id] ?? null;
  return json({ strategy });
}

// 전략 생성/재생성 (#1)
export async function POST() {
  const guard = await withUser();
  if ("res" in guard) return guard.res;
  if (!guard.user.survey) return bad("먼저 시작 설문을 완료하세요.", 409);

  let strategy;
  try {
    strategy = await generateStrategy(guard.user.survey);
  } catch {
    return bad("지금 AI가 혼잡해요. 잠시 후 다시 시도해 주세요.", 503);
  }
  await mutateDB((db) => {
    db.strategies[guard.user.id] = strategy;
  });
  return json({ strategy });
}
