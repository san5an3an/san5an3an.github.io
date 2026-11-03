export const PLAYED_PAGES_KEY = "build-played-pages";

function readPlayedPages(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(PLAYED_PAGES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// 현재 탭에서 조립 애니메이션을 이미 본 페이지인지 판별
export function hasPlayedPage(pathname: string) {
  return readPlayedPages().includes(pathname);
}

// 조립 애니메이션을 본 페이지 기록. 저장에 실패하면 다음에도 재생하도록 오류를 무시함
export function markPlayedPage(pathname: string) {
  try {
    const pages = readPlayedPages();
    if (!pages.includes(pathname)) sessionStorage.setItem(PLAYED_PAGES_KEY, JSON.stringify([...pages, pathname]));
  } catch {}
}
