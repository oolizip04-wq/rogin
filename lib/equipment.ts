import type {
  BodyPart,
  Equipment,
  EquipmentGroup,
  EquipmentKind,
} from "./types";

export const BODY_PARTS: BodyPart[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "abs",
];

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  arms: "팔",
  legs: "하체",
  abs: "복근",
};

/** 한 부위 안에서 보여 줄 갈래의 순서와 이름 */
export const KIND_ORDER: EquipmentKind[] = [
  "free",
  "bench",
  "rack",
  "cable",
  "machine",
  "attachment",
  "station",
  "cardio",
  "accessory",
];

export const KIND_LABELS: Record<EquipmentKind, string> = {
  free: "프리웨이트",
  bench: "벤치",
  rack: "랙 · 스미스 머신",
  cable: "케이블",
  machine: "머신",
  attachment: "케이블 그립 · 바",
  station: "철봉 · 평행봉",
  cardio: "유산소",
  accessory: "소도구",
};

/** 가슴·등·어깨·팔·하체 (복근은 따로 적는다) */
const ALL: BodyPart[] = ["chest", "back", "shoulders", "arms", "legs"];

/**
 * 기구는 여기 한 번만 등록한다. 여러 부위에서 쓰는 기구도 항목은 하나이고,
 * parts 에 쓸 수 있는 부위를 모두 적는다. (화면은 이 정보로 각 부위에 같은 항목을 보여 준다)
 * 초안입니다. 부위 연결은 실제 체단실 기준으로 검수하세요.
 */
export const EQUIPMENT: Equipment[] = [
  // 프리웨이트: 하나로 뭉치지 않고 각각 따로 선택한다.
  { id: "dumbbell", name: "덤벨", kind: "free", parts: ALL },
  { id: "barbell", name: "바벨", kind: "free", parts: ALL },
  { id: "ez-bar", name: "EZ바", kind: "free", parts: ["arms", "shoulders"] },
  { id: "trap-bar", name: "트랩바 (헥스바)", kind: "free", parts: ["back", "legs", "shoulders"] },
  { id: "kettlebell", name: "케틀벨", kind: "free", parts: ["shoulders", "back", "legs"] },

  // 벤치
  { id: "flat-bench", name: "플랫 벤치", kind: "bench", parts: ["chest", "shoulders", "arms", "back"] },
  { id: "incline-bench", name: "인클라인 벤치", kind: "bench", parts: ["chest", "shoulders", "arms"] },
  { id: "decline-bench", name: "디클라인 벤치", kind: "bench", parts: ["chest", "arms"] },
  { id: "adjustable-bench", name: "각도조절 벤치", kind: "bench", parts: ["chest", "shoulders", "arms", "back", "abs"] },
  { id: "situp-bench", name: "싯업 벤치", kind: "bench", parts: ["abs"] },
  { id: "preacher-bench", name: "프리처 컬 벤치", kind: "bench", parts: ["arms"] },
  { id: "back-extension-bench", name: "백 익스텐션 벤치", kind: "bench", parts: ["back", "legs"] },

  // 랙 · 스미스 머신
  { id: "bench-press-rack", name: "벤치프레스 랙", kind: "rack", parts: ["chest"] },
  { id: "squat-rack", name: "스쿼트 랙", kind: "rack", parts: ["legs", "shoulders"] },
  { id: "power-rack", name: "파워 랙", kind: "rack", parts: ["chest", "back", "shoulders", "legs"] },
  { id: "smith-machine", name: "스미스 머신", kind: "rack", parts: ["chest", "shoulders", "legs", "back"] },

  // 케이블
  { id: "cable-machine", name: "케이블 머신 (멀티 풀리)", kind: "cable", parts: [...ALL, "abs"] },
  { id: "cable-crossover", name: "케이블 크로스오버", kind: "cable", parts: ["chest", "shoulders", "arms"] },
  { id: "lat-pulldown", name: "랫풀다운 머신", kind: "cable", parts: ["back", "arms"] },
  { id: "seated-row", name: "시티드 로우 머신", kind: "cable", parts: ["back"] },

  // 머신
  { id: "chest-press-machine", name: "체스트 프레스 머신", kind: "machine", parts: ["chest"] },
  { id: "pec-deck", name: "펙덱 (버터플라이) 머신", kind: "machine", parts: ["chest", "shoulders"] },
  { id: "shoulder-press-machine", name: "숄더 프레스 머신", kind: "machine", parts: ["shoulders"] },
  { id: "lateral-raise-machine", name: "사이드 레터럴 레이즈 머신", kind: "machine", parts: ["shoulders"] },
  { id: "t-bar-row", name: "티바 로우 머신", kind: "machine", parts: ["back"] },
  { id: "assisted-pullup-machine", name: "어시스트 풀업 머신", kind: "machine", parts: ["back", "arms"] },
  { id: "biceps-curl-machine", name: "바이셉스 컬 머신", kind: "machine", parts: ["arms"] },
  { id: "triceps-extension-machine", name: "트라이셉스 익스텐션 머신", kind: "machine", parts: ["arms"] },
  { id: "leg-press-machine", name: "레그 프레스 머신", kind: "machine", parts: ["legs"] },
  { id: "leg-extension-machine", name: "레그 익스텐션 머신", kind: "machine", parts: ["legs"] },
  { id: "leg-curl-machine", name: "레그 컬 머신", kind: "machine", parts: ["legs"] },
  { id: "hack-squat-machine", name: "핵 스쿼트 머신", kind: "machine", parts: ["legs"] },
  { id: "hip-abduction-machine", name: "힙 어브덕션 · 어덕션 머신", kind: "machine", parts: ["legs"] },
  { id: "calf-raise-machine", name: "카프 레이즈 머신", kind: "machine", parts: ["legs"] },
  { id: "ab-crunch-machine", name: "복근 크런치 머신", kind: "machine", parts: ["abs"] },

  // 케이블 그립 · 바 (묶음을 펼쳐 종류별로 선택)
  { id: "rope", name: "로프", kind: "attachment", group: "cable-grips", parts: ["arms", "shoulders", "back", "abs"] },
  // 케이블 머신에 다는 일자 손잡이 바입니다. 벤치프레스에 쓰는 바는 '바벨'입니다.
  { id: "straight-bar", name: "스트레이트 바 (케이블용 일자 바)", kind: "attachment", group: "cable-grips", parts: ["back", "arms", "shoulders"] },
  { id: "v-bar", name: "V바", kind: "attachment", group: "cable-grips", parts: ["back", "arms"] },
  { id: "wide-lat-bar", name: "와이드 랫 바", kind: "attachment", group: "cable-grips", parts: ["back"] },
  { id: "d-handle", name: "D핸들 (싱글 핸들)", kind: "attachment", group: "cable-grips", parts: ["chest", "back", "shoulders", "arms"] },
  { id: "ankle-strap", name: "앵클 스트랩", kind: "attachment", group: "cable-grips", parts: ["legs"] },

  // 철봉 · 평행봉
  { id: "pullup-bar", name: "풀업바 (철봉)", kind: "station", group: "bar-stations", parts: ["back", "arms", "abs"] },
  { id: "multigrip-pullup-bar", name: "멀티 그립 풀업바", kind: "station", group: "bar-stations", parts: ["back", "arms", "abs"] },
  { id: "parallel-bars", name: "평행봉", kind: "station", group: "bar-stations", parts: ["chest", "arms", "abs"] },
  { id: "captains-chair", name: "캡틴스 체어 (레그레이즈 스테이션)", kind: "station", group: "bar-stations", parts: ["abs", "chest", "arms"] },

  // 유산소
  { id: "treadmill", name: "러닝머신", kind: "cardio", parts: ["legs"] },
  { id: "stationary-bike", name: "실내 자전거", kind: "cardio", parts: ["legs"] },

  // 소도구
  { id: "ab-wheel", name: "복근 롤러", kind: "accessory", parts: ["abs"] },
  { id: "gym-ball", name: "짐볼", kind: "accessory", parts: ["abs"] },
  { id: "exercise-mat", name: "운동 매트", kind: "accessory", parts: ["abs"] },
];

