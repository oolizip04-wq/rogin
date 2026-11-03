import AuthStatus from "@/components/AuthStatus";
import EquipmentPicker from "@/components/EquipmentPicker";
import EquipmentSync from "@/components/EquipmentSync";
import StartWorkoutButton from "@/components/StartWorkoutButton";

export default function EquipmentPage() {
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
        <h1>체단실</h1>
        <AuthStatus />
      </header>

      <EquipmentPicker />
      <StartWorkoutButton />
    </main>
  );
}
