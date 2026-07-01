import { USE_SUPABASE_BACKEND, supabaseAdmin } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// DM 웹훅 멱등 처리 — 같은 댓글에 DM 을 두 번 보내지 않도록 "선점(claim)"한다.
//
//   claimComment(commentId) => true  : 이번에 처음 선점 → 발송 진행
//                              false : 이미 처리됨(또는 동시 중복) → 스킵
//
// supabase 백엔드: processed_comments(PK=comment_id) 에 insert.
//   성공 = 처음 / unique 충돌(23505) = 이미 처리 → 원자적이라 다중 인스턴스에서도 안전.
// 파일 백엔드(로컬 dev): 프로세스 메모리 Set 로 충분(단일 프로세스).
// ─────────────────────────────────────────────────────────────────────────────

const localSeen = new Set<string>();

export async function claimComment(commentId: string): Promise<boolean> {
  if (!commentId) return false;

  if (!USE_SUPABASE_BACKEND) {
    if (localSeen.has(commentId)) return false;
    localSeen.add(commentId);
    return true;
  }

  const { error } = await supabaseAdmin().from("processed_comments").insert({ comment_id: commentId });
  if (!error) return true;
  if (error.code === "23505") return false; // unique_violation → 이미 처리됨
  throw new Error(`댓글 멱등 선점 실패: ${error.message}`);
}

// 발송 실패 시 선점 해제 — 재전송 때 다시 시도할 수 있게 한다.
export async function releaseComment(commentId: string): Promise<void> {
  if (!commentId) return;
  if (!USE_SUPABASE_BACKEND) {
    localSeen.delete(commentId);
    return;
  }
  await supabaseAdmin().from("processed_comments").delete().eq("comment_id", commentId);
}
