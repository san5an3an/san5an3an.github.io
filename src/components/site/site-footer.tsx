import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { profile } from "@/lib/profile";

// 페이지 하단 연락 링크 표시
export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-14 border-t bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Contact</h2>
          <p className="text-sm text-muted-foreground">{profile.role}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            GitHub
            <ArrowUpRight data-icon="inline-end" />
          </a>
          <a
            href={profile.figmaUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Figma
            <ArrowUpRight data-icon="inline-end" />
          </a>
        </div>
      </div>
    </footer>
  );
}
