"""Embed a compact serif TrueType font for reliable 12pt form appearances."""
import io
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from pypdf.generic import NameObject,DictionaryObject,ArrayObject,NumberObject,DecodedStreamObject,TextStringObject

def configure_font(writer):
    path=Path(__file__).resolve().parents[2]/'web/public/ougm/fonts/DejaVuSerif.ttf'
    font=TTFont(path)
    codes={code:ord(bytes([code]).decode('cp1252',errors='replace')) for code in range(32,256)}
    options=subset.Options();options.drop_tables=['FFTM'];options.recalc_timestamp=False
    tool=subset.Subsetter(options=options);tool.populate(unicodes=set(codes.values()));tool.subset(font)
    buffer=io.BytesIO();font.save(buffer);data=buffer.getvalue()
    scale=1000/font['head'].unitsPerEm;cmap=font.getBestCmap()
    widths=[NumberObject(round(font['hmtx'].metrics[cmap.get(codes[code],'.notdef')][0]*scale)) for code in range(32,256)]
    stream=DecodedStreamObject();stream.set_data(data);stream=stream.flate_encode();stream[NameObject('/Length1')]=NumberObject(len(data))
    descriptor=DictionaryObject({NameObject('/Type'):NameObject('/FontDescriptor'),NameObject('/FontName'):NameObject('/OUGMSerif'),NameObject('/Flags'):NumberObject(34),NameObject('/FontBBox'):ArrayObject([NumberObject(round(v*scale)) for v in [font['head'].xMin,font['head'].yMin,font['head'].xMax,font['head'].yMax]]),NameObject('/ItalicAngle'):NumberObject(0),NameObject('/Ascent'):NumberObject(round(font['hhea'].ascent*scale)),NameObject('/Descent'):NumberObject(round(font['hhea'].descent*scale)),NameObject('/CapHeight'):NumberObject(round(font['hhea'].ascent*scale)),NameObject('/StemV'):NumberObject(80),NameObject('/FontFile2'):writer._add_object(stream)})
    serif=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/TrueType'),NameObject('/BaseFont'):NameObject('/OUGMSerif'),NameObject('/Encoding'):NameObject('/WinAnsiEncoding'),NameObject('/FirstChar'):NumberObject(32),NameObject('/LastChar'):NumberObject(255),NameObject('/Widths'):ArrayObject(widths),NameObject('/FontDescriptor'):writer._add_object(descriptor)})
    form=writer.root_object['/AcroForm'];form['/DR']['/Font'][NameObject('/Time')]=writer._add_object(serif);form[NameObject('/DA')]=TextStringObject('/Time 12 Tf 0 g')
