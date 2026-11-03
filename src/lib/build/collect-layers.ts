import type { Layer, LayerElement, LayerKind, LayoutGroup, Point, Rect } from "./types";

const MEDIA_SELECTOR = "svg, img, video, canvas, picture";
const SKIP_SELECTOR = "script, style, noscript, [data-build-skip]";
const INTERACTIVE_SELECTOR = "a, button";
const MIN_LAYER_SIZE = 2;
const MIN_CHROMA = 40;

// 뷰포트 좌표를 스크롤과 무관한 문서 좌표로 변환
export function readRect(el: Element): Rect {
  const box = el.getBoundingClientRect();
  return { x: box.left + window.scrollX, y: box.top + window.scrollY, w: box.width, h: box.height };
}

function hasDirectText(el: Element) {
  return Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );
}

function isTransparent(color: string) {
  return color === "transparent" || /,\s*0\)$/.test(color) || /\/\s*0\)$/.test(color);
}

// 완전히 투명한 그림자를 제외하고 실제로 보이는 그림자만 판별
function hasVisibleShadow(style: CSSStyleDeclaration) {
  if (style.boxShadow === "none") return false;
  return style.boxShadow.replace(/rgba\(0, 0, 0, 0\)[^,]*(,|$)/g, "").trim() !== "";
}

function hasVisibleFrame(style: CSSStyleDeclaration) {
  if (!isTransparent(style.backgroundColor)) return true;
  if (hasVisibleShadow(style)) return true;
  return (
    parseFloat(style.borderTopWidth) > 0 &&
    style.borderTopStyle !== "none" &&
    !isTransparent(style.borderTopColor)
  );
}

// 채도가 있는 배경색만 16진수 색상 코드로 변환
function readChromaticFill(style: CSSStyleDeclaration) {
  const match = style.backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;
  const channels = match.slice(1, 4).map(Number);
  if (Math.max(...channels) - Math.min(...channels) < MIN_CHROMA) return null;
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function readRadius(style: CSSStyleDeclaration, rect: Rect) {
  const raw = parseFloat(style.borderTopLeftRadius);
  if (Number.isNaN(raw)) return 0;
  const value = style.borderTopLeftRadius.endsWith("%") ? (raw / 100) * Math.min(rect.w, rect.h) : raw;
  return Math.min(value, Math.min(rect.w, rect.h) / 2);
}

// 요소가 커서 작업 단위가 되는지와 종류 판별
function classify(el: Element, style: CSSStyleDeclaration, parentHasText: boolean, isItem: boolean): LayerKind | null {
  if (el.matches(MEDIA_SELECTOR)) return "media";
  if (style.display === "inline" && parentHasText) return null;
  const text = hasDirectText(el);
  const frame = hasVisibleFrame(style);
  if (frame && (text || el.matches(INTERACTIVE_SELECTOR))) return "control";
  if (text) return "text";
  if (frame || isItem) return "frame";
  return null;
}

// 흩어진 위치의 무작위 이동량 계산
function scatterOffset(group: Rect): Point {
  const rangeX = Math.min(group.w * 0.34, 200);
  const rangeY = Math.min(group.h * 0.3, 150);
  return { x: (Math.random() - 0.5) * rangeX, y: (Math.random() - 0.5) * rangeY };
}

// 페이지 DOM 을 순회해 커서 작업 목록과 자동 레이아웃 그룹 생성
export function collectLayers(root: HTMLElement) {
  const layers: Layer[] = [];
  const groups: LayoutGroup[] = [];

  const visit = (
    el: Element,
    parent: Layer | null,
    parentHasText: boolean,
    isItem: boolean,
    insideSticky: boolean,
  ): Layer | null => {
    if (el.matches(SKIP_SELECTOR)) return null;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return null;

    const isSticky = insideSticky || style.position === "sticky" || style.position === "fixed";
    const rect = readRect(el);
    const isVisibleSize = rect.w >= MIN_LAYER_SIZE && rect.h >= MIN_LAYER_SIZE;
    const kind = isVisibleSize ? classify(el, style, parentHasText, isItem) : null;

    let layer: Layer | null = null;
    if (kind) {
      layer = {
        el: el as LayerElement,
        kind,
        parent,
        rect,
        radius: readRadius(style, rect),
        fill: readChromaticFill(style),
        isGroupItem: isItem,
        isSticky,
        state: "hidden",
      };
      layers.push(layer);
    }
    if (kind === "media") return layer;

    const isGroup = el.hasAttribute("data-autolayout");
    const nextParent = layer ?? parent;
    const nextHasText = hasDirectText(el);
    const itemLayers: Layer[] = [];
    for (const child of Array.from(el.children)) {
      const childLayer = visit(child, nextParent, nextHasText, isGroup, isSticky);
      if (isGroup && childLayer) itemLayers.push(childLayer);
    }
    if (isGroup) {
      groups.push({
        el: el as HTMLElement,
        rect,
        owner: nextParent,
        items: itemLayers.map((itemLayer) => ({
          layer: itemLayer,
          offset: scatterOffset(rect),
          claimed: false,
          placed: false,
          ghost: false,
        })),
        state: "open",
      });
    }
    return layer;
  };

  visit(root, null, false, false, false);
  return { layers, groups };
}

// 줄별 글자 영역을 요소 기준 좌표로 측정
export function measureTextLines(el: LayerElement) {
  const box = el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  const lines: { top: number; bottom: number; left: number; right: number }[] = [];
  for (const piece of Array.from(range.getClientRects())) {
    if (piece.width < 1 || piece.height < 1) continue;
    const top = piece.top - box.top;
    const bottom = piece.bottom - box.top;
    const left = piece.left - box.left;
    const right = piece.right - box.left;
    const line = lines.find((item) => top < item.bottom - 2 && bottom > item.top + 2);
    if (line) {
      line.top = Math.min(line.top, top);
      line.bottom = Math.max(line.bottom, bottom);
      line.left = Math.min(line.left, left);
      line.right = Math.max(line.right, right);
    } else {
      lines.push({ top, bottom, left, right });
    }
  }
  return lines.length ? lines : [{ top: 0, bottom: box.height, left: 0, right: box.width }];
}
