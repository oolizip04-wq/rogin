"use client";

import { useState } from "react";
import {
  BRANCHES,
  CUSTOM,
  DIRECT,
  MAX_UNIT_NAME,
  UNIT_TREE,
  composeUnitName,
  type Branch,
  type UnitNode,
} from "@/lib/units";

export type UnitValue = { branch: Branch; name: string };

type Props = {
  /** 필수 단계(첫 단계)까지 채워지면 값을, 아니면 null 을 넘긴다. */
  onChange: (value: UnitValue | null) => void;
};

type Pick = { value: string; custom: string };
type Level = {
  label: string;
  options: UnitNode[];
  /** 드롭다운에 보여 줄 '직할' 항목 이름 */
  directLabel: string;
  /** '직할'을 골랐을 때 부대 이름에 붙일 글자 */
  directPart: string;
};

/** 지금까지의 선택을 따라 내려가며 화면에 보여 줄 단계들을 만든다. */
function buildLevels(branch: Branch | "", picks: Pick[]): Level[] {
  if (!branch) return [];
  const levels: Level[] = [];
  let options = UNIT_TREE[branch].children;
  let label = UNIT_TREE[branch].childLabel;
  let parent: string | null = null;
  for (let depth = 0; ; depth++) {
    levels.push({
      label,
      options,
      directLabel: parent
        ? `${parent} 직할`
        : branch === "해병대"
          ? "해병대사령부 직할"
          : `${branch}본부 직할`,
      directPart: parent ? "직할" : branch === "해병대" ? "사령부 직할" : "본부 직할",
    });
    const pick = picks[depth];
    if (!pick?.value || pick.value === CUSTOM || pick.value === DIRECT) break;
    const node = options.find((o) => o.name === pick.value);
    if (!node?.children) break;
    options = node.children;
    label = node.childLabel ?? "하위 부대";
    parent = node.name;
  }
  return levels;
}

function partsOf(levels: Level[], picks: Pick[]): string[] {
  return levels.map((level, i) => {
    const pick = picks[i];
    if (!pick?.value) return "";
    if (pick.value === DIRECT) return level.directPart;
    return pick.value === CUSTOM ? pick.custom.trim() : pick.value;
  });
}

export default function UnitPicker({ onChange }: Props) {
  const [branch, setBranch] = useState<Branch | "">("");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [detail, setDetail] = useState("");

  function emit(b: Branch | "", p: Pick[], d: string) {
    if (!b) return onChange(null);
    const levels = buildLevels(b, p);
    const parts = [...partsOf(levels, p), d];
    const name = composeUnitName(b, parts);
    const firstFilled = Boolean(partsOf(levels, p)[0]);
    onChange(firstFilled && name.length <= MAX_UNIT_NAME ? { branch: b, name } : null);
  }

  function changeBranch(next: Branch | "") {
    setBranch(next);
    setPicks([]);
    setDetail("");
    emit(next, [], "");
  }

  function changePick(depth: number, patch: Partial<Pick>) {
    // 윗단계를 바꾸면 그 아래 단계 선택은 모두 지운다.
    const next = picks.slice(0, depth + 1);
    const current = next[depth] ?? { value: "", custom: "" };
    const merged = { ...current, ...patch };
    if (patch.value !== undefined && patch.value !== current.value) {
      merged.custom = "";
    }
    next[depth] = merged;
    setPicks(next);
    emit(branch, next, detail);
  }

  function changeDetail(value: string) {
    setDetail(value);
    emit(branch, picks, value);
  }

  const levels = buildLevels(branch, picks);
  const preview = branch
    ? composeUnitName(branch, [...partsOf(levels, picks), detail])
    : "";

  return (
    <fieldset>
      <legend>소속 부대</legend>

      <p>
        <label>
          군
          <br />
          <select
            value={branch}
            onChange={(e) => changeBranch(e.target.value as Branch | "")}
            required
          >
            <option value="">선택하세요</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </p>

      {levels.map((level, depth) => {
        const pick = picks[depth] ?? { value: "", custom: "" };
        return (
          <p key={`${branch}-${depth}-${level.label}`}>
            <label>
              {level.label}
              {depth === 0 ? "" : " (선택)"}
              <br />
              <select
                value={pick.value}
                onChange={(e) => changePick(depth, { value: e.target.value })}
                required={depth === 0}
              >
                <option value="">{depth === 0 ? "선택하세요" : "선택 안 함"}</option>
                {level.options.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
                <option value={DIRECT}>{level.directLabel}</option>
                <option value={CUSTOM}>목록에 없음 (직접 입력)</option>
              </select>
            </label>
            {pick.value === CUSTOM && (
              <input
                type="text"
                value={pick.custom}
                onChange={(e) => changePick(depth, { custom: e.target.value })}
                maxLength={30}
                required={depth === 0}
                placeholder="부대 이름 (별칭 가능)"
                style={{ width: "100%" }}
              />
            )}
          </p>
        );
      })}

      {branch && (
        <p>
          <label>
            세부 부대 (선택)
            <br />
            <input
              type="text"
              value={detail}
              onChange={(e) => changeDetail(e.target.value)}
              maxLength={30}
              placeholder="연대·대대 등 (별칭 가능)"
              style={{ width: "100%" }}
            />
          </label>
        </p>
      )}

      {preview && <p>선택한 부대: {preview}</p>}
      <small>
        정확한 위치나 상세 정보는 쓰지 마세요. 세부 부대는 별칭으로 적어도 됩니다.
      </small>
    </fieldset>
  );
}
