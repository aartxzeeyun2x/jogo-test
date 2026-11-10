(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),$=id=>document.getElementById(id);
const W=960,H=540,GROUND=454,GOAL_X=W-62,NEEDED=5;
const HALF_LENGTHS=[20,16]; // 1 segundo real equivale a 1 minuto da partida.
const CARDS=[
 {name:"GOL 2X",type:"double",description:"Seu próximo gol vale em dobro."},
 {name:"SUSPENSÃO",type:"suspend",description:"Retira temporariamente os adversários."},
 {name:"PÊNALTI",type:"penalty",description:"Concede um gol direto."},
 {name:"PÊNALTI REVERSO",type:"reverse",description:"Se acertar a cobrança, ganha um gol."},
 {name:"SHOOTOUT",type:"shootout",description:"Inicia uma cobrança de shootout."},
 {name:"JOGADOR ESTRELA",type:"star",description:"A próxima bola coletada vale em dobro."},
 {name:"CORINGA",type:"joker",description:"Sorteia outra carta secreta."}
];
let state="menu",half=0,timeLeft=20,clock=0,score=0,opponentScore=0,collected=0,elapsed=0,last=0,scroll=0;
let player={x:80,y:GROUND-52,w:35,h:52,vx:0,vy:0,onGround:true};
let balls=[],enemies=[],particles=[],keys=Object.create(null),touch={left:false,right:false,jump:false};
let card=null,cardUsed=false,doubleGoal=false,starGoal=false,shield=false,suspensionTime=0;
let notice="",noticeTime=0,stageLock=false;
let shootoutCount=0,shootoutGoals=0,power=0,shootoutOrigin="tie";
let matchballSeconds=0,matchballNeed=0,matchballWasTied=false,matchballGold=false,dicePlayers=3;

