import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

const log = createLogger("auth");

const config: NextAuthConfig = {
  ...authConfig,
  providers: [
    // ── Sosyal Giriş ──────────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })]
      : []),
    // ── E-posta / Şifre ───────────────────────────────────────────────────────
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          throw new Error("E-posta ve şifre gereklidir");
        }

        // Email-based rate limit for login
        const rateCheck = await checkRateLimit(email, "auth");
        if (!rateCheck.allowed) {
          log.warn("Login rate limit aşıldı", { email });
          throw new Error("Çok fazla giriş denemesi. 15 dakika bekleyin.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            isAdmin: true,
            userType: true,
            avatarUrl: true,
            onboardingDone: true,
          },
        });

        if (!user) {
          throw new Error("E-posta veya şifre hatalı");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash ?? "");

        if (!isValid) {
          log.warn("Hatalı şifre denemesi", { email });
          throw new Error("E-posta veya şifre hatalı");
        }

        log.info("Kullanıcı giriş yaptı", { userId: user.id });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? null,
          isAdmin: user.isAdmin,
          userType: user.userType,
          onboardingDone: user.onboardingDone,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 gün
  },
  callbacks: {
    // OAuth ile giriş yapınca kullanıcıyı DB'ye kaydet veya güncelle
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email! } });
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name ?? user.email!.split("@")[0],
                avatarUrl: user.image ?? null,
                onboardingDone: false,
              },
            });
            log.info("OAuth ile yeni kullanıcı oluşturuldu", { email: user.email, provider: account.provider });
          } else if (user.image && !existing.avatarUrl) {
            await prisma.user.update({ where: { id: existing.id }, data: { avatarUrl: user.image } });
          }
        } catch (err) {
          log.error("OAuth signIn DB hatası", { err });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (!user) {
        return token;
      }

      // OAuth logins resolve the canonical user shape once at sign-in.
      if (account?.provider === "google" || account?.provider === "github") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, isAdmin: true, userType: true, avatarUrl: true, onboardingDone: true },
        });

        token.id = dbUser?.id ?? token.sub;
        token.isAdmin = dbUser?.isAdmin ?? false;
        token.userType = dbUser?.userType ?? "INDIVIDUAL";
        token.avatarUrl = dbUser?.avatarUrl ?? user.image ?? null;
        token.onboardingDone = dbUser?.onboardingDone ?? false;
        return token;
      }

      // Credentials logins already have the required claims from authorize().
      const credsUser = user as {
        id: string;
        isAdmin?: boolean;
        userType?: string;
        onboardingDone?: boolean;
      };

      token.id = credsUser.id;
      token.isAdmin = credsUser.isAdmin ?? false;
      token.userType = credsUser.userType ?? "INDIVIDUAL";
      token.avatarUrl = user.image ?? null;
      token.onboardingDone = credsUser.onboardingDone ?? false;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.userType = token.userType as string;
        session.user.image = (token.avatarUrl as string) ?? null;
        (session.user as any).onboardingDone = token.onboardingDone ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const nextUrl = new URL(url, baseUrl);

      if (nextUrl.origin !== baseUrl) {
        return baseUrl;
      }

      if (nextUrl.pathname.startsWith("/api/auth")) {
        return baseUrl;
      }

      if (nextUrl.pathname === "/auth/giris" || nextUrl.pathname === "/auth/kayit") {
        return baseUrl;
      }

      return nextUrl.toString();
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

// Legacy export for gradual migration compatibility
export const authOptions = config;

