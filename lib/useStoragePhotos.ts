import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/client";

const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

type Photos = Record<string, string>;
const caches = new Map<string, Promise<Photos>>();

/**
 * Supabase Storage 의 공개 버킷에 올라온 사진을 한 번만 읽어 {id: 사진 주소} 로 만든다.
 * 파일 이름(확장자 빼고)이 id 와 같아야 하고, isValidId 가 false 인 이름은 건너뛴다.
 */
function loadPhotos(bucket: string, isValidId: (id: string) => boolean): Promise<Photos> {
  let cached = caches.get(bucket);
  if (!cached) {
    cached = (async () => {
      if (!isSupabaseConfigured) return {};
      const storage = createClient().storage.from(bucket);
      const { data, error } = await storage.list("", { limit: 300 });
      if (error || !data) {
        caches.delete(bucket); // 다음에 다시 시도할 수 있게 비운다.
        return {};
      }
      const photos: Photos = {};
      for (const file of data) {
        if (!IMAGE_FILE.test(file.name)) continue;
        const id = file.name.replace(IMAGE_FILE, "");
        if (!isValidId(id)) continue;
        const url = storage.getPublicUrl(file.name).data.publicUrl;
        // 같은 이름으로 다시 올린 사진이 바로 바뀌어 보이도록 수정 시각을 붙인다.
        const version = file.updated_at ? Date.parse(file.updated_at) : 0;
        photos[id] = version ? `${url}?v=${version}` : url;
      }
      return photos;
    })();
    caches.set(bucket, cached);
  }
  return cached;
}

/** id → 사진 주소. 사진이 없는 id 는 키가 없다. */
export function useStoragePhotos(bucket: string, isValidId: (id: string) => boolean): Photos {
  const [photos, setPhotos] = useState<Photos>({});
  useEffect(() => {
    let alive = true;
    loadPhotos(bucket, isValidId).then((p) => {
      if (alive) setPhotos(p);
    });
    return () => {
      alive = false;
    };
  }, [bucket, isValidId]);
  return photos;
}
