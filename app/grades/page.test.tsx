import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める挙動を模す
  throw new Error(`REDIRECT:${path}`);
});
const listGradesMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));
vi.mock("@/features/grades/server/gradesService", () => ({
  listGrades: (...args: unknown[]) => listGradesMock(...args),
}));
// 重い子コンポーネント（server action / hooks 依存）はスタブ化し、ページの責務に絞る
vi.mock("@/components/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/features/grades/components/AddGradeForm", () => ({ AddGradeForm: () => null }));
vi.mock("@/features/grades/components/GradesTable", () => ({ GradesTable: () => null }));

const { default: GradesPage } = await import("@/app/grades/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("GradesPage", () => {
  it("認証済みなら等級管理見出しを表示し、一覧を取得する", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });
    listGradesMock.mockResolvedValue([]);

    render(await GradesPage());

    expect(screen.getByRole("heading", { name: "等級管理" })).toBeInTheDocument();
    expect(listGradesMock).toHaveBeenCalledTimes(1);
  });

  it("未認証なら /login へリダイレクトする", async () => {
    authMock.mockResolvedValue(null);

    await expect(GradesPage()).rejects.toThrow("REDIRECT:/login");
    expect(listGradesMock).not.toHaveBeenCalled();
  });
});
