import type { PDFDocument, PDFFont } from "pdf-lib";

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
    load("/ougm/fonts/DejaVuSans.ttf"),
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
    leading = 12,
  ) {
    const lines = wrapText(text, font, 10, width);
    const fits = lines.length <= rows;
    const visible = lines.slice(0, fits ? rows : Math.max(0, rows - 1));
    visible.forEach((line, i) =>
      first.drawText(line, {
        x,
        y: 792 - top - 10 - i * leading,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      }),
    );
    if (!fits) {
      first.drawText("See continuation", {
        x,
        y: 792 - top - 10 - (rows - 1) * leading,
        size: Math.min(8, width / 10),
        font,
      });
      overflow.push({
        label,
        lines: wrapText(lines.slice(visible.length).join("\n"), font, 10, 520),
      });
    }
  }
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
      : value;
  const time = /^(\d{2}):(\d{2})$/.exec(values.incidentTime || "");
  const hour = time ? Number(time[1]) : null;
  field("Date filed", date(values.dateFiled || ""), 324, 82, 87, 2);
  field("Received by (initial)", values.receivedBy || "", 503, 82, 62, 2);
  field("Staff / volunteers involved", values.staff || "", 45, 143, 204, 10);
  field("Location(s) of incident", values.location || "", 270, 143, 295, 3);
  field("Date of incident", date(values.incidentDate || ""), 281, 239, 125, 2);
  field(
    "Time of incident",
    time ? `${hour! % 12 || 12} : ${time[2]}` : values.incidentTime || "",
    433,
    239,
    91,
    2,
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
  field("Guests / visitors involved", values.guests || "", 45, 310, 204, 11);
  field("Outcomes of incident", values.outcomes || "", 270, 311, 295, 5);
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
      first.drawText("X", { x: x + 1, y: 398, size: 10, font });
  }
  field(
    "Banned until",
    date(values.ban || "").replace(/(\d{2}\/\d{2}\/)(\d{4})$/, "$1\n$2"),
    307,
    412,
    54,
    2,
  );
  field(
    "Trespassed until",
    date(values.trespass || "").replace(/(\d{2}\/\d{2}\/)(\d{4})$/, "$1\n$2"),
    413,
    412,
    50,
    2,
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
    486,
    517,
    12,
    22.58,
  );
  addContinuations(pdf, font, overflow, date(values.incidentDate || ""));
  pdf.getPages().forEach((page, i) =>
    page.drawText(`Page ${i + 1} of ${pdf.getPageCount()}`, {
      x: 510,
      y: 20,
      size: 8,
      font,
    }),
  );
  return pdf.save();
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  if (!text) return [];
  const result: string[] = [];
  for (const paragraph of text
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .split("\n")) {
    let line = "";
    for (const character of paragraph) {
      if (line && font.widthOfTextAtSize(line + character, size) > width) {
        const space = line.lastIndexOf(" ");
        if (space > 0) {
          result.push(line.slice(0, space));
          line = line.slice(space + 1) + character;
        } else {
          result.push(line);
          line = character;
        }
      } else line += character;
    }
    result.push(line);
  }
  return result;
}

function addContinuations(
  pdf: PDFDocument,
  font: PDFFont,
  sections: { label: string; lines: string[] }[],
  incidentDate: string,
) {
  let page: ReturnType<PDFDocument["addPage"]> | null = null;
  let y = 0;
  function next() {
    page = pdf.addPage([612, 792]);
    page.drawText("SECURITY: INCIDENT REPORT - CONTINUATION", {
      x: 45,
      y: 746,
      font,
      size: 14,
    });
    page.drawText(
      `Olympia Union Gospel Mission | Incident date: ${incidentDate || "Not entered"}`,
      { x: 45, y: 724, font, size: 10 },
    );
    y = 696;
  }
  for (const section of sections) {
    if (!page || y < 90) next();
    page!.drawText(section.label, { x: 45, y, font, size: 11 });
    y -= 20;
    for (const line of section.lines) {
      if (y < 50) {
        next();
        page!.drawText(`${section.label} (continued)`, {
          x: 45,
          y,
          font,
          size: 11,
        });
        y -= 20;
      }
      if (line) page!.drawText(line, { x: 45, y, font, size: 10 });
      y -= 14;
    }
    y -= 18;
  }
}
