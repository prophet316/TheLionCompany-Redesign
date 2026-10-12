exec(open('designs.py').read().split("# 1 BOLD")[0])
import numpy as np, json
exec(open('lockup.py').read().split("lk=lockup()")[0])
# --- tote: feathered roaring lion
def feather_roar():
    r=ImageOps.grayscale(ROAR).point(lambda p:min(255,int(p*1.05)))
    a=np.asarray(ROAR.getchannel('A')).astype(float)/255
    b=np.asarray(ROAR.getchannel('A').filter(ImageFilter.GaussianBlur(90))).astype(float)/255
    f=np.clip((b-0.55)*2.0,0,1)
    # extra fade toward the bottom (neck)
    ys,xs=np.nonzero(a>0.5); y0,y1=ys.min(),ys.max(); H=a.shape[0]
    yy=np.arange(H)[:,None]; g=np.clip((y1-yy)/((y1-y0)*0.35),0,1)
    # fur-like break-up: use the image's own texture to roughen the fade
    tex=np.asarray(r).astype(float)/255
    xs2=np.nonzero(a>0.5)[1]; cx=(xs2.min()+xs2.max())/2; cy=(y0+y1)/2-0.08*(y1-y0); rx=(xs2.max()-xs2.min())/2; ry=(y1-y0)/2
    XX=np.arange(a.shape[1])[None,:]; d=np.sqrt(((XX-cx)/rx)**2+((yy-cy)/ry)**2)
    e=np.clip((1.0-d)/0.32,0,1)
    m=np.minimum(e,f)
    rough=np.clip(m*1.2+(tex-0.5)*0.5*(1-m)*(m>0.02),0,1)
    na=(a*np.clip(rough,0,1)*255).astype('uint8')
    im=Image.merge('RGBA',(r,r,r,Image.fromarray(na)))
    return im.crop(im.getbbox())
def tote():
    w=3000; roar=fit_w(feather_roar(),int(w*0.78))
    t1=fit_w(T('LIONS',400,BLACK),w); t2=fit_w(colorline([('ARE',BLACK),('MADE.',ORANGE)],400),w)
    tag=fit_w(T('THE LION COMPANY',90,BLACK,MONO,24),int(w*0.6))
    return stack([roar,t1,t2,tag],gap=60)
save('tote-made',tote(),CREAM)
# --- journal: podcast lockup (no PODCAST), light version for dark cover, higher up
def light_lockup():
    c=Image.new('RGBA',(3000,2500),(0,0,0,0))
    for f in ['12-black-tape-band-behind-company.png','11-text-LION.png','13-text-COMPANY.png','16-lion-sketch-half-title.png','17-lion-geometric-half-title.png']:
        l=d[f]; im=Image.open(L+'as-designed/'+f).convert('RGBA')
        if f.startswith(('11','16','17')): im=tint(ink_mask(im),INK)
        c.alpha_composite(im,(l['x'],l['y']))
    return c.crop(c.getbbox())
def journal(W=3000,H=2100):
    sc=max(W/NEWS.width,H/NEWS.height); n=NEWS.resize((int(NEWS.width*sc)+1,int(NEWS.height*sc)+1)); ox=(n.width-W)//2; c=ImageOps.mirror(n.crop((ox,0,ox+W,H))).convert('RGBA')
    c=Image.blend(c,Image.new('RGBA',c.size,(0,0,0,255)),0.55)
    half=W//2
    lk=fit_w(light_lockup(),1150); c.alpha_composite(lk,(half+(half-lk.width)//2,340))
    t=stack([fit_w(T('PRAYER',200,INK),820),fit_w(T('JOURNAL',200,ORANGE),820)],gap=20)
    c.alpha_composite(t,(half+(half-t.width)//2,340+lk.height+110))
    sp=fit_w(T('LIONS ARE MADE.',60,INK,MONO,18),520); c.alpha_composite(sp,((half-sp.width)//2,1000))
    return c
j=journal().resize((4065,2850),Image.LANCZOS); save('journal-prayer',j,BLACK)
