import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  // next/navigation の redirect は内部で throw して以降の処理を止める挙動を模す
  throw new Error(`REDIRECT:${path}`);
});
const listEvaluationAxesMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));
vi.mock("@/features/evaluation-axes/server/evaluationAxesService", () => ({
  listEvaluationAxes: (...args: unknown[]) => listEvaluationAxesMock(...args),
}));
// 重い子コンポーネント（server action / hooks 依存）はスタブ化し、ページの責務に絞る
vi.mock("@/components/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/features/evaluation-axes/components/AddCategoryForm", () => ({
  AddCategoryForm: () => null,
}));
vi.mock("@/features/evaluation-axes/components/AddItemForm", () => ({
  AddItemForm: () => null,
}));
vi.mock("@/features/evaluation-axes/components/EvaluationAxesTable", () => ({
  EvaluationAxesTable: () => null,
}));

const { default: EvaluationAxesPage } = await import("@/app/evaluation-axes/page");

afterEach(() => {
  vi.clearAllMocks();
});

describe("EvaluationAxesPage", () => {
  it("認証済みなら評価軸カテゴリ管理見出しを表示し、一覧を取得する", async () => {
    authMock.mockResolvedValue({ user: { name: "山田 太郎" } });
    listEvaluationAxesMock.mockResolvedValue([]);

    render(await EvaluationAxesPage());

    expect(screen.getByRole("heading", { name: "評価軸カテゴリ管理" })).toBeInTheDocument();
    expect(listEvaluationAxesMock).toHaveBeenCalledTimes(1);
  });

  it("未認証なら /login へリダイレクトする", async () => {
    authMock.mockResolvedValue(null);

    await expect(EvaluationAxesPage()).rejects.toThrow("REDIRECT:/login");
    expect(listEvaluationAxesMock).not.toHaveBeenCalled();
  });
});
