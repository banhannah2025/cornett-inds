import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blended Basecamp | Blended Works",
  description: "A practical home base for remote work, connectivity, power, travel, camp readiness, and field notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={GeistSans.className}>{children}</body></html>;
}
