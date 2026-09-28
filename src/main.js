import {testRooms} from './world/rooms/test-room.js';
import {installTestLab} from './ui/test-lab.js';
import { RENDER } from '../config/tuning.js';
import { createLoop } from './core/loop.js';
import { Input } from './core/input.js';
import { Camera } from './core/camera.js';
import { Background } from './world/background.js';
import { RoomManager } from './world/room-manager.js';
import { DemoView, WORLD_ZOOM } from './ui/demo-view.js';
import { Heartbeat } from './audio/heartbeat.js';
import { playEffect } from './audio/effects.js';
import { Zombie } from './entities/zombie.js';
import { loadPlayerSprites, PlayerSpriteView } from './ui/player-sprites.js';
import { loadWorldArt } from './ui/world-art.js';
import { PixelDisplay, installFullscreen } from './ui/display.js';
const canvas=document.getElementById('game'),display=new PixelDisplay(canvas),ctx=display.context;
function fit(){const full=!!document.fullscreenElement;display.resize(innerWidth-(full?0:16),innerHeight-(full?0:document.getElementById('controls').offsetHeight+32),window.devicePixelRatio||1);}
window.addEventListener('resize',fit);fit();
installFullscreen(document.getElementById('stage'),document.getElementById('fullscreen'),fit,document.getElementById('display-status'));
const camera=new Camera(RENDER.width/WORLD_ZOOM,RENDER.height/WORLD_ZOOM),world=new RoomManager(camera,new URLSearchParams(location.search).has('test-room')?testRooms:undefined);
let playerView,worldArt;
try{const [sprites,art]=await Promise.all([loadPlayerSprites(),loadWorldArt()]);playerView=new PlayerSpriteView(sprites);worldArt=art;}
catch(error){document.body.textContent='Não foi possível carregar a arte. Reabra o jogo com todos os arquivos da pasta. Detalhe: '+error.message;throw error;}
const input=new Input(),heartbeat=new Heartbeat(),view=new DemoView(new Background(RENDER.width,RENDER.height),playerView,worldArt);
input.onFirstInput=()=>heartbeat.resume();world.onEvent=name=>playEffect(heartbeat,name);
const debug={visible:false,hitboxes:false,map:false},debugEl=document.getElementById('debug');
const abilities={Digit1:'dash',Digit2:'wallClimb',Digit3:'dashIntangible',Digit4:'doubleJump',Digit5:'glide'};
const lab=new URLSearchParams(location.search).has('test-room')?installTestLab(world,worldArt,debug,canvas):null;
if(lab){view.art=lab.art;playerView.effects=(ctx,w,pose)=>lab.art.playerEffects(ctx,w,pose);fit();document.title='Arauto do Sol — Sala de testes';}
let paused=false,time=0,frames=0,fps=0,last=performance.now();
window.addEventListener('keydown',e=>{
 if(e.repeat)return;
 if(e.code==='F1'){e.preventDefault();debug.visible=!debug.visible;debugEl.style.display=debug.visible?'block':'none';}
 else if(e.code==='F2'){e.preventDefault();debug.hitboxes=!debug.hitboxes;}
 else if(e.code==='F3'){e.preventDefault();debug.map=!debug.map;}
 else if(e.code==='Escape')paused=!paused;
 else if(e.code==='KeyM'){heartbeat.toggle();heartbeat.resume();}
 else if(e.code==='KeyR'){world.respawn();paused=false;}
 else if(debug.visible&&e.code==='KeyC')world.damage(1,world.player.x-1);
 else if(debug.visible&&e.code==='Digit6')world.enemies.push(new Zombie(world.player.x+24,world.player.y));
 else if(debug.visible&&abilities[e.code]){const a=abilities[e.code];world.player.abilities[a]=!world.player.abilities[a];}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)paused=true;});
createLoop({
 update(dt){input.beginFrame();if(!paused&&!debug.map){time+=dt;world.update(dt,input);lab?.update(dt);view.update(dt,world);}heartbeat.update(dt,{healthRatio:world.health.ratio,active:!paused&&!debug.map&&world.phase==='playing'&&world.energy.mode==='combate'});},
 render(){frames++;const now=performance.now();if(now-last>=1000){fps=Math.round(frames*1000/(now-last));frames=0;last=now;}view.draw(ctx,world,time,debug,paused);display.present();
  if(debug.visible)debugEl.textContent=[`Sala: ${world.room.id} | checkpoint: ${world.checkpoint.room}`,`Estado: ${world.phase} | transição: ${!!world.transition} | FPS ${fps} | updates 60 Hz`,`Pos: ${world.player.x.toFixed(1)}, ${world.player.y.toFixed(1)} | ${world.player.state}`,`Vida: ${world.health.skulls}/${world.health.maxSkulls} | energia ${world.energy.current.toFixed(1)} (${world.energy.mode})`,`Inimigos: ${world.enemies.filter(e=>!e.dead).length} | boss: ${world.boss?.state??'-'} ${world.boss?.health??''}`,`Alavanca: ${world.flags.has('liftLever')} | plataforma: ${world.levelEvents.liftY??'-'} | arena: ${world.levelEvents.arena.phase} | ossos: ${world.levelEvents.bones}`,`Paredes abertas: ${world.levelEvents.targets.filter(t=>t.dead).map(t=>t.id).join(', ')}`,`Habilidades: ${Object.entries(world.player.abilities).filter(([,v])=>v).map(([k])=>k).join(', ')||'nenhuma'}`,'F1 painel · F2 hitboxes · F3 mapa · R checkpoint · M áudio','C dano · 6 dummy · 1 dash · 2 parede · 3 intangível · 4 duplo · 5 planar'].join('\n');
 }
}).start();
