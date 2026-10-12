exec(open('designs.py').read().split("# 1 BOLD")[0])
src=Image.open('/home/claude/thelioncompany-redesign/store-art/gen/calm1.png').convert('L')
src=src.resize((int(src.width*1.5),int(src.height*1.5)),Image.LANCZOS)
# ink alpha: dark = opaque, white paper = clear; keep graded tones so fur fades naturally
a=src.point(lambda v:max(0,min(255,int((240-v)*255/140))))
lion=Image.new('RGBA',src.size,(20,20,22,0)); lion.putalpha(a)
lion=lion.crop(a.getbbox())
def tote3():
    w=3000
    roar=fit_w(lion,int(w*0.66))
    t1=fit_w(T('LIONS',400,BLACK),w); t2=fit_w(colorline([('ARE',BLACK),('MADE.',ORANGE)],400),w)
    tag=fit_w(T('THE LION COMPANY',90,BLACK,MONO,24),int(w*0.6))
    return stack([roar,t1,t2,tag],gap=70)
save('tote-made-calm',tote3(),CREAM)
