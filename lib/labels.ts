import type { AreaLabel, BodyPart, Muscle, PartLabel } from "./types";

/** 분류 파일의 한국어 부위 이름 → 코드 안의 부위 */
export const PART_BY_LABEL: Record<PartLabel, BodyPart> = {
  가슴: "chest",
  등: "back",
  어깨: "shoulders",
  팔: "arms",
  하체: "legs",
  "복부·코어": "abs",
};

/** 세부 부위가 속한 큰 부위와, 근육 그림에서 칠할 근육 */
export const AREA_INFO: Record<AreaLabel, { part: BodyPart; muscle: Muscle }> = {
  윗가슴: { part: "chest", muscle: "chest" },
  중앙가슴: { part: "chest", muscle: "chest" },
  아랫가슴: { part: "chest", muscle: "chest" },
  안쪽가슴: { part: "chest", muscle: "chest" },
  "등 너비": { part: "back", muscle: "back" },
  "등 두께": { part: "back", muscle: "back" },
  "허리·등 안정화": { part: "back", muscle: "back" },
  전면어깨: { part: "shoulders", muscle: "shoulders" },
  측면어깨: { part: "shoulders", muscle: "shoulders" },
  후면어깨: { part: "shoulders", muscle: "shoulders" },
  "어깨 안정화": { part: "shoulders", muscle: "shoulders" },
  이두: { part: "arms", muscle: "biceps" },
  삼두: { part: "arms", muscle: "triceps" },
  전완: { part: "arms", muscle: "forearms" },
  앞벅지: { part: "legs", muscle: "quads" },
  뒷벅지: { part: "legs", muscle: "hamstrings" },
  엉덩이: { part: "legs", muscle: "glutes" },
  "안쪽 허벅지": { part: "legs", muscle: "adductors" },
  "바깥 허벅지": { part: "legs", muscle: "abductors" },
  종아리: { part: "legs", muscle: "calves" },
  상복부: { part: "abs", muscle: "abs" },
  하복부: { part: "abs", muscle: "abs" },
  옆구리: { part: "abs", muscle: "obliques" },
  코어: { part: "abs", muscle: "abs" },
};

/** 화면에 이름 옆에 작게 붙여 주는 근육 이름 (없는 부위는 붙이지 않는다) */
export const AREA_NOTE: Partial<Record<AreaLabel, string>> = {
  윗가슴: "상부 대흉근",
  중앙가슴: "대흉근",
  아랫가슴: "하부 대흉근",
  "허리·등 안정화": "척추기립근",
  "어깨 안정화": "회전근개",
  앞벅지: "대퇴사두",
  뒷벅지: "햄스트링",
  엉덩이: "둔근",
  "안쪽 허벅지": "내전근",
  "바깥 허벅지": "중둔근·외전근",
  종아리: "비복근·가자미근",
  옆구리: "복사근",
};

/** 큰 부위 안의 세부 부위 (화면에 보여 줄 순서) */
export const AREAS_BY_PART: Record<BodyPart, AreaLabel[]> = {
  chest: ["윗가슴", "중앙가슴", "아랫가슴", "안쪽가슴"],
  back: ["등 너비", "등 두께", "허리·등 안정화"],
  shoulders: ["전면어깨", "측면어깨", "후면어깨", "어깨 안정화"],
  arms: ["이두", "삼두", "전완"],
  legs: ["앞벅지", "뒷벅지", "엉덩이", "안쪽 허벅지", "바깥 허벅지", "종아리"],
  abs: ["상복부", "하복부", "옆구리", "코어"],
};
