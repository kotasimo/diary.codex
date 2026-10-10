import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hibi — 日々を綴る",
  description: "日付でつながる、シンプルな公開日記",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
