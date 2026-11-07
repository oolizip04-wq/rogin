"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, DumbbellIcon, GearIcon, HomeIcon, RoutineIcon } from "@/components/icons";
import { showsChrome } from "@/lib/nav";

type Tab = { href: string; label: string; Icon: typeof HomeIcon; active: (path: string) => boolean };

const TABS: Tab[] = [
  { href: "/workout", label: "홈", Icon: HomeIcon, active: (p) => p === "/workout" || p === "/notifications" },
  {
    href: "/workout/available",
    label: "운동",
    Icon: DumbbellIcon,
    active: (p) => p.startsWith("/workout/") || p.startsWith("/exercises"),
  },
  { href: "/routines", label: "루틴", Icon: RoutineIcon, active: (p) => p.startsWith("/routines") },
  { href: "/community", label: "커뮤니티", Icon: ChatIcon, active: (p) => p.startsWith("/community") },
  { href: "/settings", label: "설정", Icon: GearIcon, active: (p) => p.startsWith("/settings") },
];

/** 로그인한 뒤의 주요 화면 아래에 붙는 탭 막대: 홈 · 운동 · 루틴 · 커뮤니티 · 설정 */
export default function BottomNav() {
  const path = usePathname() ?? "";
  if (!showsChrome(path)) return null;

  return (
    <>
      {/* 막대에 가려지지 않도록 같은 높이만큼 비워 둔다 */}
      <div aria-hidden style={{ height: "calc(72px + env(safe-area-inset-bottom))" }} />
      <nav
        aria-label="주요 메뉴"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "var(--hero)",
        }}
      >
        {TABS.map(({ href, label, Icon, active }) => {
          const on = active(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                height: 72,
                color: on ? "#fff4e8" : "#c9c39f",
                // 선택된 탭은 녹슨 주황으로 칠한 기울어진 판
                background: on ? "var(--rust)" : "transparent",
                clipPath: on ? "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" : undefined,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <Icon width={24} height={24} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
