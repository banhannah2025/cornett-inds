from pdf_fonts import configure_font
"""Add interactive fields to the supplied Mission spiritual outcomes report.
Usage: python create-spiritual-outcomes-pdf.py source.pdf output.pdf
"""
import json
from pathlib import Path
import io
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, ArrayObject, TextStringObject, BooleanObject, DictionaryObject, DecodedStreamObject

source, destination = sys.argv[1:]
stream = io.BytesIO()
c = canvas.Canvas(stream, pagesize=(792,612))
expected=set()
for page in range(1,2):
    def field(name, label, x, top, width, height, multiline=False):
        expected.add(name)
        c.acroForm.textfield(name=name,tooltip=label,x=x,y=612-top-height,width=width,height=height,
            fontName='Times-Roman',fontSize=12,borderWidth=0,textColor=black,fillColor=white,
            fieldFlags='multiline' if multiline else '',maxlen=20000,forceBorder=False)
    layout=json.loads((Path(__file__).parent.parent/'src/spiritual-outcomes-layout.json').read_text())
    for key,top in [('from',60),('to',96)]: field(key,f'Report {key}',637,top,105,15)
    for i,day in enumerate(layout['days']):
        field(f'date.{day}',f'{day} date',layout['columns'][i]+3,82,layout['columns'][i+1]-layout['columns'][i]-6,15)
    for row in layout['rows']:
        if row['key'].startswith('recovery'): field(f"{row['key']}.label",f"{row['label']} name",45,row['top']+4,220,18)
        for i,day in enumerate(layout['days']):
            field(f"{row['key']}.{day}",f"{row['label']} {day} count",layout['columns'][i]+3,row['top']+4,layout['columns'][i+1]-layout['columns'][i]-6,18)
    for total in layout['totals']: field(f"total.{total['key']}",f"Total {total['label']}",total['x'],total['top'],65 if total['key']=='meal' else 38,14)
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
assert len(reader.pages)==1
for page in reader.pages:
    assert len(page['/Annots'])==119
    for ref in page['/Annots']:
        widget=ref.get_object()
        assert reader.get_fields()[str(widget['/T'])]['/V']==widget['/V']
        assert widget['/AP']['/N'].get_object().get_data()
print('Validated 119 interactive fields and widgets on the original landscape page.')
