import Link from "next/link";
import { Suspense } from "react";
import AuthStatus from "@/components/AuthStatus";
import EquipmentSync from "@/components/EquipmentSync";
import RoutineMake from "@/components/RoutineMake";
import RoutineSync from "@/components/RoutineSync";

export default function NewRoutinePage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <EquipmentSync />
      <RoutineSync />
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>루틴 만들기</h1>
        <AuthStatus />
      </header>
      <p>
        <Link href="/workout">← 운동 시작</Link> · <Link href="/routines">내 루틴 보기</Link>
      </p>
      <Suspense fallback={null}>
        <RoutineMake />
      </Suspense>
    </main>
  );
}
