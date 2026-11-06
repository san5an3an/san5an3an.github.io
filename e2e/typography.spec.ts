import { expect, test } from "@playwright/test";

const PAGES = ["/", "/projects/cbm-monitoring/", "/projects/minari-design-storybook/", "/projects/we-on/", "/projects/greeon/"];

test.describe("사이트 글꼴", () => {
  for (const pathname of PAGES) {
    test(`${pathname} 페이지의 제목과 본문을 SUITE 글꼴로 표시함`, async ({ page }) => {
      await page.goto(pathname);
      await page.getByTestId("build-status").getByRole("button", { name: "애니메이션 건너뛰기" }).click();

      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          heading: getComputedStyle(document.querySelector("h1") as Element).fontFamily,
          body: getComputedStyle(document.body).fontFamily,
          loaded: [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
        };
      });

      expect(fonts.heading).toMatch(/suite/i);
      expect(fonts.body).toMatch(/suite/i);
      expect(fonts.loaded.some((family) => /suite/i.test(family))).toBe(true);
      expect(fonts.loaded.some((family) => /pretendard/i.test(family))).toBe(false);
    });
  }

  for (const pathname of PAGES) {
    test(`${pathname} 페이지의 h1, h2 굵기는 모두 800 임`, async ({ page }) => {
      await page.goto(pathname);
      await page.getByTestId("build-status").getByRole("button", { name: "애니메이션 건너뛰기" }).click();

      const weights = await page.locator("h1, h1 span, h2").evaluateAll((headings) =>
        headings.map((heading) => getComputedStyle(heading).fontWeight),
      );
      expect(weights.length).toBeGreaterThan(1);
      expect(new Set(weights)).toEqual(new Set(["800"]));
    });
  }

  test("큰 제목 외의 로고, 카드 제목, 버튼, 본문 굵기는 유지함", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("build-status").getByRole("button", { name: "애니메이션 건너뛰기" }).click();

    await expect(page.locator("header a").first()).toHaveCSS("font-weight", "700");
    await expect(page.locator('#projects [data-slot="card-title"]').first()).toHaveCSS("font-weight", "600");
    await expect(page.locator("#skills h3").first()).toHaveCSS("font-weight", "600");
    await expect(page.locator("#projects").getByRole("link", { name: "상세 보기" }).first()).toHaveCSS("font-weight", "500");
    await expect(page.locator("#top p")).toHaveCSS("font-weight", "400");
  });

  test("가변 글꼴의 굵기 축이 실제로 적용되어 값이 커질수록 글자가 넓고 진하게 그려짐", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("build-status").getByRole("button", { name: "애니메이션 건너뛰기" }).click();

    const rendered = await page.evaluate(async () => {
      await document.fonts.ready;
      const family = getComputedStyle(document.body).fontFamily;
      const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      if (!context) return [];
      context.canvas.width = 900;
      context.canvas.height = 90;
      return [400, 500, 600, 700].map((weight) => {
        context.clearRect(0, 0, 900, 90);
        context.font = `${weight} 60px ${family}`;
        context.fillText("Designing 글꼴", 4, 66);
        const pixels = context.getImageData(0, 0, 900, 90).data;
        let ink = 0;
        for (let index = 3; index < pixels.length; index += 4) ink += pixels[index];
        return { width: context.measureText("Designing 글꼴").width, ink };
      });
    });

    expect(rendered).toHaveLength(4);
    for (let index = 1; index < rendered.length; index += 1) {
      expect(rendered[index].width).toBeGreaterThan(rendered[index - 1].width);
      expect(rendered[index].ink).toBeGreaterThan(rendered[index - 1].ink);
    }
  });
});
