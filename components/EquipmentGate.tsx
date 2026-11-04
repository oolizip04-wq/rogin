"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadEquipmentProfile } from "@/lib/equipmentSync";

/**
 * 기구 선택 화면을 처음 쓰는 사람에게만 보여 준다.
 * 기구를 이미 등록한 계정이 이 주소로 들어오면 바로 운동 시작으로 보낸다.
 * 다만 '기구 추가·수정하기'로 들어온 경우(주소 끝에 ?edit=1)에는 그대로 보여 준다.
 * 로그인하지 않은 사람은 막지 않는다.
 */
export default function EquipmentGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const editing = useSearchParams().get("edit") === "1";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const profile = await loadEquipmentProfile();
      if (!alive) return;
      const registered = profile ? profile.confirmed || profile.ids.length > 0 : false;
      if (registered && !editing) {
        router.replace("/workout");
        return;
      }
      setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [editing, router]);

  if (!checked) {
    return (
      <p>
        <small>확인 중...</small>
      </p>
    );
  }
  return <>{children}</>;
}
