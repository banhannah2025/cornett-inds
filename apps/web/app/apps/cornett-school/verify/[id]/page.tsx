import Link from "next/link";
import { schoolDb, schoolStorageReady, query } from "@/lib/school/store";
import type { Certificate } from "@/lib/school/model";
import { pathways } from "../../catalog";
import "../../school.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Certificate Verification | Cornett School of Christianity",
  robots: { index: false, follow: false },
};
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let certificate: Certificate | undefined,
    unavailable = false;
  if (
    schoolStorageReady() &&
    process.env.SCHOOL_CERTIFICATES_ENABLED === "true" &&
    /^[0-9a-f-]{36}$/i.test(id)
  ) {
    try {
      certificate = (
        await schoolDb<Certificate[]>(
          "school_certificates",
          query({
            id: `eq.${id}`,
            select:
              "id,pathway,content_version,display_name,public_name,issued_at,revoked_at",
          }),
        )
      )[0];
    } catch {
      unavailable = true;
    }
  }
  return (
    <div className="cornett-school">
      <main className="school-content school-course-page">
        <h1>Certificate verification</h1>
        <section className="school-card">
          {certificate ? (
            <>
              <h2>
                {certificate.revoked_at
                  ? "Revoked certificate"
                  : "Issued certificate"}
              </h2>
              <p>{pathways[certificate.pathway]?.title}</p>
              <p>Certificate ID: {certificate.id}</p>
              <p>
                Issued:{" "}
                {new Date(certificate.issued_at).toISOString().slice(0, 10)}
              </p>
              {certificate.public_name && !certificate.revoked_at && (
                <p>Recipient: {certificate.display_name}</p>
              )}
              <p className="school-muted">
                This verifies a school completion record. It is not an academic
                degree, professional license, ordination, or church endorsement.
              </p>
            </>
          ) : (
            <p>
              {unavailable
                ? "Verification is temporarily unavailable. Please try again later."
                : "No verifiable certificate is available at this address. A course preview or practice activity is not a certificate."}
            </p>
          )}
        </section>
        <Link href="/apps/cornett-school">Visit the school</Link>
      </main>
    </div>
  );
}
