import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  NormalBlending,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { createHumanLandscape } from "./human-landscape";

export type ResonanceState = {
  progress: number;
  pointerX: number;
  pointerY: number;
  active: boolean;
  pressed: boolean;
  paused: boolean;
  reducedMotion: boolean;
  tuning: number;
  pulse: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;
const smooth = (value: number) => { const v = clamp(value); return v*v*(3-2*v); };
const TAU = Math.PI*2;

// A fixed seed gives every visitor the same constellation, without a remote asset.
function randomSource(seed = 112358) {
  return () => { seed = (seed*1664525+1013904223) >>> 0; return seed/4294967296; };
}

const neuronVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  attribute vec3 aSource;
  attribute vec3 color;
  uniform float uTime;
  uniform float uDpr;
  uniform float uGather;
  uniform float uTuning;
  uniform float uOpacity;
  uniform float uActive;
  uniform float uAssembly;
  uniform vec2 uPointer;
  uniform vec3 uPulses;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float packet = aKind > 1.5 && aKind < 2.5 ? 1.0 : 0.0;
    float junction = aKind > 2.5 ? 1.0 : 0.0;
    float phase = fract(aSeed*13.71-uTime*mix(0.115,0.34,packet));
    float travelling = aKind > 0.5 && aKind < 2.5 ? 1.0 : 0.0;
    float flow = mix(phase*phase,phase,packet)*(1.0-uGather*0.65);
    p = mix(p, mix(position,aSource,flow), travelling);
    p = mix(p,mix(aSource,position,smoothstep(0.0,1.0,clamp(uAssembly*1.15-aSeed*0.15,0.0,1.0))),junction);
    float wave = sin(aSeed*41.0+uTime*0.42);
    p += vec3(sin(aSeed*81.0+uTime*0.31), cos(aSeed*67.0-uTime*0.27), wave)
      * (0.006+travelling*0.023)*(1.0-uGather*0.55);
    float proximity = exp(-length(p.xy-uPointer)*2.0)*uActive;
    p.xy += (uPointer-p.xy)*proximity*0.035;
    float age = max(0.0,uTime-uPulses.x);
    float pulse = exp(-pow((length(p.xy)-0.75-age*0.48)*12.0,2.0))*exp(-age*0.65)*step(-50.0,uPulses.x);
    age = max(0.0,uTime-uPulses.y);
    pulse += exp(-pow((length(p.xy)-0.75-age*0.48)*12.0,2.0))*exp(-age*0.65)*step(-50.0,uPulses.y);
    age = max(0.0,uTime-uPulses.z);
    pulse += exp(-pow((length(p.xy)-0.75-age*0.48)*12.0,2.0))*exp(-age*0.65)*step(-50.0,uPulses.z);
    vColor = mix(color,vec3(0.35,0.47,0.48),uTuning*0.48);
    vColor = mix(vColor,vec3(0.96,0.67,0.27),min(0.7,pulse*0.5+proximity*0.3+uGather*0.22));
    vAlpha = uOpacity*(0.68+0.2*sin(aSeed*18.0+uTime*0.55));
    vAlpha *= mix(1.0,smoothstep(0.0,0.12,phase)*(1.0-smoothstep(0.86,1.0,phase))*mix(0.72,1.3,packet),travelling);
    vec4 mvPosition = modelViewMatrix*vec4(p,1.0);
    float eyeDepth = -mvPosition.z;
    float perspective = clamp(8.0/max(eyeDepth,0.25),0.3,4.0);
    vAlpha *= smoothstep(0.15,0.55,eyeDepth);
    gl_PointSize = min(27.0,aSize*uDpr*perspective*(1.0+proximity*0.6+pulse*0.5+uGather*0.2));
    gl_Position = projectionMatrix*mvPosition;
  }
`;

const neuronFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord-0.5)*2.0;
    if (d>1.0) discard;
    float core = exp(-d*d*13.0);
    float aura = exp(-d*d*3.8)*0.30;
    vec3 color = mix(vColor,vec3(1.0,0.87,0.56),core*0.36);
    gl_FragColor = vec4(color,(core+aura)*vAlpha);
  }
`;

