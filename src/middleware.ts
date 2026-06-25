import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import authConfig from "@/auth.config";
import { routing } from "@/i18n/routing";
import {
  getLocaleFromPathname,
  isAuthPath,
  isProtectedPath,
  stripLocaleFromPathname,
} from "@/lib/auth/routes";
import { preferredLanguageToLocale } from "@/lib/i18n/locale";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname, routing.locales, routing.defaultLocale);
  const pathWithoutLocale = stripLocaleFromPathname(pathname, routing.locales);
  const isLoggedIn = !!request.auth;

  if (isProtectedPath(pathWithoutLocale) && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPath(pathWithoutLocale)) {
    const preferredLocale = request.auth?.user?.preferredLanguage
      ? preferredLanguageToLocale(request.auth.user.preferredLanguage)
      : locale;
    return Response.redirect(
      new URL(`/${preferredLocale}/dashboard`, request.nextUrl.origin),
    );
  }

  if (isLoggedIn && pathWithoutLocale === "/") {
    const preferredLocale = request.auth?.user?.preferredLanguage
      ? preferredLanguageToLocale(request.auth.user.preferredLanguage)
      : locale;
    return Response.redirect(
      new URL(`/${preferredLocale}/dashboard`, request.nextUrl.origin),
    );
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
