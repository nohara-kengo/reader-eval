import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める挙動を模す
  throw new Error(`REDIRECT:${path}`);
});
const listOrganizationsMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));
vi.mock("@/features/organizations/server/organizationsService", () => ({
  listOrganizations: (...args: unknown[]) => listOrganizationsMock(...args),
}));
// 重い子コンポーネント（server action / hooks 依存）はスタブ化し、ページの責務に絞る
vi.mock("@/components/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/features/organizations/components/AddOrganizationForm", () => ({
  AddOrganizationForm: () => null,
}));
vi.mock("@/features/organizations/components/OrganizationsTable", () => ({
  OrganizationsTable: () => null,
}));

const { default: OrganizationsPage } = await import("@/app/organizations/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("OrganizationsPage", () => {
  it("認証済みなら組織管理見出しを表示し、一覧を取得する", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });
    listOrganizationsMock.mockResolvedValue([]);

    render(await OrganizationsPage());

    expect(screen.getByRole("heading", { name: "組織管理" })).toBeInTheDocument();
    expect(listOrganizationsMock).toHaveBeenCalledTimes(1);
  });

  it("未認証なら /login へリダイレクトする", async () => {
    authMock.mockResolvedValue(null);

    await expect(OrganizationsPage()).rejects.toThrow("REDIRECT:/login");
    expect(listOrganizationsMock).not.toHaveBeenCalled();
  });
});
