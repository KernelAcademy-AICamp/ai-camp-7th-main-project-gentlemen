import Link from "next/link";
import { AuthShell } from "@/components/workspace/AuthShell";
import { Button, Field, inputClass } from "@/components/workspace/ui";
import { continueAsGuest, signInWithGoogle, signInWithPassword } from "./actions";

/**
 * 로그인 — Supabase Auth(구글 메인 + 이메일/비번 보조).
 * 디자인은 워크스페이스 AuthShell(통일된 그레이스케일 토큰).
 * 성공 → /auth/callback 또는 액션 내부에서 파일DB 브릿지 → /app.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell title="다시 만나서 반가워요" sub="로그인하고 이번 주 루틴을 이어가요.">
      {error && (
        <p className="mb-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={signInWithPassword} className="space-y-4">
        <Field label="이메일">
          <input className={inputClass} name="email" type="email" placeholder="you@example.com" required />
        </Field>
        <Field label="비밀번호">
          <input className={inputClass} name="password" type="password" placeholder="••••••" required />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          로그인
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">또는</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <span className="font-bold text-[#4285F4]">G</span> 구글로 계속하기
        </Button>
      </form>

      {/* Supabase 없이도 화면을 볼 수 있는 폴백(파일DB 게스트) */}
      <form action={continueAsGuest} className="mt-2">
        <Button type="submit" variant="ghost" size="lg" className="w-full">
          비회원으로 둘러보기
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-coral">
          무료로 시작하기
        </Link>
      </p>
    </AuthShell>
  );
}
