const ink=(ctx,color)=>ctx.fillStyle=color;
const line=(ctx,x1,y1,x2,y2,color='#54606a',width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.lineWidth=1;};
function bones(ctx,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);for(let i=0;i<28;i++){const xx=(i*23%83)-42,yy=-5-Math.floor(i/7)*10;ink(ctx,i%2?'#6c7174':'#4b565f');ctx.fillRect(xx,yy,16,4);ctx.fillRect(xx+2,yy-3,6,8);}ctx.restore();}
function statue(ctx,x,y){ink(ctx,'#333e49');ctx.fillRect(x-26,y-15,52,15);ctx.fillRect(x-17,y-63,34,48);ctx.beginPath();ctx.moveTo(x-17,y-63);ctx.lineTo(x-30,y-103);ctx.lineTo(x+12,y-121);ctx.lineTo(x+24,y-67);ctx.fill();ink(ctx,'#65717b');ctx.fillRect(x-9,y-132,17,19);line(ctx,x+17,y-94,x+28,y-28,'#a18d64',4);ctx.strokeStyle='#b6a17066';ctx.beginPath();ctx.arc(x,y-123,21,0,Math.PI*2);ctx.stroke();}
export function drawLandmarks(ctx,w){
 const r=w.room,f=(w.map.rows-2)*16,x=Math.min(w.map.width*.55,440);ctx.save();
 switch(r.landmark){
 case 'statue':statue(ctx,350,f);break;
 case 'bones':bones(ctx,330,f,2.6);line(ctx,448,0,448,70,'#467789',3);break;
 case 'bell':ink(ctx,'#333e49');ctx.fillRect(x-48,f-198,8,198);ctx.fillRect(x+40,f-198,8,198);line(ctx,x-48,f-198,x+48,f-198,'#65717b',8);line(ctx,x,f-198,x,f-155,'#b3a178',3);ink(ctx,'#847859');ctx.beginPath();ctx.moveTo(x-18,f-148);ctx.lineTo(x-30,f-104);ctx.lineTo(x+30,f-104);ctx.lineTo(x+18,f-148);ctx.fill();ctx.fillRect(x-36,f-105,72,6);ctx.fillRect(x-3,f-99,6,10);break;
 case 'chain':for(let yy=14;yy<f;yy+=12){ctx.strokeStyle='#568b9a';ctx.strokeRect(9*16-3,yy,6,9);}break;
 case 'bridge':for(let xx=32;xx<w.map.width-16;xx+=40){line(ctx,xx,f,xx,f-50,'#5b6871',3);line(ctx,xx,f-38,xx+40,f-38,'#687078',2);}line(ctx,256,f-18,256,10,'#568b9a',3);break;
 case 'window':ctx.strokeStyle='#626170';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,f-130,49,Math.PI,0);ctx.lineTo(x+49,f-35);ctx.lineTo(x-49,f-35);ctx.closePath();ctx.stroke();ink(ctx,'#79979833');ctx.fillRect(x-43,f-130,86,89);line(ctx,x,f-176,x,f-35,'#4d555e',4);line(ctx,x-43,f-94,x+43,f-94,'#4d555e',4);break;
 case 'tree':case 'roots':for(let k=0;k<5;k++){const xx=r.landmark==='roots'?160+k*480:x;line(ctx,xx,f,xx-14,f-118,'#323e46',9);line(ctx,xx-12,f-75,xx-60,f-132,'#323e46',5);line(ctx,xx-11,f-100,xx+35,f-155,'#323e46',5);line(ctx,xx-42,f-110,xx-80,f-104,'#323e46',3);if(r.landmark==='tree')break;}break;
 case 'urns':for(let i=0;i<4;i++){ink(ctx,'#46505c');ctx.fillRect(350+i*36,f-38,22,35);ctx.fillRect(354+i*36,f-43,14,6);}break;
 case 'tomb':ink(ctx,'#36444f');ctx.fillRect(x-47,f-69,94,69);ctx.beginPath();ctx.moveTo(x-60,f-70);ctx.lineTo(x,f-121);ctx.lineTo(x+60,f-70);ctx.fill();ink(ctx,'#131e2b');ctx.fillRect(x-18,f-48,36,48);line(ctx,x-32,f-89,x+32,f-89,'#8a795b',2);break;
 }
 if(r.vista){const vx=r.id==='crypt'?270:r.id==='refuge'?450:430,vy=f-165;ink(ctx,'#08121cdc');ctx.fillRect(vx-64,vy,128,92);ctx.strokeStyle='#52606c';ctx.strokeRect(vx-66,vy-2,132,96);
  if(r.vista.kind==='bones')bones(ctx,vx,vy+83,1.5);
  if(r.vista.kind==='return'){line(ctx,vx-58,vy+65,vx+58,vy+65,'#8c846a',4);for(let i=-2;i<3;i++)line(ctx,vx+i*22,vy+5,vx+i*22,vy+87,'#53585b',3);}
  if(r.vista.kind==='guardian'){ink(ctx,'#52616b');ctx.fillRect(vx-13,vy+30,26,55);ctx.fillRect(vx-8,vy+14,16,19);line(ctx,vx+25,vy+24,vx+25,vy+85,'#b4a27b',3);}
  ctx.font='7px monospace';ctx.textAlign='center';ink(ctx,'#8b999d');ctx.fillText(r.vista.label,vx,vy-9);
 }
 ctx.restore();
}
export function drawMap(ctx,w){
 ctx.fillStyle='#080f18f5';ctx.fillRect(0,0,480,270);ctx.font='10px monospace';ctx.textAlign='left';ctx.fillStyle='#dccca5';ctx.fillText('CEMITÉRIO · F3 FECHA O MAPA DE DEBUG',12,20);
 const s=1.16,ox=105,oy=88,rooms=Object.values(w.rooms),center=r=>({x:ox+(r.origin.x+r.rows[0].length/2)*s,y:oy+(r.origin.y+r.rows.length/2)*s});
 for(const r of rooms)for(const e of r.exits){const a=center(r),b=center(w.rooms[e.to]);line(ctx,a.x,a.y,b.x,b.y,w.progression.isOpen(e)?'#709b8e':'#ae715c',1);if(e.oneWay){ctx.fillStyle='#e0b476';ctx.fillText('↓',(a.x+b.x)/2,(a.y+b.y)/2);}}
 const labels={awakening:'INÍCIO',passage:'LÁPIDES',crossroads:'PÁTIO',watch:'VIGÍLIA',shaft:'SINO',bridge:'PONTE',crypt:'CRIPTA',chapel:'CAPELA',ossuary:'OSSOS',ascent:'URNAS',sentries:'GALERIA',balcony:'JARDIM',refuge:'REPOUSO',antechamber:'RETORNO',procession:'ALAMEDA',guardian:'BOSS',beyond:'FIM'};
 for(const r of rooms){const x=ox+r.origin.x*s,y=oy+r.origin.y*s,ww=r.rows[0].length*s,hh=r.rows.length*s;ctx.fillStyle=r===w.room?'#706044':w.visited.has(r.id)?'#253d48':'#16232e';ctx.fillRect(x+2,y+2,ww-4,hh-4);ctx.strokeStyle=r===w.room?'#e7ca8a':'#50606b';ctx.strokeRect(x+2,y+2,ww-4,hh-4);ctx.fillStyle='#c1c5b8';ctx.font='6px monospace';ctx.textAlign='center';ctx.fillText(labels[r.id],x+ww/2,y+hh/2+2);}
 ctx.textAlign='left';ctx.font='8px monospace';ctx.fillStyle='#b9c1bf';ctx.fillText(`Atual: ${w.room.name}`,12,205);ctx.fillText(`Chave ${w.flags.has('cemeteryKey')?'SIM':'—'} · Porta ${w.flags.has('cemeteryDoor')?'ABERTA':'FECHADA'} · Alavanca ${w.flags.has('mainGateLever')?'SIM':'—'}`,12,224);ctx.fillText(`Atalhos: Cripta ${w.flags.has('shortcutWest')?'SIM':'—'} · Galeria ${w.flags.has('shortcutGallery')?'SIM':'—'} · Profundo ${w.flags.has('shortcutDeep')?'SIM':'—'}`,12,240);ctx.fillText('Verde: passagem livre · cobre: bloqueada · jogo pausado',12,258);
}
