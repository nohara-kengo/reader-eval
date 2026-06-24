import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("見出し「reader-eval」を表示する", async () => {
    // 子コンポーネント HealthCheck が /api/health を叩くため fetch をスタブする
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      }),
    );

    render(<Home />);

    expect(screen.getByRole("heading", { name: "reader-eval" })).toBeInTheDocument();
    // HealthCheck の非同期状態更新を act() 内で確実に消化する
    await waitFor(() => {
      expect(screen.getByText(/疎通 OK/)).toBeInTheDocument();
    });
  });
});
