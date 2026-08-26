import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Blended Planner | Blended Works",
  description: "A purpose-centered calendar and planning journal for faith, family, work, mission, and shared goals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={GeistSans.className}>{children}</body></html>;
}
