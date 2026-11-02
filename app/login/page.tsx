import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

const NOTICES: Record<string, string> = {
  link: "인증 링크를 처리하지 못했습니다. 링크가 만료됐거나 가입을 시작한 브라우저와 다른 곳에서 열었을 수 있습니다. 메일 인증은 이미 끝났을 수 있으니 먼저 로그인을 시도해 보세요. 로그인할 때 인증이 안 됐다고 나오면 그때 뜨는 '인증 메일 다시 보내기'를 누르세요.",
};

async function LoginWithNotice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginForm notice={error ? NOTICES[error] : undefined} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
      <h1>체단실</h1>
      <Suspense fallback={null}>
        <LoginWithNotice searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
