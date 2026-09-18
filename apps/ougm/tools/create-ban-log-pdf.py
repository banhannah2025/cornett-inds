"""Add interactive fields to both sides of the supplied OUGM ban log.

Usage: python create-ban-log-pdf.py source.pdf output.pdf
"""

import io
import sys

from reportlab.lib.colors import black, white
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    BooleanObject,
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    TextStringObject,
)


source, destination = sys.argv[1:]
stream = io.BytesIO()
c = canvas.Canvas(stream, pagesize=(612, 792))
expected = set()


def field(name, label, x, top, width, height, max_length=2000):
    expected.add(name)
    c.acroForm.textfield(
        name=name,
        tooltip=label,
        x=x,
        y=792 - top - height,
        width=width,
        height=height,
        fontName="Times-Roman",
        fontSize=12,
        borderWidth=0,
        textColor=black,
        fillColor=white,
        maxlen=max_length,
        forceBorder=False,
    )


for page in range(1, 3):
    for row in range(1, 23):
        number = (page - 1) * 22 + row
        top = 135.93 + (row - 1) * 27.995 + 4
        field(f"ban.{number}.name", f"Ban row {number} name", 44, top, 211, 19, 300)
        field(f"ban.{number}.startDate", f"Ban row {number} start date", 263, top, 48, 19, 10)
        field(f"ban.{number}.endDate", f"Ban row {number} end date", 319, top, 44, 19, 10)
        field(f"ban.{number}.reason", f"Ban row {number} reason or notes", 371, top, 164, 19, 1000)
        field(f"ban.{number}.trespass", f"Ban row {number} trespass status", 543, top, 24, 19, 3)
    c.showPage()
c.save()

writer = PdfWriter()
writer.clone_document_from_reader(PdfReader(source))
overlay = PdfReader(io.BytesIO(stream.getvalue()))
writer.root_object[NameObject("/AcroForm")] = overlay.trailer["/Root"]["/AcroForm"].clone(writer)
canonical = []

for page, extra in zip(writer.pages, overlay.pages):
    page.merge_page(extra)
    for ref in page["/Annots"]:
        widget = ref.get_object()
        widget[NameObject("/P")] = page.indirect_reference
        widget[NameObject("/DA")] = TextStringObject("0 Tc 0 Tw 100 Tz /Time 12 Tf 0 g")
        appearance = DecodedStreamObject()
        appearance.set_data(b"q Q")
        appearance.update(
            {
                NameObject("/Type"): NameObject("/XObject"),
                NameObject("/Subtype"): NameObject("/Form"),
                NameObject("/BBox"): widget["/AP"]["/N"].get_object()["/BBox"],
            }
        )
        widget[NameObject("/AP")] = DictionaryObject(
            {NameObject("/N"): writer._add_object(appearance)}
        )
        widget["/MK"].pop(NameObject("/BG"), None)
        canonical.append(ref)

form = writer.root_object["/AcroForm"]
form[NameObject("/Fields")] = ArrayObject(canonical)
form["/DR"]["/Font"]["/Time"][NameObject("/Encoding")] = NameObject("/WinAnsiEncoding")
form[NameObject("/NeedAppearances")] = BooleanObject(False)
writer.write(destination)

reader = PdfReader(destination)
assert set(reader.get_fields()) == expected
assert len(reader.pages) == 2
assert all(len(page["/Annots"]) == 110 for page in reader.pages)
for page in reader.pages:
    for ref in page["/Annots"]:
        widget = ref.get_object()
        assert reader.get_fields()[str(widget["/T"])]["/V"] == widget["/V"]
        assert widget["/AP"]["/N"].get_object().get_data()

print("Validated 220 interactive fields and widgets across both original pages.")