function createNeuralHalo() {
  const rng = randomSource();
  const group = new Group();
  const positions: number[] = [], sources: number[] = [], colors: number[] = [];
  const sizes: number[] = [], seeds: number[] = [], kinds: number[] = [];
  const palette = [new Color("#8b612e"), new Color("#bb8c45"), new Color("#d6b16f"), new Color("#5e6253")];
  const point = (angle: number, tube: number, radius = 0.16) => {
    const r = 1+Math.cos(tube)*radius;
    return new Vector3(Math.cos(angle)*r,Math.sin(angle)*r,Math.sin(tube)*radius*0.8);
  };
  for (let i = 0; i < 6600; i++) {
    const travelling = i >= 5250;
    const angle = rng()*TAU;
    const tube = rng()*TAU;
    const radius = (0.035+Math.pow(rng(),0.65)*0.145);
    const p = point(angle,tube,radius);
    p.x += (rng()-0.5)*0.009;
    p.y += (rng()-0.5)*0.009;
    const sourceAngle = angle + (rng()-0.5)*0.6;
    const reach = 1.55+Math.pow(rng(),1.6)*2.5;
    positions.push(p.x,p.y,p.z);
    sources.push(Math.cos(sourceAngle)*reach,Math.sin(sourceAngle)*reach,(rng()-0.5)*2.1);
    const c = palette[Math.floor(rng()*palette.length)];
    colors.push(c.r,c.g,c.b);
    const node = i%31 === 0;
    sizes.push(travelling ? 1.5+rng()*2.2 : node ? 4.0+rng()*4.5 : 0.9+rng()*2.4);
    seeds.push(rng()); kinds.push(travelling ? 1 : 0);
  }
  const neuronAngles:number[]=[];
  const neuronTubes:number[]=[];
  const neurons:Vector3[]=[];
  const junctionColor=new Color("#a46c20");
  for(let i=0;i<180;i++) {
    const angle=i/180*TAU+(rng()-0.5)*0.018,tube=rng()*TAU;
    const p=point(angle,tube,0.08+rng()*0.1);
    neuronAngles.push(angle);neuronTubes.push(tube);neurons.push(p);
    const reach=1.42+rng()*0.95;
    positions.push(p.x,p.y,p.z);sources.push(Math.cos(angle)*reach,Math.sin(angle)*reach,(rng()-0.5)*0.7);
    colors.push(junctionColor.r,junctionColor.g,junctionColor.b);
    sizes.push(8+rng()*8);seeds.push(rng());kinds.push(3);
  }
  const packetColor=new Color("#dd9c37");
  for(let i=0;i<300;i++) {
    const start=neurons[i%neurons.length];
    const end=neurons[(i+2+Math.floor(rng()*4))%neurons.length];
    positions.push(start.x,start.y,start.z);sources.push(end.x,end.y,end.z);
    colors.push(packetColor.r,packetColor.g,packetColor.b);
    sizes.push(3.5+rng()*4.5);seeds.push(rng());kinds.push(2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new Float32BufferAttribute(positions,3));
  geometry.setAttribute("aSource",new Float32BufferAttribute(sources,3));
  geometry.setAttribute("color",new Float32BufferAttribute(colors,3));
  geometry.setAttribute("aSize",new Float32BufferAttribute(sizes,1));
  geometry.setAttribute("aSeed",new Float32BufferAttribute(seeds,1));
  geometry.setAttribute("aKind",new Float32BufferAttribute(kinds,1));
  const uniforms = {
    uTime:{value:0},uDpr:{value:1},uGather:{value:0},uTuning:{value:0.18},uOpacity:{value:1},
    uActive:{value:0},uAssembly:{value:0},uPointer:{value:new Vector2()},uPulses:{value:new Vector3(-100,-100,-100)},
  };
  const material = new ShaderMaterial({vertexShader:neuronVertex,fragmentShader:neuronFragment,uniforms,transparent:true,depthWrite:false,depthTest:false,blending:NormalBlending});
  const particles = new Points(geometry,material);
  particles.frustumCulled = false;
  group.add(particles);

  const fibrePositions: number[] = [];
  // Fine three-dimensional bundles thread through the nodes and around the opening.
  for (let fibre = 0; fibre < 12; fibre++) {
    const phase = rng()*TAU;
    const tubeRadius = 0.065+rng()*0.105;
    for (let segment = 0; segment < 220; segment++) {
      for (const fraction of [segment/220,(segment+1)/220]) {
        const angle = fraction*TAU;
        const tube = phase+Math.sin(angle*3+phase)*0.5+angle*(fibre%3-1);
        const p = point(angle,tube,tubeRadius);
        fibrePositions.push(p.x,p.y,p.z);
      }
    }
  }
  // Branches follow the annulus rather than cutting across its open centre.
  for (let branch = 0; branch < 330; branch++) {
    const angle = rng()*TAU, tube = rng()*TAU;
    const a = point(angle,tube,0.08+rng()*0.1);
    const b = point(angle+0.015+rng()*0.11,tube+(rng()-0.5)*1.8,0.08+rng()*0.1);
    fibrePositions.push(a.x,a.y,a.z,b.x,b.y,b.z);
  }
  const fibreGeometry = new BufferGeometry();
  fibreGeometry.setAttribute("position",new Float32BufferAttribute(fibrePositions,3));
  const fibreMaterial = new LineBasicMaterial({color:0x927044,transparent:true,opacity:0.115,depthWrite:false,depthTest:false});
  group.add(new LineSegments(fibreGeometry,fibreMaterial));

  const dendrites:number[]=[];
  for(let n=0;n<neurons.length;n++) {
    const origin=neurons[n],angle=neuronAngles[n],tube=neuronTubes[n];
    for(let branch=0;branch<4;branch++) {
      const direction=branch%2===0?1:-1;
      const span=(0.018+rng()*0.065)*direction;
      const spread=(rng()-0.5)*1.4;
      const end=point(angle+span,tube+spread,0.08+rng()*0.10);
      const control=origin.clone().lerp(end,0.5);
      control.x+=Math.cos(angle)*(rng()-0.4)*0.055;
      control.y+=Math.sin(angle)*(rng()-0.4)*0.055;
      for(let j=0;j<7;j++)for(const t of [j/7,(j+1)/7]) {
        const p=origin.clone().multiplyScalar((1-t)*(1-t)).addScaledVector(control,2*t*(1-t)).addScaledVector(end,t*t);
        dendrites.push(p.x,p.y,p.z);
      }
      const twig=point(angle+span*1.3,tube+spread+(rng()-0.5)*1.0,0.08+rng()*0.10);
      const twigControl=end.clone().lerp(twig,0.5).addScaledVector(origin.clone().sub(end),0.08);
      for(let j=0;j<4;j++)for(const t of [j/4,(j+1)/4]) {
        const p=end.clone().multiplyScalar((1-t)*(1-t)).addScaledVector(twigControl,2*t*(1-t)).addScaledVector(twig,t*t);
        dendrites.push(p.x,p.y,p.z);
      }
    }
  }
  const dendriteGeometry=new BufferGeometry();
  dendriteGeometry.setAttribute("position",new Float32BufferAttribute(dendrites,3));
  const dendriteMaterial=new LineBasicMaterial({color:0xa17d43,transparent:true,opacity:0.3,depthWrite:false,depthTest:false});
  group.add(new LineSegments(dendriteGeometry,dendriteMaterial));

  const reachPositions: number[] = [];
  for (let ray = 0; ray < 27; ray++) {
    const angle = rng()*TAU, bend = (rng()-0.5)*0.4;
    const reach = 1.4+rng()*0.5;
    for (let j=0;j<23;j++) for (const fraction of [j/23,(j+1)/23]) {
      const radius = 1.04+fraction*(reach-1.04);
      const a = angle+Math.sin(fraction*Math.PI)*bend;
      reachPositions.push(Math.cos(a)*radius,Math.sin(a)*radius,Math.sin(fraction*Math.PI)*(rng()-0.5)*0.08);
    }
  }
  const reachGeometry = new BufferGeometry();
  reachGeometry.setAttribute("position",new Float32BufferAttribute(reachPositions,3));
  const reachMaterial = new LineBasicMaterial({color:0xb49c72,transparent:true,opacity:0.045,depthWrite:false,depthTest:false});
  group.add(new LineSegments(reachGeometry,reachMaterial));

  const glowGeometry = new PlaneGeometry(3.4,3.4);
  const glowMaterial = new ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:false,blending:NormalBlending,
    uniforms:{uOpacity:{value:1}},
    vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`precision highp float; varying vec2 vUv; uniform float uOpacity; void main(){float r=length(vUv-.5)*3.4;float a=exp(-pow((r-1.0)*5.0,2.0))*.085;gl_FragColor=vec4(.88,.67,.30,a*uOpacity);}`,
  });
  const glow = new Mesh(glowGeometry,glowMaterial);
  glow.position.z=-0.22;
  glow.renderOrder=-1;
  group.add(glow);
  return {group,uniforms,fibreMaterial,dendriteMaterial,reachMaterial,glowMaterial};
}

