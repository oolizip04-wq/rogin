"use client";

import { useEffect, useRef } from "react";
import { loadEquipmentProfile, saveEquipmentProfile } from "@/lib/equipmentSync";
import { replaceEquipment, setSyncing } from "@/lib/equipmentStore";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

/**
 * 화면에는 아무것도 그리지 않고, 로그인한 사람의 기구 선택을 계정과 맞춘다.
 *  - 들어오면 계정에 저장된 기구를 불러와 이 기기의 선택을 그 내용으로 바꾼다. (선택을 마친 계정만)
 *  - 기구를 바꾸면 잠시 뒤 계정에 저장한다.
 * 기구 선택·운동 시작 화면에 하나씩 둔다.
 */
export default function EquipmentSync() {
  const { ids } = useOwnedEquipment();
  const userId = useRef<string | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const profile = await loadEquipmentProfile();
      if (!alive) return;
      if (profile) {
        userId.current = profile.userId;
        if (profile.confirmed) replaceEquipment(profile.ids);
      }
      ready.current = true;
      setSyncing(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready.current || !userId.current) return;
    const uid = userId.current;
    const timer = setTimeout(() => {
      saveEquipmentProfile(uid, ids);
    }, 600);
    return () => clearTimeout(timer);
  }, [ids]);

  return null;
}
