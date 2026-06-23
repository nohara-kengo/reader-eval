import { expect, test } from "@playwright/test";

// 主要導線のスモーク（testing.md §7）。実行前に `npm run dev` 等でアプリを起動しておくこと。
test("ヘルスチェックが ok を返す", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ status: "ok" });
});

test("トップページに見出しが表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "reader-eval" })).toBeVisible();
});
