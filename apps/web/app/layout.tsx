import "@repo/ui/styles.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { BackToTop } from "@/components/back-to-top";

export const metadata: Metadata = {
  title: "Blended Works | Remote work beyond the map",
  description:
    "Follow Robin and Laura as they work remotely, explore new places, and share honest field notes on Starlink, connectivity, and life beyond the usual office.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_BUSINESS_COMPOSER_URL ?? "http://localhost:3002";
  const document = (
    <html lang="en">
      <body className={GeistSans.className}>
        {children}
        <BackToTop />
      </body>
    </html>
  );

  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider
      allowedRedirectOrigins={["http://localhost:3002"]}
      signInForceRedirectUrl={dashboardUrl}
      signUpForceRedirectUrl={dashboardUrl}
    >
      {document}
    </ClerkProvider>
  ) : (
    document
  );
}
