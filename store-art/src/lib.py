from PIL import Image, ImageDraw, ImageFont, ImageChops
import numpy as np
L='/mnt/project-files/brand/podcast-ep10/layers/as-designed/'
F='/mnt/project-files/release/build/'
ORANGE=(228,141,29); INK=(238,241,246); BLACK=(12,13,15); CREAM=(244,236,222)
def font(name,size): return ImageFont.truetype(F+name,size)
ANTON='Anton-Regular.ttf'; MONO='AnonymousPro-Bold.ttf'; MAN='manrope_700_bold.ttf'; MAN5='manrope_500_medium.ttf'
def ink_mask(im):
    a=np.asarray(im.convert('RGBA')).astype(float)
    lum=a[...,:3].mean(-1)/255.
    alpha=a[...,3]/255.*(1-lum)  # darkness * alpha
    alpha=np.clip(alpha*1.6,0,1)
    return Image.fromarray((alpha*255).astype('uint8'))
def tint(mask,color):
    im=Image.new('RGBA',mask.size,color+(255,)); im.putalpha(mask); return im
def split_lion():
    s=Image.open(L+'03-lion-sketch-half-large-faded.png'); g=Image.open(L+'04-lion-geometric-half-large-faded.png')
    W=2702+910-1789; H=max(496+2185,523+2155)-496
    c=Image.new('RGBA',(W,H),(0,0,0,0)); c.alpha_composite(s.convert('RGBA'),(0,0)); c.alpha_composite(g.convert('RGBA'),(2702-1789,523-496))
    return c
def mask_of(path_or_img):
    im=Image.open(path_or_img) if isinstance(path_or_img,str) else path_or_img
    return ink_mask(im)
def text_img(txt,fnt,color,track=0):
    # tracked text
    w=sum(fnt.getbbox(ch)[2] for ch in txt)+track*(len(txt)-1)+20
    asc,desc=fnt.getmetrics(); im=Image.new('RGBA',(int(w),asc+desc+20),(0,0,0,0)); d=ImageDraw.Draw(im); x=10
    for ch in txt:
        d.text((x,10),ch,font=fnt,fill=color+(255,)); x+=fnt.getbbox(ch)[2]+track
    return im.crop(im.getbbox())
def stack(items,gap=40,align='c'):
    W=max(i.width for i in items); H=sum(i.height for i in items)+gap*(len(items)-1)
    c=Image.new('RGBA',(W,H),(0,0,0,0)); y=0
    for i in items:
        x=(W-i.width)//2 if align=='c' else 0; c.alpha_composite(i,(x,y)); y+=i.height+gap
    return c
def fit_w(im,w):
    return im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
def pad(im,p):
    c=Image.new('RGBA',(im.width+2*p,im.height+2*p),(0,0,0,0)); c.alpha_composite(im,(p,p)); return c
def preview(im,bg,path,maxd=900):
    b=Image.new('RGBA',im.size,bg+(255,)); b.alpha_composite(im); b=b.convert('RGB'); b.thumbnail((maxd,maxd)); b.save(path)
