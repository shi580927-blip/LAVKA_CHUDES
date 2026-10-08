const assert=require('node:assert/strict'),fs=require('node:fs');
const {LEVELS,create}=require('../src/campaign.js');
for(let n=41;n<=50;n++){
 const l=LEVELS[n];assert(l.chains.length>=1&&l.chains.length<=4);
 const occupied=[...l.holes,...l.root,...l.ac,...l.ice].map(p=>p.slice(0,2).join(','));
 assert(l.chains.every(p=>!occupied.includes(p.join(','))));
 assert.equal(new Set(l.chains.map(p=>p.join(','))).size,l.chains.length);
 assert.equal(l.g.find(g=>g[0]==='chain')[2],l.chains.length);
}
const mem={};const api=create({getItem:k=>mem[k],setItem:(k,v)=>mem[k]=v});
assert.equal(api.buyKey(),false);const token=api.begin(1);api.win(token);
const coins=api.read().coins;assert.equal(api.buyKey(),true);assert.equal(api.read().coins,coins-40);
const src=fs.readFileSync('src/potion_chapter.js','utf8');
const body=src.split('p.unlockChain=async function(r,c){')[1].split('\n };')[0];
const unlock=new (Object.getPrototypeOf(async function(){}).constructor)('r','c',body);
(async()=>{
 let goals=0,resolved=0;const potion={id:'blueberry',sp:null};
 const ctx={busy:false,cell:[[{block:'chain'}]],board:[[potion]],levelKeys:1,fx:{},unselect(){},hideHint(){},render(){},bumpGoal(t){assert.equal(t,'chain');goals++},async resolve(){resolved++},updateHud(){},refreshKeys(){},endCheck(){},scheduleHint(){}};
 assert.equal(await unlock.call(ctx,0,0),true);assert.equal(ctx.cell[0][0].block,null);assert.equal(ctx.board[0][0],potion);assert.equal(ctx.levelKeys,0);assert.equal(goals,1);assert.equal(resolved,1);
 assert.equal(await unlock.call(ctx,0,0),false);assert.equal(goals,1);
 ctx.cell[0][0].block='chain';assert.equal(await unlock.call(ctx,0,0),false);assert.equal(ctx.cell[0][0].block,'chain');
 const core=fs.readFileSync('src/vertical_slice.js','utf8');const start=core.indexOf('async clearCells(initial,chain=1)'),end=core.indexOf('  async fallRefill()',start);
 const clear=new Function('inBounds','return ({'+core.slice(start,end).trim()+'}).clearCells')((r,c)=>r>=0&&r<8&&c>=0&&c<8);
 ctx.cell=Array.from({length:8},()=>Array.from({length:8},()=>({block:null,ice:0})));ctx.board=ctx.cell.map(row=>row.map(()=>null));ctx.cell[3][3].block='chain';ctx.board[3][3]=potion;ctx.expandSpecials=s=>s;ctx.pos=()=>({x:0,y:0});
 await clear.call(ctx,new Set(['3,3']));assert.equal(ctx.board[3][3],potion);assert.equal(ctx.cell[3][3].block,'chain');
 console.log('PASS chains: layout, key economy, unlock once, potion preservation and special-hit protection');
})().catch(e=>{console.error(e);process.exitCode=1});
