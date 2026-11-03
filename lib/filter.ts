import type { AreaLabel, Exercise } from "./types";

/** 고른 세부 부위 중 하나라도 주로 쓰는 운동만 돌려준다. */
export function filterByAreas(
  exercises: Exercise[],
  areas: readonly AreaLabel[],
): Exercise[] {
  return exercises.filter((ex) => ex.areas.some((a) => areas.includes(a)));
}

/**
 * 선택한 기구만으로 할 수 있는 운동(맨몸 운동 포함)만 돌려준다.
 * 필요 기구가 배열이면 그중 하나만 있어도 된다.
 */
export function filterExercises(
  exercises: Exercise[],
  ownedEquipmentIds: readonly string[],
): Exercise[] {
  const owned = new Set(ownedEquipmentIds);
  return exercises.filter((ex) =>
    ex.requires.every((req) =>
      Array.isArray(req) ? req.some((id) => owned.has(id)) : owned.has(req),
    ),
  );
}
