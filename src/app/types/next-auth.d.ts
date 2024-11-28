import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  // Extend the Session interface
  interface Session {
    user?: {
      id: string; // Add the `id` field
    } & DefaultSession["user"];
  }

  // Extend the User interface
  interface User extends DefaultUser {
    id: string; // Add the `id` field
  }
}
