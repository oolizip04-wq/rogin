import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import EquipmentSync from "@/components/EquipmentSync";
import RoutineList from "@/components/RoutineList";
import RoutineSync from "@/components/RoutineSync";

export default function MyRoutinesPage() {
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
        <h1>내 루틴</h1>
        <AuthStatus />
      </header>
      <p>
        <Link href="/workout">← 운동 시작</Link>
      </p>
      <RoutineList />
      <p>
        <Link href="/routines/new">
          <strong>+ 루틴 만들기</strong>
        </Link>
      </p>
    </main>
  );
}
