import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatPrintDate } from "./pdf-layout";

const BLUE = rgb(31 / 255, 78 / 255, 121 / 255);
const PALE_BLUE = rgb(217 / 255, 234 / 255, 247 / 255);
const PALE_GOLD = rgb(1, 242 / 255, 204 / 255);
const GOLD = rgb(191 / 255, 144 / 255, 0);
const BLACK = rgb(0, 0, 0);

function names(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
}

function centered(page: PDFPage, font: PDFFont, text: string, size: number, y: number, color = BLACK) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (612 - width) / 2, y, size, font, color });
}

function fit(font: PDFFont, text: string, width: number, preferred = 12) {
  let size = preferred;
  while (size > 9 && font.widthOfTextAtSize(text, size) > width) size -= 0.5;
  return size;
}

export async function createMedicalInsideListPdf(
  values: Record<string, string>,
  load: typeof fetch = fetch,
): Promise<Uint8Array> {
  const typeface = await load("/ougm/fonts/DejaVuSerif.ttf");
  if (!typeface.ok) throw new Error("The medical and inside list font could not be loaded.");

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await typeface.arrayBuffer(), { subset: true });
  const bold = await pdf.embedFont(await typeface.arrayBuffer(), { subset: true });
  const page = pdf.addPage([612, 792]);

  centered(page, bold, "OLYMPIA UNION GOSPEL MISSION", 12, 760, BLUE);
  centered(page, bold, "MEDICAL & INSIDE LIST", 17, 735);
  centered(
    page,
    bold,
    "AUTHORIZED PERSONS WHO MAY REMAIN INSIDE DURING CLOSED HOURS",
    9.5,
    715,
    rgb(68 / 255, 68 / 255, 68 / 255),
  );

  const meta = [
    ["Effective Date", formatPrintDate(values.effectiveDate || "")],
    ["Updated By", values.updatedBy || ""],
    ["Authorized By", values.authorizedBy || ""],
  ];
  meta.forEach(([label, value], index) => {
    const x = 42 + index * 176;
    page.drawText(`${label}:`, { x, y: 690, size: 9, font: bold });
    page.drawText(value, { x, y: 676, size: fit(font, value, 164, 10), font });
    page.drawLine({ start: { x, y: 673 }, end: { x: x + 164, y: 673 }, thickness: 0.75 });
  });

  page.drawRectangle({ x: 42, y: 636, width: 528, height: 28, color: PALE_GOLD, borderColor: GOLD, borderWidth: 1 });
  centered(page, bold, "DO NOT ADD, REMOVE, OR MOVE NAMES EXCEPT AS DIRECTED BY STEVE OR DAWN.", 9.5, 646);

  const xPositions = [42, 218, 394, 570];
  const tableTop = 625;
  const headerHeight = 28;
  const rowHeight = 22;
  const rows = 15;
  page.drawRectangle({ x: 42, y: tableTop - headerHeight, width: 528, height: headerHeight, color: BLUE, borderColor: BLACK, borderWidth: 1 });
  ["MEDICAL", "WORKERS", "STAFF PICKS"].forEach((title, index) => {
    const x = xPositions[index];
    const width = 176;
    const textWidth = bold.widthOfTextAtSize(title, 11);
    page.drawText(title, { x: x + (width - textWidth) / 2, y: tableTop - 19, size: 11, font: bold, color: rgb(1, 1, 1) });
  });

  const medical = names(values.medical || "");
  const workers = names(values.workers || "");
  const staff: { section?: string; name?: string }[] = [
    { section: "BEHAVIOR CONTINGENT" },
    ...names(values.behaviorContingent || "").map((name) => ({ name })),
    { section: "WEATHER DEPENDENT" },
    ...names(values.weatherDependent || "").map((name) => ({ name })),
    { section: "OTHER STAFF PICKS" },
    ...names(values.staffPicks || "").map((name) => ({ name })),
  ];

  for (let row = 0; row < rows; row++) {
    const top = tableTop - headerHeight - row * rowHeight;
    const bottom = top - rowHeight;
    const staffEntry = staff[row];
    if (staffEntry?.section)
      page.drawRectangle({ x: 394, y: bottom, width: 176, height: rowHeight, color: PALE_BLUE });
    const entries = [medical[row] || "", workers[row] || "", staffEntry?.section || staffEntry?.name || ""];
    entries.forEach((text, column) => {
      const isSection = column === 2 && !!staffEntry?.section;
      const usedFont = isSection ? bold : font;
      const size = fit(usedFont, text, 160, isSection ? 9.5 : 12);
      const width = usedFont.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: isSection ? 394 + (176 - width) / 2 : xPositions[column] + 7,
        y: bottom + (rowHeight - size) / 2 + 2,
        size,
        font: usedFont,
        color: isSection ? BLUE : BLACK,
      });
    });
    page.drawLine({ start: { x: 42, y: bottom }, end: { x: 570, y: bottom }, thickness: 0.55 });
  }
  xPositions.forEach((x) =>
    page.drawLine({ start: { x, y: tableTop }, end: { x, y: tableTop - headerHeight - rows * rowHeight }, thickness: 0.75 }),
  );
  page.drawLine({ start: { x: 42, y: tableTop }, end: { x: 570, y: tableTop }, thickness: 0.75 });

  page.drawText(
    "Operational note: Eligibility may be changed at any time by authorized leadership. Verify the current list before granting inside access.",
    { x: 42, y: 245, size: 8, font, color: rgb(68 / 255, 68 / 255, 68 / 255) },
  );
  centered(page, font, "OUGM Internal Use Only | Medical & Inside List", 8, 28, rgb(89 / 255, 89 / 255, 89 / 255));
  return pdf.save();
}
