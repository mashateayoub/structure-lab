import { test, expect } from "@playwright/test";
import fs from "node:fs";
const patterns = JSON.parse(fs.readFileSync("src/patterns.json", "utf8")) as {
  id: string;
}[];
test("pattern layouts keep nodes and relationship labels apart", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (const lang of ["en", "fr"]) {
    await page.goto("/#/patterns");
    await page
      .getByRole("button", { name: lang.toUpperCase(), exact: true })
      .click();
    for (const pattern of patterns) {
      await page.goto("/#/patterns/" + pattern.id);
      await expect(page.locator(".diagram-node").first()).toBeVisible();
      await expect(
        page.locator(".react-flow__edge-text").first(),
      ).toBeVisible();
      const collisions = await page
        .locator(".pattern-flow")
        .evaluate((container) => {
          const boxes = [...container.querySelectorAll(".diagram-node")].map(
            (el) => el.getBoundingClientRect(),
          );
          const labels = [
            ...container.querySelectorAll(".react-flow__edge-text"),
          ].map((el) => el.getBoundingClientRect());
          const overlaps = (a: DOMRect, b: DOMRect) =>
            a.left < b.right - 2 &&
            a.right > b.left + 2 &&
            a.top < b.bottom - 2 &&
            a.bottom > b.top + 2;
          return {
            nodes: boxes.some((a, i) =>
              boxes.some((b, j) => i < j && overlaps(a, b)),
            ),
            labels:
              labels.some((a) => boxes.some((b) => overlaps(a, b))) ||
              labels.some((a, i) =>
                labels.some((b, j) => i < j && overlaps(a, b)),
              ),
          };
        });
      expect(collisions, pattern.id).toEqual({ nodes: false, labels: false });
    }
  }
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.goto("/#/patterns/factory-method");
  await expect(page.locator(".diagram-node").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/arranged-factory.png",
    fullPage: true,
  });
});
test("graph auto-arrange preserves traversal and mobile diagrams scroll internally", async ({
  page,
}) => {
  await page.goto("/#12");
  await page.getByRole("button", { name: "Step", exact: true }).click();
  await expect(page.locator(".status")).toContainText("Visit A");
  const node = page.locator('.react-flow__node[data-id="B"]');
  await node.scrollIntoViewIfNeeded();
  const before = await node.getAttribute("style");
  const box = await node.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 55,
    box!.y + box!.height / 2 + 40,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(node).not.toHaveAttribute("style", before!);
  await page.getByRole("button", { name: "Auto arrange", exact: true }).click();
  await expect(page.locator(".status")).toContainText("Visit A");
  await expect(page.locator(".diagram-node")).toHaveCount(6);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/#/patterns/facade", "/#8", "/#7"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/#8");
  await page.screenshot({
    path: "test-results/arranged-tree-mobile.png",
    fullPage: true,
  });
});
