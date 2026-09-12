import { drawPrintLine, wrapPrint, addPrintContinuations } from "./pdf-layout";

export async function createIncidentReportPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [
    { PDFDocument, PDFName, rgb },
    { default: fontkit },
    template,
    typeface,
  ] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
    load("/ougm/forms/incident-report-fillable.pdf"),
    load("/ougm/fonts/DejaVuSerif.ttf"),
  ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The incident report template could not be loaded.");
  const pdf = await PDFDocument.load(await template.arrayBuffer());
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), {
    subset: true,
  });
  // The printable copy contains only original artwork and drawn entries.
  // Remove the empty field tree and widgets without retaining viewer-managed values.
  pdf.catalog.delete(PDFName.of("AcroForm"));
  for (const page of pdf.getPages()) page.node.delete(PDFName.of("Annots"));
  const first = pdf.getPages()[0]!;
  const overflow: { label: string; lines: string[] }[] = [];
  function field(
    label: string,
    text: string,
    x: number,
    top: number,
    width: number,
    rows: number,
    leading = 18,
  ) {
    const lines = wrapPrint(text, font, width);
    const fits = lines.length <= rows;
    const visible = lines.slice(0, fits ? rows : Math.max(0, rows - 1));
    visible.forEach((line, i) =>
      drawPrintLine(first, font, line, x, top + i * leading, leading),
    );
    if (!fits) {
      drawPrintLine(
        first,
        font,
        "More",
        x,
        top + (rows - 1) * leading,
        leading,
      );
      overflow.push({
        label,
        lines: wrapPrint(lines.slice(visible.length).join("\n"), font, 520),
      });
    }
  }
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
      : value;
  const time = /^(\d{2}):(\d{2})$/.exec(values.incidentTime || "");
  const hour = time ? Number(time[1]) : null;
  field("Date filed", date(values.dateFiled || ""), 324, 82, 87, 1);
  field("Received by (initial)", values.receivedBy || "", 503, 82, 62, 1);
  field("Staff / volunteers involved", values.staff || "", 45, 143, 204, 7);
  field("Location(s) of incident", values.location || "", 270, 143, 295, 2);
  field("Date of incident", date(values.incidentDate || ""), 281, 239, 125, 1);
  field(
    "Time of incident",
    time ? `${hour! % 12 || 12} : ${time[2]}` : values.incidentTime || "",
    433,
    239,
    91,
    1,
  );
  if (hour !== null)
    first.drawRectangle({
      x: 541,
      y: hour >= 12 ? 526 : 541,
      width: 26,
      height: 17,
      borderWidth: 1,
      color: rgb(1, 1, 1),
      opacity: 0,
      borderOpacity: 1,
    });
  field("Guests / visitors involved", values.guests || "", 45, 310, 204, 7);
  field("Outcomes of incident", values.outcomes || "", 270, 311, 295, 4);
  for (const [key, x] of [
    ["OPD", 284],
    ["CRU", 337],
    ["OFD", 389],
    ["EMT", 441],
    ["COR", 493],
  ] as const) {
    first.drawRectangle({
      x,
      y: 397,
      width: 10,
      height: 10,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    if (values[key] === "true")
      first.drawText("X", { x: x + 1, y: 398, size: 12, font });
  }
  field(
    "Banned until",
    date(values.ban || "").replace(/(\d{2}\/\d{2}\/)(\d{4})$/, "$1\n$2"),
    307,
    412,
    54,
    2,
    16,
  );
  field(
    "Trespassed until",
    date(values.trespass || "").replace(/(\d{2}\/\d{2}\/)(\d{4})$/, "$1\n$2"),
    413,
    412,
    50,
    2,
    16,
  );
  for (const x of [483.5, 525.5])
    first.drawCircle({
      x,
      y: 359.5,
      size: 4.5,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  if (values.override === "Yes" || values.override === "No") {
    first.drawCircle({
      x: values.override === "Yes" ? 483.5 : 525.5,
      y: 359.5,
      size: 2.5,
      color: rgb(0, 0, 0),
    });
  }
  field(
    "Detailed summary of incident",
    values.summary || "",
    47,
    480.5,
    517,
    12,
    22.58,
  );
  addPrintContinuations(
    pdf,
    font,
    "Security: Incident Report - Continuation",
    overflow,
  );
  pdf.getPages().forEach((page, i) =>
    page.drawText(`Page ${i + 1} of ${pdf.getPageCount()}`, {
      x: 510,
      y: 20,
      size: 12,
      font,
    }),
  );
  return pdf.save();
}
