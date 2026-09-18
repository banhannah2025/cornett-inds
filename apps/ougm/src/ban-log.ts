import {
  addPrintContinuations,
  drawPrintLine,
  wrapPrint,
} from "./pdf-layout";

const formatBanDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(2, 4)}`
    : value;

export async function createBanLogPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [
    { PDFArray, PDFDocument, PDFName, rgb },
    { default: fontkit },
    template,
    typeface,
  ] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
    load("/ougm/forms/ban-log-fillable.pdf"),
    load("/ougm/fonts/DejaVuSerif.ttf"),
  ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The ban and trespass log template could not be loaded.");

  const artwork = await PDFDocument.load(await template.arrayBuffer());
  artwork.catalog.delete(PDFName.of("AcroForm"));
  artwork.getPages().forEach((page) => page.node.delete(PDFName.of("Annots")));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), { subset: true });

  for (const index of [0, 1]) {
    const [page] = await pdf.copyPages(artwork, [index]);
    const contents = page!.node.Contents();
    if (contents instanceof PDFArray)
      page!.node.set(PDFName.of("Contents"), contents.clone(pdf.context));
    pdf.addPage(page!);
  }

  const overflow: { label: string; lines: string[] }[] = [];
  function oneLine(
    pageIndex: number,
    key: string,
    label: string,
    x: number,
    top: number,
    width: number,
  ) {
    const lines = wrapPrint(values[key] || "", font, width - 8);
    if (lines[0])
      drawPrintLine(
        pdf.getPages()[pageIndex]!,
        font,
        lines[0] + (lines.length > 1 ? " *" : ""),
        x,
        top,
        20,
      );
    if (lines.length > 1)
      overflow.push({ label, lines: lines.slice(1) });
  }

  for (let number = 1; number <= 44; number++) {
    const pageIndex = number <= 22 ? 0 : 1;
    const row = (number - 1) % 22;
    const top = 139.93 + row * 27.995;
    const prefix = `ban.${number}`;
    oneLine(pageIndex, `${prefix}.name`, `Row ${number} name`, 44, top, 211);
    const start = formatBanDate(values[`${prefix}.startDate`] || "");
    const end = formatBanDate(values[`${prefix}.endDate`] || "");
    const page = pdf.getPages()[pageIndex]!;
    if (end === "TFN")
      page.drawRectangle({
        x: 315.5,
        y: page.getHeight() - top - 19,
        width: 51,
        height: 19,
        color: rgb(1, 0.88, 0.2),
        opacity: 0.58,
      });
    if (start)
      drawPrintLine(page, font, start, 263, top, 20);
    if (end)
      drawPrintLine(page, font, end, 319, top, 20);
    oneLine(pageIndex, `${prefix}.reason`, `Row ${number} reason / notes`, 371, top, 164);
    const trespass = values[`${prefix}.trespass`] || "";
    if (trespass === "Yes")
      page.drawRectangle({
        x: 539.5,
        y: page.getHeight() - top - 19,
        width: 31,
        height: 19,
        color: rgb(1, 0.88, 0.2),
        opacity: 0.58,
      });
    if (trespass)
      drawPrintLine(
        page,
        font,
        trespass === "Yes" ? "Y" : trespass === "No" ? "N" : trespass,
        547,
        top,
        20,
      );
  }

  addPrintContinuations(pdf, font, "Ban & Trespass List - Continued", overflow);
  return pdf.save();
}
