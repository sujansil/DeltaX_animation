'use strict';
const $=s=>document.querySelector(s),canvas=$('#canvas'),ctx=canvas.getContext('2d',{alpha:false});
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,f)=>a+(b-a)*f,ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const count=innerWidth<650?1000:1900,TAU=Math.PI*2;
let W=0,H=0,dpr=1,p=0,target=0,raf=0,last=0,clock=0,ready=false;
const bounds=[.24,.30,.355,.425,.495,.555,.615,.68,.755,.815];
const names=['THREE BODIES, ONE DISTURBANCE','THE PENDULUM DIVERGES','CHUA / THE DOUBLE SCROLL','AIZAWA / CHAOS TAKES SHAPE','CLIFFORD / FOLDS OF LIGHT','FRACTAL FLAME / UNRAVELLING','SHEAR / THE STRUCTURE BREAKS','CURL FLOW / INTO THE CURRENT','PARTICLES / FINDING FORM'];
const shapes={},textures={},gravity=[],pendulums=[];
const coords=new Float32Array(count*3),screen=new Float32Array(count*2);
// Integration and geometry happen once. Only bounded particle projection runs on animation frames.
function rk4(v,dt,f){const a=f(v),b=f(v.map((x,i)=>x+a[i]*dt/2)),c=f(v.map((x,i)=>x+b[i]*dt/2)),d=f(v.map((x,i)=>x+c[i]*dt));return v.map((x,i)=>x+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6)}
function normalize(points,stretch=1){let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const v of points)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k])}let span=Math.max(...hi.map((v,k)=>v-lo[k]))||1;return points.map(v=>v.map((x,k)=>(x-(lo[k]+hi[k])/2)*2.6/span*stretch))}
function attractor(initial,derivative,dt,steps,burn){let v=initial,points=[];for(let i=0;i<steps;i++){v=rk4(v,dt,derivative);if(!v.every(Number.isFinite))throw Error('Non-finite attractor trajectory');if(i>burn)points.push(v.slice())}return normalize(points)}
function makeGravity(){let bodies=[[-.8,-.24,.30,-.28],[.76,-.18,-.21,.36],[.08,.83,-.10,-.09]];for(let step=0;step<4200;step++){for(let sub=0;sub<2;sub++){const accelerations=bodies.map((b,i)=>{let ax=0,ay=0;for(let j=0;j<3;j++)if(i!==j){let dx=bodies[j][0]-b[0],dy=bodies[j][1]-b[1],r2=dx*dx+dy*dy+.035,f=.22/Math.pow(r2,1.5);ax+=dx*f;ay+=dy*f}return [ax,ay]});for(let i=0;i<3;i++){bodies[i][2]+=accelerations[i][0]*.005;bodies[i][3]+=accelerations[i][1]*.005;bodies[i][0]+=bodies[i][2]*.005;bodies[i][1]+=bodies[i][3]*.005}}gravity.push(bodies.map(b=>[b[0],b[1],0]))}let all=normalize(gravity.flat());for(let i=0;i<gravity.length;i++)gravity[i]=all.slice(i*3,i*3+3)}
function makePendulums(){for(let j=0;j<7;j++){let state=[2.15+j*.0003,1.55,0,0],path=[];const f=([a,b,u,v])=>{let d=a-b,den=3-Math.cos(2*d);return [u,v,(-3*9.81*Math.sin(a)-9.81*Math.sin(a-2*b)-2*Math.sin(d)*(v*v+u*u*Math.cos(d)))/den,(2*Math.sin(d)*(2*u*u+2*9.81*Math.cos(a)+v*v*Math.cos(d)))/den]};for(let i=0;i<4200;i++){state=rk4(state,.008,f);let [a,b]=state,x1=Math.sin(a)*.62,y1=Math.cos(a)*.62;path.push([[x1,y1-.28,0],[x1+Math.sin(b)*.62,y1+Math.cos(b)*.62-.28,0]])}pendulums.push(path)}}
function makeShapes(){makeGravity();makePendulums();shapes.chua=attractor([.1,0,0],([x,y,z])=>{let h=-.714*x+.5*(-1.143+.714)*(Math.abs(x+1)-Math.abs(x-1));return [15.6*(y-x-h),x-y+z,-28*y]},.008,14000,1800);
shapes.aizawa=attractor([.1,0,0],([x,y,z])=>[(z-.7)*x-3.5*y,3.5*x+(z-.7)*y,.6+.95*z-z*z*z/3-(x*x+y*y)*(1+.25*z)+.1*z*x*x*x],.012,16000,1000);
shapes.chua=normalize(shapes.chua.map(v=>[v[0]*1.7,v[2]*.8,v[1]*.8]));shapes.aizawa=shapes.aizawa.map(v=>[v[0],-v[2],v[1]]);
let x=.1,y=.1,points=[];for(let i=0;i<22000;i++){let nx=Math.sin(-1.4*y)+Math.cos(-1.4*x),ny=Math.sin(1.6*x)+Math.cos(.7*y);x=nx;y=ny;if(i>200)points.push([x,y,Math.sin(x*1.7)*Math.cos(y*1.2)*.22])}shapes.clifford=normalize(points);
// A deterministic iterated-function flame using swirl and sinusoidal variations.
x=.1;y=.1;points=[];let seed=94721;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let i=0;i<26000;i++){let b=Math.floor(rnd()*3),a=b*TAU/3+.22,xx=.66*(Math.cos(a)*x-Math.sin(a)*y)+Math.cos(a)*.62,yy=.66*(Math.sin(a)*x+Math.cos(a)*y)+Math.sin(a)*.62,r2=xx*xx+yy*yy;x=.7*(xx*Math.sin(r2)-yy*Math.cos(r2))+.3*Math.sin(xx*1.8);y=.7*(xx*Math.cos(r2)+yy*Math.sin(r2))+.3*Math.sin(yy*1.8);if(i>200)points.push([x,y,Math.sin(x*2+y)*.25])}shapes.flame=normalize(points);
for(const name of Object.keys(shapes)){const tex=document.createElement('canvas');tex.width=900;tex.height=760;let tc=tex.getContext('2d');for(let g=0;g<7;g++){tc.fillStyle=`hsla(${155+g*20},88%,74%,.42)`;tc.beginPath();let arr=shapes[name];for(let i=g;i<arr.length;i+=7){let v=arr[i];tc.rect(450+v[0]*245,380+v[1]*245,1.3,1.3)}tc.fill()}textures[name]=tex}

}
const strokes=[[[-1.42,.62],[-.77,-.67],[-.12,.62],[-1.42,.62]],[[.25,-.67],[1.2,.62]],[[1.2,-.67],[.25,.62]]],segments=[];let length=0;
for(const line of strokes)for(let i=1;i<line.length;i++){let a=line[i-1],b=line[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);segments.push({a,b,len,start:length});length+=len}
function glyph(u){let d=clamp(u)*length,seg=segments.find(s=>d<=s.start+s.len)||segments[segments.length-1],f=clamp((d-seg.start)/seg.len);return [mix(seg.a[0],seg.b[0],f)*.84,mix(seg.a[1],seg.b[1],f)*.84,0]}
function sampleShape(name,i,time){let arr=shapes[name],index;if(name==='clifford'||name==='flame')index=(i*11)%arr.length;else index=(Math.floor(i/count*arr.length)+Math.floor(time*85))%arr.length;return arr[index]}
function point(stage,i,time){let u=i/count,a=i*2.399963;
if(stage===0){let body=i%3,idx=(Math.floor(time*70)+Math.floor(u*230))%gravity.length;return gravity[idx][body]}
if(stage===1){let path=pendulums[i%7],idx=(Math.floor(time*75)+Math.floor(u*260))%path.length;return path[idx][1]}
if(stage===2)return sampleShape('chua',i,time);
if(stage===3)return sampleShape('aizawa',i,time);
if(stage===4)return sampleShape('clifford',i,time);
if(stage===5){let v=sampleShape('flame',i,time),w=time*.15;return [v[0]+Math.sin(v[1]*3+w)*.08,v[1],v[2]]}
if(stage===6){let cell=i%6,theta=Math.floor(i/6)/(count/6)*TAU*2.8,r=.035+u*.32,phase=theta+time*.5;return [(cell-2.5)*.47+Math.cos(phase)*r,.36*Math.sin(cell*1.2)+Math.sin(phase)*r,Math.sin(theta*.6+time*.2)*.14]}
if(stage===7){let r=Math.sqrt(u)*1.5,ang=a+time*(.12+(i%7)*.025),x=Math.cos(ang)*r,y=Math.sin(ang)*r*.72;for(let k=0;k<2;k++){let xx=x;x+=Math.sin(y*2.6+time*.3)*.2;y+=Math.cos(xx*2.2-time*.28)*.2}return [x,y,Math.sin(a+time*.2)*.2]}
return glyph(u);
}
function dot(x,y,r,alpha=1){ctx.save();ctx.globalAlpha=clamp(alpha);let g=ctx.createRadialGradient(x,y,0,x,y,r*8);g.addColorStop(0,'#effff7');g.addColorStop(.12,'#b5ffdb');g.addColorStop(.3,'#60e7ac50');g.addColorStop(1,'#60e7ac00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*8,0,TAU);ctx.fill();ctx.fillStyle='#f3fff9';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function projection(v,size,rotation){let x=v[0]*Math.cos(rotation)+v[2]*Math.sin(rotation),z=-v[0]*Math.sin(rotation)+v[2]*Math.cos(rotation),pers=3.7/(3.7-z*.28);return [W/2+x*size*pers,H/2+v[1]*size*pers]}
function drawChaos(size){let stage=0;while(stage<8&&p>=bounds[stage+1])stage++;let local=clamp((p-bounds[stage])/(bounds[stage+1]-bounds[stage])),blend=stage<8?ease((local-.62)/.38):0,birth=ease((p-.24)/.035),fade=1-ease((p-.805)/.027),rotation=stage<6?Math.sin(clock*.1)*.23:0,time=reduced?0:clock;
ctx.save();ctx.globalCompositeOperation='lighter';
if(stage>=2&&stage<=5){let name=['chua','aizawa','clifford','flame'][stage-2],tex=textures[name];ctx.save();ctx.translate(W/2,H/2);ctx.rotate(Math.sin(time*.13)*.035);ctx.globalAlpha=birth*fade*(1-blend)*.85;ctx.drawImage(tex,-450*size/245,-380*size/245,900*size/245,760*size/245);ctx.restore()}
let groups=innerWidth<650?5:7;
for(let i=0;i<count;i++){let v=point(stage,i,time),b=blend?point(stage+1,i,time):v,q=[mix(v[0],b[0],blend),mix(v[1],b[1],blend),mix(v[2],b[2],blend)];if(stage===8){let f=ease(local/.68),source=point(7,i,time);q=q.map((v,k)=>mix(source[k],v,f));}q=q.map(v=>v*mix(.02,1,birth));coords.set(q,i*3);screen.set(projection(q,size,rotation),i*2)}
// Density particles carry continuously between the different geometries.
for(let g=0;g<groups;g++){ctx.fillStyle=`hsla(${155+g*20},88%,${65+g*2}%,${birth*fade*(stage<2?.24:.67)})`;ctx.beginPath();for(let i=g;i<count;i+=groups){let x=screen[i*2],y=screen[i*2+1],r=(i%19===0?1.8:1.1);ctx.rect(x,y,r,r)}ctx.fill()}
// Fine moving light trails, capped regardless of viewport resolution.
if(stage>=2&&stage<=3){let name=stage===2?'chua':'aizawa',arr=shapes[name];ctx.globalAlpha=birth*fade*(1-blend)*.72;for(let j=0;j<22;j++){let index=(Math.floor(time*95)+j*431)%arr.length;ctx.strokeStyle=`hsl(${155+(j%7)*20},90%,73%)`;ctx.lineWidth=.6;ctx.beginPath();for(let k=0;k<150;k++){let q=projection(arr[(index+k)%arr.length],size,rotation);if(!k)ctx.moveTo(...q);else ctx.lineTo(...q)}ctx.stroke()}}
if(stage===0){let idx=Math.floor(time*70)%gravity.length;for(let body=0;body<3;body++){ctx.globalAlpha=birth*(1-blend)*.65;ctx.strokeStyle=['#a8ffdc','#aab7ff','#ffd0ad'][body];ctx.beginPath();for(let k=0;k<90;k++){let q=projection(gravity[(idx+k)%gravity.length][body],size,rotation);if(!k)ctx.moveTo(...q);else ctx.lineTo(...q)}ctx.stroke();let q=projection(gravity[(idx+89)%gravity.length][body],size,rotation);dot(q[0],q[1],3,birth*(1-blend))}}
if(stage===1){ctx.globalAlpha=birth*(1-blend)*.34;for(let j=0;j<7;j++){let path=pendulums[j],idx=Math.floor(time*75)%path.length;ctx.strokeStyle=`hsl(${155+j*20},80%,75%)`;ctx.beginPath();for(let k=0;k<170;k++){let q=projection(path[(idx+k)%path.length][1],size,0);if(!k)ctx.moveTo(...q);else ctx.lineTo(...q)}ctx.stroke();if(j===0){let nodes=path[(idx+169)%path.length],q1=projection(nodes[0],size,0),q2=projection(nodes[1],size,0);ctx.globalAlpha=1-blend;ctx.beginPath();ctx.moveTo(W/2,H/2-size*.28);ctx.lineTo(...q1);ctx.lineTo(...q2);ctx.stroke();dot(...q1,2.1,1-blend);dot(...q2,3,1-blend)}}}
if(stage===6||stage===7){ctx.globalAlpha=birth*fade*(1-blend)*.38;ctx.lineWidth=.8;for(let j=0;j<66;j++){ctx.strokeStyle=`hsl(${155+j%7*20},85%,74%)`;ctx.beginPath();for(let k=0;k<32;k++){let q=point(stage,(j*29)%count,time-k*.055),xy=projection(q,size,rotation);if(!k)ctx.moveTo(...xy);else ctx.lineTo(...xy)}ctx.stroke()}}
ctx.restore();return stage;
}
function trace(frac,size,alpha){let d=clamp(frac)*length;ctx.save();ctx.translate(W/2,H/2);ctx.lineWidth=1.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=`rgba(191,255,220,${alpha})`;ctx.shadowColor='#69fbb3';ctx.shadowBlur=12;let head=segments[0].a;for(let seg of segments){if(d<seg.start)break;let f=clamp((d-seg.start)/seg.len),q=[mix(seg.a[0],seg.b[0],f),mix(seg.a[1],seg.b[1],f)];ctx.beginPath();ctx.moveTo(seg.a[0]*size,seg.a[1]*size);ctx.lineTo(q[0]*size,q[1]*size);ctx.stroke();head=q}if(frac<1)dot(head[0]*size,head[1]*size,2.5,alpha);ctx.restore()}
// These captions describe the dynamics actually used above; procedural scenes are labelled.
const equationCards=[
['THREE-BODY GRAVITY',
'r̈<sub>i</sub> = G Σ<sub>j≠i</sub> (r<sub>j</sub> − r<sub>i</sub>) / (‖r<sub>j</sub> − r<sub>i</sub>‖² + ε²)<sup>3/2</sup>',
'G = 0.22 · ε² = 0.035 · equal masses'],
['DOUBLE PENDULUM · LAGRANGIAN',
'L = ω₁² + ½ω₂² + ω₁ω₂ cos δ + g(2 cos θ₁ + cos θ₂)<br>d/dt (∂L/∂ω<sub>i</sub>) = ∂L/∂θ<sub>i</sub>',
'δ = θ₁ − θ₂ · ωᵢ = θ̇ᵢ · m = ℓ = 1'],
['CHUA · DOUBLE-SCROLL DYNAMICS',
'ẋ = 15.6[y − x − h(x)]<br>ẏ = x − y + z &nbsp; · &nbsp; ż = −28y<br>h(x) = −0.714x − 0.2145(|x + 1| − |x − 1|)',
''],
['AIZAWA · STRANGE ATTRACTOR',
'ẋ = (z − 0.7)x − 3.5y<br>ẏ = 3.5x + (z − 0.7)y<br>ż = 0.6 + 0.95z − z³/3<br>&nbsp;&nbsp; − (x² + y²)(1 + 0.25z) + 0.1zx³',
''],
['CLIFFORD · ITERATED MAP',
'x<sub>n+1</sub> = sin(−1.4y<sub>n</sub>) + cos(−1.4x<sub>n</sub>)<br>y<sub>n+1</sub> = sin(1.6x<sub>n</sub>) + cos(0.7y<sub>n</sub>)',
''],
['FRACTAL FLAME · ITERATED VISUAL MODEL',
'v = A<sub>j</sub>p<sub>n</sub> + b<sub>j</sub><br>p<sub>n+1</sub> = 0.7 S(v) + 0.3 sin(1.8v)<br>S(x,y) = (x sin r² − y cos r²,<br>&nbsp;&nbsp; x cos r² + y sin r²)',
'r² = x² + y² · j selects an affine branch'],
['SHEAR CURLS · STYLISED VISUAL MODEL',
'x = 0.47(j − 2.5) + r cos(θ + 0.5t)<br>y = 0.36 sin(1.2j) + r sin(θ + 0.5t)',
'j = 0…5 · a row of rolling filaments'],
['CURL-INSPIRED FLOW · VISUAL DEFORMATION',
'x′ = x + 0.2 sin(2.6y + 0.3t)<br>y′ = y + 0.2 cos(2.2x − 0.28t)',
'Two deformation steps applied to orbiting particles'],
['PARTICLE MORPH · CHAOS INTO FORM',
'p<sub>i</sub>(s) = [1 − E(s)]p<sub>i</sub><sup>flow</sup> + E(s)p<sub>i</sub><sup>ΔX</sup><br>E(s) = 3s² − 2s³',
'0 ≤ s ≤ 1 · every particle finds its place']
];
let equationStage=-1;
function updateEquations(stage){const panel=$('#equations'),show=p>.25&&p<.815&&stage>=0;panel.classList.toggle('visible',show);panel.setAttribute('aria-hidden',String(!show));if(stage!==equationStage&&stage>=0){equationStage=stage;const [name,equation,note]=equationCards[stage];panel.innerHTML=`<div class="model">${name}</div><div class="eq">${equation}</div>${note?`<div class="note">${note}</div>`:''}`}}
function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);let cx=W/2,cy=H/2,size=Math.min(W*.29,H*.36),stage=-1;
// Preserve the black hold, falling dot and exactly one ripple.
if(p>=.08&&p<.255){let drop=clamp((p-.08)/.035),y=mix(cy-size*1.65,cy,drop*drop),fade=1-ease((p-.22)/.035);dot(cx,y,2.5,fade);if(p>=.115){let q=clamp((p-.115)/.13),r=q*size*2.15;ctx.save();ctx.globalAlpha=(1-q)*.65;ctx.strokeStyle='#98eac6';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,r,r*.57,0,0,TAU);ctx.stroke();ctx.restore()}}
if(p>.24&&p<.832)stage=drawChaos(size);
if(p>=.79&&p<.905){let f=(p-.79)/.09,alpha=ease((p-.79)/.02)*(1-ease((p-.88)/.025));trace(f,size*.84,alpha)}
if(p>=.885){let f=ease((p-.885)/.075),fs=Math.min(W*.155,H*.2,150);ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=ease((p-.885)/.018);ctx.font=`400 ${fs}px Arial,sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';let dw=ctx.measureText('Delta').width,xw=ctx.measureText('X').width,total=dw+xw+fs*.04,left=-total/2;ctx.save();ctx.beginPath();ctx.rect(left-3,-fs*.65,(total+6)*f,fs*1.3);ctx.clip();ctx.fillStyle='#edfff4';ctx.fillText('Delta',left,0);ctx.fillStyle='#a5edc6';ctx.fillText('X',left+dw+fs*.04,0);ctx.restore();if(f<1)dot(left+total*f,fs*.34,2,Math.sin(f*Math.PI));ctx.globalAlpha=ease((p-.963)/.027);ctx.font=`${Math.max(7,fs*.065)}px monospace`;ctx.textAlign='center';ctx.letterSpacing='3px';ctx.fillStyle='#8aaf99';ctx.fillText('ONE CHANGE. INFINITE POSSIBILITIES.',0,fs*.75);ctx.letterSpacing='0px';ctx.restore()}
updateEquations(stage);
let phase=p<.08?0:p<.24?1:p<.815?2:p<.885?3:4;$('#hint').classList.toggle('show',ready&&p<.035);$('#header').classList.toggle('visible',p>.25);$('#rail').classList.toggle('visible',p>.25);$('#chapter').classList.toggle('visible',p>.25);$('#chapter').textContent=phase===2?'02 / '+names[Math.max(0,stage)]:['','01 / THE FIRST DISTURBANCE','','03 / CHAOS FINDS FORM','04 / DELTAX'][phase];$('#replay').classList.toggle('visible',p>.985);$('#progress').style.transform=`scaleX(${p})`;document.querySelectorAll('.rail button').forEach((b,i)=>{b.classList.toggle('active',i===phase);b.setAttribute('aria-current',String(i===phase))})}
function fail(e){console.error('DeltaX renderer:',e);$('#error').style.display='flex'}
function tick(now){raf=0;if(document.hidden)return;if(last&&now-last<33){raf=requestAnimationFrame(tick);return}let dt=last?Math.min((now-last)/1000,.08):0;last=now;if(!reduced&&p>.24&&p<.815)clock+=dt;let diff=target-p;p=reduced?target:p+diff*.18;if(Math.abs(diff)<.00015)p=target;try{render()}catch(e){fail(e);return}if(p!==target||(!reduced&&p>.24&&p<.815))raf=requestAnimationFrame(tick)}
function request(){if(!raf)raf=requestAnimationFrame(tick)}
function scroll(){target=ready?clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)):0;request()}
function resize(){W=innerWidth;H=$('#viewport').clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);scroll();request()}
function jump(v){window.scrollTo({top:v*(document.documentElement.scrollHeight-innerHeight),behavior:reduced?'instant':'smooth'})}
window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)request()});document.querySelectorAll('.rail button').forEach(b=>b.onclick=()=>jump(+b.dataset.p));$('#replay').onclick=()=>jump(0);$('#retry').onclick=()=>location.reload();
try{if(!ctx)throw Error('Canvas unavailable');makeShapes();resize();setTimeout(()=>{ready=true;scroll()},1800)}catch(e){fail(e)}
