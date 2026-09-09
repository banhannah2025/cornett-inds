import "./code-ai.css";
import { ServiceWorkerNotifications } from "../code-ai/service-worker-notifications";

export default function CodeAiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <><ServiceWorkerNotifications />{children}</>;
}
