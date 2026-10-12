exec(open('designs.py').read().split("# 1 BOLD")[0])
def phone(W=1320,H=2264):
    c=NEWS.copy().resize((int(NEWS.width*H/NEWS.height),H)).crop((400,0,400+W,H)).convert('RGBA')
    c=Image.blend(c,Image.new('RGBA',c.size,(0,0,0,255)),0.4)
    r=ImageOps.grayscale(ROAR); roar=Image.merge('RGBA',(r,r,r,ROAR.getchannel('A'))); roar=fit_w(roar.crop(roar.getbbox()),1250)
    c.alpha_composite(roar,(60,250))
    t1=fit_w(T('LION',300,INK),760); y=1360
    c.alpha_composite(t1,((W-t1.width)//2,y)); y+=t1.height+30
    band=fit_w(Image.open(L+'12-black-tape-band-behind-company.png').convert('RGBA'),1250)
    t2=fit_w(T('COMPANY',300,ORANGE),860)
    c.alpha_composite(band,((W-band.width)//2,y-(band.height-t2.height)//2)); c.alpha_composite(t2,((W-t2.width)//2,y))
    return c
save('phone-collage',phone(),BLACK)
