"use client";

import { useState } from "react";
import {
  BODY_PARTS,
  BODY_PART_LABELS,
  EQUIPMENT_GROUPS,
  KIND_LABELS,
  KIND_ORDER,
  equipmentForPart,
  unclassifiedEquipment,
} from "@/lib/equipment";
import { EQUIPMENT_ILLUSTRATIONS, EQUIPMENT_INFO } from "@/lib/equipmentInfo";
import { useEquipmentPhotos } from "@/lib/useEquipmentPhotos";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import type { BodyPart, Equipment } from "@/lib/types";

/** 기구 이름 옆에 쓸 수 있는 부위를 작은 표로 보여 줄지. 안 보이게 하려면 false 로 바꾸세요. */
const SHOW_PART_BADGE = true;

const badgeStyle = {
  display: "inline-block",
  marginLeft: 6,
  padding: "0 8px",
  border: "1px solid currentColor",
  borderRadius: 12,
  opacity: 0.75,
  // 좁은 화면에서는 부위가 많으면 줄을 바꿔 화면 밖으로 넘치지 않게 한다.
  maxWidth: "100%",
  overflowWrap: "anywhere" as const,
};

/**
 * 운동 부위별로 기구를 고르는 화면.
 * 같은 기구는 어느 부위에서 골라도 하나의 선택 상태(equipmentStore)를 함께 쓴다.
 */
export default function EquipmentPicker() {
  const { ids, has, toggle, clear } = useOwnedEquipment();
  const [part, setPart] = useState<BodyPart>("chest");
  const photos = useEquipmentPhotos();

  const items = equipmentForPart(part);
  const unclassified = unclassifiedEquipment();

  function renderRow(item: Equipment) {
    // 실제 사진이 있으면 사진, 없으면 임시 일러스트
    const drawing = EQUIPMENT_ILLUSTRATIONS.has(item.id)
      ? `/equipment/${item.id}.svg`
      : undefined;
    const photo = photos[item.id] ?? drawing;
    const selected = has(item.id);
    const partNames = item.parts.map((p) => BODY_PART_LABELS[p]).join(" · ");
    return (
      <li key={item.id}>
        <label>
          <input type="checkbox" checked={selected} onChange={() => toggle(item.id)} />{" "}
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              style={{ objectFit: "cover", verticalAlign: "middle" }}
            />
          )}{" "}
          {item.name}
          {SHOW_PART_BADGE && (
            <small style={badgeStyle}>
              {item.parts.length > 1 ? `여러 부위 가능 · ${partNames}` : partNames}
            </small>
          )}
          {selected && (
            <small style={{ marginLeft: 6, fontWeight: 700 }}>✓ 선택됨</small>
          )}
        </label>
        <details>
          <summary>
            <small>설명 보기</small>
          </summary>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={item.name}
              width={240}
              loading="lazy"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          ) : (
            <p>
              <small>사진 준비 중</small>
            </p>
          )}
          <p>{EQUIPMENT_INFO[item.id]}</p>
        </details>
      </li>
    );
  }

  return (
    <section>
      <h2>우리 체단실 기구</h2>
      <p>부위를 눌러 있는 기구를 모두 선택하세요. 같은 기구는 다른 부위에서도 선택된 상태로 보입니다.</p>

      <div role="tablist" aria-label="운동 부위" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {BODY_PARTS.map((p) => {
          const count = equipmentForPart(p).filter((e) => has(e.id)).length;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={part === p}
              onClick={() => setPart(p)}
              style={{ fontWeight: part === p ? 700 : 400 }}
            >
              {BODY_PART_LABELS[p]}
              {count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {KIND_ORDER.map((kind) => {
          const kindItems = items.filter((e) => e.kind === kind);
          if (kindItems.length === 0) return null;

          const groups = EQUIPMENT_GROUPS.filter((g) => g.kind === kind);
          const loose = kindItems.filter((e) => !e.group);

          return (
            <fieldset key={kind}>
              <legend>{KIND_LABELS[kind]}</legend>
              {loose.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {loose.map(renderRow)}
                </ul>
              )}
              {groups.map((group) => {
                const members = kindItems.filter((e) => e.group === group.id);
                if (members.length === 0) return null;
                const picked = members.filter((e) => has(e.id)).length;
                return (
                  <details key={group.id}>
                    <summary>
                      {group.name} ({picked}/{members.length})
                    </summary>
                    <ul style={{ listStyle: "none", paddingLeft: 16 }}>
                      {members.map(renderRow)}
                    </ul>
                  </details>
                );
              })}
            </fieldset>
          );
        })}
      </div>

      {ids.length > 0 && (
        <p>
          <small>선택한 기구 {ids.length}종</small>{" "}
          <button type="button" onClick={clear}>
            모두 해제
          </button>
        </p>
      )}

      {/* 개발 중에만 보입니다. 분류표(lib/classification.ts)에서 부위를 아직 안 정한 기구입니다. */}
      {process.env.NODE_ENV !== "production" && unclassified.length > 0 && (
        <details>
          <summary>
            <small>[개발용] 부위가 아직 없는 기구 ({unclassified.length}) — 화면에 안 나옵니다</small>
          </summary>
          <ul>
            {unclassified.map((e) => (
              <li key={e.id}>
                <small>{e.name}</small>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
