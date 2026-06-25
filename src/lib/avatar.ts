export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isValidAvatarUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/uploads/avatars/")) return true;
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function avatarExtensionFromMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export function avatarMimeFromFileName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return null;
  }
}

export function resolveAvatarMimeType(file: File): string | null {
  if (AVATAR_ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const fromName = avatarMimeFromFileName(file.name);
  if (fromName && AVATAR_ALLOWED_TYPES.has(fromName)) {
    return fromName;
  }

  return null;
}
