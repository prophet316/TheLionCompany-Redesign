exec(open('designs.py').read().split("# 1 BOLD")[0])
def mug3(W=2475,H=1155):
    c=Image.new('RGBA',(W,H),BLACK+(255,))
    b=stack([fit_w(T('BOLD AS A',260,INK),900),fit_w(T('LION.',260,ORANGE),900),fit_w(T('PROVERBS 28:1',70,INK,MONO,14),460)],gap=36)
    b=b.resize((int(b.width*940/b.height),940)) if b.height>940 else b
    c.alpha_composite(b,((W-b.width)//2,(H-b.height)//2)); return c
save('mug-bold-v2',mug3(),BLACK)
