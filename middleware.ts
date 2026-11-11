import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["fr", "ar"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dashboard : sans cookie de session, on renvoie vers la connexion.
  // (La vraie vérification de la session se fait côté serveur dans chaque page et chaque action.)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const open = pathname === "/admin/login" || pathname === "/admin/setup";
    if (!open && !req.cookies.get("gh_admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Boutique : ajoute le préfixe de langue (/fr ou /ar) si absent.
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) return NextResponse.next();

  const accept = req.headers.get("accept-language") ?? "";
  const locale = /^\s*ar/i.test(accept) ? "ar" : "fr";
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

// Ignore l'API, les fichiers internes de Next.js et tous les fichiers statiques (qui contiennent un point).
export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
