"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXERCISES } from "@/lib/data";
import { BODY_PARTS, BODY_PART_LABELS } from "@/lib/equipment";
import { filterByAreas, filterExercises } from "@/lib/filter";
import { AREAS_BY_PART, AREA_NOTE } from "@/lib/labels";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import type { AreaLabel, BodyPart } from "@/lib/types";

/**
 * 운동 시작 화면.
 * ① 오늘 운동할 부위 → ② 세부 부위 → ③ 내가 고른 기구로 할 수 있는 운동
 */
export default function WorkoutStart() {
  const { ids } = useOwnedEquipment();
  const [part, setPart] = useState<BodyPart | null>(null);
  const [picked, setPicked] = useState<AreaLabel[]>([]);

  const areas = part ? AREAS_BY_PART[part] : [];
  // 세부 부위를 하나도 안 고르면 그 부위 전체
  const targetAreas = picked.length > 0 ? picked : areas;

  const available = useMemo(() => filterExercises(EXERCISES, ids), [ids]);
  const results = useMemo(
    () => (part ? filterByAreas(available, targetAreas) : []),
    [available, part, targetAreas],
  );
  const partTotal = useMemo(
    () => (part ? filterByAreas(EXERCISES, targetAreas).length : 0),
    [part, targetAreas],
  );

  function choosePart(next: BodyPart) {
    setPart(next);
    setPicked([]);
  }

  function toggleArea(area: AreaLabel) {
    setPicked((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  return (
    <div>
      {ids.length === 0 && (
        <p role="status">
          선택한 기구가 없어서 <strong>맨몸 운동</strong>만 보입니다.{" "}
          <Link href="/equipment">기구 선택하러 가기</Link>
        </p>
      )}

      <section>
        <h2>오늘 어디를 운동할까요?</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BODY_PARTS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={part === p}
              onClick={() => choosePart(p)}
              style={{ fontWeight: part === p ? 700 : 400, padding: "8px 16px" }}
            >
              {BODY_PART_LABELS[p]}
            </button>
          ))}
        </div>
      </section>

      {part && (
        <section>
          <h2>{BODY_PART_LABELS[part]} 세부 부위</h2>
          <p>
            <small>
              여러 개를 고를 수 있습니다. 아무것도 안 고르면 {BODY_PART_LABELS[part]} 전체를 보여 줍니다.
            </small>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {areas.map((area) => (
              <label key={area}>
                <input
                  type="checkbox"
                  checked={picked.includes(area)}
                  onChange={() => toggleArea(area)}
                />{" "}
                {area}
                {AREA_NOTE[area] && <small> ({AREA_NOTE[area]})</small>}
              </label>
            ))}
          </div>
        </section>
      )}

      {part && (
        <section>
          <h2>할 수 있는 운동 ({results.length})</h2>
          {results.length === 0 ? (
            <p>
              {partTotal === 0
                ? "이 부위에는 아직 등록된 운동이 없습니다."
                : "지금 선택한 기구로는 할 수 있는 운동이 없습니다."}{" "}
              {partTotal > 0 && <Link href="/equipment">기구 더 선택하기</Link>}
            </p>
          ) : (
            <ul>
              {results.map((ex) => (
                <li key={ex.id}>
                  <Link href={`/exercises/${ex.id}`}>
                    <strong>{ex.name}</strong>
                  </Link>{" "}
                  <small>{ex.areas.join(" · ")}</small>
                </li>
              ))}
            </ul>
          )}
          {partTotal > results.length && results.length > 0 && (
            <p>
              <small>
                기구가 더 있으면 할 수 있는 운동이 {partTotal - results.length}개 더 있습니다.{" "}
                <Link href="/equipment">기구 선택하기</Link>
              </small>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
