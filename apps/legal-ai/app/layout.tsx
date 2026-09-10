import "@repo/ui/styles.css";
import "./globals.css";
import "./code-ai.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ServiceWorkerNotifications } from "./service-worker-notifications";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const document = (
    <html lang="en">
      <body>
        <ServiceWorkerNotifications />
        {children}
      </body>
    </html>
  );

  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider>{document}</ClerkProvider>
  ) : (
    document
  );
}
