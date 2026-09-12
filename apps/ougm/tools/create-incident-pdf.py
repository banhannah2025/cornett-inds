from pdf_fonts import configure_font
"""Attach interactive fields to the supplied Mission incident report.
Usage: python create-incident-pdf.py source.pdf output.pdf
"""
import io
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, BooleanObject, DecodedStreamObject, DictionaryObject, ArrayObject, TextStringObject

source, destination = sys.argv[1:]
stream = io.BytesIO()
c = canvas.Canvas(stream, pagesize=(612, 792))
fields = {
    'dateFiled': (324, 81, 87, 23), 'receivedBy': (503, 81, 62, 23),
    'staff': (44, 143, 206, 123), 'location': (270, 143, 296, 40),
    'incidentDate': (280, 235, 128, 20), 'incidentTime': (428, 235, 98, 20),
    'guests': (45, 310, 205, 130),
    'outcomes': (270, 311, 295, 64), 'ban': (306, 412, 55, 30),
    'trespass': (412, 412, 51, 30), 'summary': (46, 483, 519, 262),
}
fields.pop('summary')
for i in range(12): fields['summary' if i==0 else f'summary.line{i+1}']=(46,480.5+i*22.58333+2,519,18)
for name, (x, top, width, height) in fields.items():
    c.acroForm.textfield(name=name, tooltip=name, x=x, y=792-top-height,
        width=width, height=height, fontName="Times-Roman", fontSize=12, borderWidth=0,
        textColor=black, fillColor=white, forceBorder=False,
        fieldFlags='multiline' if height>25 else '', maxlen=20000)
for name,x in [('OPD',284),('CRU',337),('OFD',389),('EMT',441),('COR',493)]:
    c.acroForm.checkbox(name=name, tooltip=name, x=x, y=792-395,
        size=10, buttonStyle='check', borderWidth=1)
for value,y in [('AM',544),('PM',529)]:
    c.acroForm.radio(name='period', value=value, tooltip='AM / PM',
        x=529,y=y,size=9,buttonStyle='circle',borderWidth=1)
for value,x in [('Yes',479),('No',521)]:
    c.acroForm.radio(name='override', value=value, tooltip='Override?',
        x=x,y=792-437,size=9,buttonStyle='circle',borderWidth=1)
c.showPage()
c.save()
writer=PdfWriter()
writer.clone_document_from_reader(PdfReader(source))
overlay=PdfReader(io.BytesIO(stream.getvalue()))
writer.root_object[NameObject('/AcroForm')]=overlay.trailer['/Root']['/AcroForm'].clone(writer)
writer.pages[0].merge_page(overlay.pages[0])
# Canonical fields must reference the actual page widgets, including radio parents.
canonical=[]
radio_parents={}
for reference in writer.pages[0]['/Annots']:
    widget=reference.get_object()
    widget[NameObject('/P')]=writer.pages[0].indirect_reference
    if widget.get('/FT')=='/Btn' and '/T' not in widget:
        choices=set(widget['/AP']['/N'])
        group='period' if '/AM' in choices or '/PM' in choices else 'override'
        parent=next(ref for ref in writer.root_object['/AcroForm']['/Fields'] if ref.get_object().get('/T')==group)
        widget[NameObject('/Parent')]=parent
    if '/Parent' in widget:
        parent_ref=widget.raw_get('/Parent')
        parent=parent_ref.get_object()
        name=str(parent['/T'])
        if name not in radio_parents:
            parent[NameObject('/Kids')]=ArrayObject()
            radio_parents[name]=parent_ref
            canonical.append(parent_ref)
        parent_ref=radio_parents[name]
        widget[NameObject('/Parent')]=parent_ref
        parent_ref.get_object()['/Kids'].append(reference)
    else: canonical.append(reference)
writer.root_object['/AcroForm'][NameObject('/Fields')]=ArrayObject(canonical)
# Leave text backgrounds transparent so the original ruled summary remains visible.
for widget in writer.pages[0]['/Annots']:
    widget=widget.get_object()
    if widget.get('/FT')=='/Tx':
        widget[NameObject('/DA')]=TextStringObject('0 Tc 0 Tw 100 Tz /Time 12 Tf 0 g')
        appearance=DecodedStreamObject(); appearance.set_data(b'q Q')
        appearance.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):widget['/AP']['/N'].get_object()['/BBox']})
        widget[NameObject('/AP')]=DictionaryObject({NameObject('/N'):writer._add_object(appearance)})
        widget['/MK'].pop(NameObject('/BG'),None)
writer.root_object['/AcroForm']['/DR']['/Font']['/Time'][NameObject('/Encoding')]=NameObject('/WinAnsiEncoding')
writer.root_object['/AcroForm'][NameObject('/NeedAppearances')]=BooleanObject(False)
configure_font(writer)
writer.write(destination)
reader=PdfReader(destination)
expected=set(fields)|{'OPD','CRU','OFD','EMT','COR','override','period'}
assert expected == set(reader.get_fields()), reader.get_fields().keys()
assert len(reader.pages)==1
print(f'Validated {len(expected)} interactive fields on the original letter-size page.')