function say(text){notice=text;noticeTime=2.1;}
function hud(){
 $("phaseLabel").textContent=state==="shootout"?"SHOOTOUT":state==="matchball"?"MATCHBALL":half===0?"1º TEMPO":"2º TEMPO";
 $("score").textContent=score;$("opponentScore").textContent=opponentScore;
 $("items").textContent=collected+"/"+NEEDED;
 $("timer").textContent=String(Math.max(0,timeLeft)).padStart(2,"0")+":00";
 const minute=HALF_LENGTHS[0]-timeLeft;
 const linePlayers=half===0?Math.min(6,1+Math.floor(minute)):dicePlayers;
 $("players").textContent=(linePlayers+1)+" × "+(linePlayers+1);
}
function show(title,text,button,tag="KINGS LEAGUE 2D"){
 $("overlayTitle").textContent=title;$("overlayText").textContent=text;$("mainButton").textContent=button;$("overlayEyebrow").textContent=tag;$("overlay").classList.remove("hidden");
}
function hide(){ $("overlay").classList.add("hidden"); }
function setupStage(){
 player.x=75;player.y=GROUND-player.h;player.vx=player.vy=0;player.onGround=true;
 collected=0;stageLock=false;balls=[];enemies=[];particles=[];
 for(let i=0;i<NEEDED;i++)balls.push({x:245+i*137,y:GROUND-78-(i%2)*36,taken:false,bob:i*.7});
 const linePlayers=half===0?Math.min(6,1+Math.floor(HALF_LENGTHS[0]-timeLeft)):dicePlayers;
 const enemyCount=Math.max(1,Math.min(5,linePlayers-1));
 for(let i=0;i<enemyCount;i++)enemies.push({x:420+i*115,y:GROUND-43,w:30,h:43,speed:75+i*12,dir:i%2?-1:1});
 hud();
}
function startGame(){
 state="playing";half=0;timeLeft=20;clock=0;score=0;opponentScore=0;elapsed=0;
 card=null;cardUsed=false;doubleGoal=false;starGoal=false;shield=false;suspensionTime=0;
 matchballSeconds=0;matchballNeed=0;matchballGold=false;setupStage();hide();say("BOLA EM JOGO!");
}
function finishGame(title,text,tag="FIM DE JOGO"){
 state=title==="CAMPEÃO!"?"won":"over";show(title,text,"JOGAR NOVAMENTE",tag);
}
function gameOver(reason){if(state==="over"||state==="won")return;finishGame("GAME OVER",reason+" Sua partida terminou. Tente novamente!");}
function champion(text){finishGame("CAMPEÃO!",text,"APITO FINAL");}
function startSecondHalf(){
 half=1;timeLeft=16;clock=0;dicePlayers=[1,2,3][Math.floor(Math.random()*3)];
 card=CARDS[Math.floor(Math.random()*CARDS.length)];cardUsed=false;
 doubleGoal=false;starGoal=false;setupStage();say("DADO GIGANTE: "+dicePlayers+" × "+dicePlayers+"!");
}
function startShootout(origin){
 state="shootout";shootoutOrigin=origin;shootoutCount=0;shootoutGoals=0;power=0;
 show("SHOOTOUT","Empate na partida! Faça 5 cobranças. Pressione ESPAÇO quando o marcador estiver na faixa verde.","COMEÇAR COBRANÇAS","DECISÃO POR SHOOTOUT");
}
function startMatchball(){
 state="matchball";matchballSeconds=6;matchballNeed=score>opponentScore?score+1:opponentScore+1;matchballWasTied=false;matchballGold=false;
 setupStage();timeLeft=6;clock=0;say("MATCHBALL! FORMAÇÃO REDUZIDA.");
}
function activateCard(){
 if(half!==1||!card||cardUsed||!(state==="playing"||state==="matchball"))return;
 cardUsed=true;
 switch(card.type){
  case"double":doubleGoal=true;say("GOL 2X ATIVADO!");break;
  case"suspend":enemies=[];suspensionTime=8;say("SUSPENSÃO ATIVADA!");break;
  case"penalty":score++;say("PÊNALTI CONVERTIDO: +1 GOL!");break;
  case"reverse":
   state="reverse";power=0;show("PÊNALTI REVERSO","Pressione ESPAÇO quando o marcador estiver na faixa verde. Se acertar, sua equipe ganha um gol.","INICIAR COBRANÇA","CARTA SECRETA");break;
  case"shootout":startShootout("card");break;
  case"star":starGoal=true;say("JOGADOR ESTRELA ATIVADO!");break;
  case"joker":
   card=CARDS.filter(c=>c.type!=="joker")[Math.floor(Math.random()*6)];cardUsed=false;say("CORINGA: "+card.name+"!");break;
 }
 hud();
}
function shoot(){
 if(state==="reverse"){
  if(power>=.38&&power<=.68){score++;say("PÊNALTI REVERSO CONVERTIDO!");state="playing";hide();hud();}
  else{opponentScore++;gameOver("Você perdeu o pênalti reverso e sofreu um gol.");}
  power=0;return;
 }
 if(state!=="shootout")return;
 const success=power>=.38&&power<=.68;
 if(success)shootoutGoals++;
 shootoutCount++;power=0;
 if(shootoutCount>=5){
  if(shootoutGoals>=3)champion("Você venceu a disputa de shootouts por "+shootoutGoals+" a "+(5-shootoutGoals)+"!");
  else gameOver("Você perdeu a disputa de shootouts ("+shootoutGoals+" cobranças convertidas).");
 }else say(success?"COBRANÇA CONVERTIDA!":"O GOLEIRO DEFENDEU!");
}
function collectBall(ball){
 if(ball.taken)return;ball.taken=true;collected++;burst(ball.x,ball.y,"#ffe66b");hud();
 if(collected===NEEDED)say("5 BOLAS COLETADAS! AGORA VÁ ATÉ O GOL!");
}
function goal(){
 if(stageLock)return;stageLock=true;
 let points=(half===0&&timeLeft<=4)||doubleGoal?2:1;
 if(starGoal)points*=2;
 score+=points;doubleGoal=false;starGoal=false;hud();burst(GOAL_X,GROUND-50,"#c8ff3d");
 say(points>1?"GOL EM DOBRO!":"GOOOOL!");
 setTimeout(()=>{
  if(state!=="playing"&&state!=="matchball")return;
  if(half===0){startSecondHalf();}
  else if(state==="matchball"){
   if(matchballGold){champion("GOL DE OURO! Você venceu o Matchball!");return;}
   if(score>=matchballNeed){champion("Você alcançou a meta do Matchball e conquistou a vitória!");return;}
   if(score===opponentScore){matchballGold=true;say("EMPATE! PRÓXIMO GOL É DE OURO!");setupStage();}
   else{gameOver("O tempo do Matchball acabou sem alcançar a meta.");}
  }else{
   setupStage();say("GOL MARCADO! CONTINUE!");
  }
 },700);
}
function burst(x,y,color){for(let i=0;i<10;i++)particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.7)*220,life:.55,color});}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function update(dt){
 elapsed+=dt;if(noticeTime>0)noticeTime-=dt;
 if(state==="shootout"||state==="reverse"){power=(power+dt*.75)%1;return;}
 if(state!=="playing"&&state!=="matchball"){updateParticles(dt);return;}
 clock+=dt;
 while(clock>=1){
  clock-=1;timeLeft--;hud();
  if(timeLeft<=0){
   if(half===0){startSecondHalf();return;}
   if(state==="playing"){
    if(score===opponentScore){startShootout("tie");return;}
    startMatchball();return;
   }
   if(state==="matchball"){
    if(matchballGold){gameOver("O tempo do Matchball acabou sem gol de ouro.");return;}
    if(score>=matchballNeed){champion("Você venceu o Matchball!");return;}
    if(score===opponentScore){matchballGold=true;timeLeft=6;clock=0;setupStage();say("GOL DE OURO! PRÓXIMO GOL VENCE!");return;}
    gameOver("Você não alcançou a meta do Matchball.");return;
   }
  }
 }
 if(suspensionTime>0){suspensionTime-=dt;if(suspensionTime<=0&&enemies.length===0)createOneEnemy();}
 const left=keys.ArrowLeft||keys.a||touch.left,right=keys.ArrowRight||keys.d||touch.right,jump=keys[" "]||keys.ArrowUp||keys.w||touch.jump;
 player.vx=(right?1:0)-(left?1:0);player.x=Math.max(5,Math.min(W-player.w-5,player.x+player.vx*300*dt));
 if(jump&&player.onGround){player.vy=-610;player.onGround=false;}
 player.vy+=1500*dt;player.y+=player.vy*dt;
 if(player.y+player.h>=GROUND){player.y=GROUND-player.h;player.vy=0;player.onGround=true;}
 for(const b of balls)if(!b.taken){b.bob+=dt*3;let by=b.y+Math.sin(b.bob)*5;if(overlap(player,{x:b.x-14,y:by-14,w:28,h:28}))collectBall(b);}
 for(const e of enemies){
  e.x+=e.speed*e.dir*dt;if(e.x<270||e.x>W-80)e.dir*=-1;
  if(overlap({x:player.x+4,y:player.y+5,w:player.w-8,h:player.h-8},e)){
   if(shield){shield=false;e.x=W-40;say("ESCUDO BLOQUEOU O GOL!");}
   else{opponentScore++;hud();gameOver("GOL SOFRIDO! Um adversário alcançou você.");return;}
  }
 }
 if(collected>=NEEDED&&player.x+player.w>=GOAL_X&&player.y+player.h>GROUND-100)goal();
 updateParticles(dt);
}
function createOneEnemy(){enemies.push({x:650,y:GROUND-43,w:30,h:43,speed:90,dir:-1});}
function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=350*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}
function cloud(x,y,s){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y+10*s,20*s,0,Math.PI*2);ctx.arc(x+22*s,y,25*s,0,Math.PI*2);ctx.arc(x+48*s,y+11*s,19*s,0,Math.PI*2);ctx.fill();}
function drawBackground(){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#52a8f0");sky.addColorStop(1,"#c3edff");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 for(let i=0;i<4;i++){let x=((i*280-scroll*.18)%(W+180)+W+180)%(W+180)-80;cloud(x,70+(i%2)*55,.85+(i%2)*.1);}
 ctx.fillStyle="#17365b";ctx.fillRect(0,350,W,104);
 for(let x=-40;x<W+40;x+=42){let xx=x+(scroll*.25%42);ctx.fillStyle=["#ffcf45","#e85d75","#f3f5fa","#48d6b0"][Math.floor((x+40)/42)%4];ctx.fillRect(xx,366,15,8);ctx.fillRect(xx+5,390,15,8);}
 ctx.fillStyle="#eaffff";ctx.fillRect(0,335,W,5);
 ctx.fillStyle="#d6ff48";ctx.fillRect(0,GROUND,W,5);ctx.fillStyle="#16894f";ctx.fillRect(0,GROUND+5,W,H-GROUND);
 for(let x=0;x<W;x+=80){ctx.fillStyle=x%160===0?"#20a95f":"#15904f";ctx.fillRect(x,GROUND+5,40,H-GROUND);}
}
function drawBall(x,y,r){ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#18233a";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#18233a";ctx.beginPath();for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ctx.lineTo(x+Math.cos(a)*r*.42,y+Math.sin(a)*r*.42);}ctx.closePath();ctx.fill();}
function drawPlayer(x,y,enemy=false){
 ctx.fillStyle="#101827";ctx.fillRect(x+7,y+37,8,15);ctx.fillRect(x+22,y+37,8,15);
 ctx.fillStyle="#f7f7f7";ctx.fillRect(x+4,y+49,13,4);ctx.fillRect(x+20,y+49,13,4);
 ctx.fillStyle=enemy?"#ed4657":"#f4f5f8";ctx.fillRect(x+5,y+18,27,23);
 ctx.fillStyle=enemy?"#a51f3b":"#222f55";ctx.fillRect(x+5,y+18,8,23);ctx.fillRect(x+24,y+18,8,23);
 ctx.fillStyle="#c98253";ctx.fillRect(x+9,y+2,21,19);ctx.fillStyle="#24202a";ctx.fillRect(x+8,y,22,7);
 ctx.fillStyle="#fff";ctx.fillRect(x+24,y+9,3,3);
}
function draw(){
 drawBackground();
 ctx.strokeStyle="#fff";ctx.lineWidth=5;ctx.strokeRect(W-55,GROUND-78,48,78);
 ctx.strokeStyle="#ffffff66";ctx.lineWidth=2;ctx.beginPath();ctx.arc(500,GROUND,65,Math.PI,0);ctx.stroke();
 for(const b of balls)if(!b.taken)drawBall(b.x,b.y+Math.sin(b.bob)*5,13);
 for(const e of enemies)drawPlayer(e.x,e.y,true);
 drawPlayer(player.x,player.y);
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.55);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5);}ctx.globalAlpha=1;
 ctx.fillStyle="#10213a";ctx.font="800 17px Arial";ctx.fillText(half===0?"1º TEMPO":"2º TEMPO",24,32);
 ctx.font="700 13px Arial";ctx.fillText(half===0&&timeLeft<=4?"GOLS EM DOBRO!":collected>=NEEDED?"LEVE A BOLA ATÉ O GOL →":"COLETE 5 BOLAS",24,54);
 if(noticeTime>0){ctx.fillStyle="#071326cc";ctx.fillRect(W/2-205,78,410,44);ctx.fillStyle="#d6ff48";ctx.textAlign="center";ctx.font="900 19px Arial";ctx.fillText(notice,W/2,106);ctx.textAlign="left";}
 if(shield){ctx.strokeStyle="#64dfff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x+17,player.y+25,34,0,Math.PI*2);ctx.stroke();}
 if(state==="shootout"||state==="reverse"){
  ctx.fillStyle="#071426dd";ctx.fillRect(205,175,550,180);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 23px Arial";ctx.fillText(state==="reverse"?"PÊNALTI REVERSO":"SHOOTOUT",480,213);
  ctx.fillStyle="#293b54";ctx.fillRect(300,250,360,22);ctx.fillStyle="#d6ff48";ctx.fillRect(300+360*.38,250,360*.30,22);ctx.fillStyle="#fff";ctx.fillRect(300+power*360-4,242,8,38);
  ctx.font="14px Arial";ctx.fillText(state==="reverse"?"ESPAÇO NA FAIXA VERDE = GOL":"ESPAÇO NA FAIXA VERDE = CONVERSÃO",480,302);ctx.textAlign="left";
 }
}
function loop(t){const dt=Math.min((t-(last||t))/1000,.04);last=t;update(dt);draw();requestAnimationFrame(loop);}
document.addEventListener("keydown",e=>{
 const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=true;
 if(["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key))e.preventDefault();
 if(k==="c")activateCard();
 if(k===" "&&(state==="shootout"||state==="reverse"))shoot();
 if(k==="p"&&(state==="playing"||state==="matchball")){state="paused";show("PAUSADO","A partida está pausada. Clique para continuar.","CONTINUAR","PAUSA");}
});
document.addEventListener("keyup",e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;});
$("mainButton").addEventListener("click",()=>{
 if(state==="paused"){state="playing";hide();return;}
 if(state==="shootout"||state==="reverse"){hide();return;}
 startGame();
});
function bindHold(id,prop){const el=$(id);el.addEventListener("pointerdown",e=>{e.preventDefault();touch[prop]=true;});["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();touch[prop]=false;}));}
bindHold("leftBtn","left");bindHold("rightBtn","right");bindHold("jumpBtn","jump");
setupStage();hud();requestAnimationFrame(loop);
})();