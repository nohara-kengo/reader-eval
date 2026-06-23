import { NextResponse } from "next/server";

// ヘルスチェック（logging.md §6.1）。DB 疎通確認は DB 基盤導入後（Issue #5）に拡張する。
export function GET() {
  return NextResponse.json({ status: "ok" });
}