export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  { id: "cable-grips", name: "케이블 그립 · 바 종류", kind: "attachment" },
  { id: "bar-stations", name: "철봉 · 평행봉 종류", kind: "station" },
];

export const EQUIPMENT_BY_ID: ReadonlyMap<string, Equipment> = new Map(
  EQUIPMENT.map((e) => [e.id, e]),
);

/** 등록 내용이 어긋나지 않았는지 확인한다. 문제가 있으면 문장 목록을 돌려준다. */
export function validateEquipment(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const groupIds = new Set(EQUIPMENT_GROUPS.map((g) => g.id));
  for (const e of EQUIPMENT) {
    if (seen.has(e.id)) problems.push(`기구 id 가 중복됩니다: ${e.id}`);
    seen.add(e.id);
    if (e.parts.length === 0) problems.push(`운동 부위가 없습니다: ${e.id}`);
    if (new Set(e.parts).size !== e.parts.length) {
      problems.push(`운동 부위가 겹칩니다: ${e.id}`);
    }
    if (e.group && !groupIds.has(e.group)) {
      problems.push(`없는 묶음입니다: ${e.id} → ${e.group}`);
    }
  }
  const names = new Map<string, string>();
  for (const e of EQUIPMENT) {
    const prev = names.get(e.name);
    if (prev) problems.push(`이름이 같은 기구가 있습니다: ${prev}, ${e.id}`);
    names.set(e.name, e.id);
  }
  return problems;
}

/** 한 부위에서 쓸 수 있는 기구 (등록 순서대로) */
export function equipmentForPart(part: BodyPart): Equipment[] {
  return EQUIPMENT.filter((e) => e.parts.includes(part));
}
