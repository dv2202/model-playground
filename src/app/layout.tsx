'use client';

import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Check if the current route is the login page
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <head>
        <title>AI Models Playground</title>
        <meta name="description" content="Created by Devansh Vishwakarma" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >
        <SessionProvider>
          <Toaster position="top-right" />
          {!isLoginPage && <Sidebar />}
          <main className="flex-1">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
