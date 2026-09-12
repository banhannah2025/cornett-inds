import type { PDFFont, PDFPage } from "pdf-lib";
import { parseShiftEntries } from "./shift-entries";

export async function createShiftNotesPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [
    { PDFDocument, PDFName, PDFArray, rgb },
    { default: fontkit },
    template,
    typeface,
  ] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
    load("/ougm/forms/shift-notes-fillable.pdf"),
    load("/ougm/fonts/DejaVuSans.ttf"),
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
      lines: wrap(column.text, font, column.width),
    }));
    const chunks = Math.max(
      1,
      ...columns.map((column) => Math.ceil(column.lines.length / 2)),
    );
    for (let chunk = 0; chunk < chunks; chunk++, slot++) {
      const pageIndex = Math.floor(slot / 25);
      if (pageIndex >= pdf.getPageCount()) {
        await addArtwork(pageIndex % 2);
      }
      const page = pdf.getPages()[pageIndex]!;
      const top = 148 + (slot % 25) * 24.263044;
      columns.forEach((column, index) =>
        column.lines
          .slice(
            index < 3 && column.lines.length <= 2 ? 0 : chunk * 2,
            index < 3 && column.lines.length <= 2 ? 2 : chunk * 2 + 2,
          )
          .forEach((line, index) => {
            if (line)
              page.drawText(line, {
                x: column.x,
                y: 792 - top - 9 - index * 10,
                size: 9,
                font,
                color: rgb(0, 0, 0),
              });
          }),
      );
    }
  }
  function header(value: string, x: number, page: PDFPage) {
    const [day, clock] = value.split("T");
    const lines = clock
      ? [date(day || "").replace("\n", ""), time(clock).replace("\n", " ")]
      : wrap(value, font, 110);
    if (lines.length > 2)
      throw new Error("Enter a date and time for the shift beginning and end.");
    lines.forEach((line, index) => {
      if (line)
        page.drawText(line, { x, y: 792 - 82 - 9 - index * 10, size: 9, font });
    });
  }
  pdf.getPages().forEach((page, index) => {
    header(values.begin || "", 296, page);
    header(values.end || "", 443, page);
    page.drawText(`Page ${index + 1} of ${pdf.getPageCount()}`, {
      x: 510,
      y: 20,
      size: 8,
      font,
    });
  });
  return pdf.save();
}

function wrap(text: string, font: PDFFont, width: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const paragraph of text
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .split("\n")) {
    let line = "";
    for (const character of paragraph) {
      if (line && font.widthOfTextAtSize(line + character, 9) > width) {
        const space = line.lastIndexOf(" ");
        if (space > 0) {
          lines.push(line.slice(0, space));
          line = line.slice(space + 1) + character;
        } else {
          lines.push(line);
          line = character;
        }
      } else line += character;
    }
    lines.push(line);
  }
  return lines;
}
