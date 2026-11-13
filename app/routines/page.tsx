import EquipmentSync from "@/components/EquipmentSync";
import RoutineSync from "@/components/RoutineSync";
import RoutinesApp from "@/components/RoutinesApp";

export default function MyRoutinesPage() {
  return (
    <main className="app-page">
      <EquipmentSync />
      <RoutineSync />
      <p className="page-eyebrow">MY ROUTINES</p>
      <h1 className="page-title">나의 루틴</h1>
      <RoutinesApp />
    </main>
  );
}
