# -*- coding: utf-8 -*-
"""Quiet Cartography — An Atlas of Quiet Company.
A hand-drawn field-guide plate cataloguing what one small room can hold.
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------- geometry
S  = 2                      # supersample
FW, FH = 2000, 2750         # final canvas
W,  H  = FW*S, FH*S

FONTS = ("C:/Users/User/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/"
         "ad079d9e-6f86-4a5c-bb7e-f63175de36c4/d148a62c-c44a-4834-996c-68c94c19107e/"
         "skills/canvas-design/canvas-fonts")
WINF = "C:/Windows/Fonts"

# ---------------------------------------------------------------- palette
PAPER  = (238, 230, 211)
INK    = (43, 39, 33)
INKSOFT= (122, 112, 97)
SAGE   = (110, 127, 97)
PINE   = (60, 72, 53)
TERRA  = (185, 97, 66)
GOLD   = (196, 160, 72)

def blend(a, b, t):
    return tuple(int(round(a[i]+(b[i]-a[i])*t)) for i in range(3))

HAIR   = blend(PAPER, INK,  0.22)   # subtle rule
HAIR2  = blend(PAPER, INK,  0.12)   # fainter rule
SEP    = blend(PAPER, SAGE, 0.30)   # medallion / separators
CONTOUR= blend(PAPER, PINE, 0.085)  # background topographic lines
MEDBG  = blend(PAPER, PAPER, 0)     # medallion interior = paper

img = Image.new("RGB", (W, H), PAPER)
d   = ImageDraw.Draw(img)

# ---------------------------------------------------------------- helpers
def F(path, size):
    return ImageFont.truetype(os.path.join(FONTS, path), int(size*S))
def FW_(path, size):
    return ImageFont.truetype(os.path.join(WINF, path), int(size*S))

def L(x1,y1,x2,y2,w=1.4,fill=INK,joint=None):
    d.line([(x1*S,y1*S),(x2*S,y2*S)], fill=fill, width=max(1,int(round(w*S))), joint=joint)
def PL(pts,w=1.4,fill=INK,joint="curve"):
    d.line([(x*S,y*S) for x,y in pts], fill=fill, width=max(1,int(round(w*S))), joint=joint)
def POLY(pts,w=1.4,outline=INK,fill=None):
    p=[(x*S,y*S) for x,y in pts]
    d.polygon(p, outline=outline, fill=fill, width=max(1,int(round(w*S))))
def E(cx,cy,r,w=1.4,outline=INK,fill=None):
    d.ellipse([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S], outline=outline,
              fill=fill, width=max(1,int(round(w*S))))
def DOT(cx,cy,r,fill=INK):
    d.ellipse([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S], fill=fill)
def ARC(cx,cy,r,a0,a1,w=1.4,fill=INK):
    d.arc([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S], a0,a1, fill=fill, width=max(1,int(round(w*S))))
def PIE(cx,cy,r,a0,a1,fill=INK):
    d.pieslice([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S], a0,a1, fill=fill)
def T(x,y,s,font,fill=INK,anchor="la",spacing=0):
    d.text((x*S,y*S), s, font=font, fill=fill, anchor=anchor)
def TW(s,font):
    return d.textlength(s, font=font)/S

def tracked(x,y,s,font,fill,track,anchor_center=None):
    """letter-spaced text; if anchor_center given, center on that x."""
    widths=[d.textlength(ch,font=font)/S for ch in s]
    total=sum(widths)+track*(len(s)-1)
    sx = (anchor_center-total/2) if anchor_center is not None else x
    for ch,wch in zip(s,widths):
        d.text((sx*S, y*S), ch, font=font, fill=fill, anchor="la")
        sx += wch+track

# ---------------------------------------------------------------- fonts
f_title = F("Italiana-Regular.ttf", 92)
f_sub   = F("CrimsonPro-Italic.ttf", 33)
f_name  = F("CrimsonPro-Regular.ttf", 33)
f_mono  = F("IBMPlexMono-Regular.ttf", 18)
f_mono_s= F("IBMPlexMono-Regular.ttf", 15.5)
f_monob = F("IBMPlexMono-Bold.ttf", 15.5)
f_th    = FW_("LeelawUI.ttf", 19)
f_th_big= FW_("leelawdb.ttf", 40)
f_th_sm = FW_("LeelawUI.ttf", 16)

# ================================================================ FRAME
def frame():
    o=64
    d.rectangle([o*S,o*S,(FW-o)*S,(FH-o)*S], outline=HAIR, width=int(1.6*S))
    o2=74
    d.rectangle([o2*S,o2*S,(FW-o2)*S,(FH-o2)*S], outline=HAIR2, width=int(1*S))
    # corner ticks
    for cx,cy in [(o,o),(FW-o,o),(o,FH-o),(FW-o,FH-o)]:
        pass

# ================================================================ BACKGROUND contours
HX, HY = 1000, 826          # hero centre
def contours():
    for r in (372,440,512,590,672):
        E(HX,HY,r,w=1.0,outline=CONTOUR)

# ================================================================ HERO
def hero():
    # compass tick ring
    R=300
    for a in range(0,360,3):
        rad=math.radians(a)
        long = (a%15==0)
        r0 = R+ (18 if long else 10)
        r1 = R+2
        L(HX+math.cos(rad)*r0, HY+math.sin(rad)*r0,
          HX+math.cos(rad)*r1, HY+math.sin(rad)*r1,
          w=1.0, fill=(SAGE if long else HAIR2))
    E(HX,HY,R+2,  w=1.2, outline=SAGE)
    E(HX,HY,R+22, w=1.0, outline=HAIR2)
    # concentric ripples of listening
    for i,r in enumerate((70,112,156,202,250)):
        col = INK if i%2==0 else SAGE
        E(HX,HY,r, w=1.3, outline=col)
    # faint radial crosshair
    for a in (0,90,180,270):
        rad=math.radians(a)
        L(HX+math.cos(rad)*40, HY+math.sin(rad)*40,
          HX+math.cos(rad)*292, HY+math.sin(rad)*292, w=0.8, fill=HAIR2)
    # two souls held, joined by a thread
    dx=46
    L(HX-dx,HY,HX+dx,HY, w=1.4, fill=GOLD)
    DOT(HX-dx,HY,13, fill=TERRA)
    DOT(HX+dx,HY,13, fill=TERRA)
    E(HX-dx,HY,20, w=1.1, outline=TERRA)
    E(HX+dx,HY,20, w=1.1, outline=TERRA)
    # tiny cardinal glyph marks
    for a,lab in ((270,"N"),(0,"E"),(90,"S"),(180,"W")):
        rad=math.radians(a)
        T(HX+math.cos(rad)*(R+40), HY+math.sin(rad)*(R+40), lab, f_mono_s, fill=SAGE, anchor="mm")

# ================================================================ GLYPHS
def g_pair(x,y):
    L(x-16,y,x+16,y,w=1.3,fill=INK)
    DOT(x-16,y,5.5,fill=INK); DOT(x+16,y,5.5,fill=INK)
    ARC(x,y-16,20,20,160,w=1.2,fill=SAGE)
    ARC(x,y+16,20,200,340,w=1.2,fill=SAGE)

def g_circles(x,y):
    E(x,y,28,w=1.3,outline=SAGE)
    for a in range(-90,270,72):
        rad=math.radians(a)
        DOT(x+math.cos(rad)*28, y+math.sin(rad)*28, 5, fill=INK)
    DOT(x,y,4,fill=TERRA)

def g_clock(x,y):
    E(x,y,27,w=1.3,outline=INK)
    for a in range(0,360,30):
        rad=math.radians(a-90)
        L(x+math.cos(rad)*24, y+math.sin(rad)*24, x+math.cos(rad)*27, y+math.sin(rad)*27, w=0.9,fill=SAGE)
    # 8:00
    hr=math.radians(240-90); mn=math.radians(0-90)
    L(x,y,x+math.cos(hr)*13,y+math.sin(hr)*13,w=1.4,fill=INK)
    L(x,y,x+math.cos(mn)*19,y+math.sin(mn)*19,w=1.2,fill=TERRA)
    DOT(x,y,2.6,fill=INK)

def g_wave(x,y):
    pts=[]
    for i in range(0,61):
        t=i/60.0
        px=x-30+60*t
        py=y-14*math.sin(t*math.pi*2.3)*math.exp(-0.15*t*3)
        pts.append((px,py))
    L(x-33,y+18,x+33,y+18,w=1.0,fill=HAIR2)
    PL(pts,w=1.4,fill=INK)
    DOT(pts[-1][0],pts[-1][1],4,fill=TERRA)

def g_breath(x,y):
    for r in (10,19,28):
        E(x,y,r,w=1.3,outline=(INK if r==19 else SAGE))
    DOT(x,y,3.4,fill=TERRA)

def g_plant(x,y):
    L(x-16,y+26,x+16,y+26,w=1.2,fill=SAGE)         # ground
    stem=[(x,y+26),(x+2,y+8),(x-3,y-10),(x+1,y-26)]
    PL(stem,w=1.4,fill=INK)
    # leaves
    ARC(x-11,y-6,12,90,210,w=1.2,fill=SAGE)
    ARC(x+11,y-16,12,320,80,w=1.2,fill=SAGE)
    DOT(x+1,y-27,3.4,fill=TERRA)

def g_star(x,y):
    pts=[]
    for i in range(10):
        a=math.radians(-90+i*36)
        r=27 if i%2==0 else 11.5
        pts.append((x+math.cos(a)*r, y+math.sin(a)*r))
    POLY(pts,w=1.4,outline=INK)
    DOT(x,y,2.4,fill=GOLD)

def g_react(x,y):
    # speech bubble
    pts=[(x-26,y-20),(x+26,y-20),(x+26,y+8),(x-10,y+8),(x-18,y+20),(x-16,y+8),(x-26,y+8)]
    POLY(pts,w=1.3,outline=INK)
    # heart inside
    hx,hy=x,y-6
    hp=[]
    for i in range(0,49):
        t=i/48.0*2*math.pi
        px=16*math.sin(t)**3
        py=13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)
        hp.append((hx+px*0.5, hy-py*0.5))
    PL(hp,w=1.2,fill=TERRA)

def g_specialty(x,y):
    E(x-11,y,20,w=1.3,outline=INK)
    E(x+11,y,20,w=1.3,outline=SAGE)
    DOT(x,y,4,fill=TERRA)

def g_net(x,y):
    L(x-26,y-18,x+26,y-18,w=1.2,fill=INK)          # top bar
    L(x-26,y-18,x-20,y+6,w=1.0,fill=SAGE)
    L(x+26,y-18,x+20,y+6,w=1.0,fill=SAGE)
    ARC(x,y-14,30,20,160,w=1.4,fill=INK)           # cradle
    DOT(x,y-2,5.5,fill=TERRA)                       # held

def g_book(x,y):
    L(x,y-20,x,y+18,w=1.2,fill=SAGE)               # spine
    PL([(x,y-16),(x-30,y-9),(x-30,y+15),(x,y+13)],w=1.3,fill=INK)
    PL([(x,y-16),(x+30,y-9),(x+30,y+15),(x,y+13)],w=1.3,fill=INK)
    L(x-24,y-4,x-6,y-6,w=0.9,fill=SAGE)
    L(x+24,y-4,x+6,y-6,w=0.9,fill=SAGE)

def g_chain(x,y):
    for i,off in enumerate((-22,0,22)):
        col=INK if i!=1 else SAGE
        E(x+off,y,14,w=1.4,outline=col)
    DOT(x,y,3,fill=TERRA)

def g_moon(x,y):
    E(x,y,25,w=1.3,outline=INK)
    PIE(x,y,25,-90,90,fill=INK)
    ARC(x,y,25,-90,90,w=1.3,fill=INK)

def g_mend(x,y):
    PL([(x-4,y-24),(x-10,y-8),(x-6,y+8),(x-12,y+24)],w=1.3,fill=INK)
    PL([(x+4,y-24),(x+10,y-8),(x+6,y+8),(x+12,y+24)],w=1.3,fill=INK)
    for yy in (-12,0,12):
        L(x-9,yy+y-4,x+9,yy+y+4,w=1.1,fill=TERRA)

GLYPHS=[g_pair,g_circles,g_clock,g_wave,g_breath,g_plant,g_star,
        g_react,g_specialty,g_net,g_book,g_chain,g_moon,g_mend]

# ================================================================ SPECIMEN DATA
SPECS=[
 ("NG—01","Paired Listening",      "จับคู่รับฟังแบบไม่เปิดเผยตัว"),
 ("NG—02","Sharing Circles",       "วงกลมกลุ่มเล็กพูดคุยตามหัวข้อ"),
 ("NG—03","Scheduled Gathering",   "วงกลมเปิดทุกคืนวันอาทิตย์"),
 ("NG—04","Mood Cartography",      "บันทึกอารมณ์ก่อน–หลัง เป็นกราฟ"),
 ("NG—05","The Breath",            "ฝึกหายใจ ๔·๗·๘ ระหว่างรอคิว"),
 ("NG—06","Gratitude Growth",      "น้ำใจที่ให้ ค่อยๆ โตเป็นต้นไม้"),
 ("NG—07","Small Kindnesses",      "ส่งดาวขอบคุณก่อนลาจากกัน"),
 ("NG—08","Wordless Reactions",    "แตะข้อความด้วยอีโมจิความรู้สึก"),
 ("NG—09","Listener Specialties",  "ผู้รับฟังเลือกหัวข้อถนัด"),
 ("NG—10","The Safety Net",        "พบคำวิกฤต เรียกสายด่วนช่วยเหลือ"),
 ("NG—11","Consent & Care",        "ข้อตกลงอ่อนโยนก่อนพูดคุย"),
 ("NG—12","Quiet Continuity",      "สถิติวันต่อวันและเหรียญกำลังใจ"),
 ("NG—13","Gentle Adaptation",     "โหมดมืด–สว่าง ปรับขนาดตัวอักษร"),
 ("NG—14","Restoration",           "แม้ถูกระงับ ก็ขออุทธรณ์ได้"),
]

def grid():
    gx0,gx1 = 150, 1850
    gy0,gy1 = 1236, 2452
    colw=(gx1-gx0)/2
    rows=7
    rh=(gy1-gy0)/rows
    # faint centre rule
    L(1000, gy0+8, 1000, gy1-8, w=1.0, fill=SEP)
    for i,(code,name,th) in enumerate(SPECS):
        col=i%2; row=i//2
        cx0=gx0+col*colw
        cy = gy0+row*rh + rh/2
        # row baseline
        if col==0:
            L(gx0, gy0+row*rh, gx1, gy0+row*rh, w=0.8, fill=blend(PAPER,SAGE,0.16))
        mx=cx0+92; my=cy
        E(mx,my,52,w=1.1,outline=SEP)
        GLYPHS[i](mx,my)
        tx=cx0+178
        T(tx, cy-40, code, f_mono, fill=TERRA, anchor="lm")
        T(tx, cy-8,  name, f_name, fill=INK,   anchor="lm")
        T(tx, cy+26, th,   f_th,   fill=SAGE,  anchor="lm")
    L(gx0, gy1, gx1, gy1, w=0.8, fill=blend(PAPER,SAGE,0.16))

# ================================================================ HEADER / TITLE / FOOTER
def header():
    y=126
    tracked(0,y,"THE  INSTITVTE  OF  QVIET  COMPANY", f_mono_s, INKSOFT, 3, anchor_center=None)
    T(150,y,"", f_mono_s)  # noop
    # left + right justified
    d.text((150*S,y*S),"", font=f_mono_s)
    # draw plainly
def header2():
    y=122
    T(150,y,"THE  INSTITUTE  OF  QUIET  COMPANY", f_mono_s, fill=INKSOFT, anchor="lm")
    T(1850,y,"PLATE  I  /  XIV", f_mono_s, fill=INKSOFT, anchor="rm")
    L(150,150,1850,150,w=1.1,fill=HAIR)

def title():
    tracked(0,232,"ATLAS  OF  QUIET  COMPANY", f_title, INK, 6, anchor_center=1000)
    T(1000,392,"a field guide to what one small room can hold", f_sub, fill=INKSOFT, anchor="mm")
    # small flanking rules
    L(150,470,1850,470,w=1.0,fill=HAIR2)
    tracked(0,458,"—  FOURTEEN  SPECIMENS  OF  CARE  —", f_mono_s, SAGE, 3, anchor_center=1000)

def footer():
    y=2536
    L(150,y-24,1850,y-24,w=1.1,fill=HAIR)
    T(150,y,"OBSERVED & DRAWN BY HAND", f_mono_s, fill=INKSOFT, anchor="lm")
    T(1850,y,"13.7563° N  ·  100.5018° E", f_mono_s, fill=INKSOFT, anchor="rm")
    # soul line
    T(1000,2602,"ยังมีคนรับฟังเสมอ", f_th_big, fill=INK, anchor="mm")
    tracked(0,2650,"here, someone is always listening", f_mono_s, INKSOFT, 2, anchor_center=1000)

# ================================================================ COMPOSE
frame()
contours()
title()
header2()
hero()
grid()
footer()

# ---------------------------------------------------------------- downsample
final = img.resize((FW,FH), Image.LANCZOS)

# subtle paper grain
try:
    import numpy as np
    arr=np.asarray(final).astype(np.int16)
    rng=np.random.default_rng(7)
    noise=rng.normal(0,7.0,(FH,FW,1))
    arr=np.clip(arr+noise,0,255).astype(np.uint8)
    final=Image.fromarray(arr,"RGB")
except Exception as e:
    print("grain skipped:",e)

out_png="C:/Users/User/Downloads/blissiam-chat3/canvas/quiet-cartography.png"
final.save(out_png,"PNG")
final.convert("RGB").save("C:/Users/User/Downloads/blissiam-chat3/canvas/quiet-cartography.pdf","PDF",resolution=150)
print("saved", out_png, final.size)
