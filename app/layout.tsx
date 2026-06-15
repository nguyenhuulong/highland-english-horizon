import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { OfflineBanner, ToastContainer } from "@/components/ui/Feedback";
import Providers from "@/components/providers/Providers";
import Companion from "@/components/companion/Companion";

export const metadata: Metadata = {
  title: "Highland English Horizon - Học Tiếng Anh Qua Truyện Tranh & AI",
  description:
    "Nền tảng học tiếng Anh cho học sinh dân tộc thiểu số Tây Nguyên qua truyện tranh tương tác, trò chơi giáo dục và học liệu tạo bằng AI.",
};

export const viewport: Viewport = {
  themeColor: "#E8643A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/service-worker.js').catch(() => {});
            }
          `}
        </Script>
      </head>
      <body>
        <Providers>
          <OfflineBanner />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ToastContainer />
          <Companion />
        </Providers>
      </body>
    </html>
  );
}
