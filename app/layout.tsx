import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "동아리앱 - 충북대학교",
  description: "충북대학교 동아리 커뮤니티 소셜 네트워크 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
