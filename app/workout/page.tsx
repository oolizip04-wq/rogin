import AuthStatus from "@/components/AuthStatus";
import EquipmentBar from "@/components/EquipmentBar";
import EquipmentSync from "@/components/EquipmentSync";
import WorkoutStart from "@/components/WorkoutStart";

export default function WorkoutPage() {
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
        <h1>운동 시작</h1>
        <AuthStatus />
      </header>
      <EquipmentBar />
      <WorkoutStart />
    </main>
  );
}
