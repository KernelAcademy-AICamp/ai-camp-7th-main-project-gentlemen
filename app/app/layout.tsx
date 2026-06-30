import { redirect } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/workspace/auth";
import { aiAvailable } from "@/lib/workspace/ai";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/"); // 미로그인 → 마케팅 정문(모달 로그인). 별도 로그인 화면 없음
  if (!user.survey) redirect("/onboarding");
  return (
    <div className="bg-paper text-ink font-sans min-h-screen">
      <WorkspaceShell user={toPublicUser(user)} aiAvailable={aiAvailable()}>
        {children}
      </WorkspaceShell>
    </div>
  );
}
