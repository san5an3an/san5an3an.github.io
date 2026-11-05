import type { ReactNode } from "react";

import { BuildOverlay } from "@/components/build/build-overlay";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// 모든 페이지에 공통으로 쓰는 상단, 하단, 조립 애니메이션 영역 배치
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div data-build-root className="flex flex-1 flex-col overflow-x-clip">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      <BuildOverlay />
    </>
  );
}
