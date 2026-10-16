import { test, expect } from "@playwright/test";
test("all lessons render and quizzes work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  for (let i = 0; i < 17; i++) {
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Lesson quiz" }),
    ).toBeVisible();
    await page.locator(".quiz-options button").first().click();
    await expect(page.locator(".feedback")).toBeVisible();
    if (i < 16) await page.getByRole("button", { name: "Next lesson" }).click();
  }
  expect(errors).toEqual([]);
});
test("array mutation and stack underflow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Push", exact: true }).click();
  await expect(page.locator(".cell").last()).toHaveText("42");
  await page.getByRole("button", { name: "Stacks", exact: true }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Pop", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("empty");
});
test("search, sorting and traversal controls", async ({ page }) => {
  await page.goto("/#10");
  await page.getByLabel("Algorithm", { exact: true }).selectOption("Binary");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Compare");
  await page.getByRole("button", { name: "Sorting", exact: true }).click();
  await page.getByLabel("Step delay").selectOption("200");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Sorted!", {
    timeout: 12000,
  });
  await page.getByRole("button", { name: "BFS", exact: true }).click();
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Visit A");
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  // Layout/selection updates must not restart the traversal.
  await page.locator('.react-flow__node[data-id="B"]').click();
  await expect(page.getByRole("status").first()).toContainText("Visit A");
  await page.getByLabel("Step delay").selectOption("200");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Complete: A → B → C → D → E → F",
  );
  await page.getByRole("button", { name: "DFS", exact: true }).click();
  await page.getByLabel("Step delay").selectOption("200");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Complete: A → B → D → E → C → F",
  );
});
test("Monaco loads, local code runs, infinite loop stops, challenge passes", async ({
  page,
}) => {
  await page.goto("/#16");
  await page.getByRole("tab", { name: "Code playground" }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Plain text editor", exact: true })
    .click();
  const source = page.getByRole("textbox", { name: "JavaScript source" });
  await source.fill("function unique(values) { return [...new Set(values)]; }");
  await page.getByRole("button", { name: "Check challenge" }).click();
  await expect(page.getByRole("log")).toContainText(
    "5/5 challenge tests passed",
  );
  await source.fill("while(true) {}");
  await page.getByRole("button", { name: "Run code" }).click();
  await expect(page.getByRole("log")).toContainText("Stopped after 2 seconds");
  await source.fill("console.log(6 * 7)");
  await page.getByRole("button", { name: "Run code" }).click();
  await expect(page.getByRole("log")).toHaveText("42");
});
test("mobile navigation, quiz persistence, and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "C Unshift at the front" }).click();
  await page.reload();
  await expect(page.locator(".feedback")).toContainText("Correct.");
  await page.getByRole("button", { name: "☰ Lessons" }).click();
  await page.getByRole("button", { name: "Graphs", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Graphs");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("keyed collections, Set and linked list mutations", async ({ page }) => {
  await page.goto("/#2");
  await page.getByLabel("Key", { exact: true }).fill("language");
  await page.getByLabel("Value", { exact: true }).fill("JavaScript");
  await page
    .locator(".demo-toolbar")
    .getByRole("button", { name: "Set", exact: true })
    .click();
  await expect(page.locator(".entries")).toContainText("JavaScript");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByLabel("Key", { exact: true }).fill("name");
  await page.getByRole("button", { name: "Get", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Ada");
  await page.getByRole("button", { name: "Set", exact: true }).first().click();
  await page.getByLabel("Value", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.locator(".cell")).toHaveCount(5);
  await expect(page.getByRole("status").first()).toContainText("no duplicate");
  await page.getByRole("button", { name: "Linked Lists", exact: true }).click();
  await page.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect(page.locator(".cell").first()).toHaveText("42");
});
test("tree insertion, graph edge editing and growth controls", async ({
  page,
}) => {
  await page.goto("/#8");
  await page.getByRole("button", { name: "Insert node" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(8);
  await expect(page.locator('.react-flow__node[data-id="25"]')).toBeVisible();
  await page.getByRole("button", { name: "Graphs", exact: true }).click();
  await page.getByRole("button", { name: "Add vertex" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.locator("summary").click();
  await page.getByLabel("To", { exact: true }).selectOption("G");
  await page.getByRole("button", { name: "Connect vertices" }).click();
  await expect(page.locator("details")).toContainText("A → G");
  await page.getByRole("button", { name: "Big O", exact: true }).click();
  await page.getByRole("slider").fill("32");
  await expect(page.locator("caption")).toContainText("32");
  await expect(page.locator("table")).toContainText("1,024");
  await page.getByRole("button", { name: "Present ↗" }).click();
  await expect(page.locator(".app")).toHaveClass("app present");
  await page.keyboard.press("Escape");
  await expect(page.locator(".app")).toHaveClass("app ");
});
test("capture desktop and mobile presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".cell").first()).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
