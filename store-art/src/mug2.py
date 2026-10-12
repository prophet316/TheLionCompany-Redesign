exec(open('designs.py').read().split("# 1 BOLD")[0])
def mug2(W=2475,H=1155):
    c=Image.new('RGBA',(W,H),BLACK+(255,))
    v=stack([T('THE WICKED FLEE THOUGH',62,INK,MONO,6),T('NO ONE PURSUES, BUT THE',62,INK,MONO,6),T('RIGHTEOUS ARE AS BOLD',62,INK,MONO,6),T('AS A LION.',62,ORANGE,MONO,6),T(' ',30,INK),T('PROVERBS 28:1',50,ORANGE,MONO,14)],gap=26)
    v=fit_w(v,860); c.alpha_composite(v,(int(W*0.25-v.width/2),(H-v.height)//2))
    b=stack([fit_w(T('BOLD AS A',260,INK),860),fit_w(T('LION.',260,ORANGE),860)],gap=30)
    b=b.resize((int(b.width*880/b.height),880)) if b.height>880 else b
    c.alpha_composite(b,(int(W*0.75-b.width/2),(H-b.height)//2)); return c
save('mug-bold-v2',mug2(),BLACK)
