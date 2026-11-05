import { Hero } from "@/components/home/hero";
import { ProjectSection } from "@/components/home/project-section";
import { SkillSection } from "@/components/home/skill-section";
import { PageShell } from "@/components/site/page-shell";

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <ProjectSection />
      <SkillSection />
    </PageShell>
  );
}
