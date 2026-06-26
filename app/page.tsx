export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Kup</h1>
      <p className="text-base opacity-70">
        뼈대(scaffold) 가동 확인용 페이지. 콘텐츠관리 · 자동화 · 성과 화면이 여기에 붙는다.
      </p>
      <p className="text-sm opacity-50">
        프론트+API는 Vercel, 발행·웹훅·인사이트 워커는 Railway(<code>npm run worker</code>)로 분리.
      </p>
    </main>
  );
}
