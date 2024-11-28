import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, profile }) {
            if (!profile?.email) {
                throw new Error("Email is required");
            }

            try {
                const userName = profile.name || user.name || "Anonymous User";

                const existingUser = await prisma.user.findUnique({
                    where: { email: profile.email },
                });

                if (existingUser) {
                    await prisma.user.update({
                        where: { email: profile.email },
                        data: {
                            name: userName,
                            profilePic: user.image || null,
                        },
                    });
                } else {
                    await prisma.user.create({
                        data: {
                            name: userName,
                            email: profile.email,
                            profilePic: user.image || null,
                        },
                    });
                }

                return true;
            } catch (error) {
                console.error("Error during sign-in callback:", error);
                return false;
            }
        },
        async session({ session }) {
            const prismaUser = await prisma.user.findUnique({
                where: { email: session.user?.email || undefined },
            });

            if (prismaUser) {
                session.user = {
                    ...session.user,
                    id: prismaUser.id,
                    name: prismaUser.name,
                    email: prismaUser.email,
                    image: prismaUser.profilePic || null,
                };
            }

            return session;
        },
    },
    session: {
        maxAge: 60 * 20,
        updateAge: 60 * 10,
    },
};
