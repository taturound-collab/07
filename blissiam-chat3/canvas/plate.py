# -*- coding: utf-8 -*-
"""
Tender Empiricism — Plate I: The Anatomy of Being Heard
A scientific plate documenting the ephemeral phenomenon of two people meeting
in a listening space: two resonance fields overlapping into a shared amber glow.
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Circle, Rectangle, FancyArrow
from matplotlib.collections import LineCollection
import matplotlib.patheffects as pe

FONTS = r"C:\Users\User\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\ad079d9e-6f86-4a5c-bb7e-f63175de36c4\d148a62c-c44a-4834-996c-68c94c19107e\skills\canvas-design\canvas-fonts"
def F(name): return fm.FontProperties(fname=FONTS + "\\" + name)
serif      = F("Italiana-Regular.ttf")      # elegant thin display serif
serif_ed   = F("InstrumentSerif-Regular.ttf")
mono       = F("IBMPlexMono-Regular.ttf")   # clinical annotation
mono_b     = F("IBMPlexMono-Bold.ttf")
thin       = F("Jura-Light.ttf")            # geometric thin
try:
    thai = fm.FontProperties(family="Leelawadee UI")
except Exception:
    thai = mono

# ---- palette (limited, calibrated) ----
PAPER   = "#f3ead9"   # aged cream
PAPER2  = "#efe3cf"
INK     = "#2c352e"   # botanist ink-sage
INK_S   = "#5c6b5c"   # soft ink
AMBER   = "#d0722f"   # ember core
AMBER_L = "#e7a24c"
CORAL   = "#c8563a"
TEAL    = "#4f7567"   # cool breath
FAINT   = "#c9bca2"   # faint rule on paper

W, H = 1620, 2040          # portrait, points
fig = plt.figure(figsize=(W/150, H/150), dpi=150)
ax = fig.add_axes([0,0,1,1]); ax.set_xlim(0,W); ax.set_ylim(0,H)
ax.set_aspect("equal"); ax.axis("off")

# ---- paper ground with subtle vertical warmth ----
grad = np.linspace(0,1,600).reshape(-1,1)
paper_rgb = np.array([[0.953,0.918,0.851],[0.937,0.890,0.812]])
img = (paper_rgb[0]*(1-grad)+paper_rgb[1]*grad)
img = np.repeat(img[:,None,:],2,axis=1)
ax.imshow(img, extent=[0,W,0,H], origin="lower", zorder=0, aspect="auto")

# faint paper tooth (very low-contrast speckle) — patient texture
rng = np.random.default_rng(7)
sx = rng.uniform(0,W,2600); sy = rng.uniform(0,H,2600)
ax.scatter(sx,sy,s=rng.uniform(0.05,0.4,2600),c="#7a6f56",alpha=0.05,zorder=0.5,linewidths=0)

# ---- plate border: double hairline rule ----
M = 118
for i,(off,lw,col) in enumerate([(0,1.4,INK),(14,0.7,INK_S)]):
    ax.add_patch(Rectangle((M+off,M+off),W-2*(M+off),H-2*(M+off),
                 fill=False,lw=lw,ec=col,zorder=3))
# corner registration crosses
def cross(x,y,r=15,lw=1.0,col=INK):
    ax.plot([x-r,x+r],[y,y],col,lw=lw,zorder=4,solid_capstyle="round")
    ax.plot([x,x],[y-r,y+r],col,lw=lw,zorder=4,solid_capstyle="round")
    ax.add_patch(Circle((x,y),r*0.62,fill=False,lw=lw*0.8,ec=col,zorder=4))
for cx in (M+40, W-M-40):
    for cy in (M+40, H-M-40): cross(cx,cy)

# ---- top clinical header ----
tx0, tx1 = M+40, W-M-40
htop = H-M-72
ax.text(tx0, htop, "TENDER  EMPIRICISM", fontproperties=serif, fontsize=25,
        color=INK, va="center", ha="left")
ax.text(tx1, htop, "PLATE  I", fontproperties=mono, fontsize=13,
        color=INK_S, va="center", ha="right", zorder=5)
ax.plot([tx0,tx1],[htop-34,htop-34],color=FAINT,lw=0.8,zorder=3)
ax.text(tx0, htop-58, "THE ANATOMY OF BEING HEARD", fontproperties=mono, fontsize=11.5,
        color=INK_S, va="center", ha="left")
ax.text(tx1, htop-58, "specimen  no. 0.02 — anon / anon", fontproperties=mono, fontsize=9.5,
        color=INK_S, va="center", ha="right")

# ================= CENTRAL PHENOMENON =================
cx, cy = W/2, H*0.575          # meeting point (shared centre)
d = 150                        # half-distance between the two souls
pA = (cx-d, cy)                # one who speaks / vents
pB = (cx+d, cy)                # one who listens

# soft amber glow at the meeting point (radial gradient, built by hand)
gy, gx = np.mgrid[0:H:1, 0:W:1][:, ::4, ::4]  # coarse grid for speed
rr = np.sqrt((gx-cx)**2 + (gy-cy)**2)
glow = np.clip(1 - rr/408, 0, 1)**2.7
gimg = np.zeros(glow.shape+(4,))
amb = np.array([0.847,0.478,0.204]); aml = np.array([0.945,0.706,0.365])
mix = glow[...,None]
gimg[...,:3] = aml*(1-mix**0.6)+amb*(mix**0.6)
gimg[...,3] = glow*0.58
ax.imshow(gimg, extent=[0,W,0,H], origin="lower", zorder=1.6, aspect="auto",
          interpolation="bilinear")

# concentric resonance rings from each soul (ripples of being heard)
def rings(p, n=17, step=27, col=INK, base=0.0):
    x0,y0=p
    for k in range(1,n+1):
        a = 0.42*(1-k/(n+2)) + 0.05
        lw = 1.35 if k<=2 else max(0.35, 1.05-0.03*k)
        ax.add_patch(Circle((x0,y0), base+k*step, fill=False, ec=col,
                     lw=lw, alpha=a, zorder=2))
rings(pA, col=TEAL); rings(pB, col=CORAL)

# the two focal nuclei
for p,c in ((pA,TEAL),(pB,CORAL)):
    ax.add_patch(Circle(p, 8.5, fc=PAPER, ec=c, lw=1.6, zorder=3.2))
    ax.add_patch(Circle(p, 3.2, fc=c, ec="none", zorder=3.3))

# shared kudos-star at the exact centre (น้ำใจ — the point of contact)
def star(x,y,r,rot=90,col=AMBER,ec=INK,lw=1.0,z=4):
    pts=[]
    for i in range(10):
        ang=np.deg2rad(rot + i*36)
        rad = r if i%2==0 else r*0.4
        pts.append((x+rad*np.cos(ang), y+rad*np.sin(ang)))
    poly=plt.Polygon(pts, closed=True, fc=col, ec=ec, lw=lw, zorder=z)
    ax.add_patch(poly)
ax.add_patch(Circle((cx,cy), 30, fc="#f6efe0", ec=AMBER, lw=1.3, zorder=3.6, alpha=0.9))
star(cx,cy,17, col=AMBER_L, ec=AMBER, lw=1.2, z=4)

# fine connecting hair between the two nuclei (the thread of attention)
ax.plot([pA[0]+11,pB[0]-11],[cy,cy], color=INK, lw=0.6, alpha=0.5, zorder=2.4,
        dashes=(1,3))

# tiny orbiting specimen marks around the phenomenon
for ang in np.linspace(0,2*np.pi,13,endpoint=False):
    R=352
    x,y=cx+R*np.cos(ang), cy+R*np.sin(ang)*0.92
    ax.plot([x-4,x+4],[y,y],color=INK_S,lw=0.7,alpha=0.6,zorder=2.5)
    ax.plot([x,x],[y-4,y+4],color=INK_S,lw=0.7,alpha=0.6,zorder=2.5)

# labels for the two souls (clinical, sparse)
ax.text(pA[0], cy-232, "FIG. A", fontproperties=mono, fontsize=10, color=TEAL,
        ha="center", va="center")
ax.text(pA[0], cy-250, "the one who speaks", fontproperties=serif_ed, fontsize=13.5,
        color=INK_S, ha="center", va="center")
ax.text(pB[0], cy-232, "FIG. B", fontproperties=mono, fontsize=10, color=CORAL,
        ha="center", va="center")
ax.text(pB[0], cy-250, "the one who holds", fontproperties=serif_ed, fontsize=13.5,
        color=INK_S, ha="center", va="center")
ax.annotate("locus of contact", xy=(cx,cy+30), xytext=(cx+250,cy+250),
    fontproperties=mono, fontsize=9.5, color=INK, ha="left", va="center",
    arrowprops=dict(arrowstyle="-", color=INK, lw=0.7,
                    connectionstyle="arc3,rad=-0.2"), zorder=6)

# ================= MEASURED AXIS: arc of venting -> calm =================
ax0, ax1 = M+70, W-M-70
ayb = H*0.235
n=520; xs=np.linspace(ax0,ax1,n); t=np.linspace(0,1,n)
env = np.exp(-3.1*t)                      # agitation eases to stillness
wave = env*np.sin(t*34)*46
ys = ayb + wave
# axis baseline + ticks
ax.plot([ax0,ax1],[ayb,ayb],color=INK,lw=1.0,zorder=3)
for i in range(11):
    xt=ax0+(ax1-ax0)*i/10
    ax.plot([xt,xt],[ayb,ayb-9],color=INK_S,lw=0.8,zorder=3)
    ax.text(xt,ayb-22,f"{i/10:.1f}",fontproperties=mono,fontsize=7.5,
            color=INK_S,ha="center",va="center")
# the waveform, colour easing teal->amber (spoken -> received)
segs=np.array([[[xs[i],ys[i]],[xs[i+1],ys[i+1]]] for i in range(n-1)])
cols=[]
for i in range(n-1):
    f=t[i]; c=np.array([0.31,0.46,0.40])*(1-f)+np.array([0.816,0.447,0.184])*f
    cols.append(c)
ax.add_collection(LineCollection(segs,colors=cols,linewidths=1.7,zorder=4))
ax.text(ax0, ayb+70, "un-heard", fontproperties=serif_ed, fontsize=13,
        color=TEAL, ha="left", va="center")
ax.text(ax1, ayb+38, "heard", fontproperties=serif_ed, fontsize=13,
        color=AMBER, ha="right", va="center")
ax.text(ax0, ayb-40, "fig. C — decay of disquiet across the interval of attention",
        fontproperties=mono, fontsize=9, color=INK_S, ha="left", va="center")

# ================= bottom caption block =================
by = H*0.150
ax.plot([cx-300,cx+300],[by+56,by+56],color=FAINT,lw=0.8,zorder=3)
ax.text(cx, by+20, "to be heard is to be held",
        fontproperties=serif, fontsize=30, color=INK, ha="center", va="center")
# whisper-quiet Thai accent (for those who know)
ax.text(cx, by-24, "ไม่เป็นไรที่จะไม่โอเค", fontproperties=thai, fontsize=13,
        color=INK_S, ha="center", va="center")
ax.text(cx, by-50, "—  a study in the transfer of care  —", fontproperties=mono,
        fontsize=9, color=INK_S, ha="center", va="center")

# footer catalogue line — inset to clear the corner registration marks
fy = M+74
ax.text(M+78, fy, "obs. under anonymity  ·  temp. 36.6°C  ·  duration — one conversation",
        fontproperties=mono, fontsize=8.5, color=INK_S, ha="left", va="center")
ax.text(W-M-78, fy, "pl. I / I", fontproperties=mono, fontsize=8.5, color=INK_S,
        ha="right", va="center")

fig.savefig(r"C:\Users\User\Downloads\blissiam-chat3\canvas\tender-empiricism.png",
            dpi=200, facecolor=PAPER)
fig.savefig(r"C:\Users\User\Downloads\blissiam-chat3\canvas\tender-empiricism.pdf",
            facecolor=PAPER)
print("SAVED")
