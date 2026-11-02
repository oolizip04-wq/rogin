import { EQUIPMENT_BY_ID } from "./equipment";

/**
 * 내가 가진 기구를 담는 저장소. 앱 전체에서 이것 하나만 쓴다.
 * id 하나가 한 번만 들어가므로 어느 부위 화면에서 골라도 중복 저장되지 않는다.
 */
const STORAGE_KEY = "chedansil.equipment.v1";

export const EMPTY: readonly string[] = [];

let selected: readonly string[] = EMPTY;
let loaded = false;
let storageListening = false;
const listeners = new Set<() => void>();

/** 알 수 없는 id 와 중복을 걸러 정렬한 새 배열을 만든다. */
function normalize(ids: unknown): readonly string[] {
  if (!Array.isArray(ids)) return EMPTY;
  const valid = ids.filter(
    (x): x is string => typeof x === "string" && EQUIPMENT_BY_ID.has(x),
  );
  return [...new Set(valid)].sort();
}

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: readonly string[]) {
  selected = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장소를 못 쓰는 환경에서는 이 탭 안에서만 유지한다.
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  selected = read();
  emit();
}

export function getSnapshot(): readonly string[] {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    selected = read();
  }
  return selected;
}

export function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!storageListening && typeof window !== "undefined") {
    storageListening = true;
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function isSelected(id: string): boolean {
  return getSnapshot().includes(id);
}

/** 선택하거나 해제한다. 이미 그 상태면 아무것도 바꾸지 않는다. */
export function setEquipment(id: string, on: boolean) {
  if (!EQUIPMENT_BY_ID.has(id)) return;
  const current = getSnapshot();
  const has = current.includes(id);
  if (on === has) return;
  commit(on ? normalize([...current, id]) : current.filter((x) => x !== id));
}

export function toggleEquipment(id: string) {
  setEquipment(id, !isSelected(id));
}

export function clearEquipment() {
  if (getSnapshot().length === 0) return;
  commit(EMPTY);
}
