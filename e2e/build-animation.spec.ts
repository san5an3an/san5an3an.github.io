import { expect, test, type Page } from "@playwright/test";

const statusBar = (page: Page) => page.getByTestId("build-status");
const layerCount = (page: Page) => page.getByTestId("build-layers");
const canvas = (page: Page) => page.locator("canvas[data-build-canvas]");
const hiddenElements = (page: Page) => page.locator("[data-build-hidden]");
const replayButton = (page: Page) => page.getByRole("button", { name: "다시 보기" });
const skipButton = (page: Page) => statusBar(page).getByRole("button", { name: "애니메이션 건너뛰기" });

async function readDoneLayers(page: Page) {
  const text = await layerCount(page).textContent();
  return Number(text?.split("/")[0].trim());
}

async function expectFinishedPage(page: Page, timeout = 5000) {
  await expect(replayButton(page)).toBeVisible({ timeout });
  await expect(statusBar(page)).toHaveCount(0);
  await expect(hiddenElements(page)).toHaveCount(0);
  await expect(canvas(page)).toBeHidden();
}

test.describe("조립 애니메이션 재생", () => {
  test("페이지를 열면 커서가 요소를 하나씩 완성해 상태 막대의 레이어 수가 늘어남", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await expect(canvas(page)).toBeVisible();

    const before = await readDoneLayers(page);
    await expect.poll(() => readDoneLayers(page), { timeout: 8000 }).toBeGreaterThan(before + 20);
  });

  test("첫 화면을 다 지으면 아래쪽 요소는 숨긴 채 스크롤 안내를 표시함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page).getByText("스크롤")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#top h1 span").first()).not.toHaveAttribute("data-build-hidden");
    await expect(page.locator("#skills h2")).toHaveAttribute("data-build-hidden");
  });

  test("페이지 끝까지 스크롤하면 모든 요소를 완성하고 다시 보기 버튼만 남김", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expectFinishedPage(page, 20000);
  });

  test("프로젝트 카드 아래쪽 끝이 화면 위로 살짝 지나간 위치에서도 카드를 빠뜨리지 않고 표시함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    const card = page.locator('#projects [data-slot="card"]').first();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const box = document.querySelector('#projects [data-slot="card"]')?.getBoundingClientRect();
      if (box) window.scrollTo(0, box.bottom + window.scrollY + 30);
    });
    await expect(card).not.toHaveAttribute("data-build-hidden", { timeout: 3000 });
  });

  test("조립 도중 스크롤을 맨 위로 되돌려도 상단 메뉴를 완성함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("header nav a").last()).not.toHaveAttribute("data-build-hidden", { timeout: 8000 });
  });

  test("Skills 섹션으로 바로 이동하면 지나친 위쪽 요소를 커서 없이 먼저 표시함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      document.querySelector("#skills")?.scrollIntoView();
    });
    await expect(page.locator("#top h1 span").first()).not.toHaveAttribute("data-build-hidden");
  });
});

test.describe("조립 애니메이션 제어", () => {
  test("건너뛰기 버튼을 누르면 모든 요소를 바로 표시하고 Canvas 를 숨김", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await expectFinishedPage(page);
    await expect(page.locator("#top h1")).toBeVisible();
    await expect(page.locator("#projects h2")).toHaveCSS("opacity", "1");
  });

  test("다시 보기 버튼을 누르면 요소를 다시 숨기고 조립을 처음부터 시작함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await replayButton(page).click();
    await expect(statusBar(page)).toBeVisible();
    await expect(canvas(page)).toBeVisible();
    await expect(page.locator("#skills h2")).toHaveAttribute("data-build-hidden");
  });

  test("일시정지 버튼을 누르면 레이어 수가 멈추고 재생 버튼을 누르면 다시 늘어남", async ({ page }) => {
    await page.goto("/");
    await statusBar(page).getByRole("button", { name: "애니메이션 일시정지" }).click();
    const paused = await readDoneLayers(page);
    await page.waitForTimeout(800);
    expect(await readDoneLayers(page)).toBe(paused);

    await statusBar(page).getByRole("button", { name: "애니메이션 재생" }).click();
    await expect.poll(() => readDoneLayers(page), { timeout: 8000 }).toBeGreaterThan(paused);
  });

  test("재생 속도 버튼을 누르면 표시가 2배로 바뀜", async ({ page }) => {
    await page.goto("/");
    const speed = statusBar(page).getByRole("button", { name: /재생 속도/ });
    await expect(speed).toHaveText("1×");
    await speed.click();
    await expect(speed).toHaveText("2×");
  });

  test("브라우저 폭이 바뀌면 측정 위치가 틀어지므로 완성된 화면으로 전환함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await page.setViewportSize({ width: 900, height: 800 });
    await expectFinishedPage(page);
  });
});

test.describe("조립 애니메이션 접근성과 대체 화면", () => {
  test("조립 중에도 스크린리더가 제목과 프로젝트 내용을 읽을 수 있도록 접근성 트리에 남김", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
    await expect(page.getByRole("heading", { level: 2, name: "Projects" })).toBeAttached();
  });

  test("키보드 포커스가 조립 전 링크로 이동하면 그 링크를 바로 표시함", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    const link = page.locator("#contact a").first();
    await expect(link).toHaveAttribute("data-build-hidden");
    await link.focus();
    await expect(link).not.toHaveAttribute("data-build-hidden");
  });

  test("움직임 줄이기 설정에서는 Canvas 와 상태 막대 없이 완성된 화면을 바로 표시함", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("#top h1")).toBeVisible();
    await expect(page.locator("#top h1")).toHaveCSS("opacity", "1");
    await expect(hiddenElements(page)).toHaveCount(0);
    await expect(statusBar(page)).toHaveCount(0);
    await expect(canvas(page)).toBeHidden();
    await context.close();
  });

  test("자바스크립트가 꺼져 있어도 제목과 프로젝트 내용을 표시함", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("#top h1")).toBeVisible();
    await expect(page.locator("#top h1")).toHaveCSS("opacity", "1");
    await expect(page.locator("#projects h2")).toBeVisible();
    await context.close();
  });
});

test.describe("조립 애니메이션 모바일 화면", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("모바일 폭에서 조립이 끝날 때까지 가로 스크롤이 생기지 않음", async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.waitForTimeout(2500);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await skipButton(page).click();
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
