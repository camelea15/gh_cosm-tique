import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration GH Cosmétique" },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#c82060" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="min-h-screen bg-brand-50/40">{children}</body>
    </html>
  );
}
