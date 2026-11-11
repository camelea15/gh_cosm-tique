import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata({ locale, path: "/confidentialite", title: t.privacy.title, description: t.privacy.intro.slice(0, 160) });
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { t } = await resolveLocale(params);
  return (
    <div className="container-page max-w-3xl pb-4 pt-10 sm:pt-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t.privacy.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">{t.privacy.intro}</p>
      <div className="mt-10 space-y-8">
        {t.privacy.sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold text-ink">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-ink/80">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
