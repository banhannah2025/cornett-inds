import "./code-ai.css";
import { ServiceWorkerNotifications } from "./service-worker-notifications";
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerNotifications />{children}</body></html>;
}