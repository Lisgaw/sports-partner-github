import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      userType: string;
      onboardingDone?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    isAdmin?: boolean;
    userType?: string;
    onboardingDone?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
    userType?: string;
    avatarUrl?: string | null;
    onboardingDone?: boolean;
  }
}
