import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める挙動を模す
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

const { default: DashboardPage } = await import("@/app/dashboard/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it("認証済みならダッシュボード見出しを表示する", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "ダッシュボード" })).toBeInTheDocument();
  });

  it("未認証なら /login へリダイレクトする", async () => {
    authMock.mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
