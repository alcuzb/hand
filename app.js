import * as THREE from "three";
import {HandLandmarker,FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL="https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const NAMES=["Silindr","Chiziq","Tekis rom","Uchburchakli prizma","Kub","Beshburchakli prizma"];
const CFG={follow:8,lift:1.0,minScale:.4,maxScale:1.8,spinGain:.9,flick:2.2};
const demo=location.search.includes("demo");
const $=s=>document.querySelector(s), vid=$("#cam");
// --- 3D sahna
const ren=new THREE.WebGLRenderer({canvas:$("#gl"),alpha:true,antialias:true});
ren.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(50,1,.1,50);cam.position.z=6;
scene.add(new THREE.AmbientLight(0xffffff,.8));
const sun=new THREE.DirectionalLight(0xffffff,1.6);sun.position.set(2,3,4);scene.add(sun);
const group=new THREE.Group();scene.add(group);
function frameGeo(){const s=new THREE.Shape(),h=new THREE.Path();
 s.moveTo(-.8,-.8);s.lineTo(.8,-.8);s.lineTo(.8,.8);s.lineTo(-.8,.8);s.closePath();
 h.moveTo(-.6,-.6);h.lineTo(-.6,.6);h.lineTo(.6,.6);h.lineTo(.6,-.6);h.closePath();s.holes.push(h);
 const g=new THREE.ExtrudeGeometry(s,{depth:.1,bevelEnabled:false});g.center();return g}
const GEO=[()=>new THREE.CylinderGeometry(.6,.6,1.4,48),()=>new THREE.BoxGeometry(.08,2,.08),frameGeo,
 ()=>new THREE.CylinderGeometry(.9,.9,1,3),()=>new THREE.BoxGeometry(1.2,1.2,1.2),()=>new THREE.CylinderGeometry(.8,.8,1,5)];
const mat=new THREE.MeshStandardMaterial({color:0xffb703,roughness:.4,metalness:.1,transparent:true,opacity:.9});
const lineMat=new THREE.LineBasicMaterial({color:0xffffff});
let mesh,edges,cur=-1;
function setShape(i){
 if(i===cur)return;cur=i;
 [mesh,edges].forEach(o=>{if(o){group.remove(o);o.geometry.dispose()}});
 const g=GEO[i]();mesh=new THREE.Mesh(g,mat);edges=new THREE.LineSegments(new THREE.EdgesGeometry(g),lineMat);
 group.add(mesh,edges);$("#name").textContent=NAMES[i];
}
function resize(){const w=innerWidth,h=innerHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener("resize",resize);resize();
// --- qo'l yordamchilari
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const palm=h=>D(h[0],h[9]);
const countFingers=h=>{let n=[[8,6],[12,10],[16,14],[20,18]].filter(([t,p])=>D(h[t],h[0])>D(h[p],h[0])*1.05).length;
 return n+(D(h[4],h[17])>D(h[2],h[17])*1.1?1:0)};
const openness=h=>[8,12,16,20].reduce((s,t)=>s+D(h[t],h[0]),0)/4/palm(h);
const toWorld=l=>{const vh=2*6*Math.tan(THREE.MathUtils.degToRad(25)),vw=vh*cam.aspect;
 return new THREE.Vector3((.5-l.x)*vw,(.5-l.y)*vh,0)};
// --- holat
let target=new THREE.Vector3(0,0,0),tScale=1,scale=1,spin=.3,tRoll=0,roll=0,want=4,wantSince=0,prevTip=null,prevT=0,hands=[];
function control(now){
 if(!hands.length){tScale=1;tRoll=0;target.set(0,0,0);$("#msg").textContent="Qo‘lingizni kameraga ko‘rsating";return}
 const a=hands[0];
 target.copy(toWorld(a[9]));target.y+=CFG.lift*scale+.5;
 const n=countFingers(a);
 if(n!==want){want=n;wantSince=now}else if(now-wantSince>150)setShape(n);
 const b=hands[1];
 if(!b){tScale=1;tRoll=0;$("#msg").textContent="Ikkinchi qo‘l bilan kattalashtiring, aylantiring, buring";return}
 $("#msg").textContent="";
 const pinch=D(b[4],b[8])/palm(b)<.3, o=openness(b);
 tScale=pinch?CFG.minScale:CFG.minScale+(CFG.maxScale-CFG.minScale)*clamp((o-.9)/1,0,1);
 tRoll=Math.atan2(-(b[9].x-b[0].x),-(b[9].y-b[0].y))*-1;
 const tip=b[8];
 if(prevTip&&now>prevT){const v=-(tip.x-prevTip.x)/((now-prevT)/1000);if(Math.abs(v)>CFG.flick)spin+=v*CFG.spinGain*.05}
 prevTip={x:tip.x,y:tip.y};prevT=now;
}
function demoStep(t){
 const s=t/1000;target.set(Math.cos(s)*1.5,Math.sin(s*1.3)*.8,0);setShape(Math.floor(s/2)%6);
 tScale=1+.5*Math.sin(s);tRoll=Math.sin(s*.7)*.6;
}
// --- ishlash sikli
let lm,lastVT=-1,last=performance.now();
function loop(now){
 const dt=Math.min((now-last)/1000,.1);last=now;
 if(demo)demoStep(now);
 else if(lm&&vid.readyState>=2&&vid.currentTime!==lastVT){lastVT=vid.currentTime;hands=lm.detectForVideo(vid,now).landmarks;control(now)}
 const k=1-Math.exp(-CFG.follow*dt);
 group.position.lerp(target,k);group.position.y+=Math.sin(now/500)*.003;
 scale+=(tScale-scale)*k;group.scale.setScalar(scale);
 roll+=(tRoll-roll)*k;group.rotation.z=roll;
 group.rotation.y+=spin*dt;group.rotation.x=.35;spin+=((.3)-spin)*Math.min(1,dt*.8);
 ren.render(scene,cam);requestAnimationFrame(loop);
}
setShape(4);
(async()=>{
 if(demo){$("#msg").textContent="Demo rejimi";requestAnimationFrame(loop);return}
 try{
  vid.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:1280,height:720}});await vid.play();
  lm=await HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(WASM),
   {baseOptions:{modelAssetPath:MODEL},runningMode:"VIDEO",numHands:2});
  requestAnimationFrame(loop);
 }catch(e){console.error(e);$("#msg").textContent="Kameraga ruxsat bering yoki /?demo ni oching.";requestAnimationFrame(loop)}
})();
