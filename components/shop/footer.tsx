import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SITE, whatsappLink } from "@/lib/site";
import type { Dict, Locale } from "@/lib/i18n";

export function Footer({ locale, t }: { locale: Locale; t: Dict }) {
  const base = `/${locale}`;
  const social = [
    { href: SITE.instagram, label: "Instagram", icon: "instagram" as const },
    { href: SITE.tiktok, label: "TikTok", icon: "tiktok" as const },
    { href: SITE.facebook, label: "Facebook", icon: "facebook" as const },
    { href: whatsappLink(), label: "WhatsApp", icon: "whatsapp" as const },
  ];
  return (
    <footer id="contact" className="mt-24 border-t border-line bg-brand-50/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14" />
            <span className="font-display text-xl font-semibold text-brand-700">GH Cosmétique</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t.footer.about}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink/80">
            <Icon name="pin" size={16} className="text-brand-600" />
            {t.footer.location}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">{t.footer.links}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link href={`${base}/produits`} className="hover:text-brand-600">
                {t.nav.products}
              </Link>
            </li>
            <li>
              <Link href={`${base}/livraison`} className="hover:text-brand-600">
                {t.nav.delivery}
              </Link>
            </li>
            <li>
              <Link href={`${base}/confidentialite`} className="hover:text-brand-600">
                {t.footer.privacy}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">{t.footer.follow}</h2>
          <ul className="mt-4 flex gap-3">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 transition hover:border-brand-500 hover:bg-brand-600 hover:text-white"
                >
                  <Icon name={s.icon} size={20} />
                </a>
              </li>
            ))}
          </ul>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <Icon name="phone" size={16} />
            <span dir="ltr">{SITE.whatsappDisplay}</span>
          </a>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} GH Cosmétique. {t.footer.rights}
      </div>
    </footer>
  );
}
