import { wrapPrint, drawPrintLine } from "./pdf-layout";
import type { PDFPage } from "pdf-lib";
import { parseShiftEntries } from "./shift-entries";

export async function createShiftNotesPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [
    { PDFDocument, PDFName, PDFArray },
    { default: fontkit },
    template,
    typeface,
  ] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
    load("/ougm/forms/shift-notes-fillable.pdf"),
    load("/ougm/fonts/DejaVuSerif.ttf"),
  ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The shift notes template could not be loaded.");
  const artwork = await PDFDocument.load(await template.arrayBuffer());
  artwork.catalog.delete(PDFName.of("AcroForm"));
  artwork.getPages().forEach((page) => page.node.delete(PDFName.of("Annots")));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), {
    subset: true,
  });
  // PDFsam may share the Contents array between the supplied sides.
  // Detach it before adding entries so each copied page owns its drawing stream.
  async function addArtwork(index: number) {
    const [page] = await pdf.copyPages(artwork, [index]);
    const contents = page!.node.Contents();
    if (contents instanceof PDFArray)
      page!.node.set(PDFName.of("Contents"), contents.clone(pdf.context));
    pdf.addPage(page!);
  }
  await addArtwork(0);
  await addArtwork(1);
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value.slice(5, 7)}/${value.slice(8, 10)}/\n${value.slice(0, 4)}`
      : value;
  const time = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return value;
    const hour = Number(match[1]);
    return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]}\n${hour >= 12 ? "PM" : "AM"}`;
  };
  let slot = 0;
  for (const entry of parseShiftEntries(values.entries).filter(
    (entry) => entry.date || entry.time || entry.initials || entry.notes,
  )) {
    const columns = [
      { x: 44, width: 46, text: date(entry.date) },
      { x: 96, width: 45, text: time(entry.time) },
      { x: 148, width: 55, text: entry.initials },
      { x: 210, width: 357, text: entry.notes },
    ].map((column) => ({
      ...column,
      lines: wrapPrint(column.text, font, column.width),
    }));
    const chunks = Math.max(1, ...columns.map((column) => column.lines.length));
    for (let chunk = 0; chunk < chunks; chunk++, slot++) {
      const pageIndex = Math.floor(slot / 25);
      if (pageIndex >= pdf.getPageCount()) {
        await addArtwork(pageIndex % 2);
      }
      const page = pdf.getPages()[pageIndex]!;
      const top = 144.763044 + (slot % 25) * 24.263044;
      columns.forEach((column, index) => {
        const line =
          index < 3 && column.lines.length <= 1
            ? column.lines[0]
            : column.lines[chunk];
        if (line) drawPrintLine(page, font, line, column.x, top, 24.263044);
      });
    }
  }
  function header(value: string, x: number, page: PDFPage) {
    const [day, clock] = value.split("T");
    const lines = clock
      ? [date(day || "").replace("\n", ""), time(clock).replace("\n", " ")]
      : wrapPrint(value, font, 110);
    if (lines.length > 2)
      throw new Error("Enter a date and time for the shift beginning and end.");
    lines.forEach((line, index) =>
      drawPrintLine(page, font, line, x, 76 + index * 18, 16),
    );
  }
  pdf.getPages().forEach((page, index) => {
    header(values.begin || "", 296, page);
    header(values.end || "", 443, page);
    page.drawText(`Page ${index + 1} of ${pdf.getPageCount()}`, {
      x: 510,
      y: 20,
      size: 12,
      font,
    });
  });
  return pdf.save();
}
