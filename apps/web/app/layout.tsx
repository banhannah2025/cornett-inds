import "@repo/ui/styles.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { BackToTop } from "@/components/back-to-top";

export const metadata: Metadata = {
  title: "Blended Works | Life, work, and possibility—blended",
  description:
    "Meet Robin + Laura™ and explore Blended Works: faith-rooted stories, practical tools, creative services, technology, business support, and a family building forward together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardUrl = process.env.NEXT_PUBLIC_BUSINESS_COMPOSER_URL;
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
      {...(dashboardUrl
        ? {
            allowedRedirectOrigins: [dashboardUrl],
          }
        : {})}
    >
      {document}
    </ClerkProvider>
  ) : (
    document
  );
}
