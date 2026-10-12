exec(open('designs.py').read().split("# 1 BOLD")[0])
G='/home/claude/thelioncompany-redesign/store-art/gen/'
def gm(n):
    m=ink_mask(Image.open(G+n).convert('RGBA')).point(lambda v:max(0,int((v-25)*255/230))); return m.crop(m.getbbox())
SK=gm('lioness-up.jpg')
exec("def strength("+open('designs.py').read().split("def strength(")[1].split("# 11 Kids")[0])
CUB=gm('cub-up.jpg')
def little(ink=BLACK,acc=ORANGE,w=2600):
    lion=fit_w(tint(CUB,ink),int(w*0.62))
    t=fit_w(colorline([('LITTLE',ink),('LION',acc)],300),w)
    v=fit_w(T("YOU ARE A LION'S CUB. GENESIS 49:9",80,ink,MONO,10),int(w*0.9))
    return stack([lion,t,v],gap=70)
save('kids-little-lion',little(),(255,255,255))
save('kids-little-lion-dark',little(INK),BLACK)
