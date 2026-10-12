exec(open('more.py').read().split("save('tumbler-lionco'")[0])
def bottle(W=2760,H=1500):
    c=Image.new('RGBA',(W,H),BLACK+(255,))
    lion=tint(SL,INK); lion=lion.resize((int(lion.width*1150/lion.height),1150),Image.LANCZOS)
    c.alpha_composite(lion,(int(W*0.27-lion.width/2),(H-1150)//2))
    b=stack([fit_w(T('LION',300,INK),820),fit_w(T('COMPANY',300,ORANGE),820),fit_w(T('LIONS ARE MADE.',70,INK,MONO,14),620)],gap=34)
    c.alpha_composite(b,(int(W*0.73-b.width/2),(H-b.height)//2)); return c
save('bottle-lionco',bottle(),BLACK)
def key_front(W=1063,H=2008):
    c=Image.new('RGBA',(W,H),BLACK+(255,))
    lion=fit_w(tint(SL,INK),700); c.alpha_composite(lion,((W-lion.width)//2,230))
    b=stack([fit_w(T("LION",300,INK),560),fit_w(T("COMPANY",300,ORANGE),700)],gap=24)
    c.alpha_composite(b,((W-b.width)//2,H-b.height-230)); return c
def key_back(W=1063,H=2008):
    c=Image.new('RGBA',(W,H),ORANGE+(255,))
    b=stack([fit_w(T('BOLD',300,BLACK),700),fit_w(T('AS A',300,BLACK),480),fit_w(T('LION',300,BLACK),700),fit_w(T('PROVERBS 28:1',70,BLACK,MONO,10),620)],gap=40)
    c.alpha_composite(b,((W-b.width)//2,(H-b.height)//2)); return c
save('key-front',key_front(),BLACK); save('key-back',key_back(),ORANGE)
