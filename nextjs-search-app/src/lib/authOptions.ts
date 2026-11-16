import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getAuthDb } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      if (!user?.email) return false;

      const emailLower = user.email.trim().toLowerCase();
      const developerEmail = (process.env.DEVELOPER_EMAIL || "").trim().toLowerCase();
      const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

      const db = await getAuthDb();
      const existingUser = await db.get(`SELECT * FROM users WHERE LOWER(email) = ?`, [emailLower]);

      if (!existingUser) {
        let role = 'user';
        let subscriptionTier = 'free';
        let allowedWards = '';
        let allowedGalis = '';

        if (developerEmail && emailLower === developerEmail) {
          role = 'developer';
          subscriptionTier = 'paid';
          allowedWards = 'all';
          allowedGalis = 'all';
        } else if (adminEmail && emailLower === adminEmail) {
          role = 'admin';
          subscriptionTier = 'paid';
          allowedWards = 'all';
          allowedGalis = 'all';
        }

        await db.run(
          `INSERT INTO users (name, email, image, role, subscription_tier, allowed_wards, allowed_galis)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.name || '', emailLower, user.image || '', role, subscriptionTier, allowedWards, allowedGalis]
        );
      }

      return true;
    },

    async jwt({ token }: any) {
      if (token?.email) {
        const emailLower = token.email.trim().toLowerCase();
        const db = await getAuthDb();
        const existingUser = await db.get(`SELECT * FROM users WHERE LOWER(email) = ?`, [emailLower]);

        if (existingUser) {
          token.role = existingUser.role || 'user';
          token.subscription_tier = existingUser.subscription_tier || 'free';
          token.allowed_wards = existingUser.allowed_wards || '';
          token.allowed_galis = existingUser.allowed_galis || '';
        }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role || 'user';
        session.user.subscription_tier = token.subscription_tier || 'free';
        session.user.allowed_wards = token.allowed_wards || '';
        session.user.allowed_galis = token.allowed_galis || '';
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  },
};

