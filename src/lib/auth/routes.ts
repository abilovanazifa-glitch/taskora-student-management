export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/projects",
  "/calendar",
  "/tasks",
  "/notifications",
  "/profile",
  "/invitations",
] as const;

export const AUTH_ROUTE_PREFIXES = ["/login", "/register"] as const;

export function stripLocaleFromPathname(pathname: string, locales: readonly string[]) {
  for (const locale of locales) {
    if (pathname === `/${locale}`) {
      return "/";
    }

    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }

  return pathname;
}

export function isProtectedPath(pathWithoutLocale: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function isAuthPath(pathWithoutLocale: string) {
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function getLocaleFromPathname(pathname: string, locales: readonly string[], fallback: string) {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }

  return fallback;
}
