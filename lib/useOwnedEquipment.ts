import { useMemo, useSyncExternalStore } from "react";
import {
  clearEquipment,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleEquipment,
} from "./equipmentStore";

/** 내가 가진 기구 id 목록과, 어디서든 같은 상태를 바꾸는 함수들 */
export function useOwnedEquipment() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useMemo(() => new Set(ids), [ids]);
  return { ids, has: (id: string) => set.has(id), toggle: toggleEquipment, clear: clearEquipment };
}
