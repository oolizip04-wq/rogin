import { Suspense } from "react";
import AuthStatus from "@/components/AuthStatus";
import EquipmentGate from "@/components/EquipmentGate";
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

      <Suspense fallback={null}>
        <EquipmentGate>
          <EquipmentPicker />
          <StartWorkoutButton />
        </EquipmentGate>
      </Suspense>
    </main>
  );
}
