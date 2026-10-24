import { test, expect } from "@playwright/test";

for (const lab of ["structures", "patterns"] as const) {
  test(`${lab}: syntax colors and automatic member completions`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(lab === "structures" ? "/#1" : "/#/patterns/strategy");
    await page
      .getByRole("tab", {
        name: lab === "structures" ? "Code playground" : "Code",
        exact: lab === "patterns",
      })
      .click();
    await expect(page.locator(".monaco-editor")).toBeVisible({
      timeout: 30000,
    });
    for (const mode of lab === "patterns"
      ? ["javascript", "typescript"]
      : ["javascript"]) {
      if (lab === "patterns")
        await page
          .getByRole("combobox", { name: "Code", exact: true })
          .selectOption(mode);
      const input = page.locator(".monaco-editor textarea.inputarea");
      await input.focus();
      await page.keyboard.press("Control+a");
      await page.keyboard.insertText('const greeting = "hello";\ngreeting');
      await expect
        .poll(async () =>
          page
            .locator(".monaco-editor .view-lines span[class*=mtk]")
            .evaluateAll(
              (spans) =>
                new Set(
                  spans
                    .filter((span) => span.textContent?.trim())
                    .map((span) => getComputedStyle(span).color),
                ).size,
            ),
        )
        .toBeGreaterThan(1);
      // A typed dot must open real language-service suggestions without Ctrl+Space.
      await page.keyboard.type(".");
      const suggestions = page.locator(".suggest-widget.visible");
      await expect(suggestions).toBeVisible({ timeout: 20000 });
      await page.keyboard.type("toU");
      const option = suggestions
        .getByRole("option")
        .filter({ hasText: "toUpperCase" });
      await expect(option.first()).toBeVisible();
      await option.first().click();
      await expect(page.locator(".monaco-editor .view-lines")).toContainText(
        "greeting.toUpperCase",
      );
    }
    expect(errors).toEqual([]);
  });
}
