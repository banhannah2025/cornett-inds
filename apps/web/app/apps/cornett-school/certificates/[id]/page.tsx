import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { schoolDb, schoolStorageReady, query } from "@/lib/school/store";
import type { Certificate } from "@/lib/school/model";
import { pathways } from "../../catalog";
import { CertificatePrint } from "../../certificate-print";
import "../../school.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Certificate Record | Cornett School of Christianity",
  robots: { index: false, follow: false },
};
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (
    !schoolStorageReady() ||
    process.env.SCHOOL_CERTIFICATES_ENABLED !== "true" ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )
    notFound();
  const { userId } = await auth();
  if (!userId) notFound();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = await getAdminContext();
  const rows = await schoolDb<Certificate[]>(
    "school_certificates",
    query({
      id: `eq.${id}`,
      ...(admin.isAdmin ? {} : { user_id: `eq.${userId}` }),
      select: "*",
    }),
  );
  const certificate = rows[0];
  if (!certificate) notFound();
  return (
    <div className="cornett-school">
      <main className="school-content school-course-page">
        <article className="school-certificate">
          <p className="school-eyebrow">CORNETT SCHOOL OF CHRISTIANITY</p>
          <h1>
            {certificate.revoked_at
              ? "Revoked certificate"
              : "Certificate of Completion"}
          </h1>
          <p>This records that</p>
          <h2>{certificate.display_name}</h2>
          <p>completed the school’s reviewed requirements for</p>
          <h2>{pathways[certificate.pathway]?.title}</h2>
          <p>
            Issued {new Date(certificate.issued_at).toISOString().slice(0, 10)}
          </p>
          <p>Record: {certificate.id}</p>
          <p className="school-muted">
            Certificate education only. No academic degree, professional
            license, ordination, or church endorsement is conferred.
          </p>
          <Link href={`/apps/cornett-school/verify/${certificate.id}`}>
            Verify this certificate
          </Link>
        </article>
        <CertificatePrint />
        <Link href="/apps/cornett-school/student">
          Return to student records
        </Link>
      </main>
    </div>
  );
}
