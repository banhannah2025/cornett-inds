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
  const document = (
    <html lang="en">
      <body className={GeistSans.className}>{children}</body>
    </html>
  );

  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider
      isSatellite={false}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {document}
    </ClerkProvider>
  ) : (
    document
  );
}
