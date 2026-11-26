"use client";
export function CertificatePrint() {
  return (
    <div className="school-actions">
      <button onClick={() => window.print()}>Print or save as PDF</button>
    </div>
  );
}
