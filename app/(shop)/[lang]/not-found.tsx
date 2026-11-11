import Link from "next/link";
import { getDict } from "@/lib/i18n";

// Page introuvable : affichée dans les deux langues, car la langue n'est pas connue ici.
export default function NotFound() {
  const fr = getDict("fr");
  const ar = getDict("ar");
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-7xl font-semibold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{fr.notFound.title}</h1>
      <p className="mt-2 text-muted">{fr.notFound.text}</p>
      <p className="mt-6 text-xl font-semibold" dir="rtl" lang="ar">
        {ar.notFound.title}
      </p>
      <p className="mt-1 text-muted" dir="rtl" lang="ar">
        {ar.notFound.text}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/fr" className="btn btn-primary">
          {fr.notFound.cta}
        </Link>
        <Link href="/ar" className="btn btn-outline" lang="ar">
          {ar.notFound.cta}
        </Link>
      </div>
    </div>
  );
}
