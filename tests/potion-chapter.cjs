const assert=require('node:assert/strict');
const fs=require('node:fs');
const {LEVELS}=require('../src/campaign.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/vertical_slice.js'),'utf8');
const part=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b)).trim();
let release;
const wait=()=>new Promise(r=>release=r);
const ignite=new Function('pause','Phaser','TYPES','return ({'+part('async igniteRune(r,c)','  advanceSmoke()')+'}).igniteRune')(wait,{Utils:{Array:{GetRandom:a=>a[0]}}},['fire']);
const advance=new Function('R','C','return ({'+part('advanceSmoke()','  hitCrystal(r,c)')+'}).advanceSmoke')(8,8);
const groups=new Function('R','C','return ({'+part('groups(){','  findCreation(')+'}).groups')(8,8);
(async()=>{
 const cell=Array.from({length:8},()=>Array.from({length:8},()=>({block:null}))),board=cell.map(r=>r.map(()=>null));
 let goals=0;
 const ctx={cell,board,turn:1,cfg:{n:1},scene:{isActive:()=>true},render(){},fx:{spark(){}},bumpGoal(t){assert.equal(t,'roots');goals++}};
 cell[3][3].block='roots';
 const first=ignite.call(ctx,3,3);
 assert.equal(cell[3][3].runeLit,true);
 await ignite.call(ctx,3,3); // Neighbouring matches in the same wave cannot activate twice.
 release();await first;
 assert.equal(cell[3][3].block,'smoke');assert.equal(cell[3][3].smokeMoves,3);assert.equal(goals,0);
 assert.equal(board[3][3].id,'fire');
 board[3][2]={id:'fire'};board[3][4]={id:'fire'};
 assert.equal(groups.call(ctx).length,0,'smoke breaks match groups');
 advance.call(ctx);assert.equal(cell[3][3].smokeMoves,2);assert.equal(goals,0);
 advance.call(ctx);assert.equal(cell[3][3].smokeMoves,1);assert.equal(goals,0);
 advance.call(ctx);assert.equal(cell[3][3].block,null);assert.equal(goals,1);assert.equal(groups.call(ctx).length,1);
 advance.call(ctx);assert.equal(goals,1,'goal counted only once when smoke finishes');
 for(let n=31;n<=50;n++){
  const l=LEVELS[n],holes=new Set(l.holes.map(p=>p.join(',')));
  assert(l.m>=26,'three smoke turns have room');
  for(const p of [...l.root,...l.ac,...l.ice])assert(!holes.has(p.slice(0,2).join(',')),`blocker in hole ${n}`);
  const seen=new Set(),stack=[[0,1]];
  while(stack.length){const [r,c]=stack.pop(),k=r+','+c;if(r<0||r>=8||c<0||c>=8||seen.has(k)||holes.has(k))continue;seen.add(k);stack.push([r+1,c],[r-1,c],[r,c+1],[r,c-1])}
  assert.equal(seen.size,64-holes.size,'connected playable mask '+n);
 }
 console.log('PASS rune activation, three-turn smoke, match exclusion, goals and connected chapter masks');
})().catch(e=>{console.error(e);process.exitCode=1});
