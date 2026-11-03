import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import EquipmentPicker from "@/components/EquipmentPicker";

export default function EquipmentPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
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

      <p>
        <Link href="/workout">
          <strong>운동 시작하기 →</strong>
        </Link>
      </p>
    </main>
  );
}