export function createResonanceEngine(canvas:HTMLCanvasElement, options:{onReady?:()=>void} = {}) {
  let state:ResonanceState = {progress:0,pointerX:0,pointerY:0,active:false,pressed:false,paused:false,reducedMotion:window.matchMedia("(prefers-reduced-motion: reduce)").matches,tuning:0.18,pulse:0};
  let disposed=false, contextUnavailable=false, ready=false;
  let frame=0, frames=0, time=0, previousTime=0, pulseSlot=0;
  let width=0,height=0,dpr=1, resizePending=true, forceResize=true;
  let active=0, pressure=0, pointerX=0,pointerY=0;
  let renderer:WebGLRenderer;
  canvas.dataset.renderer="initialising";
  canvas.dataset.fallback="false";
  try {
    renderer=new WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
    renderer.setClearColor(0x000000,0);
  } catch {
    canvas.dataset.renderer="fallback";canvas.dataset.fallback="true";options.onReady?.();
    return {update(_next:ResonanceState){void _next;},dispose(){disposed=true;}};
  }
  const scene=new Scene();
  const camera=new PerspectiveCamera(35,1,0.05,60);
  camera.position.set(0,0,9);
  const halo=createNeuralHalo();
  scene.add(halo.group);
  const landscape=createHumanLandscape();
  const landscapeMaterials=new Map<Material,number>();
  landscape.traverse(object=>{
    if ("material" in object) {
      const materials=Array.isArray(object.material)?object.material:[object.material];
      for(const material of materials as Material[]) if(material&&!landscapeMaterials.has(material)) {
        landscapeMaterials.set(material,material.opacity);material.transparent=true;material.depthWrite=false;
      }
    }
  });
  // A small pool of warm light travels along the shared path when explored.
  const pathPositions:number[]=[];
  const pathSeeds:number[]=[];
  const pathRandom=randomSource(3321);
  for(let i=0;i<180;i++) {
    const f=i/179;
    pathPositions.push(0.65+f*2.15,-1.48+Math.sin(f*Math.PI)*0.1+(pathRandom()-0.5)*0.09,0.45+(pathRandom()-0.5)*0.15);
    pathSeeds.push(pathRandom());
  }
  const pathGeometry=new BufferGeometry();
  pathGeometry.setAttribute("position",new Float32BufferAttribute(pathPositions,3));
  pathGeometry.setAttribute("aSeed",new Float32BufferAttribute(pathSeeds,1));
  const pathMaterial=new ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
    uniforms:{uAge:{value:100},uPressure:{value:0},uReveal:{value:0},uDpr:{value:1}},
    vertexShader:`attribute float aSeed;uniform float uAge;uniform float uPressure;uniform float uReveal;uniform float uDpr;varying float vAlpha;void main(){vec3 p=position;float wave=exp(-pow((p.x-(.67+uAge*1.15))*3.0,2.0))*exp(-uAge*.55);vAlpha=(wave*.85+uPressure*.4)*uReveal;p.y+=wave*sin(aSeed*6.28)*.04;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(3.+aSeed*5.)*uDpr*clamp(8./-mv.z,.3,3.);}`,
    fragmentShader:`precision highp float;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.93,.62,.20,exp(-d*d*5.)*vAlpha);}`,
  });
  const pathLight=new Points(pathGeometry,pathMaterial);
  pathLight.frustumCulled=false;
  landscape.add(pathLight);
  scene.add(landscape);
  const viewHeight=2*9*Math.tan(35*Math.PI/360);
  const touchDevice=window.matchMedia("(pointer: coarse)").matches;

  function isStill(){return state.paused||state.reducedMotion;}
  function requestFrame(){if(!disposed&&!contextUnavailable&&!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now:number){
    frame=0;if(disposed||contextUnavailable||document.hidden)return;
    if(resizePending)applySize();
    const dt=previousTime?Math.min((now-previousTime)/1000,0.05):0;previousTime=now;
    const still=isStill();if(!still)time+=dt;
    const ease=still?1:1-Math.exp(-dt*7);
    pressure=mix(pressure,state.pressed?1:0,ease);
    if(!state.paused){active=mix(active,state.active?1:0,ease);pointerX=mix(pointerX,clamp(state.pointerX,-1,1),ease);pointerY=mix(pointerY,clamp(state.pointerY,-1,1),ease);}
    const progress=clamp(state.progress,0,3), mobile=width<760;
    const safePassage=mobile||touchDevice;
    const gather=smooth(progress);
    const passage=smooth(progress-1);
    // Keep mobile figures anchored; dissolve them gently behind the reading passage.
    const readingVeil=mobile?smooth((progress-1.82)/0.28)*(1-smooth((progress-2.35)/0.55)):0;
    const reveal=smooth((progress-(mobile?1.25:1.35))/(mobile?0.6:0.8))*(1-readingVeil*0.8);
    const mobileHaloTone=mobile?1-0.48*smooth(progress/0.8)*(1-smooth((progress-1.2)/0.8)):1;
    const haloOpacity=(1-smooth((progress-1.68)/0.32))*mobileHaloTone;
    const ringRadius=mobile?width*0.345:Math.min(width*0.255,height*0.365);
    const x=mix(mobile?0.5:0.73,0.5,passage);
    const y=mix(mobile?Math.max(0.305,(120+ringRadius)/height):0.47,0.5,passage);
    const ringScale=ringRadius/height*viewHeight/1.18;
    // Mobile expands the iris without taking its transparent layers through the camera.
    halo.group.position.set((x-0.5)*viewHeight*width/height,(0.5-y)*viewHeight,passage*(safePassage?5.3:10.3));
    halo.group.scale.setScalar(ringScale*(safePassage?1+passage*1.1:1)*(1-pressure*0.045));
    halo.group.rotation.set(0.07+pointerY*active*0.055,-0.07+pointerX*active*0.075,Math.sin(time*0.055)*0.015);
    halo.group.visible=haloOpacity>0.001;
    halo.uniforms.uTime.value=time;
    const assembly=state.reducedMotion||still&&time<0.02?1:smooth(time/3);
    halo.uniforms.uAssembly.value=assembly;
    halo.uniforms.uGather.value=pressure+gather*0.12;
    halo.uniforms.uTuning.value=clamp(state.tuning);
    halo.uniforms.uOpacity.value=haloOpacity;
    halo.uniforms.uActive.value=active;
    halo.uniforms.uPointer.value.set(((pointerX+1)/2-x)*width/ringRadius*1.18, (y-(pointerY+1)/2)*height/ringRadius*1.18);
    halo.fibreMaterial.opacity=(0.115+pressure*0.055)*haloOpacity*(0.5+assembly*0.5);
    halo.dendriteMaterial.opacity=(0.3+pressure*0.1)*haloOpacity*(0.2+assembly*0.8);
    halo.reachMaterial.opacity=0.045*haloOpacity*(1-pressure*0.8);
    halo.glowMaterial.uniforms.uOpacity.value=haloOpacity*(1+pressure*1.6);
    landscape.visible=reveal>0.001;
    landscapeMaterials.forEach((opacity,material)=>{material.opacity=opacity*reveal;});
    const latestPulse=Math.max(halo.uniforms.uPulses.value.x,halo.uniforms.uPulses.value.y,halo.uniforms.uPulses.value.z);
    pathMaterial.uniforms.uAge.value=time-latestPulse;
    pathMaterial.uniforms.uPressure.value=pressure;
    pathMaterial.uniforms.uReveal.value=reveal;
    if(mobile){landscape.scale.setScalar(0.64);landscape.position.set(-1.03,-0.52,0);}else{
      // Keep the whole family in frame when a desktop preview is taller than it is wide.
      landscape.scale.setScalar(Math.min(1,width/height/1.1));landscape.position.set(0,0,0);
    }
    landscape.rotation.y=pointerX*active*0.007;
    if(typeof landscape.userData.update==="function")landscape.userData.update(time,progress,pointerX,pointerY);
    renderer.render(scene,camera);
    frames++;
    Object.assign(canvas.dataset,{renderer:"webgl",engine:"three.js neural light",rendered:"true",frames:String(frames),time:time.toFixed(3),paused:String(state.paused),reducedMotion:String(state.reducedMotion),tuning:state.tuning.toFixed(3),pulse:String(state.pulse),progress:progress.toFixed(3),scenePhase:progress<1?"coalescence":progress<2?"passage":"experience",landscapeOpacity:reveal.toFixed(3),ringDepth:halo.group.position.z.toFixed(3)});
    if(!ready){ready=true;options.onReady?.();}
    if(!still)requestFrame();
  }
  function applySize(){
    resizePending=false;
    const bounds=canvas.getBoundingClientRect();
    const nextWidth=Math.max(1,Math.round(bounds.width||window.innerWidth));
    const nextHeight=Math.max(1,Math.round(bounds.height||window.innerHeight));
    const compactDrawing=nextWidth<760||touchDevice;
    const nextDpr=Math.min(window.devicePixelRatio||1,compactDrawing?1.5:1.75);
    if(!forceResize&&width===nextWidth&&height===nextHeight&&dpr===nextDpr)return;
    forceResize=false;width=nextWidth;height=nextHeight;dpr=nextDpr;
    // One buffer resize, immediately followed by a draw in the same animation frame.
    renderer.setDrawingBufferSize(width,height,dpr);
    renderer.setClearColor(0xf1f0e9,compactDrawing?1:0);
    camera.aspect=width/height;camera.updateProjectionMatrix();halo.uniforms.uDpr.value=dpr;pathMaterial.uniforms.uDpr.value=dpr;
    canvas.dataset.resolution=`${Math.round(width*dpr)}x${Math.round(height*dpr)}`;
  }
  function resize(){if(disposed)return;resizePending=true;requestFrame();}
  function visibilityChanged(){previousTime=0;if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else if(!document.hidden)requestFrame();}
  function contextLost(event:Event){event.preventDefault();contextUnavailable=true;ready=false;if(frame)cancelAnimationFrame(frame);frame=0;canvas.dataset.renderer="fallback";canvas.dataset.fallback="true";options.onReady?.();}
  function contextRestored(){contextUnavailable=false;canvas.dataset.fallback="false";previousTime=0;forceResize=true;resize();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibilityChanged);
  canvas.addEventListener("webglcontextlost",contextLost);canvas.addEventListener("webglcontextrestored",contextRestored);resize();
  return {
    update(next:ResonanceState){
      if(disposed)return;let changed=false,onlyPointerChanged=true;
      for(const key of Object.keys(state) as (keyof ResonanceState)[])if(state[key]!==next[key]){changed=true;if(key!=="pointerX"&&key!=="pointerY"&&key!=="active")onlyPointerChanged=false;}
      if(!changed)return;
      if(next.pulse!==state.pulse){halo.uniforms.uPulses.value.setComponent(pulseSlot,time);pulseSlot=(pulseSlot+1)%3;}
      const wasStill=isStill();state={...next};if(state.paused&&onlyPointerChanged)return;if(wasStill!==isStill())previousTime=0;requestFrame();
    },
    dispose(){
      disposed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibilityChanged);
      canvas.removeEventListener("webglcontextlost",contextLost);canvas.removeEventListener("webglcontextrestored",contextRestored);
      if(typeof landscape.userData.dispose==="function")landscape.userData.dispose();
      const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();
      scene.traverse(object=>{if("geometry" in object)geometries.add(object.geometry as BufferGeometry);if("material" in object){const ms=Array.isArray(object.material)?object.material:[object.material];for(const m of ms)materials.add(m as Material);}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();
    },
  };
}
