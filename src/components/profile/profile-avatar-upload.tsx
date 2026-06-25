"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { uploadProfileAvatar, removeProfileAvatar } from "@/lib/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProfileAvatarUploadProps = {
  fullName: string;
  avatarUrl: string;
  onAvatarChange: (avatarUrl: string) => void;
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileAvatarUpload({
  fullName,
  avatarUrl,
  onAvatarChange,
  className,
}: ProfileAvatarUploadProps) {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("avatar", file);

        const result = await uploadProfileAvatar(formData);
        if (result.success && result.avatarUrl) {
          setPreview(result.avatarUrl);
          onAvatarChange(result.avatarUrl);
          try {
            await update({ avatarUrl: result.avatarUrl });
          } catch {
            // Avatar saved; session refresh is best-effort.
          }
          setSuccess(true);
        } else if (result.formError) {
          setError(tAuth(`errors.${result.formError}`));
        } else {
          setError(t("avatarUploadFailed"));
        }
      } catch {
        setError(t("avatarUploadFailed"));
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  function handleRemove() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const result = await removeProfileAvatar();
        if (result.success) {
          setPreview("");
          onAvatarChange("");
          try {
            await update({ avatarUrl: null });
          } catch {
            // Avatar removed; session refresh is best-effort.
          }
          setSuccess(true);
        } else if (result.formError) {
          setError(tAuth(`errors.${result.formError}`));
        } else {
          setError(t("avatarUploadFailed"));
        }
      } catch {
        setError(t("avatarUploadFailed"));
      }
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{t("avatarPhoto")}</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-20 shrink-0">
          {preview ? <AvatarImage src={preview} alt={fullName} /> : null}
          <AvatarFallback className="text-lg">{initials(fullName)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {isPending ? t("avatarUploading") : t("avatarUpload")}
          </Button>

          {preview ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              disabled={isPending}
              onClick={handleRemove}
            >
              <Trash2 className="size-4" />
              {t("avatarRemove")}
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />

      <p className="text-caption">{t("avatarUploadHint")}</p>

      {error ? (
        <p className="text-form-error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-form-success" role="status">
          {t("avatarUploadSuccess")}
        </p>
      ) : null}
    </div>
  );
}
