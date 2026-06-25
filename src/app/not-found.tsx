import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans antialiased">
        <h1 className="text-2xl font-semibold">404 — Page not found</h1>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          The page you requested does not exist. Choose a locale to continue.
        </p>
        <div className="flex gap-3">
          <Link href="/ja" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            日本語
          </Link>
          <Link href="/en" className="rounded-md border px-4 py-2 text-sm">
            English
          </Link>
          <Link href="/uz" className="rounded-md border px-4 py-2 text-sm">
            Oʻzbekcha
          </Link>
        </div>
      </body>
    </html>
  );
}
