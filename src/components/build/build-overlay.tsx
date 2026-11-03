"use client";

import { useEffect, useRef, useState } from "react";

import { BuildStatusBar } from "@/components/build/build-status-bar";
import { BuildEngine } from "@/lib/build/engine";
import type { BuildStatus } from "@/lib/build/types";

const FONT_WAIT_LIMIT = 1200;

// 조립 애니메이션의 Canvas 와 상태 막대를 페이지 위에 표시
export function BuildOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BuildEngine | null>(null);
  const shouldPlayRef = useRef<boolean | null>(null);
  const [status, setStatus] = useState<BuildStatus | null>(null);

  useEffect(() => {
    // React 개발 모드가 효과를 두 번 실행해도 첫 판단을 유지하도록 ref 에 저장함
    shouldPlayRef.current ??= document.documentElement.dataset.build === "pending";
    if (!shouldPlayRef.current) return;

    const root = document.querySelector<HTMLElement>("[data-build-root]");
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let cancelled = false;
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

    // 글자 크기가 확정된 뒤 위치를 측정하도록 글꼴 로딩을 잠시 기다림
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const waitLimit = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT));
    void Promise.race([fontsReady, waitLimit]).then(() => {
      if (cancelled) return;
      engine.start();
      engineRef.current = engine;
    });

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
