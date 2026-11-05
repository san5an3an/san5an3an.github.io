import type { Agent, BuildScene, Draft, Flash, Rect } from "./types";

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

  for (const flash of scene.flashes) drawFlash(ctx, scene, flash);
  for (const agent of scene.agents) {
    if (agent.active && agent.draft) drawSelection(ctx, scene, agent.draft);
  }
  for (const agent of scene.agents) {
    if (agent.active) drawAgent(ctx, scene, agent);
  }
}
