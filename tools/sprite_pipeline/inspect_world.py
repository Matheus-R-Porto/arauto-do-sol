from PIL import Image
from collections import deque
from pathlib import Path
import sys
for name in sys.argv[1:]:
 im=Image.open(Path('assets/raw/world')/(name+'.png')).convert('RGBA')
 mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
 pixels=bytearray(mask.tobytes());w,h=im.size;parts=[]
 for index in range(w*h):
  if not pixels[index]:continue
  pixels[index]=0;q=deque([index]);size=0;l=w;t=h;r=b=0
  while q:
   k=q.popleft();y,x=divmod(k,w);size+=1;l=min(l,x);r=max(r,x);t=min(t,y);b=max(b,y)
   for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
    if 0<=xx<w and 0<=yy<h and pixels[yy*w+xx]:pixels[yy*w+xx]=0;q.append(yy*w+xx)
  if size>400:parts.append((size,[l,t,r+1,b+1]))
 print(name,im.size,sorted(parts,reverse=True)[:16])
