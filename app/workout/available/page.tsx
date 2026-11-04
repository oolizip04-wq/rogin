import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import EquipmentBar from "@/components/EquipmentBar";
import EquipmentSync from "@/components/EquipmentSync";
import WorkoutStart from "@/components/WorkoutStart";

export default function AvailableWorkoutPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <EquipmentSync />
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>내 체단실에서 가능한 운동</h1>
        <AuthStatus />
      </header>
      <p>
        <Link href="/workout">← 운동 시작</Link>
      </p>
      <EquipmentBar />
      <WorkoutStart />
    </main>
  );
}
