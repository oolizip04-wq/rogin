import AuthStatus from "@/components/AuthStatus";
import ExerciseFinder from "@/components/ExerciseFinder";

export default function Home() {
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
      <ExerciseFinder />
    </main>
  );
}
