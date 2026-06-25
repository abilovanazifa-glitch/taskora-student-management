import type { NextAuthConfig } from "next-auth";

export default {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
