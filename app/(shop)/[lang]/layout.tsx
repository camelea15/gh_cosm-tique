import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/cairo";
import "@/app/globals.css";
import { CartProvider } from "@/components/shop/cart-provider";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Icon } from "@/components/icons";
import { dirOf, getDict, locales } from "@/lib/i18n";
import { resolveLocale } from "@/lib/page";
import { siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#c82060",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const t = getDict(locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.title, template: "%s | GH Cosmétique" },
    description: t.meta.description,
    applicationName: "GH Cosmétique",
    icons: { icon: "/favicon.png", apple: "/icon-192.png" },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { locale, t } = await resolveLocale(params);
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="min-h-screen bg-white">
        <CartProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
          >
            {t.common.skip}
          </a>
          <div className="bg-brand-700 px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-[13px]">
            <span className="inline-flex items-center gap-2">
              <Icon name="truck" size={15} />
              {t.announce}
            </span>
          </div>
          <Header locale={locale} t={t} />
          <main id="content">{children}</main>
          <Footer locale={locale} t={t} />
        </CartProvider>
      </body>
    </html>
  );
}
