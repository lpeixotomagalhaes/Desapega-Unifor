import type { Metadata, Viewport } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { CompleteProfileGate } from "@/components/CompleteProfileModal";
import { MainShell } from "@/components/MainShell";
import { MobileTabBarGlobal } from "@/components/MobileTabBarGlobal";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AuthProvider } from "@/lib/auth";
import { MobileChromeProvider } from "@/lib/mobile-chrome";
import { OfflineQueueProvider } from "@/lib/offlineQueue";
import { PendingReviewsProvider } from "@/lib/pendingReviews";
import { SavedItemsProvider } from "@/lib/savedItems";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Desapega UNIFOR — Economia Circular no Campus",
  description:
    "Marketplace universitário de desapego: doe, venda e encontre livros, eletrônicos, jalecos e muito mais dentro do campus.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/brand/unifor-mark-blue.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/unifor-mark-blue.png" }],
    shortcut: ["/favicon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Desapega UNIFOR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1f4d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <OfflineQueueProvider>
            <MobileChromeProvider>
              <SavedItemsProvider>
                <PendingReviewsProvider>
                  <AppHeader />
                  <MainShell>{children}</MainShell>
                  <MobileTabBarGlobal />
                  <CompleteProfileGate />
                </PendingReviewsProvider>
              </SavedItemsProvider>
            </MobileChromeProvider>
          </OfflineQueueProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
