import assert from 'node:assert/strict';
import { Input } from '../src/core/input.js';
globalThis.window={addEventListener(){}};
let pad=null;
Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>pad?[pad]:[]},configurable:true});
const makePad=()=>({connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))});
const key=(code)=>({code,repeat:false,preventDefault(){}});
let count=0;const test=(name,f)=>{f();count++;console.log('PASSOU ',name);};
test('gamepad desconectado não deixa direção presa',()=>{
 const i=new Input();pad=makePad();pad.axes[0]=1;i.beginFrame();assert.equal(i.moveX,1);pad=null;i.beginFrame();assert.equal(i.moveX,0);assert.ok(i.released.right);
});
test('teclado continua pressionado quando gamepad desconecta',()=>{
 const i=new Input();i._onKey(key('KeyD'),true);pad=makePad();pad.axes[0]=1;i.beginFrame();pad=null;i.beginFrame();assert.equal(i.moveX,1);
});
test('soltar teclado não solta ação ainda segurada no gamepad',()=>{
 const i=new Input();pad=makePad();pad.buttons[0].pressed=true;i._onKey(key('Space'),true);i.beginFrame();i._onKey(key('Space'),false);i.beginFrame();assert.ok(i.held.jump);assert.ok(!i.released.jump);pad=null;
});
test('M1, J e gamepad alimentam a mesma ação sem repetir bordas',()=>{
 const i=new Input();i._onMouse({button:0,preventDefault(){}},true);i.beginFrame();assert.ok(i.pressed.attackLight);i._onKey(key('KeyJ'),true);i.beginFrame();assert.ok(!i.pressed.attackLight);i._onMouse({button:0,preventDefault(){}},false);i.beginFrame();assert.ok(i.held.attackLight);i._onKey(key('KeyJ'),false);i.beginFrame();assert.ok(!i.held.attackLight);
});
test('perda de foco solta teclado e mouse',()=>{
 const i=new Input();i._onKey(key('KeyD'),true);i._onMouse({button:2,preventDefault(){}},true);i.beginFrame();i._releaseAll();i.beginFrame();assert.equal(i.moveX,0);assert.ok(!i.held.attackM2);
});
console.log(`${count}/${count} testes de input ok`);
