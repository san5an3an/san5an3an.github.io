import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { ProjectBlockView } from "@/components/project/project-blocks";
import { GreeonShowcase } from "@/components/project/showcases/greeon-showcase";
import { MinariShowcase } from "@/components/project/showcases/minari-showcase";
import { WeOnShowcase } from "@/components/project/showcases/we-on-showcase";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Project } from "@/lib/projects";

const showcases: Record<string, ComponentType> = {
  "we-on": WeOnShowcase,
  "minari-design-storybook": MinariShowcase,
  greeon: GreeonShowcase,
};

type ProjectDetailProps = {
  project: Project;
  previous: Project;
  next: Project;
};

// 프로젝트 소개, 화면 구조, 상세 내용, 이전과 다음 프로젝트 링크 표시
export function ProjectDetail({ project, previous, next }: ProjectDetailProps) {
  const Showcase = showcases[project.slug];

  return (
    <article className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:gap-14 sm:px-8 sm:py-12">
      <header className="flex flex-col items-start gap-5">
        <Link href="/#projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft data-icon="inline-start" />
          프로젝트 목록
        </Link>
        <Badge variant="outline">{project.platform}</Badge>
        <h1 className="text-[2.25rem] leading-[1.1] font-bold tracking-tight sm:text-5xl">
          {project.name}
        </h1>
        <div className="flex max-w-3xl flex-col gap-2 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {project.lead.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Repository 보기
          <ArrowUpRight data-icon="inline-end" />
        </a>
      </header>

      <dl
        data-autolayout
        className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3"
      >
        {project.facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="mt-1 font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {Showcase && <Showcase />}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-12">
          {project.sections.map((section) => (
            <section key={section.id} id={section.id} className="flex scroll-mt-20 flex-col gap-4">
              <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
              {section.blocks.map((block, index) => (
                <ProjectBlockView key={index} block={block} />
              ))}
            </section>
          ))}
        </div>
        <nav aria-label="목차" className="sticky top-20 hidden self-start lg:block">
          <p className="mb-2 text-xs font-medium text-muted-foreground">목차</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {project.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <nav aria-label="다른 프로젝트" data-autolayout className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/projects/${previous.slug}/`}
          className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="size-3.5" aria-hidden />
            이전 프로젝트
          </span>
          <span className="font-semibold">{previous.name}</span>
        </Link>
        <Link
          href={`/projects/${next.slug}/`}
          className="flex flex-col items-end gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            다음 프로젝트
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
          <span className="font-semibold">{next.name}</span>
        </Link>
      </nav>
    </article>
  );
}
