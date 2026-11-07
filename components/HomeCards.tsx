"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon } from "@/components/icons";
import { EXERCISES } from "@/lib/data";
import { filterExercises } from "@/lib/filter";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import { useRoutines } from "@/lib/useRoutines";

/** 오늘 요일과 시각. 처음 그릴 때는 시각을 읽지 않고, 그린 뒤에 채운다. */
function useClock(): string | null {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const day = now.toLocaleDateString("ko-KR", { weekday: "long" });
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setText(`${day} · ${hh}:${mm}`);
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return text;
}

const card = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 0,
  padding: 16,
  borderRadius: 12,
  boxShadow: "4px 4px 0 rgba(35,40,32,0.22)",
} as const;

/**
 * 홈의 '오늘의 개인정비' 패널: 가능한 운동(큰 카드), 나의 루틴, 커뮤니티.
 * 홈이 스크롤 없이 한 화면에 들어가도록, 위 D-day 카드를 뺀 남은 높이를 카드가 나눠 쓴다.
 */
export default function HomeCards() {
  const { ids, syncing } = useOwnedEquipment();
  const { routines } = useRoutines();
  const clock = useClock();
  const available = useMemo(() => filterExercises(EXERCISES, ids).length, [ids]);

  return (
    <section
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "18px 16px 16px",
        borderRadius: "24px 24px 0 0",
        backgroundColor: "var(--paper)",
        backgroundImage:
          "linear-gradient(#0000000a 1px, transparent 1px), linear-gradient(90deg, #0000000a 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        boxShadow: "0 -4px 0 rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "var(--olive)" }}>DAILY TRAINING ORDER /</p>
          <h2 style={{ fontSize: 24, fontWeight: 900, wordBreak: "keep-all", lineHeight: 1.2 }}>오늘의 개인정비</h2>
        </div>
        <span
          style={{
            minWidth: 104,
            minHeight: 30,
            padding: "5px 10px",
            textAlign: "center",
            border: "1px solid #8a8670",
            borderRadius: 8,
            background: "var(--cream)",
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {clock ?? " "}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        <Link
          href="/workout/available"
          style={{
            ...card,
            gridRow: "1 / span 2",
            color: "#fff4e8",
            background: "var(--rust)",
          }}
        >
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, wordBreak: "keep-all" }}>가능한 운동</p>
            <p className="home-sub" style={{ marginTop: 6, color: "#f6cfc2", fontSize: 13, fontWeight: 600 }}>
              보유 장비 기준 {syncing ? "…" : available}개
            </p>
          </div>
          <span
            style={{
              alignSelf: "flex-end",
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--cream)",
              color: "var(--ink)",
            }}
          >
            <ArrowUpRightIcon />
          </span>
        </Link>

        <Link href="/routines" style={{ ...card, background: "var(--khaki)", color: "var(--ink)" }}>
          <p style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>나의 루틴</p>
          <p className="home-sub" style={{ color: "#6f6b52", fontSize: 12, fontWeight: 600 }}>
            개인 훈련계획 {routines.length}개
          </p>
        </Link>

        <Link href="/community" style={{ ...card, background: "var(--olive)", color: "#f6f3e4" }}>
          <p style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>커뮤니티</p>
          <p className="home-sub" style={{ color: "#d6dcc4", fontSize: 12, fontWeight: 600 }}>
            장병 자유게시판
          </p>
        </Link>
      </div>
    </section>
  );
}
