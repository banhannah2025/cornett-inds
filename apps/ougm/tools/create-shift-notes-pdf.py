from pdf_fonts import configure_font
"""Add interactive fields to both sides of the supplied Mission shift notes.
Usage: python create-shift-notes-pdf.py source.pdf output.pdf
"""
import io
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, ArrayObject, TextStringObject, BooleanObject, DictionaryObject, DecodedStreamObject

source, destination = sys.argv[1:]
stream = io.BytesIO()
c = canvas.Canvas(stream, pagesize=(612,792))
expected=set()
for page in range(1,3):
    # The old underline sits through a second header line. Move it below both 12pt lines.
    c.setFillColor(white)
    for x in [293,440]: c.rect(x,682,118,36,stroke=0,fill=1)
    c.setStrokeColor(black)
    for x in [296,443]: c.line(x,681,x+112,681)

    def field(name, label, x, top, width, height, multiline=False):
        expected.add(name)
        c.acroForm.textfield(name=name,tooltip=label,x=x,y=792-top-height,width=width,height=height,
            fontName='Times-Roman',fontSize=12,borderWidth=0,textColor=black,fillColor=white,
            fieldFlags='multiline' if multiline else '',maxlen=20000,forceBorder=False)
    field(f'p{page}.begin',f'Page {page}: Shift begins',296,78,112,15)
    field(f'p{page}.end',f'Page {page}: Shift ends',443,78,111,15)
    field(f'p{page}.beginTime',f'Page {page}: Beginning time',296,95,112,15)
    field(f'p{page}.endTime',f'Page {page}: Ending time',443,95,111,15)
    for row in range(1,26):
        top=147.763044+(row-1)*24.263044
        for key,x,width in [('date',44,46),('time',96,45),('initials',148,55),('notes',210,357)]:
            field(f'p{page}.r{row}.{key}',f'Page {page} Entry {row}: {key.title()}',x,top,width,18)
    c.showPage()
c.save()
writer=PdfWriter();writer.clone_document_from_reader(PdfReader(source))
overlay=PdfReader(io.BytesIO(stream.getvalue()))
writer.root_object[NameObject('/AcroForm')]=overlay.trailer['/Root']['/AcroForm'].clone(writer)
canonical=[]
for page,extra in zip(writer.pages,overlay.pages):
    page.merge_page(extra)
    for ref in page['/Annots']:
        widget=ref.get_object()
        widget[NameObject('/P')]=page.indirect_reference
        widget[NameObject('/DA')]=TextStringObject('0 Tc 0 Tw 100 Tz /Time 12 Tf 0 g')
        appearance=DecodedStreamObject();appearance.set_data(b'q Q')
        appearance.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):widget['/AP']['/N'].get_object()['/BBox']})
        widget[NameObject('/AP')]=DictionaryObject({NameObject('/N'):writer._add_object(appearance)})
        widget['/MK'].pop(NameObject('/BG'),None)
        canonical.append(ref)
form=writer.root_object['/AcroForm']
form[NameObject('/Fields')]=ArrayObject(canonical)
form['/DR']['/Font']['/Time'][NameObject('/Encoding')]=NameObject('/WinAnsiEncoding')
form[NameObject('/NeedAppearances')]=BooleanObject(False)
configure_font(writer)
writer.write(destination)
reader=PdfReader(destination)
assert set(reader.get_fields())==expected
assert len(reader.pages)==2
for page in reader.pages:
    assert len(page['/Annots'])==104
    for ref in page['/Annots']:
        widget=ref.get_object()
        assert reader.get_fields()[str(widget['/T'])]['/V']==widget['/V']
        assert widget['/AP']['/N'].get_object().get_data()
print('Validated 208 interactive fields and widgets across both original pages.')
