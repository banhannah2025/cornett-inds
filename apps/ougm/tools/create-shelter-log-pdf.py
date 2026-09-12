"""Add interactive fields to both sides of the supplied Mission shelter sign-in log.
Usage: python create-shelter-log-pdf.py source.pdf output.pdf
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
    def field(name, label, x, top, width, height, multiline=False):
        expected.add(name)
        c.acroForm.textfield(name=name,tooltip=label,x=x,y=792-top-height,width=width,height=height,
            fontName='Courier',fontSize=8,borderWidth=0,textColor=black,fillColor=white,
            fieldFlags='multiline' if multiline else '',maxlen=20000,forceBorder=False)
    side='male' if page==1 else 'female'
    field(f'{side}.date',f'{side.title()} side date',453,87,98,14)
    rows=25 if page==1 else 19
    for number in range(1,rows*2+1):
        top=(135.51 if page==1 else 134.78)+((number-1)%rows)*(24.6076 if page==1 else 24.88)+3
        field(f'{side}.{number}',f'{side.title()} slot {number} name',79 if number<=rows else 342,top,222,17,True)
    if page==2:
        tops=[624.86,651.99,677.03,700.85,727.1]
        for row,top in enumerate(tops,1):
            field(f'quarantine.{row}.name',f'Quarantine row {row} name',186,top+3,210,18,True)
            field(f'quarantine.{row}.location',f'Quarantine row {row} location',404,top+3,164,18,True)
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
        widget[NameObject('/DA')]=TextStringObject('0 Tc 0 Tw 100 Tz /Cour 8 Tf 0 g')
        appearance=DecodedStreamObject();appearance.set_data(b'q Q')
        appearance.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):widget['/AP']['/N'].get_object()['/BBox']})
        widget[NameObject('/AP')]=DictionaryObject({NameObject('/N'):writer._add_object(appearance)})
        widget['/MK'].pop(NameObject('/BG'),None)
        canonical.append(ref)
form=writer.root_object['/AcroForm']
form[NameObject('/Fields')]=ArrayObject(canonical)
form['/DR']['/Font']['/Cour'][NameObject('/Encoding')]=NameObject('/WinAnsiEncoding')
form[NameObject('/NeedAppearances')]=BooleanObject(False)
writer.write(destination)
reader=PdfReader(destination)
assert set(reader.get_fields())==expected
assert len(reader.pages)==2
for page in reader.pages:
    assert len(page['/Annots']) in (51,49)
    for ref in page['/Annots']:
        widget=ref.get_object()
        assert reader.get_fields()[str(widget['/T'])]['/V']==widget['/V']
        assert widget['/AP']['/N'].get_object().get_data()
print('Validated 100 interactive fields and widgets across both original pages.')
