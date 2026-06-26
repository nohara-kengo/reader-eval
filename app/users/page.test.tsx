import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める挙動を模す
  throw new Error(`REDIRECT:${path}`);
});
const listUsersMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));
vi.mock("@/features/users/server/usersService", () => ({
  listUsers: (...args: unknown[]) => listUsersMock(...args),
}));
// 重い子コンポーネント（server action / hooks 依存）はスタブ化し、ページの責務に絞る
vi.mock("@/components/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/features/users/components/AddUserForm", () => ({ AddUserForm: () => null }));
vi.mock("@/features/users/components/UsersTable", () => ({ UsersTable: () => null }));

const { default: UsersPage } = await import("@/app/users/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  it("認証済みならユーザー管理見出しを表示し、一覧を取得する", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });
    listUsersMock.mockResolvedValue([]);

    render(await UsersPage());

    expect(screen.getByRole("heading", { name: "ユーザー管理" })).toBeInTheDocument();
    expect(listUsersMock).toHaveBeenCalledTimes(1);
  });

  it("未認証なら /login へリダイレクトし、一覧を取得しない", async () => {
    authMock.mockResolvedValue(null);

    await expect(UsersPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(listUsersMock).not.toHaveBeenCalled();
  });
});
