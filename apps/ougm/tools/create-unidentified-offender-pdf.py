from pdf_fonts import configure_font
"""Create the Mission's unidentified offender report with a 216 x 360 pt photo frame."""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('OugmSerif','/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('OugmSerifBold','/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,TextStringObject,BooleanObject
out=sys.argv[1]
c=canvas.Canvas(out,pagesize=(612,792));c.setTitle('Olympia Union Gospel Mission - Unidentified Offender Report')
c.setFont('OugmSerifBold',12);c.drawString(42,756,'OLYMPIA UNION GOSPEL MISSION');c.drawString(42,736,'UNIDENTIFIED OFFENDER REPORT')
c.setFont('OugmSerif',12)
def ruled(key,label,x,top,width,rows):
 c.drawString(x,792-top+5,label)
 for i in range(rows):
  name=key if i==0 else f'{key}.line{i+1}'
  y=792-top-(i+1)*22
  c.line(x,y,x+width,y)
  c.acroForm.textfield(name=name,tooltip=f'{label} line {i+1}',x=x,y=y+2,width=width,height=18,fontName='Times-Roman',fontSize=12,borderWidth=0,fillColor=white,textColor=black,forceBorder=False,maxlen=20000)
ruled('dateFiled','Date Filed',42,100,135,1);ruled('staff','Reporting Staff',190,100,134,1)
ruled('incidentDate','Incident Date',42,144,135,1);ruled('incidentTime','Incident Time',190,144,134,1)
ruled('location','Location(s)',42,188,282,3)
ruled('description','Physical Description / Clothing / Features',42,280,282,7)
c.drawString(354,718,'Identification Photo: 3 x 5 Inches');c.rect(354,350,216,360,stroke=1,fill=0)
ruled('summary','Observed Incident / Behavior',42,482,528,5)
ruled('action','Actions Taken / Response',42,620,528,3)
ruled('followup','Follow-Up / Identifying Information',42,714,528,2)
c.showPage();c.save()
r=PdfReader(out);w=PdfWriter();w.clone_document_from_reader(r)
# Transparent widget backgrounds retain the rules in all PDF viewers.
from pypdf.generic import DictionaryObject,DecodedStreamObject
for a in w.pages[0]['/Annots']:
 f=a.get_object();f[NameObject('/DA')]=TextStringObject('0 Tc 0 Tw 100 Tz /Time 12 Tf 0 g');f['/MK'].pop(NameObject('/BG'),None)
 ap=DecodedStreamObject();ap.set_data(b'q Q');ap.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Form'),NameObject('/BBox'):f['/AP']['/N'].get_object()['/BBox']});f[NameObject('/AP')]=DictionaryObject({NameObject('/N'):w._add_object(ap)})
w.root_object['/AcroForm'][NameObject('/NeedAppearances')]=BooleanObject(False);configure_font(w);w.write(out)
r=PdfReader(out);assert len(r.get_fields())==24;assert len(r.pages[0]['/Annots'])==24
print('Created 24 fillable fields and an exact 3 x 5 inch portrait photo frame.')
