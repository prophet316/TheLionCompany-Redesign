exec(open('designs.py').read().split("# 1 BOLD")[0])
def tumbler2(W=2795,H=2100):
    c=Image.new('RGBA',(W,H),BLACK+(255,))
    b=stack([fit_w(T('LION',300,INK),1100),fit_w(T('COMPANY',300,ORANGE),1100),fit_w(T('LIONS ARE MADE.',70,INK,MONO,14),820)],gap=50)
    c.alpha_composite(b,((W-b.width)//2,(H-b.height)//2)); return c
save('tumbler-lionco-v2',tumbler2(),BLACK)
def poster2(W=3600,H=4800):
    c=NEWS.copy().resize((int(NEWS.width*H/NEWS.height),H)).crop((300,0,300+W,H)).convert('RGBA')
    c=Image.blend(c,Image.new('RGBA',c.size,(0,0,0,255)),0.6)
    lion=tint(SL,INK); lion=lion.resize((int(lion.width*1300/lion.height),1300),Image.LANCZOS)
    t=stack([fit_w(T('THE RIGHTEOUS ARE',300,INK),2900),fit_w(colorline([('AS BOLD AS A',INK),('LION.',ORANGE)],300),2900)],gap=40)
    r=fit_w(T('PROVERBS 28:1  ·  THE LION COMPANY',90,INK,MONO,20),2200)
    g1,g2=220,260; tot=lion.height+g1+t.height+g2+r.height; y=(H-tot)//2
    c.alpha_composite(lion,((W-lion.width)//2,y)); y+=lion.height+g1
    c.alpha_composite(t,((W-t.width)//2,y)); y+=t.height+g2
    c.alpha_composite(r,((W-r.width)//2,y)); return c
save('blanket-bold-v2',poster2(),BLACK)
def bold_text(ink,acc,w=3600):
    l1=fit_w(colorline([('BOLD',ink),('AS',ink),('A',ink),('LION.',acc)],400),w)
    v1=T('THE RIGHTEOUS ARE AS BOLD AS A LION.',120,ink,MONO,6); v2=T('PROVERBS 28:1',110,acc,MONO,30)
    return stack([l1,fit_w(v1,int(w*0.92)),fit_w(v2,int(w*0.34))],gap=int(w*0.035))
save('bold-back-dark-v2',bold_text(INK,ORANGE),BLACK)
save('bold-back-light-v2',bold_text(BLACK,ORANGE),CREAM)
