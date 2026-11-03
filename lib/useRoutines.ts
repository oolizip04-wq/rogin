import { useSyncExternalStore } from "react";
import {
  addExercise,
  createRoutine,
  deleteRoutine,
  getServerSnapshot,
  getSnapshot,
  moveExercise,
  removeExercise,
  renameRoutine,
  subscribe,
} from "./routineStore";

/** 내 루틴 목록과, 어디서든 같은 상태를 바꾸는 함수들 */
export function useRoutines() {
  const routines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    routines,
    create: createRoutine,
    rename: renameRoutine,
    remove: deleteRoutine,
    add: addExercise,
    removeExercise,
    move: moveExercise,
  };
}
