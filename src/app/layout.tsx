import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { MessengerProvider } from "@/context/MessengerContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AppShell } from "@/components/layout/AppShell";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { SocketBridge } from "@/components/messenger/SocketBridge";
import { SITE_CONFIG } from "@/lib/constants";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  // Installed PWAs sit under the status bar / notch on mobile.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_CONFIG.name,
  },
  title: {
    default: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "NexPlay",
    "online gaming platform",
    "esports tournaments",
    "gaming leaderboards",
    "play to earn games",
  ],
  openGraph: {
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-body text-white antialiased">
        <AuthProvider>
          <ToastProvider>
            <MessengerProvider>
              <NotificationProvider>
                <SocketBridge />
                <PWAProvider />
                <AppShell>{children}</AppShell>
              </NotificationProvider>
            </MessengerProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
