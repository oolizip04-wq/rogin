"use client";

import { useRef, useState } from "react";
import {
  BODY_PARTS,
  BODY_PART_LABELS,
  EQUIPMENT_BY_ID,
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

/** 화면 아래 장바구니 막대의 높이(px) */
const CART_BAR_HEIGHT = 52;

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
 * 부위별 폴더로 기구를 고르는 화면.
 *  - 부위(폴더)를 누르면 그 폴더가 열리고 그 부위에 쓰는 기구가 나온다. (한 번에 하나만 열린다)
 *  - 폴더 맨 아래 [저장]을 누르면 그 폴더가 닫히고 다음 부위 폴더가 열린다.
 *  - 선택은 기구 id 기준으로 하나만 관리하므로, 다른 폴더에서도 같은 기구는 선택된 채로 보인다.
 */
export default function EquipmentPicker() {
  const { ids, has, toggle, clear } = useOwnedEquipment();
  const [openPart, setOpenPart] = useState<BodyPart | null>(null);
  const [saved, setSaved] = useState<BodyPart[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const photos = useEquipmentPhotos();
  const folderRefs = useRef<Partial<Record<BodyPart, HTMLElement | null>>>({});
  const endRef = useRef<HTMLDivElement | null>(null);

  const unclassified = unclassifiedEquipment();

  function scrollTo(el: HTMLElement | null | undefined) {
    // 폴더가 열려 화면이 바뀐 뒤에 위치를 맞춘다.
    setTimeout(() => el?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function toggleFolder(part: BodyPart) {
    setOpenPart((cur) => (cur === part ? null : part));
  }

  /** 지금 폴더를 저장하고 닫은 뒤, 다음 부위 폴더를 연다. 마지막이면 모두 닫고 맨 아래로 간다. */
  function saveAndNext(part: BodyPart) {
    setSaved((cur) => (cur.includes(part) ? cur : [...cur, part]));
    const index = BODY_PARTS.indexOf(part);
    const next = BODY_PARTS[index + 1];
    if (next) {
      setOpenPart(next);
      scrollTo(folderRefs.current[next]);
    } else {
      setOpenPart(null);
      scrollTo(endRef.current);
    }
  }

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

  function renderFolderBody(part: BodyPart) {
    // 이미 고른 기구는 장바구니(화면 아래 막대)로 옮겨 가서 여기서는 빠진다.
    const items = equipmentForPart(part).filter((e) => !has(e.id));
    const index = BODY_PARTS.indexOf(part);
    const next = BODY_PARTS[index + 1];

    return (
      <div role="region" aria-label={`${BODY_PART_LABELS[part]} 기구`}>
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
                return (
                  <details key={group.id}>
                    <summary>
                      {group.name} (남은 {members.length}종)
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

        {items.length === 0 && (
          <p>
            <small>이 부위에 쓰는 기구는 모두 선택했습니다.</small>
          </p>
        )}

        {/* 스크롤을 내려도 [저장]이 화면 아래에 붙어 있어서 바로 누를 수 있다. (아래 장바구니 막대 위에 놓인다) */}
        <div
          style={{
            position: "sticky",
            bottom: CART_BAR_HEIGHT,
            padding: "8px 0",
            background: "Canvas",
            color: "CanvasText",
          }}
        >
          <button
            type="button"
            onClick={() => saveAndNext(part)}
            style={{ padding: "10px 20px", fontWeight: 700 }}
          >
            {next ? `저장 · 다음: ${BODY_PART_LABELS[next]}` : "저장하고 끝내기"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <h2>우리 체단실 기구</h2>
      <p>
        부위 폴더를 열어 있는 기구를 선택하고 <strong>저장</strong>을 누르면 다음 부위로
        넘어갑니다. 같은 기구는 다른 폴더에서도 선택된 채로 보입니다.
      </p>

      {BODY_PARTS.map((part) => {
        const open = openPart === part;
        const count = equipmentForPart(part).filter((e) => has(e.id)).length;
        const isSaved = saved.includes(part);
        return (
          <div
            key={part}
            ref={(el) => {
              folderRefs.current[part] = el;
            }}
            style={{ marginBottom: 8 }}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggleFolder(part)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                fontSize: 18,
                fontWeight: open ? 700 : 500,
              }}
            >
              {open ? "▼" : "▶"} {BODY_PART_LABELS[part]}
              {count > 0 && <small> · 선택 {count}종</small>}
              {isSaved && <small> · ✓ 저장됨</small>}
            </button>
            {open && renderFolderBody(part)}
          </div>
        );
      })}

      <div ref={endRef} />

      {/* 장바구니 막대가 마지막 내용을 가리지 않게 아래에 빈 공간을 둔다. */}
      <div style={{ height: CART_BAR_HEIGHT + 24 }} />

      {/* 장바구니: 고른 기구가 여기로 모인다. 화면 아래에 고정되어 있고, 누르면 위로 펼쳐진다. */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          background: "Canvas",
          color: "CanvasText",
          borderTop: "1px solid currentColor",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {cartOpen && (
            <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "8px 16px" }}>
              {ids.length === 0 ? (
                <p>
                  <small>아직 선택한 기구가 없습니다.</small>
                </p>
              ) : (
                <>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {ids.map((id) => {
                      const item = EQUIPMENT_BY_ID.get(id);
                      if (!item) return null;
                      return (
                        <li
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 0",
                          }}
                        >
                          <span style={{ flex: 1 }}>
                            {item.name}
                            {SHOW_PART_BADGE && (
                              <small style={badgeStyle}>
                                {item.parts.map((p) => BODY_PART_LABELS[p]).join(" · ")}
                              </small>
                            )}
                          </span>
                          <button type="button" onClick={() => toggle(id)}>
                            해제
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p>
                    <button type="button" onClick={clear}>
                      모두 해제
                    </button>
                  </p>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setCartOpen((v) => !v)}
            aria-expanded={cartOpen}
            style={{
              display: "block",
              width: "100%",
              height: CART_BAR_HEIGHT,
              textAlign: "left",
              padding: "0 16px",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              background: "transparent",
              color: "inherit",
            }}
          >
            🛒 선택한 기구 {ids.length}종 {cartOpen ? "▼" : "▲"}
          </button>
        </div>
      </div>

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
