import { useMemo, useSyncExternalStore } from "react";
import {
  clearEquipment,
  getServerSnapshot,
  getServerSyncingSnapshot,
  getSnapshot,
  getSyncingSnapshot,
  subscribe,
  toggleEquipment,
} from "./equipmentStore";

/** 내가 가진 기구 id 목록과, 어디서든 같은 상태를 바꾸는 함수들 */
export function useOwnedEquipment() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const syncing = useSyncExternalStore(
    subscribe,
    getSyncingSnapshot,
    getServerSyncingSnapshot,
  );
  const set = useMemo(() => new Set(ids), [ids]);
  return {
    ids,
    /** 계정에서 기구 정보를 불러오는 중이면 true */
    syncing,
    has: (id: string) => set.has(id),
    toggle: toggleEquipment,
    clear: clearEquipment,
  };
}
