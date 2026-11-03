// 포트폴리오 화면에 표시할 소개 문구와 프로젝트 목록 지정
export const profile = {
  name: "San Kang",
  role: "UI/UX Designer & Developer",
  headline: ["Designing interfaces.", "Building systems.", "Shipping products."],
  bio: "UI/UX 디자인부터 실제 제품 구현까지, 디자인과 개발의 경계를 넘나들며 사용자 경험을 만드는 Developer입니다.",
  interest:
    "현재는 Design System과 재사용 가능한 UI Architecture, 그리고 AI Agent를 실제 개발 Workflow에 통합하는 Developer Tooling에 관심을 두고 있습니다.",
  githubUrl: "https://github.com/san5an3an",
  figmaUrl:
    "https://www.figma.com/design/YBcLGvMB0dIIQ6RCiDSIJ2/-PortFolio--SAN-KANG?node-id=0-1",
};

export const projects = [
  {
    name: "WE-ON",
    platform: "iOS",
    description:
      "결식 우려 아동이 아동급식카드로 이용할 수 있는 동네 식당을 찾고, 한 달 식비를 관리할 수 있는 iOS 앱이에요.",
    stack: ["Swift 6", "SwiftUI", "Cloudflare Workers"],
    url: "https://github.com/san5an3an/WE-ON",
  },
  {
    name: "minari-design-storybook",
    platform: "Design System",
    description:
      "서로 독립적으로 설계된 20종의 디자인 시스템과 동일한 컴포넌트 규격을 다양한 UI 라이브러리에 적용하여 한 화면에서 비교할 수 있도록 구성한 프로젝트입니다.",
    stack: ["React", "TypeScript", "shadcn/ui"],
    url: "https://github.com/san5an3an/minari-design-storybook",
  },
  {
    name: "GREEON",
    platform: "iOS",
    description: "전기차 충전소를 찾고 충전까지 이어주는 iOS 앱이에요.",
    stack: ["Swift", "UIKit", "KakaoMapsSDK"],
    url: "https://github.com/san5an3an/GREEON_swift",
  },
];

export const skills = [
  { title: "iOS / SwiftUI", detail: "iOS / SwiftUI 기반 UI 개발", icon: "smartphone" },
  { title: "Flutter", detail: "Flutter 기반 Cross-platform App 개발", icon: "layers" },
  { title: "UI/UX Design", detail: "UI/UX Design & Prototyping", icon: "pen-tool" },
  { title: "Design System", detail: "Design System & Reusable Component 설계", icon: "component" },
  { title: "React / TypeScript", detail: "React / TypeScript 기반 Web UI 개발", icon: "code" },
  { title: "AI Workflow", detail: "AI-assisted Development Workflow 설계 및 활용", icon: "sparkles" },
] as const;
