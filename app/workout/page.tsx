import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import EquipmentBar from "@/components/EquipmentBar";
import EquipmentSync from "@/components/EquipmentSync";
import ServiceDates from "@/components/ServiceDates";

const MENU = [
  {
    href: "/workout/available",
    title: "내 체단실에서 가능한 운동",
    desc: "내 기구로 할 수 있는 운동을 부위별로 봅니다.",
  },
  {
    href: "/routines",
    title: "나의 루틴",
    desc: "루틴을 만들고, 운동 순서를 정하고, 확인합니다.",
  },
];

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
      <ServiceDates />
      <EquipmentBar />

      <nav aria-label="운동 메뉴">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {MENU.map((item) => (
            <li key={item.href} style={{ marginBottom: 12 }}>
              <Link
                href={item.href}
                style={{
                  display: "block",
                  padding: "16px 18px",
                  border: "1px solid currentColor",
                  borderRadius: 12,
                  textDecoration: "none",
                }}
              >
                <strong style={{ fontSize: 20 }}>{item.title}</strong>
                <br />
                <small>{item.desc}</small>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
