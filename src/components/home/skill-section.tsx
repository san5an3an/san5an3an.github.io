import { Code, Component, Layers, PenTool, Smartphone, Sparkles } from "lucide-react";

import { profile, skills } from "@/lib/profile";

const skillIcons = {
  smartphone: Smartphone,
  layers: Layers,
  "pen-tool": PenTool,
  component: Component,
  code: Code,
  sparkles: Sparkles,
};

// 다루는 기술 영역과 현재 관심사 표시
export function SkillSection() {
  return (
    <section id="skills" className="mx-auto w-full max-w-7xl scroll-mt-14 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mb-8 flex flex-col gap-2 sm:mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Skills</h2>
        <p className="max-w-3xl leading-7 text-muted-foreground">{profile.interest}</p>
      </div>
      <div data-autolayout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => {
          const Icon = skillIcons[skill.icon];
          return (
            <div key={skill.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-sm font-semibold">{skill.title}</h3>
                <p className="text-sm text-muted-foreground">{skill.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
