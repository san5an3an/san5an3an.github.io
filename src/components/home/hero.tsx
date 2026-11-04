import { ArrowDown, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { HeroFrames } from "@/components/home/hero-frames";
import { profile } from "@/lib/profile";

// 첫 화면의 소개 문구와 작업물 프레임 표시
export function Hero() {
  return (
    <section
      id="top"
      className="mx-auto grid min-h-[calc(100svh-3.5rem)] w-full max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-14"
    >
      <div className="flex min-w-0 flex-col items-start gap-6">
        <Badge variant="secondary">{profile.role}</Badge>
        <h1 className="text-[2.25rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-[2.75rem] xl:text-6xl">
          {profile.headline.map((line, index) => (
            <span
              key={line}
              className={`block ${index === 2 ? "text-[var(--semantic-fg-brand-default)]" : ""}`}
            >
              {line}
            </span>
          ))}
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {profile.bio}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a href="#projects" className={buttonVariants({ size: "lg" })}>
            프로젝트 보기
            <ArrowDown data-icon="inline-end" />
          </a>
          <a
            href={profile.figmaUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Figma 포트폴리오
            <ArrowUpRight data-icon="inline-end" />
          </a>
        </div>
      </div>
      <HeroFrames />
    </section>
  );
}
