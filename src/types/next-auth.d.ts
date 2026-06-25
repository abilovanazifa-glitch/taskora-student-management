import type { DefaultSession } from "next-auth";
import type { PreferredLanguage, Theme } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      fullName: string;
      email: string;
      preferredLanguage: PreferredLanguage;
      theme: Theme;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    fullName: string;
    preferredLanguage: PreferredLanguage;
    theme: Theme;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    fullName: string;
    email: string;
    preferredLanguage: PreferredLanguage;
    theme: Theme;
    avatarUrl: string | null;
  }
}

export {};
