import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("見出し「reader-eval」を表示する", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "reader-eval" })).toBeInTheDocument();
  });
});
