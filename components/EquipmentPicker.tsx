"use client";

import { useState } from "react";
import {
  BODY_PARTS,
  BODY_PART_LABELS,
  EQUIPMENT,
  EQUIPMENT_BY_ID,
  EQUIPMENT_GROUPS,
  KIND_LABELS,
  KIND_ORDER,
  equipmentForPart,
} from "@/lib/equipment";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import type { BodyPart, Equipment } from "@/lib/types";

function partsText(item: Equipment, current: BodyPart): string {
  const others = item.parts.filter((p) => p !== current);
  return others.length ? `다른 부위: ${others.map((p) => BODY_PART_LABELS[p]).join("·")}` : "";
}

/**
 * 운동 부위별로 기구를 고르는 화면.
 * 같은 기구는 어느 부위에서 골라도 하나의 선택 상태(equipmentStore)를 함께 쓴다.
 */
export default function EquipmentPicker() {
  const { ids, has, toggle, clear } = useOwnedEquipment();
  const [part, setPart] = useState<BodyPart>("chest");

  const items = equipmentForPart(part);

  function renderRow(item: Equipment) {
    const hint = partsText(item, part);
    return (
      <li key={item.id}>
        <label>
          <input type="checkbox" checked={has(item.id)} onChange={() => toggle(item.id)} />{" "}
          {item.name}
          {hint && (
            <>
              {" "}
              <small>({hint})</small>
            </>
          )}
        </label>
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

      <h3>선택한 기구 ({ids.length})</h3>
      {ids.length === 0 ? (
        <p>
          <small>아직 선택한 기구가 없습니다.</small>
        </p>
      ) : (
        <>
          <ul>
            {ids.map((id) => {
              const item = EQUIPMENT_BY_ID.get(id);
              if (!item) return null;
              return (
                <li key={id}>
                  {item.name}{" "}
                  <small>({item.parts.map((p) => BODY_PART_LABELS[p]).join("·")})</small>{" "}
                  <button type="button" onClick={() => toggle(id)}>
                    해제
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={clear}>
            모두 해제
          </button>
        </>
      )}
      <p>
        <small>전체 기구 {EQUIPMENT.length}종</small>
      </p>
    </section>
  );
}
