import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { NotFoundTitle } from "@/components/site/not-found-title";
import { PageShell } from "@/components/site/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { profile } from "@/lib/profile";

// 404 숫자에만 쓰는 자이언츠체 Inline 지정. 라이선스가 변환을 금지해 OTF 원본을 그대로 쓰고, 큰 파일을 다른 페이지가 받지 않도록 미리 받기를 끔
const giantsInline = localFont({
  src: "../design-system/fonts/Giants-Inline.otf",
  display: "swap",
  preload: false,
});

const TITLES = ["어라....?", "여긴 어디 나는 누구", "헤헤 잘못 들어왔당"];
const DESCRIPTION = ["찾을 수 없는 페이지예요.", "요청하신 페이지가 사라졌거나, 잘못 들어오신 것 같네요 :)"];

export const metadata: Metadata = {
  title: `404 | ${profile.name}`,
  description: DESCRIPTION.join(" "),
};

// 없는 주소를 열었을 때 안내 문구와 돌아갈 링크 표시
export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-5 py-10 sm:px-8 sm:py-12 lg:flex-row lg:items-center lg:gap-14 lg:py-24">
        <p
          className={`${giantsInline.className} shrink-0 text-[min(46vw,28svh)] leading-none text-[var(--semantic-fg-brand-default)] lg:text-[min(24vw,50svh,20rem)]`}
        >
          404
        </p>
        <div className="flex min-w-0 flex-col items-start gap-6">
          <NotFoundTitle titles={TITLES} />
          <p className="max-w-xl text-base leading-7 whitespace-pre-line text-muted-foreground sm:text-lg sm:leading-8">
            {DESCRIPTION.join("\n")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              <ArrowLeft data-icon="inline-start" />
              첫 페이지로
            </Link>
            <Link href="/#projects" className={buttonVariants({ variant: "outline", size: "lg" })}>
              프로젝트 보기
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
