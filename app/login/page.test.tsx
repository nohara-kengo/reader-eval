import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
  signIn: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

const { default: LoginPage } = await import("@/app/login/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("未認証なら Microsoft サインイン導線を表示する", async () => {
    authMock.mockResolvedValue(null);

    render(await LoginPage());

    expect(screen.getByRole("button", { name: "Microsoft でサインイン" })).toBeInTheDocument();
  });

  it("認証済みなら /dashboard へリダイレクトする", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });

    await expect(LoginPage()).rejects.toThrow("REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
