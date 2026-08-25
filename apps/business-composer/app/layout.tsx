import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Composer | Blended Works",
  description:
    "A unified workspace for managing businesses, clients, and operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? "localhost:3002";
  const signInUrl =
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ??
    "http://localhost:3000/sign-in";
  const signUpUrl =
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ??
    "http://localhost:3000/sign-up";
  const document = (
    <html lang="en">
      <body className={GeistSans.className}>{children}</body>
    </html>
  );

  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider
      domain={domain}
      isSatellite={process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE !== "false"}
      satelliteAutoSync
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
    >
      {document}
    </ClerkProvider>
  ) : (
    document
  );
}
