"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadEquipmentProfile, saveEquipmentProfile } from "@/lib/equipmentSync";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

/**
 * 기구 선택을 마치고 운동을 시작한다.
 * 로그인한 계정이면 지금 고른 기구를 저장하고 '선택 완료'로 표시한다.
 * 그러면 다음 로그인부터는 이 화면을 건너뛰고 바로 운동 시작으로 간다.
 */
export default function StartWorkoutButton() {
  const router = useRouter();
  const { ids } = useOwnedEquipment();
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    setBusy(true);
    const profile = await loadEquipmentProfile();
    if (profile) await saveEquipmentProfile(profile.userId, ids, true);
    router.push("/workout");
  }

  return (
    <p>
      <button
        type="button"
        onClick={handleStart}
        disabled={busy}
        style={{ padding: "12px 24px", fontWeight: 700 }}
      >
        {busy ? "이동 중..." : "운동 시작하기 →"}
      </button>
      <br />
      <small>
        {ids.length === 0
          ? "기구를 고르지 않으면 맨몸 운동만 나옵니다."
          : `선택한 기구 ${ids.length}종으로 할 수 있는 운동을 보여 드립니다.`}
      </small>
    </p>
  );
}
