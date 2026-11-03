import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import WorkoutStart from "@/components/WorkoutStart";

export default function WorkoutPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>운동 시작</h1>
        <AuthStatus />
      </header>
      <p>
        <Link href="/equipment">← 기구 선택</Link>
      </p>
      <WorkoutStart />
    </main>
  );
}
