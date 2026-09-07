import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { MessengerProvider } from "@/context/MessengerContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { MessengerLauncher } from "@/components/messenger/MessengerLauncher";
import { MessengerPanel } from "@/components/messenger/MessengerPanel";
import { SocketBridge } from "@/components/messenger/SocketBridge";
import { SITE_CONFIG } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
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
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <Footer />
                <MessengerLauncher />
                <MessengerPanel />
              </NotificationProvider>
            </MessengerProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
