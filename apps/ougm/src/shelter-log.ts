import type { PDFFont } from "pdf-lib";
export async function createShelterLogPdf(
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
    load("/ougm/forms/shelter-log-fillable.pdf"),
    load("/ougm/fonts/DejaVuSans.ttf"),
  ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The shelter log template could not be loaded.");
  const artwork = await PDFDocument.load(await template.arrayBuffer());
  artwork.catalog.delete(PDFName.of("AcroForm"));
  artwork.getPages().forEach((page) => page.node.delete(PDFName.of("Annots")));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), {
    subset: true,
  });
  for (const index of [0, 1]) {
    const [page] = await pdf.copyPages(artwork, [index]);
    const contents = page!.node.Contents();
    if (contents instanceof PDFArray)
      page!.node.set(PDFName.of("Contents"), contents.clone(pdf.context));
    pdf.addPage(page!);
  }
  const overflow: string[] = [];
  function draw(
    pageIndex: number,
    key: string,
    label: string,
    x: number,
    top: number,
    width: number,
    maxLines: number,
  ) {
    const text = values[key] || "";
    const lines = wrap(text, font, width, 9);
    const page = pdf.getPages()[pageIndex]!;
    lines
      .slice(0, maxLines)
      .forEach((line, i) =>
        page.drawText(line, { x, y: 792 - top - 9 - i * 10, font, size: 9 }),
      );
    if (lines.length > maxLines) overflow.push(`${label}: ${text}`);
  }
  for (const [pageIndex, side, rows, first, step] of [
    [0, "male", 25, 135.51, 24.6076],
    [1, "female", 19, 134.78, 24.88],
  ] as const) {
    const value = values[`${side}.date`] || "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
      : value;
    if (date)
      pdf
        .getPages()
        [pageIndex]!.drawText(date, { x: 453, y: 691, size: 10, font });
    for (let number = 1; number <= rows * 2; number++)
      draw(
        pageIndex,
        `${side}.${number}`,
        `${side === "male" ? "Male" : "Female"} slot ${number}`,
        number <= rows ? 79 : 342,
        first + ((number - 1) % rows) * step + 3,
        222,
        2,
      );
  }
  [624.86, 651.99, 677.03, 700.85, 727.1].forEach((top, index) => {
    draw(
      1,
      `quarantine.${index + 1}.name`,
      `Quarantine row ${index + 1} name`,
      186,
      top + 3,
      210,
      2,
    );
    draw(
      1,
      `quarantine.${index + 1}.location`,
      `Quarantine row ${index + 1} location`,
      404,
      top + 3,
      164,
      2,
    );
  });
  if (overflow.length) {
    let page = pdf.addPage([612, 792]);
    let y = 740;
    const title = () =>
      page.drawText("Shelter log — continued details", {
        x: 40,
        y: 760,
        size: 12,
        font,
      });
    title();
    for (const text of overflow) {
      for (const line of wrap(text, font, 532, 10)) {
        if (y < 40) {
          page = pdf.addPage([612, 792]);
          y = 740;
          title();
        }
        page.drawText(line, { x: 40, y, size: 10, font });
        y -= 14;
      }
      y -= 10;
    }
  }
  return pdf.save();
}
function wrap(
  text: string,
  font: PDFFont,
  width: number,
  size: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) {
        lines.push(line);
        line = "";
      }
      for (const character of line ? ` ${word}` : word) {
        if (font.widthOfTextAtSize(line + character, size) > width) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}
