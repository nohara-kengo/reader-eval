import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

const { default: Home } = await import("@/app/page");

describe("Home", () => {
  it("ルート(/) は /login へリダイレクトする", () => {
    expect(() => Home()).toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
