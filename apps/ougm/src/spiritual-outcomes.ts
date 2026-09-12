import { drawPrintLine, wrapPrint, addPrintContinuations } from "./pdf-layout";
import layout from "./spiritual-outcomes-layout.json";
export { layout as spiritualLayout };
export function spiritualTotals(
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    layout.totals.map((group) => {
      const cells = layout.rows
        .filter((row) => row.group === group.key)
        .flatMap((row) =>
          layout.days.map((day) => values[`${row.key}.${day}`] || ""),
        );
      return [
        group.key,
        cells.some(Boolean)
          ? String(cells.reduce((sum, value) => sum + Number(value || 0), 0))
          : "",
      ];
    }),
  );
}
export async function createSpiritualOutcomesPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [{ PDFDocument, PDFName }, { default: fontkit }, template, typeface] =
    await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
      load("/ougm/forms/spiritual-outcomes-fillable.pdf"),
      load("/ougm/fonts/DejaVuSerif.ttf"),
    ]);
  if (!template.ok || !typeface.ok)
    throw new Error("The spiritual outcomes template could not be loaded.");
  if (values.from && values.to && values.to < values.from)
    throw new Error("The report end date must be on or after its start date.");
  const pdf = await PDFDocument.load(await template.arrayBuffer());
  pdf.catalog.delete(PDFName.of("AcroForm"));
  const page = pdf.getPages()[0]!;
  page.node.delete(PDFName.of("Annots"));
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), {
    subset: true,
  });
  const overflow: { label: string; lines: string[] }[] = [];
  function draw(
    text: string,
    x: number,
    top: number,
    width: number,
    label = "Continued value",
  ) {
    if (!text) return;
    const lines = wrapPrint(text, font, width);
    if (lines.length > 1) {
      drawPrintLine(page, font, "*", x, top, 18);
      overflow.push({ label, lines: wrapPrint(text, font, 528) });
    } else drawPrintLine(page, font, text, x, top, 18);
  }
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
      : value;
  draw(date(values.from || ""), 637, 61, 105);
  draw(date(values.to || ""), 637, 97, 105);
  layout.days.forEach((day, index) =>
    draw(
      date(values[`date.${day}`] || "").replace(/\/\d{4}$/, ""),
      layout.columns[index]! + 3,
      83,
      layout.columns[index + 1]! - layout.columns[index]! - 6,
      `${day} date`,
    ),
  );
  for (const row of layout.rows) {
    if (row.key.startsWith("recovery"))
      draw(values[`${row.key}.label`] || "", 45, row.top + 4, 220, row.label);
    layout.days.forEach((day, index) => {
      const value = values[`${row.key}.${day}`] || "";
      if (value && !/^\d{1,5}$/.test(value))
        throw new Error("Enter whole-number counts from 0 to 99999.");
      draw(
        value,
        layout.columns[index]! + 4,
        row.top + 4,
        layout.columns[index + 1]! - layout.columns[index]! - 8,
        `${row.label} ${day}`,
      );
    });
  }
  const totals = spiritualTotals(values);
  for (const total of layout.totals)
    draw(
      totals[total.key] || "",
      total.x,
      total.top,
      total.key === "meal" ? 65 : 38,
      `Total ${total.label}`,
    );
  if (overflow.length)
    drawPrintLine(
      page,
      font,
      "* See continuation for the full value.",
      42,
      580,
      18,
    );
  addPrintContinuations(
    pdf,
    font,
    "Weekly Spiritual Outcomes - Continued",
    overflow,
  );
  return pdf.save();
}
