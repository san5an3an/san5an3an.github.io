"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { BuildStatusBar } from "@/components/build/build-status-bar";
import { BuildEngine } from "@/lib/build/engine";
import { hasPlayedPage, markPlayedPage } from "@/lib/build/played-pages";
import type { BuildStatus } from "@/lib/build/types";

const FONT_WAIT_LIMIT = 1200;
const HOME_PATH = "/";

type StartMode = "after-fonts" | "immediately" | "finished" | "none";

let isFirstMount = true;
let isHistoryNavigation = false;

// 뒤로 가기와 앞으로 가기 감지. React 가 popstate 중에 새 페이지를 바로 그리므로 Next 보다 먼저 실행되는 capture 단계에 등록함
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => (isHistoryNavigation = true), true);
  // 해시 이동으로 화면이 안 바뀐 뒤 누른 링크를 뒤로 가기로 오인하지 않도록 사용자 클릭 때 감지 결과를 지움
  document.addEventListener("click", () => (isHistoryNavigation = false), true);
}

// 페이지를 여는 방식과 재생 기록에 맞는 시작 방식 판별
function decideStartMode(): StartMode {
  const isHardLoad = isFirstMount;
  const isReturning = isHistoryNavigation;
  isFirstMount = false;
  isHistoryNavigation = false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";

  const pathname = location.pathname;
  const played = hasPlayedPage(pathname);
  if (isHardLoad) {
    if (document.documentElement.dataset.build === "pending") return "after-fonts";
    return played ? "finished" : "none";
  }
  // 첫 페이지는 목록으로 돌아올 때마다 긴 조립을 다시 보지 않도록 처음 볼 때만 재생함
  if (played && (isReturning || pathname === HOME_PATH)) return "finished";
  return "immediately";
}

// 조립 애니메이션의 Canvas 와 상태 막대를 페이지 위에 표시
export function BuildOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BuildEngine | null>(null);
  const startModeRef = useRef<StartMode | null>(null);
  const [status, setStatus] = useState<BuildStatus | null>(null);

  // 페이지 이동 때 내용이 먼저 보이지 않도록 첫 그리기 전에 실행함
  useLayoutEffect(() => {
    startModeRef.current ??= decideStartMode();
    const startMode = startModeRef.current;
    if (startMode === "none") return;

    const root = document.querySelector<HTMLElement>("[data-build-root]");
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let cancelled = false;
    const pathname = location.pathname;
    const engine = new BuildEngine({
      root,
      canvas,
      onStatus: setStatus,
      getDockPoint: () => {
        const box = dockRef.current?.getBoundingClientRect();
        return box
          ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
          : { x: window.innerWidth / 2, y: window.innerHeight - 40 };
      },
    });
    engineRef.current = engine;

    const begin = () => {
      if (cancelled) return;
      markPlayedPage(pathname);
      engine.start();
    };

    if (startMode === "finished") engine.showFinished();
    if (startMode === "immediately") begin();
    if (startMode === "after-fonts") {
      // 글자 크기가 확정된 뒤 위치를 측정하도록 글꼴 로딩을 잠시 기다림
      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      const waitLimit = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT));
      void Promise.race([fontsReady, waitLimit]).then(begin);
    }

    return () => {
      cancelled = true;
      engineRef.current = null;
      engine.destroy();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        data-build-canvas
        className="pointer-events-none fixed inset-0 z-40 hidden size-full"
      />
      {status && (
        <BuildStatusBar
          ref={dockRef}
          status={status}
          onTogglePause={() => engineRef.current?.togglePause()}
          onToggleSpeed={() => engineRef.current?.toggleSpeed()}
          onSkip={() => engineRef.current?.finishNow()}
          onReplay={() => engineRef.current?.restart()}
        />
      )}
    </>
  );
}
