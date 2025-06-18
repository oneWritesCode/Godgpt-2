import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  callbacks: {
    async signIn({ user, account }: { 
      user: { id: string; email: string; name?: string }; 
      account?: { provider?: string } 
    }) {
      console.log('Sign in callback:', { userId: user.id, provider: account?.provider });
      
      try {
        // Create usage record for new users
        await prisma.usage.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            requestCount: 0,
          },
        });
      } catch (error) {
        console.error('Error creating usage record:', error);
      }
      
      return true;
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;