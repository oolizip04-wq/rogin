import { getExercise } from "./data";

/**
 * 내 루틴을 담는 저장소. 앱 전체에서 이것 하나만 쓴다.
 * 로그인한 사람은 이 내용이 계정(Supabase)에도 저장된다. (lib/routineSync.ts)
 */
export type Routine = {
  id: string;
  name: string;
  /** 담은 운동 id. 배열의 순서가 곧 루틴의 운동 순서다. */
  exerciseIds: string[];
};

export const MAX_ROUTINES = 20;
export const MAX_EXERCISES = 40;
export const MAX_NAME = 30;

const STORAGE_KEY = "chedansil.routines.v1";
export const EMPTY: readonly Routine[] = [];

let routines: readonly Routine[] = EMPTY;
let loaded = false;
let storageListening = false;
const listeners = new Set<() => void>();

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 모르는 운동 id, 중복, 너무 긴 이름을 걸러 안전한 목록으로 만든다. */
export function sanitizeRoutines(raw: unknown): readonly Routine[] {
  if (!Array.isArray(raw)) return EMPTY;
  const out: Routine[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, name, exerciseIds } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof name !== "string") continue;
    if (!Array.isArray(exerciseIds) || seen.has(id)) continue;
    seen.add(id);
    const ids = [
      ...new Set(
        exerciseIds.filter(
          (x): x is string => typeof x === "string" && getExercise(x) !== undefined,
        ),
      ),
    ].slice(0, MAX_EXERCISES);
    out.push({ id, name: name.trim().slice(0, MAX_NAME) || "루틴", exerciseIds: ids });
    if (out.length >= MAX_ROUTINES) break;
  }
  return out;
}

function read(): readonly Routine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeRoutines(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: readonly Routine[]) {
  routines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장소를 못 쓰는 환경에서는 이 탭 안에서만 유지한다.
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  routines = read();
  emit();
}

export function getSnapshot(): readonly Routine[] {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    routines = read();
  }
  return routines;
}

export function getServerSnapshot(): readonly Routine[] {
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

function update(id: string, fn: (r: Routine) => Routine) {
  const current = getSnapshot();
  if (!current.some((r) => r.id === id)) return;
  commit(current.map((r) => (r.id === id ? fn(r) : r)));
}

/** 새 루틴을 만들고 그 id 를 돌려준다. 너무 많으면 null. */
export function createRoutine(name: string): string | null {
  const current = getSnapshot();
  if (current.length >= MAX_ROUTINES) return null;
  const id = newId();
  const clean = name.trim().slice(0, MAX_NAME) || `루틴 ${current.length + 1}`;
  commit([...current, { id, name: clean, exerciseIds: [] }]);
  return id;
}

/** 이름을 바꾼다. 입력 도중에는 빈 이름도 잠깐 허용한다. (빈 채로 두면 화면에서 '루틴'으로 채운다) */
export function renameRoutine(id: string, name: string) {
  update(id, (r) => ({ ...r, name: name.slice(0, MAX_NAME) }));
}

export function deleteRoutine(id: string) {
  const current = getSnapshot();
  if (!current.some((r) => r.id === id)) return;
  commit(current.filter((r) => r.id !== id));
}

/** 루틴 맨 뒤에 운동을 담는다. 이미 있거나 모르는 운동이면 아무것도 하지 않는다. */
export function addExercise(id: string, exerciseId: string) {
  if (!getExercise(exerciseId)) return;
  update(id, (r) =>
    r.exerciseIds.includes(exerciseId) || r.exerciseIds.length >= MAX_EXERCISES
      ? r
      : { ...r, exerciseIds: [...r.exerciseIds, exerciseId] },
  );
}

export function removeExercise(id: string, exerciseId: string) {
  update(id, (r) => ({ ...r, exerciseIds: r.exerciseIds.filter((x) => x !== exerciseId) }));
}

/** 운동 하나를 한 칸 위(-1) 또는 아래(+1)로 옮긴다. */
export function moveExercise(id: string, exerciseId: string, delta: -1 | 1) {
  update(id, (r) => {
    const from = r.exerciseIds.indexOf(exerciseId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= r.exerciseIds.length) return r;
    const next = [...r.exerciseIds];
    [next[from], next[to]] = [next[to], next[from]];
    return { ...r, exerciseIds: next };
  });
}

/** 계정에서 불러온 목록으로 통째로 바꾼다. */
export function replaceRoutines(raw: unknown) {
  commit(sanitizeRoutines(raw));
}
