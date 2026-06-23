import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("status: ok を返す", async () => {
    const res = GET();
    const json = await res.json();
    expect(json).toEqual({ status: "ok" });
  });
});
