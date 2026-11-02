import { useEffect, useState } from "react";
import { EQUIPMENT_BY_ID } from "./equipment";
import { createClient, isSupabaseConfigured } from "./supabase/client";

/** Supabase Storage 의 공개 버킷 이름. supabase/schema.sql 에서 만든다. */
const BUCKET = "equipment";
const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

let cache: Promise<Record<string, string>> | null = null;

/**
 * 버킷에 올라온 사진 파일을 한 번만 읽어 {기구 id: 사진 주소} 로 만든다.
 * 파일 이름이 기구 id 와 같아야 한다. (예: dumbbell.jpg)
 */
function loadPhotos(): Promise<Record<string, string>> {
  if (!cache) {
    cache = (async () => {
      if (!isSupabaseConfigured) return {};
      const storage = createClient().storage.from(BUCKET);
      const { data, error } = await storage.list("", { limit: 200 });
      if (error || !data) {
        cache = null; // 다음에 다시 시도할 수 있게 비운다.
        return {};
      }
      const photos: Record<string, string> = {};
      for (const file of data) {
        if (!IMAGE_FILE.test(file.name)) continue;
        const id = file.name.replace(IMAGE_FILE, "");
        if (!EQUIPMENT_BY_ID.has(id)) continue;
        const url = storage.getPublicUrl(file.name).data.publicUrl;
        // 같은 이름으로 다시 올린 사진이 바로 바뀌어 보이도록 수정 시각을 붙인다.
        const version = file.updated_at ? Date.parse(file.updated_at) : 0;
        photos[id] = version ? `${url}?v=${version}` : url;
      }
      return photos;
    })();
  }
  return cache;
}

/** 기구 id → 사진 주소. 사진이 없는 기구는 키가 없다. */
export function useEquipmentPhotos(): Record<string, string> {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    loadPhotos().then((p) => {
      if (alive) setPhotos(p);
    });
    return () => {
      alive = false;
    };
  }, []);
  return photos;
}
