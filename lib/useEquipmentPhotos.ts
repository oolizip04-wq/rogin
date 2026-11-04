import { EQUIPMENT_BY_ID } from "./equipment";
import { useStoragePhotos } from "./useStoragePhotos";

/** Supabase Storage 의 공개 버킷 이름. supabase/schema.sql 에서 만든다. */
const BUCKET = "equipment";

const isEquipmentId = (id: string) => EQUIPMENT_BY_ID.has(id);

/** 기구 id → 사진 주소. 파일 이름이 기구 id 와 같아야 한다. (예: dumbbell.jpg) */
export function useEquipmentPhotos(): Record<string, string> {
  return useStoragePhotos(BUCKET, isEquipmentId);
}
