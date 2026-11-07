import type { Agent, BuildScene, Carry, Draft, Flash, Rect } from "./types";

// lucide 의 mouse-pointer-2 아이콘 경로 사용
const CURSOR_PATH =
  "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z";
const CURSOR_ICON_SIZE = 24;
const CURSOR_TIP = 4;
const HANDLE_SIZE = 6;

let cursorShape: Path2D | null = null;

function getCursorShape() {
  cursorShape ??= new Path2D(CURSOR_PATH);
  return cursorShape;
}

function isOutsideView(scene: BuildScene, rect: Rect) {
  return (
    rect.x + rect.w < scene.scrollX - 40 ||
    rect.x > scene.scrollX + scene.width + 40 ||
    rect.y + rect.h < scene.scrollY - 40 ||
    rect.y > scene.scrollY + scene.height + 40
  );
}

// 지정한 위치에 둥근 배경과 글자가 있는 작은 라벨 표시
function drawLabel(
  ctx: CanvasRenderingContext2D,
  scene: BuildScene,
  label: string,
  centerX: number,
  top: number,
  background: string,
  color: string,
) {
  ctx.font = `600 10.5px ${scene.tokens.fontFamily}`;
  const width = ctx.measureText(label).width + 10;
  const left = centerX - width / 2;
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(left, top, width, 16, 3);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, centerX, top + 8.5);
}

// 파란 윤곽선과 모서리 핸들, 크기 표시 그리기
function drawSelection(ctx: CanvasRenderingContext2D, scene: BuildScene, draft: Draft) {
  const { rect, filled } = draft;
  if (isOutsideView(scene, rect)) return;
  const { brand, onBrand, placeholder, surface } = scene.tokens;

  if (filled) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = placeholder;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = brand;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.fillStyle = surface;
  for (const [x, y] of [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
  ]) {
    ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }

  if (draft.hideSize) return;
  const label = `${Math.round(rect.w)} × ${Math.round(rect.h)}`;
  drawLabel(ctx, scene, label, rect.x + rect.w / 2, rect.y + rect.h + 6, brand, onBrand);
}

// 수명에 따라 나타났다 사라지는 투명도 계산
function flashAlpha(flash: Flash) {
  const progress = flash.age / flash.ttl;
  if (progress < 0.15) return progress / 0.15;
  if (progress > 0.7) return (1 - progress) / 0.3;
  return 1;
}

function drawFlash(ctx: CanvasRenderingContext2D, scene: BuildScene, flash: Flash) {
  if (flash.age < 0) return;
  const { brand, onBrand, danger, onDanger } = scene.tokens;
  ctx.globalAlpha = flashAlpha(flash);

  switch (flash.kind) {
    case "cross": {
      ctx.strokeStyle = danger;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(flash.x - 5, flash.y);
      ctx.lineTo(flash.x + 5, flash.y);
      ctx.moveTo(flash.x, flash.y - 5);
      ctx.lineTo(flash.x, flash.y + 5);
      ctx.stroke();
      break;
    }
    case "marquee": {
      ctx.fillStyle = brand;
      ctx.globalAlpha *= 0.12;
      ctx.fillRect(flash.rect.x, flash.rect.y, flash.rect.w, flash.rect.h);
      ctx.globalAlpha = flashAlpha(flash);
      ctx.strokeStyle = brand;
      ctx.lineWidth = 1;
      ctx.strokeRect(flash.rect.x, flash.rect.y, flash.rect.w, flash.rect.h);
      break;
    }
    case "outline": {
      ctx.strokeStyle = brand;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(flash.rect.x, flash.rect.y, flash.rect.w, flash.rect.h);
      break;
    }
    case "gap": {
      ctx.fillStyle = danger;
      ctx.globalAlpha *= 0.28;
      ctx.fillRect(flash.rect.x, flash.rect.y, flash.rect.w, flash.rect.h);
      ctx.globalAlpha = flashAlpha(flash);
      const centerX = flash.rect.x + flash.rect.w / 2;
      const centerY = flash.rect.y + flash.rect.h / 2;
      drawLabel(ctx, scene, flash.label, centerX, centerY - 8, danger, onDanger);
      break;
    }
    case "measure": {
      ctx.strokeStyle = danger;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(flash.from.x, flash.from.y);
      ctx.lineTo(flash.to.x, flash.to.y);
      ctx.stroke();
      const centerX = (flash.from.x + flash.to.x) / 2;
      const centerY = (flash.from.y + flash.to.y) / 2;
      drawLabel(ctx, scene, flash.label, centerX, centerY - 8, danger, onDanger);
      break;
    }
    case "chip": {
      drawLabel(ctx, scene, flash.label, flash.x, flash.y, brand, onBrand);
      break;
    }
  }
  ctx.globalAlpha = 1;
}

