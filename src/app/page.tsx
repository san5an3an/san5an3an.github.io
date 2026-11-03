import { BuildOverlay } from "@/components/build/build-overlay";
import { Hero } from "@/components/home/hero";
import { ProjectSection } from "@/components/home/project-section";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { SkillSection } from "@/components/home/skill-section";

export default function Home() {
  return (
    <>
      <div data-build-root className="flex flex-1 flex-col overflow-x-clip">
        <SiteHeader />
        <main className="flex-1">
          <Hero />
          <ProjectSection />
          <SkillSection />
        </main>
        <SiteFooter />
      </div>
      <BuildOverlay />
    </>
  );
}
