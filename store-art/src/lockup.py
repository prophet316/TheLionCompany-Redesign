from PIL import Image, ImageFilter, ImageOps
import json
L='/mnt/project-files/brand/podcast-ep10/layers/'
d={l['file']:l for l in json.load(open(L+'layers.json'))['layers']}
def lockup():
    c=Image.new('RGBA',(3000,2500),(0,0,0,0))
    for f in ['12-black-tape-band-behind-company.png','11-text-LION.png','13-text-COMPANY.png','16-lion-sketch-half-title.png','17-lion-geometric-half-title.png']:
        l=d[f]; c.alpha_composite(Image.open(L+'as-designed/'+f).convert('RGBA'),(l['x'],l['y']))
    return c.crop(c.getbbox())
lk=lockup(); lk.save('out/podcast-lockup.png'); print(lk.size)
bg=Image.new('RGBA',lk.size,(90,90,90,255)); bg.alpha_composite(lk); bg.thumbnail((600,600)); bg.convert('RGB').save('pv/lockup.jpg')
