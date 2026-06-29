import { signInWithGoogle, signInWithPassword, signUpWithPassword } from "./actions";

/**
 * 로그인 페이지 — 구글을 메인으로 노출, 이메일/비번은 보조(개발·테스트용).
 * 세션은 Supabase Auth가 발급. 성공 시 /auth/callback(구글) 또는 바로 /dashboard(이메일).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Kup 시작하기</h1>
        <p className="mt-2 text-sm opacity-60">구글 계정으로 1초 만에 시작하세요</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
      )}

      {/* 메인: 구글 (구글 공급자 설정 후 동작) */}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-black/[0.03]"
        >
          <span className="font-bold text-[#4285F4]">G</span> 구글로 계속하기
        </button>
      </form>

      {/* 보조: 이메일/비번 (개발·테스트용) */}
      <div className="flex items-center gap-3 text-xs opacity-40">
        <span className="h-px flex-1 bg-current" />또는 이메일 (개발·테스트용)<span className="h-px flex-1 bg-current" />
      </div>

      <form className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="이메일"
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm"
        />
        <div className="flex gap-2">
          <button
            formAction={signInWithPassword}
            className="flex-1 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold hover:bg-black/[0.03]"
          >
            로그인
          </button>
          <button
            formAction={signUpWithPassword}
            className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          >
            가입
          </button>
        </div>
      </form>
    </main>
  );
}
