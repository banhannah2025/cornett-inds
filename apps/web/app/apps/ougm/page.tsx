import type { Metadata } from "next";
import Link from "next/link";
import { getOugmAccess } from "@/lib/ougm/auth";
import { OugmWorkspace } from "../../../../ougm/src/workspace";
import "../../../../ougm/src/ougm.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "OUGM | Blended Works",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const access = await getOugmAccess();
  if (!access)
    return (
      <main className="ougm">
        <h1>Olympia Union Gospel Mission</h1>
        <p>
          This workspace is available to Mission staff and Blended Works
          administrators.
        </p>
        <Link href="/sign-in?redirect_url=%2Fapps%2Fougm">Sign in</Link>
        <p>
          If you are already signed in, ask a Blended Works administrator to
          enable your staff access.
        </p>
      </main>
    );
  return <OugmWorkspace {...access} />;
}
