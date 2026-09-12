import type { PDFFont, PDFPage, PDFDocument } from "pdf-lib";
export const PRINT_SIZE = 12;
export function wrapPrint(
  text: string,
  font: PDFFont,
  width: number,
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  for (const paragraph of text
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .split("\n")) {
    let line = "";
    for (const char of paragraph) {
      if (line && font.widthOfTextAtSize(line + char, PRINT_SIZE) > width) {
        const space = line.lastIndexOf(" ");
        if (space > 0) {
          lines.push(line.slice(0, space));
          line = line.slice(space + 1) + char;
        } else {
          lines.push(line);
          line = char;
        }
      } else line += char;
    }
    lines.push(line);
  }
  return lines;
}
export function drawPrintLine(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  top: number,
  band = 18,
) {
  if (!text) return;
  const ascent = font.heightAtSize(PRINT_SIZE, { descender: false });
  const full = font.heightAtSize(PRINT_SIZE, { descender: true });
  if (band < full + 2)
    throw new Error("The print row is too short for 12-point text.");
  page.drawText(text, {
    x,
    y: page.getHeight() - top - (band - full) / 2 - ascent,
    font,
    size: PRINT_SIZE,
  });
}
export function addPrintContinuations(
  pdf: PDFDocument,
  font: PDFFont,
  title: string,
  sections: { label: string; lines: string[] }[],
) {
  let page: PDFPage | null = null;
  let top = 0;
  function next() {
    page = pdf.addPage([612, 792]);
    drawPrintLine(page, font, title, 42, 30, 22);
    top = 66;
  }
  for (const section of sections) {
    if (!page || top > 680) next();
    drawPrintLine(page!, font, section.label, 42, top, 22);
    top += 26;
    for (const line of section.lines) {
      if (top > 736) {
        next();
        drawPrintLine(page!, font, `${section.label} (continued)`, 42, top, 22);
        top += 26;
      }
      drawPrintLine(page!, font, line, 42, top, 22);
      top += 22;
    }
    top += 16;
  }
}
export const formatPrintDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`
    : value;
