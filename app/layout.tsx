import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "reader-eval",
  description: "リーダー研修 評価システム",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
