/** 상단 바와 하단 탭 막대를 보여 줄 화면들. 첫 화면·로그인·기구 선택에서는 숨긴다. */
const CHROME_ROUTES = ["/workout", "/exercises", "/routines", "/community", "/settings", "/notifications"];

export function showsChrome(path: string): boolean {
  return CHROME_ROUTES.some((p) => path === p || path.startsWith(p + "/"));
}
