// Sword-tip sockets measured on the approved 128px frames. Presentation only:
// neither the character scale nor any combat box/timer is changed here.
const sockets = {
 'attack-light': [[126,39.5],[126,39],[101,43]],
 'attack-m2': [[117,94],[96,68]],
};

export function playerAttackPlacement(player,pose){
 const tip=sockets[pose?.state]?.[pose.index];
 if(!tip)return null; // No lingering beam on idle, hurt, death or raised recovery.
 const key=pose.state==='attack-light'?'light':'m2';
 if(player.attacks[key].flashTimer<=0)return null;
 const [px,py]=pose.pivot;
 return {key,x:Math.round(player.x)+(tip[0]-px)*pose.scale*player.facing,
  y:Math.round(player.y)+(tip[1]-py)*pose.scale,flip:player.facing};
}

export function drawPlayerAttackEffect(ctx,asset,placement,hitbox){
 const [l,t,r,b]=asset.bounds,w=r-l,h=b-t;
 // The thrust terminates on the blade axis; the diagonal trail terminates at
 // the blade tip. Centering either graphic on the hurtbox breaks that contact.
 const anchorX=r-1,anchorY=placement.key==='light'?(t+b-1)/2:b-1;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.beginPath();ctx.rect(hitbox.left,hitbox.top,hitbox.w,hitbox.h);ctx.clip();
 ctx.translate(placement.x,placement.y);ctx.scale(placement.flip,1);
 // The authored crescent curves below its diagonal. Transpose the pixel axes
 // for the downward stroke so its trail sweeps above the blade, not the knees.
 // This is an orthogonal transform: no resampling or character scale change.
 if(placement.key==='m2')ctx.transform(0,1,1,0,0,0);
 ctx.drawImage(asset.image,l,t,w,h,l-anchorX,t-anchorY,w,h);ctx.restore();
}
