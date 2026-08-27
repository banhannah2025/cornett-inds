import { ConsoleShell } from "./console-shell";
import { getAdminContext } from "@/lib/admin";

export default async function BasecampPage() {
  const admin = await getAdminContext();
  return <ConsoleShell showAdminLink={admin.isAdmin} />;
}
