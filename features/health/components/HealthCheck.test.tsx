import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthCheck } from "@/features/health/components/HealthCheck";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HealthCheck", () => {
  it("バックエンド疎通に成功すると疎通 OK を表示する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      }),
    );

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByText(/疎通 OK/)).toBeInTheDocument();
    });
  });

  it("バックエンド疎通に失敗すると失敗メッセージを表示する", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByText("バックエンドへの疎通に失敗しました")).toBeInTheDocument();
    });
  });
});
