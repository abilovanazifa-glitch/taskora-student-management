import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { getHomePath } from "@/lib/navigation/home-path";
import { Button } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  const tCommon = await getTranslations("common");
  const session = await auth();
  const homePath = getHomePath(Boolean(session?.user));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-muted-foreground text-caption font-medium">404</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{t("description")}</p>
      <Button className="cursor-pointer" render={<Link href={homePath}>{tCommon("backHome")}</Link>} />
    </div>
  );
}
