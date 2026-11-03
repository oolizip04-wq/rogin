"use client";

import Link from "next/link";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

/** 운동 시작 화면 맨 위에서, 기구 선택 화면으로 돌아가는 길을 항상 보여 준다. */
export default function EquipmentBar() {
  const { ids, syncing } = useOwnedEquipment();
  return (
    <p
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span>
        내 기구 <strong>{syncing ? "…" : `${ids.length}종`}</strong>
      </span>
      <Link href="/equipment">기구 추가·수정하기</Link>
    </p>
  );
}
