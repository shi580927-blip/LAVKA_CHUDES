const assert=require('node:assert/strict'),fs=require('node:fs');
const {LEVELS,create}=require('../src/campaign.js');
for(let n=41;n<=50;n++){
 const l=LEVELS[n];assert(l.doors.length>=1&&l.doors.length<=4);assert(!l.chains);assert(l.g.every(g=>g[0]!=='chain'));
 const occupied=[...l.holes,...l.root,...l.ac,...l.ice].map(p=>p.slice(0,2).join(','));assert(l.doors.every(p=>!occupied.includes(p.join(','))));
 const blocked=new Set([...l.holes,...l.doors].map(p=>p.join(','))),seen=new Set(),todo=[[0,1]];
 while(todo.length){const [r,c]=todo.pop(),key=r+','+c;if(r<0||r>=8||c<0||c>=8||blocked.has(key)||seen.has(key))continue;seen.add(key);todo.push([r+1,c],[r-1,c],[r,c+1],[r,c-1])}
 assert.equal(seen.size,64-blocked.size,'connected door layout '+n);
}
const api=create({getItem:()=>null,setItem(){}});assert.equal(api.buyKey,undefined);
const src=fs.readFileSync('src/vertical_slice.js','utf8');
const part=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b)).trim();
const seed=new Function('R','C','TYPES','Phaser','return ({'+part('seed(){','  pos(')+'}).seed')(8,8,['blue'],{Utils:{Array:{GetRandom:a=>a[0]}}});
const cells=Array.from({length:8},()=>Array.from({length:8},()=>({block:null,ice:0})));
const board=cells.map(row=>row.map(()=>null));cells[3][3].block='door';
const ctx={cell:cells,board,cfg:{n:1},hasMove:()=>true};seed.call(ctx);assert.equal(board[3][3],null);
const clear=new Function('inBounds','return ({'+part('async clearCells(initial,chain=1)','  async fallRefill()')+'}).clearCells')((r,c)=>r>=0&&r<8&&c>=0&&c<8);
const use=new Function('Campaign','return ({'+part('async useBoosterAt(r,c)','  async useShuffle()')+'}).useBoosterAt')({consume(){throw Error('door must not consume booster')}});
(async()=>{
 Object.assign(ctx,{expandSpecials:s=>s,pos:()=>({x:0,y:0}),updateHud(){},boosterMode:'hammer'});
 await clear.call(ctx,new Set(['3,3']));assert.equal(cells[3][3].block,'door');assert.equal(board[3][3],null);
 await use.call(ctx,3,3);assert.equal(cells[3][3].block,'door');
 console.log('PASS closed doors: connected layouts, no chain goals/key purchase, empty seed and hit/booster protection');
})().catch(e=>{console.error(e);process.exitCode=1});
