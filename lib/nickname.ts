const ADJECTIVES = [
  "씩씩한",
  "든든한",
  "날쌘",
  "용감한",
  "차분한",
  "빠른",
  "믿음직한",
  "부지런한",
  "당찬",
  "꿋꿋한",
];

const NOUNS = [
  "독수리",
  "호랑이",
  "고래",
  "상어",
  "매",
  "늑대",
  "부엉이",
  "백곰",
  "사자",
  "범고래",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** 예: "씩씩한호랑이47" (최대 11자 안팎, 닉네임 제한 20자 이내) */
export function randomNickname(): string {
  const num = Math.floor(Math.random() * 90) + 10;
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${num}`;
}
