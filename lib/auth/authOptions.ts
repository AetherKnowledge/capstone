import { createManyChatsWithOthers } from "@/lib/utils";
import { prisma } from "@/prisma/client";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import process from "process";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password!
        );

        return passwordMatch ? user : null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.type = user.type;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;

      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
      });

      session.user.id = user?.id;
      session.user.type = user?.type;
      token.id = user?.id;
      token.type = user?.type;

      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user?.id,
          email: user?.email,
          role: "authenticated",
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret);
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const newUser = await prisma.user.findUnique({
        where: { email: user.email || "" },
      });

      if (!newUser) return;

      await prisma.student.create({
        data: {
          studentId: newUser.id,
        },
      });
      createManyChatsWithOthers(newUser.type, newUser.id);
    },
  },
};

export default authOptions;
