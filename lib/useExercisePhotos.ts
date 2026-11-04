import { getExercise } from "./data";
import { useStoragePhotos } from "./useStoragePhotos";

/** 운동 이미지 버킷. supabase/schema.sql 에서 만든다. */
const BUCKET = "exercises";

const isExerciseId = (id: string) => getExercise(id) !== undefined;

/** 운동 id → 이미지 주소. 파일 이름이 운동 id 와 같아야 한다. (예: pushup.jpg) */
export function useExercisePhotos(): Record<string, string> {
  return useStoragePhotos(BUCKET, isExerciseId);
}
