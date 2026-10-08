(() => {
'use strict';
const L=window.PotionLayout,{W,H,CELL,BX,BY,PORTRAIT}=L;
const Campaign=window.BerriesCampaign;
const FONT='Trebuchet MS, Arial, sans-serif';
const fit=(im,w,h)=>im.setScale(Math.min(w/im.width,h/im.height));
const title=(s,x,y,text,size=32,color='#fff0cc')=>s.add.text(x,y,text,{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',color,align:'center',stroke:'#17233d',strokeThickness:color==='#513724'?0:4}).setOrigin(.5).setDepth(20);
function button(s,x,y,text,cb,w=300){
 const im=fit(s.add.image(x,y,'potion_resource-plaque'),w,140).setDepth(21).setInteractive({useHandCursor:true});
 const tx=title(s,x,y,text,30);tx.setDepth(22);
 im.on('pointerdown',()=>{s.fx?.click?.();cb()});return im;
}
function install(){
 const game=window.__berriesGame,play=game?.scene?.keys?.Play;
 if(!play)return false;
 const p=Object.getPrototypeOf(play);
 if(!p.__berriesStableV10)return false;
 if(p.__potionChapter)return true;p.__potionChapter=true;
 const baseInit=p.init;
 p.init=function(d){baseInit.call(this,d);this.cfg={...this.cfg,bg:'location_'+(Math.floor((this.no-1)/10)%5)}};
 const basePick=p.pickBooster;
 p.pickBooster=function(id){this.keyMode=false;this.refreshKeys();return basePick.call(this,id)};
 const baseTap=p.tap;
 p.unlockChain=async function(r,c){
  const ce=this.cell[r][c];if(this.busy||ce.block!=='chain'||this.levelKeys<=0)return false;
  this.busy=true;this.levelKeys--;this.keyMode=false;this.boosterMode=null;this.unselect();this.hideHint();
  ce.block=null;this.bumpGoal('chain',null,1);this.fx.spark?.();this.render(r,c);
  await this.resolve();this.busy=false;this.updateHud();this.refreshKeys();this.endCheck();this.scheduleHint();return true;
 };
 p.tap=function(r,c){if(this.keyMode){if(!this.busy)this.unlockChain(r,c);return}return baseTap.call(this,r,c)};
 p.refreshKeys=function(){this.keyLabel?.setText('КЛЮЧ · '+this.levelKeys+(this.keyMode?' ✓':''))};
 p.chainControls=function(){
  if(!this.cfg.chains?.length)return;
  const x=PORTRAIT?300:1640,y=PORTRAIT?1650:870;
  button(this,x,y,'',()=>{if(this.busy)return;this.keyMode=!this.keyMode;this.boosterMode=null;this.unselect();this.refreshKeys()},PORTRAIT?390:330);
  this.keyLabel=this.children.list[this.children.list.length-1];
  button(this,PORTRAIT?795:1640,PORTRAIT?1650:1000,'+ КЛЮЧ · 40 монет',()=>{
   if(this.busy)return;
   if(Campaign.buyKey()){this.levelKeys++;this.updateHud();this.refreshKeys()}
   else this.boosterHint?.setText('Для покупки ключа нужно 40 монет');
  },PORTRAIT?440:400);this.refreshKeys();
 };
 const desktopHud=p.hud;
 p.hud=function(){
  if(!PORTRAIT)return desktopHud.call(this);
  const g=this.add.graphics().setDepth(1);
  g.fillStyle(0x081b39,.95);g.fillRoundedRect(BX-12,BY-12,8*CELL+24,8*CELL+24,20);
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
   if(this.cell[r][c].block==='void')continue;
   g.fillStyle((r+c)%2?0x173755:0x204465,.58);g.fillRoundedRect(BX+c*CELL+3,BY+r*CELL+3,CELL-6,CELL-6,12);
  }
  fit(this.add.image(W/2,BY+4*CELL,'potion_board-frame'),8*CELL/.87,8*CELL/.87).setDepth(2);
  const back=fit(this.add.image(85,95,'ui_back'),80,80).setDepth(21).setInteractive({useHandCursor:true});
  back.on('pointerdown',()=>this.scene.start('Map',{page:Math.floor((this.no-1)/10)}));
  title(this,W/2,95,'УРОВЕНЬ '+this.no,38);
  const settings=fit(this.add.image(W-85,95,'ui_settings'),68,68).setDepth(21).setInteractive({useHandCursor:true});
  settings.on('pointerdown',()=>{this.fx.muted=!this.fx.muted;this.music.muted=this.fx.muted;if(this.music.muted)this.music.stop();else this.music.play('music_gameplay_calm');settings.setAlpha(this.fx.muted?.5:1)});
  fit(this.add.image(290,190,'potion_resource-plaque'),380,120).setDepth(17);
  fit(this.add.image(170,190,'ui_coin'),50,50).setDepth(20);this.coinText=title(this,300,190,'',32);
  fit(this.add.image(800,190,'potion_resource-plaque'),310,120).setDepth(17);
  fit(this.add.image(715,190,'potion_life-heart'),54,54).setDepth(20);this.lifeText=title(this,820,190,'',32);
  this.refreshLifeDisplay=()=>this.lifeText.setText(String(Campaign.read().lives));
  fit(this.add.image(440,315,'potion_goals-mobile-panel'),760,200).setDepth(3);
  fit(this.add.image(945,315,'potion_moves-panel'),230,220).setDepth(3);
  this.mt=title(this,945,325,'',29,'#513724');this.st=null;
  const step=620/Math.max(1,this.goals.length);
  this.gt=this.goals.map((goal,i)=>{
   const x=440-310+step*(i+.5);
   const key=goal.type==='berry'?'b_'+goal.id:goal.type==='ice'?'ice1':goal.type==='acorn'?'acorn':goal.type==='roots'?'roots':goal.type==='chain'?'chain':'ui_coin';
   fit(this.add.image(x-44,315,key),66,66).setDepth(5);
   return title(this,x+35,315,'',27,'#513724');
  });
  this.boosterButtons={};
  [['hammer',250],['shuffle',540],['fan',830]].forEach(([id,x])=>{
   fit(this.add.image(x,1460,'potion_booster-button'),200,200).setDepth(4);
   const im=fit(this.add.image(x,1440,id),118,118).setDepth(5).setInteractive({useHandCursor:true});
   const tx=title(this,x+55,1510,'',30);im.on('pointerdown',()=>this.pickBooster(id));this.boosterButtons[id]={im,tx};
  });
  this.boosterHint=title(this,W/2,1590,'',26);this.boosterHint.setWordWrapWidth(900);
  this.king=fit(this.add.image(190,1765,'potion_cat-idle'),300,300).setDepth(7);
  this.kingBaseX=190;this.kingBaseY=1765;this.kingBaseScale=this.king.scaleX;
  button(this,760,1810,'МАГАЗИН',()=>this.openShop(),360);
 };
 if(PORTRAIT){
  p.openShop=function(){
   if(this._potionShop?.active)return;
   const box=this.add.container(0,0).setDepth(90);this._potionShop=box;
   box.add(this.add.rectangle(W/2,H/2,W,H,0x071527,.92).setInteractive());
   box.add(title(this,W/2,500,'БУСТЕРЫ ЗА МОНЕТЫ',44));
   const names={hammer:'Молоток',shuffle:'Вихрь',fan:'Печать'};
   const coins=title(this,W/2,590,'',32);box.add(coins);
   const refresh=()=>{coins.setText('Монеты: '+Campaign.read().coins);this.inventory=Campaign.read().inventory;this.updateHud()};
   Object.keys(Campaign.PRICES).forEach((id,i)=>{
    box.add(fit(this.add.image(240,760+i*220,id),110,110));
    box.add(title(this,560,720+i*220,names[id],32));
    const buy=button(this,610,800+i*220,Campaign.PRICES[id]+' монет',()=>{Campaign.buy(id);refresh()},430);box.add(buy);
    // The label belongs to the modal as well, so it closes with its button.
    const label=this.children.list[this.children.list.length-1];if(label!==box&&label!==buy)box.add(label);
   });
   const close=button(this,W/2,1510,'ЗАКРЫТЬ',()=>{box.destroy();this._potionShop=null},400);box.add(close);
   const label=this.children.list[this.children.list.length-1];if(label!==box&&label!==close)box.add(label);
   refresh();
  };
  p.resultPopup=function(win){
   const shade=this.add.rectangle(W/2,H/2,W,H,0x071527,.93).setDepth(80).setInteractive();
   const box=this.add.container(0,0).setDepth(81);
   box.add(title(this,W/2,650,win?'ПОБЕДА!':'ПОПРОБУЕМ ЕЩЁ?',54));
   const reward=Campaign.read().lastWin;
   box.add(title(this,W/2,760,win?'Награда: '+(reward?.reward||0)+' монет':'Задание не выполнено',34));
   const status=title(this,W/2,1260,'',26);box.add(status);
   const addButton=(y,text,cb)=>{
    const im=button(this,W/2,y,text,cb,680);box.add(im);
    const label=this.children.list[this.children.list.length-1];if(label!==box&&label!==im)box.add(label);return im;
   };
   addButton(970,win?'ДАЛЬШЕ':'ПОВТОРИТЬ',()=>{
    if(!win)this.scene.restart({n:this.no});
    else if(this.no%10===0||this.no===50)this.scene.start('Map',{page:this.no===50?0:Math.floor(this.no/10)});
    else this.scene.start('Play',{n:this.no+1});
   });
   addButton(1110,'НА КАРТУ',()=>this.scene.start('Map',{page:Math.floor((this.no-1)/10)}));
   const ad=addButton(1410,win?'НАГРАДА ×2 ЗА ВИДЕО':'+5 ХОДОВ ЗА ВИДЕО',async()=>{
    if((win&&this.winRewardDoubled)||(!win&&this.continueUsed))return;
    const attempt=this.attemptId;ad.disableInteractive();const ok=await window.BerriesYandex?.showRewardedVideo?.();
    if(!this.scene.isActive()||this.attemptId!==attempt)return;
    if(ok&&win&&Campaign.doubleReward(attempt)){this.winRewardDoubled=true;status.setText('Награда удвоена');this.updateHud()}
    else if(ok&&!win&&Campaign.resume(attempt)){
     this.continueUsed=true;this.moves+=5;shade.destroy();box.destroy();this.busy=false;
     window.__berriesGameplayShouldRun=true;window.BerriesYandex?.gameplayStart?.();this.kingAnim('idle');this.updateHud();this.scheduleHint();
    }else{status.setText('Видео сейчас недоступно');ad.setInteractive({useHandCursor:true})}
   });
  };
 }
 const baseCreate=p.create;
 p.create=function(){
  baseCreate.call(this);if(!this.attemptId||!this.scene.isActive())return;this.chainControls();
  if(this.no>=31){
   const hint=title(this,PORTRAIT?650:960,PORTRAIT?1740:980,this.cfg.chains?.length?'Нажми «КЛЮЧ», затем клетку с цепью.\nБесплатные ключи выданы на этот уровень.':'Руна загорается рядом с совпадением.\nДым исчезнет за 3 следующих хода.',PORTRAIT?25:23);
   hint.setWordWrapWidth(PORTRAIT?560:620);hint.setAlpha(.95);
  }
 };
 const map=Object.getPrototypeOf(game.scene.keys.Map);
 map.init=function(d={}){this.page=Number.isInteger(d.page)?d.page:null};
 map.create=function(){
  window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
  this.music=new window.BerriesMusicBus(this);
  const sv=Campaign.read(),unlocked=Campaign.unlocked(sv),done=new Set(sv.done);
  const query=Number(new URLSearchParams(window.location.search).get('chapter'));
  const requested=this.page??(query>=1&&query<=5?query-1:Math.floor((unlocked-1)/10));
  const page=Phaser.Math.Clamp(requested,0,4);this.page=page;
  this.add.image(W/2,H/2,'location_'+page).setDisplaySize(W,H);
  this.add.rectangle(W/2,H/2,W,H,0x06142a,.35);
  title(this,W/2,PORTRAIT?130:70,'ЗЕЛЬЕВАРНЯ ЧУДЕС',PORTRAIT?48:44);
  title(this,W/2,PORTRAIT?225:145,'ГЛАВА '+(page+1)+' · УРОВНИ '+(page*10+1)+'–'+(page*10+10),32);
  const points=[];
  for(let i=0;i<10;i++)points.push(PORTRAIT?{x:270+(i%2)*540,y:410+Math.floor(i/2)*245}:{x:300+(i%5)*330,y:360+Math.floor(i/5)*330});
  const line=this.add.graphics();line.lineStyle(PORTRAIT?12:9,0xd4b176,.78);
  for(let i=1;i<points.length;i++)line.lineBetween(points[i-1].x,points[i-1].y,points[i].x,points[i].y);
  points.forEach(({x,y},i)=>{
   const n=page*10+i+1,open=n<=unlocked;
   const key=done.has(n)?'level_done_new':open?'level_current_new':'level_locked_new';
   const im=fit(this.add.image(x,y,key),PORTRAIT?170:150,PORTRAIT?170:150).setDepth(3);
   title(this,x,y,String(n),42);
   if(open)im.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.openLevel(n));
  });
  if(page>0)button(this,PORTRAIT?240:350,PORTRAIT?1690:950,'← ГЛАВА '+page,()=>this.scene.restart({page:page-1}),PORTRAIT?380:420);
  if(page<4)button(this,PORTRAIT?820:1570,PORTRAIT?1690:950,'ГЛАВА '+(page+2)+' →',()=>this.scene.restart({page:page+1}),PORTRAIT?380:420);
  title(this,W/2,PORTRAIT?1825:1020,'Монеты: '+sv.coins+'  ·  Жизни: '+sv.lives,28);
 };
 const home=Object.getPrototypeOf(game.scene.keys.Title);
 home.create=function(){
  window.__berriesGameplayShouldRun=false;window.BerriesYandex?.gameplayStop?.();
  this.fx=new window.BerriesSfx(this);this.music=new window.BerriesMusicBus(this);
  this.add.image(W/2,H/2,PORTRAIT?'location_0':'title').setDisplaySize(W,H);
  this.add.rectangle(W/2,H/2,W,H,0x06142a,.3);
  title(this,W/2,H*.30,'ЗЕЛЬЕВАРНЯ\nЧУДЕС',PORTRAIT?80:75);
  fit(this.add.image(W/2,H*.52,'potion_cat-idle'),PORTRAIT?450:310,PORTRAIT?450:310);
  button(this,W/2,H*.74,'ИГРАТЬ',()=>this.scene.start('Map'),PORTRAIT?650:520);
  title(this,W/2,H*.88,'Собирай зелья по три в ряд.\nЗажигай руны и рассеивай дым.',PORTRAIT?34:29);
  window.BerriesYandex.loadingReady();
 };
 return true;
}
if(!install()){let count=0;const timer=setInterval(()=>{if(install()||++count>250)clearInterval(timer)},20)}
})();
