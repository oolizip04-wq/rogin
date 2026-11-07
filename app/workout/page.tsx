import EquipmentSync from "@/components/EquipmentSync";
import HomeCards from "@/components/HomeCards";
import HomeHero from "@/components/HomeHero";

// 홈 화면: 스크롤 없이 한 화면에 D-day 카드 + 오늘의 개인정비(가능한 운동 · 나의 루틴 · 커뮤니티)가 들어간다.
// 높이 = 화면 − 위 막대(52px) − 아래 탭 막대(72px) − 기기 안전 영역
export default function WorkoutPage() {
  return (
    <main
      style={{
        height: "calc(100svh - 52px - 72px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--hero)",
      }}
    >
      <EquipmentSync />
      <HomeHero />
      <HomeCards />
    </main>
  );
}
