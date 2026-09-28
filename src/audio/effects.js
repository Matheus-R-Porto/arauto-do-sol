import { EFFECTS } from '../../config/tuning.js';
const tones=EFFECTS.tones;
export function playEffect(heartbeat,name){
 if(!heartbeat.enabled||!heartbeat.ctx||!tones[name])return;
 const [freq,duration]=tones[name],ctx=heartbeat.ctx,t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(freq/2,t+duration);
 gain.gain.setValueAtTime(EFFECTS.volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
 osc.connect(gain).connect(heartbeat.master);osc.start(t);osc.stop(t+duration);
}
