"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadEquipmentProfile, saveEquipmentProfile } from "@/lib/equipmentSync";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

/** 정해진 시간 안에 안 끝나면 포기하고 null 을 돌려준다. (계정 저장이 느리거나 멈춰도 화면이 안 막히게) */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * 기구 선택을 마치고 운동을 시작한다.
 * 로그인한 계정이면 지금 고른 기구를 저장하고 '선택 완료'로 표시한다.
 * 그러면 다음 로그인부터는 이 화면을 건너뛰고 바로 운동 시작으로 간다.
 * 저장이 실패하거나 오래 걸려도 운동 시작 화면으로는 반드시 넘어간다.
 */
export default function StartWorkoutButton() {
  const router = useRouter();
  const { ids } = useOwnedEquipment();
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    setBusy(true);
    try {
      const profile = await withTimeout(loadEquipmentProfile(), 4000);
      if (profile) await withTimeout(saveEquipmentProfile(profile.userId, ids, true), 4000);
    } catch {
      // 저장에 실패해도 이 기기에는 고른 기구가 남아 있으니 그대로 넘어간다.
    }
    router.push("/workout");
    // 혹시 화면이 안 바뀌어도 버튼이 영원히 잠겨 있지 않게 한다.
    setTimeout(() => setBusy(false), 4000);
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
