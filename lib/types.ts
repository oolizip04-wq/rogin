/** 근육 그림에서 칠하는 근육 */
export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "adductors"
  | "abductors"
  | "calves";

/** 기구를 고르는 큰 부위 (코드 안에서 쓰는 이름) */
export type BodyPart = "chest" | "back" | "shoulders" | "arms" | "legs" | "abs";

/** 분류 파일에 한국어로 적는 큰 부위 이름 */
export type PartLabel = "가슴" | "등" | "어깨" | "팔" | "하체" | "복부·코어";

/** 분류 파일에 한국어로 적는 세부 부위 이름 */
export type AreaLabel =
  | "윗가슴"
  | "중앙가슴"
  | "아랫가슴"
  | "안쪽가슴"
  | "등 너비"
  | "등 두께"
  | "허리·등 안정화"
  | "전면어깨"
  | "측면어깨"
  | "후면어깨"
  | "어깨 안정화"
  | "이두"
  | "삼두"
  | "전완"
  | "앞벅지"
  | "뒷벅지"
  | "엉덩이"
  | "안쪽 허벅지"
  | "바깥 허벅지"
  | "종아리"
  | "상복부"
  | "하복부"
  | "옆구리"
  | "코어";

/** 한 부위 안에서 기구를 묶어 보여 주는 갈래 */
export type EquipmentKind =
  | "free"
  | "bench"
  | "rack"
  | "cable"
  | "machine"
  | "attachment"
  | "station"
  | "cardio"
  | "accessory";

export type Equipment = {
  /** 앱 전체에서 하나뿐인 고유 id. 선택 상태는 이 id 로만 저장한다. */
  id: string;
  name: string;
  /** 이 기구를 쓸 수 있는 부위. lib/classification.ts 에서 정한 내용이 들어온다. */
  parts: BodyPart[];
  kind: EquipmentKind;
  /** 종류가 여러 개라 펼쳐서 고르는 묶음(EquipmentGroup)의 id */
  group?: string;
};

/** 그립·바처럼 종류가 여러 개인 기구를 펼쳐 보여 주는 묶음 */
export type EquipmentGroup = {
  id: string;
  name: string;
  kind: EquipmentKind;
};

/** 운동에 필요한 기구 id. 문자열은 그 기구 하나, 배열은 그중 하나만 있어도 된다는 뜻 */
export type Requirement = string | string[];

export type Exercise = {
  id: string;
  name: string;
  description: string;
  /** 동작 순서. 화면에 번호를 붙여 차례로 보여 준다. */
  steps: string[];
  /** 이 운동이 주로 쓰는 세부 부위. '오늘 운동할 부위'를 고를 때 이걸로 찾는다. */
  areas: AreaLabel[];
  /** 보조로 쓰는 세부 부위. 근육 그림에는 칠하지만 부위 찾기에는 쓰지 않는다. */
  secondary: AreaLabel[];
  /** 근육 그림에 칠할 근육 (areas, secondary 에서 자동으로 만든다) */
  muscles: Muscle[];
  /** 이 운동에 필요한 기구. 비어 있으면 맨몸 운동 */
  requires: Requirement[];
};
