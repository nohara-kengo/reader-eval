import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "reader-eval",
  description: "リーダー研修 評価システム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      {/* ブラウザ拡張機能が body に属性を注入する場合のハイドレーション警告を抑止する */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
