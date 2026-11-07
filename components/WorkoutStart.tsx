"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MuscleMap from "@/components/MuscleMap";
import { EXERCISES } from "@/lib/data";
import { BODY_PART_LABELS } from "@/lib/equipment";
import { filterByAreas, filterExercises } from "@/lib/filter";
import { AREAS_BY_PART, AREA_INFO, AREA_NOTE } from "@/lib/labels";
import { useExercisePhotos } from "@/lib/useExercisePhotos";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import type { AreaLabel, BodyPart, Exercise } from "@/lib/types";

/** 운동이 속한 큰 부위 (가장 먼저 적힌 세부 부위 기준) */
function primaryPart(ex: Exercise): BodyPart {
  return AREA_INFO[ex.areas[0]].part;
}

/**
 * 내 체단실에서 가능한 운동.
 * 부위를 세로로 나열하고, 각 부위 안에서 운동을 한 줄에 두 개씩 이미지와 함께 보여 준다.
 * 운동 이미지는 Supabase Storage 의 exercises 저장소에 올린 사진(파일 이름 = 운동 id)이고,
 * 아직 없으면 그 운동이 쓰는 근육을 칠한 몸 그림을 대신 보여 준다.
 */
/** 부위 탭: 한 줄에 두 개씩, 가슴·등 / 어깨·하체 / 팔·복근 순서 */
const TABS: { part: BodyPart; label: string }[] = [
  { part: "chest", label: "가슴" },
  { part: "back", label: "등" },
  { part: "shoulders", label: "어깨" },
  { part: "legs", label: "하체" },
  { part: "arms", label: "팔" },
  { part: "abs", label: "복근" },
];

export default function WorkoutStart() {
  const { ids, syncing } = useOwnedEquipment();
  const photos = useExercisePhotos();
  const [tab, setTab] = useState<BodyPart>("chest");
  const [filters, setFilters] = useState<Partial<Record<BodyPart, AreaLabel[]>>>({});

  const available = useMemo(() => filterExercises(EXERCISES, ids), [ids]);

  function toggleArea(part: BodyPart, area: AreaLabel) {
    setFilters((prev) => {
      const cur = prev[part] ?? [];
      const next = cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area];
      return { ...prev, [part]: next };
    });
  }

  return (
    <div>
      {!syncing && ids.length === 0 && (
        <p role="status">
          선택한 기구가 없어서 <strong>맨몸 운동</strong>만 보입니다.{" "}
          <Link href="/equipment?edit=1">기구 선택하러 가기</Link>
        </p>
      )}

      <div
        role="tablist"
        aria-label="운동 부위"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "4px 0 20px" }}
      >
        {TABS.map(({ part, label }) => {
          const on = tab === part;
          return (
            <button
              key={part}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(part)}
              style={{
                padding: "14px 0",
                fontSize: 17,
                fontWeight: 800,
                color: on ? "var(--cream)" : "var(--ink)",
                background: on ? "var(--rust)" : "var(--cream)",
                border: `1px solid ${on ? "#8e3d29" : "#b5b09a"}`,
                boxShadow: on ? "none" : "3px 3px 0 var(--shadow)",
                cursor: "pointer",
              }}
            >
              {label}
              <small style={{ marginLeft: 6, fontWeight: 600, opacity: 0.8 }}>
                {available.filter((ex) => primaryPart(ex) === part).length}
              </small>
            </button>
          );
        })}
      </div>

      {[tab].map((part) => {
        const inPart = available.filter((ex) => primaryPart(ex) === part);
        const total = EXERCISES.filter((ex) => primaryPart(ex) === part).length;
        if (total === 0) return null;

        const areas = AREAS_BY_PART[part];
        const picked = filters[part] ?? [];
        const list = picked.length > 0 ? filterByAreas(inPart, picked) : inPart;

        return (
          <section key={part} style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 6 }}>
              {BODY_PART_LABELS[part]}{" "}
              <small style={{ fontWeight: 400 }}>
                ({list.length}개{total > inPart.length ? ` · 기구가 더 있으면 ${total - inPart.length}개 더` : ""})
              </small>
            </h2>

            {areas.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <button
                  type="button"
                  aria-pressed={picked.length === 0}
                  onClick={() => setFilters((prev) => ({ ...prev, [part]: [] }))}
                  style={{ fontSize: 13, padding: "3px 10px", fontWeight: picked.length === 0 ? 700 : 400 }}
                >
                  전체보기
                </button>
                {areas.map((area) => {
                  const on = picked.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleArea(part, area)}
                      style={{ fontSize: 13, padding: "3px 10px", fontWeight: on ? 700 : 400 }}
                      title={AREA_NOTE[area]}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            )}

            {list.length === 0 ? (
              <p>
                <small>
                  {inPart.length === 0
                    ? "지금 가진 기구로 할 수 있는 운동이 아직 없습니다."
                    : "고른 세부 부위에 해당하는 운동이 없습니다."}
                </small>
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {list.map((ex) => (
                  <li key={ex.id}>
                    <Link
                      href={`/exercises/${ex.id}`}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                        border: "1px solid currentColor",
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ aspectRatio: "4 / 3", background: "#eef1f5" }}>
                        {photos[ex.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photos[ex.id]}
                            alt={`${ex.name} 운동법`}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <MuscleMap muscles={ex.muscles} compact />
                        )}
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <strong>{ex.name}</strong>
                        <br />
                        <small>{ex.areas.join(" · ")}</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
