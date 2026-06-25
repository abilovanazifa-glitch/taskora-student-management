import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import { authenticateUser, toAuthUser } from "@/lib/auth/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const user = await authenticateUser(credentials);
        if (!user) {
          return null;
        }

        return toAuthUser(user);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName ?? user.name ?? "";
        token.email = user.email ?? "";
        token.preferredLanguage = user.preferredLanguage;
        token.theme = user.theme;
        token.avatarUrl = user.avatarUrl ?? null;
      }

      if (trigger === "update" && session) {
        if (typeof session.fullName === "string") token.fullName = session.fullName;
        if (typeof session.preferredLanguage === "string") {
          token.preferredLanguage = session.preferredLanguage;
        }
        if (typeof session.theme === "string") token.theme = session.theme;
        if ("avatarUrl" in session) token.avatarUrl = session.avatarUrl as string | null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fullName = token.fullName as string;
        session.user.email = token.email as string;
        session.user.preferredLanguage = token.preferredLanguage as "UZ" | "JA";
        session.user.theme = token.theme as "LIGHT" | "DARK" | "SYSTEM";
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null;
        session.user.name = token.fullName as string;
      }

      return session;
    },
  },
});
