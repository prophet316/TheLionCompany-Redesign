exec(open('new.py').read().split("def little(")[0])
from PIL import ImageDraw
def daniel2(ink=BLACK,acc=ORANGE,w=2800):
    cub=fit_w(tint(CUB,ink),int(w*0.36))
    t=stack([fit_w(T('BRAVE',300,ink),w),fit_w(colorline([('LIKE',ink),('DANIEL',acc)],300),w)],gap=20)
    v=stack([T('MY GOD SENT HIS ANGEL, AND HE',64,ink,MONO,6),T("SHUT THE MOUTHS OF THE LIONS.",64,ink,MONO,6),T('DANIEL 6:22',64,acc,MONO,20)],gap=20)
    v=fit_w(v,int(w*0.8))
    return pad(stack([cub,t,v],gap=70),30)
save('kids-brave-daniel-v2',daniel2(),(255,255,255))
def magnet2(S=2000,ink=INK,acc=ORANGE,bgc=BLACK):
    c=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(c)
    d.rounded_rectangle((0,0,S-1,S-1),radius=300,fill=bgc+(255,))
    d.rounded_rectangle((70,70,S-71,S-71),radius=240,outline=acc+(255,),width=26)
    lion=tint(SL,ink); lion=lion.resize((int(lion.width*980/lion.height),980),Image.LANCZOS)
    t=fit_w(colorline([('LION',ink),('CO.',acc)],200),820)
    tot=lion.height+90+t.height; y=(S-tot)//2
    c.alpha_composite(lion,((S-lion.width)//2,y)); c.alpha_composite(t,((S-t.width)//2,y+lion.height+90))
    return c
save('magnet-square',magnet2(),(255,255,255))
