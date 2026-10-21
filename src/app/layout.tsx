import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Game Booster — قدرت بیشتر برای بازی‌های شما",
  description:
    "نمونه‌ساز تعاملی اپلیکیشن Game Booster اندروید: BOOST & PLAY، کتابخانه بازی، Smart RAM Manager، DNS Changer با DoH/DoT، Network Optimizer، WorkManager و معماری MVVM — بدون روت.",
  keywords: ["Game Booster", "DNS Changer", "DoH", "WorkManager", "MVVM", "Android", "گیم بستر"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05060e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;900&family=Orbitron:wght@600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground" style={{ fontFamily: "'Vazirmatn', Tahoma, system-ui, sans-serif" }}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
