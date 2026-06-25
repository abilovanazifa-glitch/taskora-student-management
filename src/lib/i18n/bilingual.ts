import type { AppLocale } from "@/i18n/routing";

export function pickLocalized(locale: AppLocale, uz: string, ja: string) {
  if (locale === "en") {
    return uz.trim() || ja.trim();
  }
  const primary = (locale === "uz" ? uz : ja).trim();
  const fallback = (locale === "uz" ? ja : uz).trim();
  return primary || fallback;
}

type BilingualStoredFields = {
  nameUz: string;
  nameJa: string;
  descriptionUz: string;
  descriptionJa: string;
};

/** Writes only the active UI locale; preserves the other locale on edit. */
export function buildBilingualFieldValues(
  locale: AppLocale,
  active: { name: string; description: string },
  stored: BilingualStoredFields,
  mode: "create" | "edit",
) {
  const name = active.name.trim();
  const description = active.description.trim();
  const storedNameUz = stored.nameUz.trim();
  const storedNameJa = stored.nameJa.trim();
  const storedDescUz = stored.descriptionUz.trim();
  const storedDescJa = stored.descriptionJa.trim();

  if (locale === "uz" || locale === "en") {
    return {
      nameUz: name,
      nameJa: mode === "edit" && storedNameJa ? storedNameJa : name,
      descriptionUz: description,
      descriptionJa: mode === "edit" && storedDescJa ? storedDescJa : description,
    };
  }

  return {
    nameJa: name,
    nameUz: mode === "edit" && storedNameUz ? storedNameUz : name,
    descriptionJa: description,
    descriptionUz: mode === "edit" && storedDescUz ? storedDescUz : description,
  };
}
