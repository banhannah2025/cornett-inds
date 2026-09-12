import {
  drawPrintLine,
  wrapPrint,
  addPrintContinuations,
  formatPrintDate,
} from "./pdf-layout";
export async function createUnidentifiedOffenderPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [{ PDFDocument, PDFName }, { default: fontkit }, template, typeface] =
    await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
      load("/ougm/forms/unidentified-offender-fillable.pdf"),
      load("/ougm/fonts/DejaVuSerif.ttf"),
    ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The unidentified offender form could not be loaded.");
  const pdf = await PDFDocument.load(await template.arrayBuffer());
  pdf.catalog.delete(PDFName.of("AcroForm"));
  const page = pdf.getPages()[0]!;
  page.node.delete(PDFName.of("Annots"));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), {
    subset: true,
  });
  const overflow: { label: string; lines: string[] }[] = [];
  function field(
    key: string,
    label: string,
    x: number,
    top: number,
    width: number,
    rows: number,
  ) {
    const text = ["dateFiled", "incidentDate", "ban", "trespass"].includes(key)
      ? formatPrintDate(values[key] || "")
      : values[key] || "";
    const lines = wrapPrint(text, font, width);
    const shown = lines.slice(0, rows);
    shown.forEach((line, i) =>
      drawPrintLine(page, font, line, x, top + i * 22, 22),
    );
    if (lines.length > rows)
      overflow.push({
        label,
        lines: wrapPrint(lines.slice(rows).join("\n"), font, 528),
      });
  }
  field("dateFiled", "Date Filed", 42, 100, 135, 1);
  field("staff", "Reporting Staff", 190, 100, 134, 1);
  field("incidentDate", "Incident Date", 42, 144, 135, 1);
  field("incidentTime", "Incident Time", 190, 144, 134, 1);
  field("location", "Location(s)", 42, 188, 282, 3);
  field("description", "Physical Description", 42, 280, 282, 7);
  field("summary", "Observed Incident / Behavior", 42, 482, 528, 5);
  field("action", "Actions Taken / Response", 42, 620, 528, 3);
  field("followup", "Follow-Up / Identifying Information", 42, 714, 528, 2);
  if (values.photo) {
    if (
      !/^data:image\/(png|jpeg);base64,/.test(values.photo) ||
      values.photo.length > 12 * 1024 * 1024
    )
      throw new Error("Choose a valid PNG or JPEG photo.");
    try {
      const photo = values.photo.startsWith("data:image/png")
        ? await pdf.embedPng(values.photo)
        : await pdf.embedJpg(values.photo);
      const fitted = photo.scaleToFit(216, 360);
      page.drawImage(photo, {
        x: 354 + (216 - fitted.width) / 2,
        y: 350 + (360 - fitted.height) / 2,
        width: fitted.width,
        height: fitted.height,
      });
    } catch {
      throw new Error(
        "The photo could not be printed. Choose another PNG or JPEG.",
      );
    }
  }
  addPrintContinuations(
    pdf,
    font,
    "Unidentified Offender Report - Continued",
    overflow,
  );
  pdf
    .getPages()
    .forEach((p, i) =>
      drawPrintLine(
        p,
        font,
        `Page ${i + 1} of ${pdf.getPageCount()}`,
        470,
        766,
        18,
      ),
    );
  return pdf.save();
}