// 끌고 온 사진을 놓을 수 있는 영역을 파란 테두리와 옅은 바탕으로 표시
function drawDropTarget(ctx: CanvasRenderingContext2D, scene: BuildScene, rect: Rect) {
  if (isOutsideView(scene, rect)) return;
  ctx.fillStyle = scene.tokens.brand;
  ctx.globalAlpha = 0.08;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = scene.tokens.brand;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
}

// 사진 비율을 유지한 채 썸네일 비율에 맞게 가운데를 잘라 그림. 아직 받지 못한 사진은 회색 카드로 대신함
function drawCarry(ctx: CanvasRenderingContext2D, scene: BuildScene, agent: Agent, carry: Carry) {
  const { image, w, h, offset, label } = carry;
  const x = agent.x + offset.x;
  const y = agent.y + offset.y;
  ctx.save();
  ctx.globalAlpha = agent.alpha * 0.92;
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = scene.tokens.surface;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.clip();
  if (image.complete && image.naturalWidth > 0) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const sourceW = w / scale;
    const sourceH = h / scale;
    const sourceX = (image.naturalWidth - sourceW) / 2;
    const sourceY = (image.naturalHeight - sourceH) / 2;
    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
  } else {
    ctx.fillStyle = scene.tokens.placeholder;
    ctx.globalAlpha *= 0.3;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  ctx.globalAlpha = agent.alpha;
  ctx.strokeStyle = scene.tokens.rulerLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 6);
  ctx.stroke();
  drawLabel(ctx, scene, label, x + w / 2, y + h + 6, scene.tokens.brand, scene.tokens.onBrand);
  ctx.globalAlpha = 1;
}

// 가이드 선과 끄는 동안의 위치 숫자 그리기
function drawGuides(ctx: CanvasRenderingContext2D, scene: BuildScene) {
  const { guides, overlayAlpha, rulerSize, tokens } = scene;
  if (overlayAlpha <= 0) return;
  ctx.strokeStyle = tokens.danger;
  ctx.lineWidth = 1;
  for (const guide of guides) {
    if (guide.position === null) continue;
    ctx.globalAlpha = overlayAlpha * (guide.placed ? 0.7 : 1);
    ctx.beginPath();
    if (guide.axis === "x") {
      const x = Math.round(guide.position) + 0.5;
      ctx.moveTo(x, scene.scrollY + rulerSize);
      ctx.lineTo(x, scene.scrollY + scene.height);
    } else {
      const y = Math.round(guide.position) + 0.5;
      ctx.moveTo(scene.scrollX + rulerSize, y);
      ctx.lineTo(scene.scrollX + scene.width, y);
    }
    ctx.stroke();
    if (guide.label) {
      ctx.globalAlpha = overlayAlpha;
      const value = `${Math.round(guide.position)}`;
      drawLabel(ctx, scene, value, guide.label.x + 30, guide.label.y - 26, tokens.danger, tokens.onDanger);
    }
  }
  ctx.globalAlpha = 1;
}

