"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 認証後ページのメインナビゲーション項目。
const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/users", label: "ユーザー管理" },
  { href: "/organizations", label: "組織管理" },
  { href: "/grades", label: "等級管理" },
] as const;

// ヘッダー内のメニューバー。現在のパスに一致する項目をアクティブ表示する。
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="メインナビゲーション" className="flex gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
