import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/project/project-detail";
import { PageShell } from "@/components/site/page-shell";
import { profile } from "@/lib/profile";
import { projects } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return { title: `${project.name} | ${profile.name}`, description: project.summary };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const index = projects.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();

  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <PageShell>
      <ProjectDetail project={projects[index]} previous={previous} next={next} />
    </PageShell>
  );
}
