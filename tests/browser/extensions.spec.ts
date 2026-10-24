import { test, expect } from "@playwright/test";
import fs from "node:fs";
import type { Pattern } from "../../src/patternEngine";
const data: Pattern[] = JSON.parse(
  fs.readFileSync("src/patterns.json", "utf8"),
);
test("landing links, bilingual catalog search and category filters", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".lab-card")).toHaveCount(2);
  await page.locator(".lab-card.patterns").click();
  await expect(page.locator(".pattern-card")).toHaveCount(22);
  await page.getByRole("button", { name: "Structural 7", exact: true }).click();
  await expect(page.locator(".pattern-card")).toHaveCount(7);
  await page
    .getByRole("button", { name: "All patterns 22", exact: true })
    .click();
  await page.getByRole("searchbox").fill("subscriber");
  await expect(page.locator(".pattern-card")).toHaveCount(1);
  await expect(page.locator(".pattern-card")).toContainText("Observer");
  await page.getByRole("searchbox").fill("not-a-pattern");
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "FR", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.getByRole("searchbox").fill("Observateur");
  await expect(page.locator(".pattern-card")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveAttribute(
    "placeholder",
    "Rechercher par nom ou intention…",
  );
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox').fill('Observer');
  await expect(page.locator('.pattern-card')).toContainText('Observer');
  await page.locator('.pattern-card').click();
  await expect(page.locator('h1')).toContainText('Observer');

});
test("all 22 pattern lessons run real experiments, diagrams and translated quizzes", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const lang of ["en", "fr"] as const) {
    await page.goto("/#/patterns");
    await page
      .getByRole("button", { name: lang.toUpperCase(), exact: true })
      .click();
    for (const p of data) {
      await page.goto("/#/patterns/" + p.id);
      await expect(page.locator("h1")).toContainText(p.name[lang]);
      await expect(page.locator(".react-flow__node")).toHaveCount(
        p.roles.length,
      );
      await page
        .getByRole("button", {
          name: lang === "en" ? "Step" : "Étape",
          exact: true,
        })
        .click();
      await expect(page.locator(".status").first()).toContainText("→");
      await page
        .getByRole("button", {
          name: lang === "en" ? "Run experiment" : "Lancer l’expérience",
          exact: true,
        })
        .click();
      await expect(page.getByRole("log")).not.toHaveText(
        "Ready. Edit the JavaScript and press Run.",
      );
      await expect(page.getByRole("log")).not.toHaveText(
        "Prêt. Modifiez le JavaScript et lancez l’exécution.",
      );
      const first = await page.getByRole("log").innerText();
      await page.getByRole("checkbox").check();
      await page
        .getByRole("button", {
          name: lang === "en" ? "Run experiment" : "Lancer l’expérience",
          exact: true,
        })
        .click();
      if (!["state", "template-method"].includes(p.id))
        await expect(page.getByRole("log")).not.toHaveText(first);
      else await expect(page.getByRole("log")).toHaveText(first);
      await page.locator(".quiz-options button").nth(p.correct).click();
      await expect(page.locator(".feedback")).toContainText(
        lang === "en" ? "Correct." : "Correct.",
      );
    }
  }
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator(".patterns-top")).toContainText("22 / 22");
});
test("pattern JS and TS editors run locally; repair exercise detects and accepts a solution", async ({
  page,
}) => {
  await page.goto("/#/patterns/adapter");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("combobox", { name: "Code", exact: true })
    .selectOption("typescript");
  await page.getByRole("button", { name: "Run code" }).click();
  await expect(page.getByRole("log")).toContainText("chargedUnits");
  await page.getByRole("tab", { name: "Practice", exact: true }).click();
  await page.getByRole("button", { name: "Run checks", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Check the output and try again.",
  );
  await page
    .getByRole("button", { name: "Plain text editor", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "JavaScript source", exact: true })
    .fill(data.find((p) => p.id === "adapter")!.code);
  await page.getByRole("button", { name: "Run checks", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("6/6");
  await page
    .getByRole("textbox", { name: "JavaScript source", exact: true })
    .fill("while(true) {}");
  await page.getByRole("button", { name: "Run code" }).click();
  await expect(page.getByRole("log")).toContainText("Stopped after 2 seconds");
});
test("browser language default, translated structures feedback and preserved progress", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.locator(".lab-card.structures").click();
  await expect(page.locator("h1")).toContainText("Tableaux");
  await page.getByRole("button", { name: "Empiler", exact: true }).click();
  await expect(page.locator(".status")).toContainText("42 ajouté à la fin.");
  await page.locator(".quiz-options button").nth(2).click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Arrays");
  await expect(page.locator(".quiz-options button").nth(2)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "FR", exact: true }).click();
  await page.getByRole("button", { name: "Recherche", exact: true }).click();
  await page.getByRole("button", { name: "Étape", exact: true }).click();
  await expect(page.locator(".status")).toContainText("Comparer");
  await context.close();
});
test("mobile landing, catalog, lesson and language controls fit viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/#/patterns", "/#/patterns/observer", "/#1"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "FR", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await expect(page.locator(".lab-card.patterns")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator(".lab-card.patterns")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
