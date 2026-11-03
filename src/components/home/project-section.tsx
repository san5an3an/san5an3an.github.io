import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projects } from "@/lib/projects";

// 주요 프로젝트 카드 목록과 상세 화면, 저장소 링크 표시
export function ProjectSection() {
  return (
    <section id="projects" className="mx-auto w-full max-w-7xl scroll-mt-14 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Projects</h2>
        <p className="text-muted-foreground">직접 설계하고 구현한 프로젝트입니다.</p>
      </div>
      <div data-autolayout className="grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.slug} className="min-w-0">
            <CardHeader>
              <Badge variant="outline">{project.platform}</Badge>
              <CardTitle className="pt-2 text-lg font-semibold">{project.name}</CardTitle>
              <CardDescription className="leading-6">{project.summary}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-1.5">
              {project.stack.slice(0, 3).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
            <CardFooter className="gap-1">
              <Link href={`/projects/${project.slug}/`} className={buttonVariants({ size: "sm" })}>
                상세 보기
                <ArrowRight data-icon="inline-end" />
              </Link>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Repository
                <ArrowUpRight data-icon="inline-end" />
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
