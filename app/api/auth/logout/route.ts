import { destroySession } from "@/lib/workspace/auth";
import { json } from "@/lib/workspace/api";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