// Figma 눈금자처럼 화면 위쪽과 왼쪽에 문서 좌표 눈금 표시. 선택 박스 범위는 파란 띠로 표시
function drawRulers(ctx: CanvasRenderingContext2D, scene: BuildScene) {
  const { overlayAlpha, rulerSize: size, width, height, scrollX, scrollY, tokens } = scene;
  if (overlayAlpha <= 0) return;
  ctx.globalAlpha = overlayAlpha;
  ctx.fillStyle = tokens.surface;
  ctx.fillRect(0, 0, width, size);
  ctx.fillRect(0, 0, size, height);

  ctx.fillStyle = tokens.brand;
  ctx.globalAlpha = overlayAlpha * 0.2;
  for (const agent of scene.agents) {
    if (!agent.active || !agent.draft) continue;
    const { rect } = agent.draft;
    ctx.fillRect(rect.x - scrollX, 0, rect.w, size);
    ctx.fillRect(0, rect.y - scrollY, size, rect.h);
  }
  ctx.globalAlpha = overlayAlpha;

  const fontSize = size < 20 ? 7.5 : 9;
  ctx.strokeStyle = tokens.rulerText;
  ctx.fillStyle = tokens.rulerText;
  ctx.lineWidth = 1;
  ctx.font = `500 ${fontSize}px ${tokens.fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const tickLength = (value: number) => size * (value % 100 === 0 ? 0.55 : value % 50 === 0 ? 0.35 : 0.2);

  ctx.beginPath();
  for (let value = Math.ceil((scrollX + size) / 10) * 10; value <= scrollX + width; value += 10) {
    const x = Math.round(value - scrollX) + 0.5;
    ctx.moveTo(x, size);
    ctx.lineTo(x, size - tickLength(value));
    if (value % 100 === 0) ctx.fillText(`${value}`, x + 3, 2);
  }
  for (let value = Math.ceil((scrollY + size) / 10) * 10; value <= scrollY + height; value += 10) {
    const y = Math.round(value - scrollY) + 0.5;
    ctx.moveTo(size, y);
    ctx.lineTo(size - tickLength(value), y);
    if (value % 100 === 0) {
      // 왼쪽 숫자는 Figma 처럼 아래에서 위로 읽히도록 돌려서 표시
      const label = `${value}`;
      ctx.save();
      ctx.translate(2, y + 3 + ctx.measureText(label).width);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }
  ctx.stroke();

  ctx.fillStyle = tokens.surface;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = tokens.rulerLine;
  ctx.beginPath();
  ctx.moveTo(0, size - 0.5);
  ctx.lineTo(width, size - 0.5);
  ctx.moveTo(size - 0.5, 0);
  ctx.lineTo(size - 0.5, height);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// 커서 또는 글자 입력 커서와 name tag 그리기
function drawAgent(ctx: CanvasRenderingContext2D, scene: BuildScene, agent: Agent) {
  if (agent.alpha <= 0) return;
  ctx.globalAlpha = agent.alpha;

  if (agent.caret) {
    ctx.fillStyle = agent.color;
    ctx.fillRect(agent.caret.x - 0.75, agent.caret.y, 1.5, agent.caret.height);
  }

  if (agent.tool === "text") {
    const height = Math.max(12, Math.min(agent.size + 2, 20));
    ctx.strokeStyle = agent.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(agent.x + 3, agent.y - 2);
    ctx.lineTo(agent.x + 3, agent.y + height);
    ctx.moveTo(agent.x, agent.y - 2);
    ctx.lineTo(agent.x + 6, agent.y - 2);
    ctx.moveTo(agent.x, agent.y + height);
    ctx.lineTo(agent.x + 6, agent.y + height);
    ctx.stroke();
  } else {
    const scale = agent.size / CURSOR_ICON_SIZE;
    ctx.save();
    ctx.translate(agent.x - CURSOR_TIP * scale, agent.y - CURSOR_TIP * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = agent.color;
    ctx.strokeStyle = scene.tokens.surface;
    ctx.lineWidth = 1.6 / scale;
    ctx.lineJoin = "round";
    const shape = getCursorShape();
    ctx.stroke(shape);
    ctx.fill(shape);
    ctx.restore();
  }

  ctx.font = `600 11.5px ${scene.tokens.fontFamily}`;
  const width = ctx.measureText(agent.name).width + 12;
  const left = agent.x + agent.size * 0.7;
  const top = agent.y + agent.size * 0.75;
  ctx.fillStyle = agent.color;
  ctx.beginPath();
  ctx.roundRect(left, top, width, 20, 4);
  ctx.fill();
  ctx.fillStyle = agent.onColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(agent.name, left + 6, top + 10.5);

  // 작업 중 바뀌는 값은 name tag 와 겹치지 않도록 커서 위쪽에 표시
  if (agent.chip) {
    drawLabel(ctx, scene, agent.chip, agent.x + 34, agent.y - 24, scene.tokens.brand, scene.tokens.onBrand);
  }
  ctx.globalAlpha = 1;
}

// 한 프레임의 모든 보조 표시와 커서를 Canvas 에 그리기
export function paintScene(ctx: CanvasRenderingContext2D, scene: BuildScene) {
  const { dpr, width, height, scrollX, scrollY, tokens } = scene;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.translate(-scrollX, -scrollY);

  for (const group of scene.groups) {
    for (const item of group.items) {
      if (!item.ghost) continue;
      const { rect } = item.layer;
      const ghost = { x: rect.x + item.offset.x, y: rect.y + item.offset.y, w: rect.w, h: rect.h };
      if (isOutsideView(scene, ghost)) continue;
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = tokens.placeholder;
      ctx.fillRect(ghost.x, ghost.y, ghost.w, ghost.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = tokens.brand;
      ctx.lineWidth = 1;
      ctx.strokeRect(ghost.x, ghost.y, ghost.w, ghost.h);
    }
  }

  drawGuides(ctx, scene);
  for (const flash of scene.flashes) drawFlash(ctx, scene, flash);
  for (const agent of scene.agents) {
    if (agent.active && agent.draft) drawSelection(ctx, scene, agent.draft);
    if (agent.active && agent.dropTarget) drawDropTarget(ctx, scene, agent.dropTarget);
  }

  // 눈금자는 화면에 고정되므로 스크롤 이동 없이 그린 뒤, 커서가 눈금자 위로 지나가도록 커서를 마지막에 그림
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRulers(ctx, scene);
  ctx.translate(-scrollX, -scrollY);
  for (const agent of scene.agents) {
    if (!agent.active) continue;
    if (agent.carry) drawCarry(ctx, scene, agent, agent.carry);
    drawAgent(ctx, scene, agent);
  }
}
