/**
 * Dim Sum Den: an orthographic bamboo-grove diorama.
 * Supply the same THREE instance and createBao function used by your app.
 */
import { PADS } from './bindings.mjs';
export function createDenScene(THREE, createBao, createWalkingBao = null, options = {}) {
  const world = new THREE.Group(); world.name='DimSumDen';
  const pandas=[],mixers=[],labels=[],steam=[],lanterns=[],obstacles=[],tallyRows=[];
  const crew = new Map(), frontier = new Map();
  const v=a=>new THREE.Vector3(...a);
  const matte=(color)=>new THREE.MeshStandardMaterial({color,roughness:0.95});
  const palette={
    grass:matte('#86a56c'),bamboo:matte('#416e31'),bambooLight:matte('#608645'),
    bambooDark:matte('#285327'),nodes:matte('#779353'),leaf:matte('#3d722b'),
    stone:matte('#c8c6b5'),stoneEdge:matte('#acae97'),
    blue:matte('#09638c'),green:matte('#175a38'),
    roof:matte('#171f1d'),wood:matte('#a8753e'),woodEdge:matte('#835b33'),
    bambooBasket:matte('#c3a66d'),basketRim:matte('#d7bd82'),
    tray:matte('#262821'),bun:matte('#f5e6b9'),
    purple:matte('#594681'),paper:matte('#eee4c9'),book:matte('#795033'),
  };
  let seed=144;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function mesh(parent,geometry,material,position=[0,0,0],name='') {
    const m=new THREE.Mesh(geometry,material);m.position.set(...position);
    m.castShadow=m.receiveShadow=true;m.name=name;parent.add(m);return m;
  }
  function box(parent,size,position,material,name='') {return mesh(parent,new THREE.BoxGeometry(...size),material,position,name);}
  function cylinder(parent,radius,height,position,material,segments=16) {
    return mesh(parent,new THREE.CylinderGeometry(radius,radius,height,segments),material,position);
  }
  function sphere(parent,scale,position,material,segments=16) {
    const m=mesh(parent,new THREE.SphereGeometry(1,segments,12),material,position);m.scale.set(...scale);return m;
  }
  function rod(parent,a,b,radius,material,segments=8) {
    const A=v(a),B=v(b),delta=B.clone().sub(A);
    const m=mesh(parent,new THREE.CylinderGeometry(radius,radius,delta.length(),segments),material,A.add(B).multiplyScalar(0.5).toArray());
    m.quaternion.setFromUnitVectors(v([0,1,0]),delta.normalize());return m;
  }
  function texture(draw,width=512,height=128) {
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    draw(canvas.getContext('2d'),width,height);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function signTexture(text,color) {
    return texture((ctx,w,h)=>{
      ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='#e9e6c5';ctx.lineWidth=3;
      ctx.strokeRect(9,9,w-18,h-18);
      ctx.fillStyle='#f6edd1';ctx.font='600 44px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(text,w/2,h/2+2,w-30);
    });
  }
  function label(text,position) {
    const map=texture((ctx,w,h)=>{
      ctx.fillStyle='#f7f7ed';ctx.beginPath();ctx.roundRect(3,10,w-6,h-20,42);ctx.fill();
      ctx.strokeStyle='#a9b795';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#596b52';ctx.font='500 30px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);
    },640,128);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false}));
    sprite.position.set(...position);sprite.scale.set(2.75,0.55,1);sprite.name=text;world.add(sprite);labels.push(sprite);return sprite;
  }
  const ground=mesh(world,new THREE.PlaneGeometry(160,160),palette.grass);
  ground.rotation.x=-Math.PI/2;ground.castShadow=false;ground.receiveShadow=true;ground.name='Bamboo clearing';
  const clearing=new THREE.CircleGeometry(5.8,12);
  clearing.rotateX(-Math.PI/2);
  const clearMaterials=['#93b275','#89aa68','#7d9e61'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  clearing.clearGroups();
  for(let i=0;i<12;i++) clearing.addGroup(i*3,3,i%3);
  mesh(world,clearing,clearMaterials,[0,0.012,-1.1],'Faceted clearing').castShadow=false;

  // Oval stepping-stone path framing the four stalls.
  for(let i=0;i<37;i++) {
    const a=i/37*Math.PI*2;
    const x=Math.sin(a)*10.1,z=Math.cos(a)*7.25-0.25;
    const stone=cylinder(world,0.31+rand()*0.065,0.075,[x,0.041,z],palette.stone,12);
    stone.scale.z=0.73;stone.rotation.y=rand()*Math.PI;stone.name='Stepping stone';
    const edge=cylinder(world,0.34,0.035,[x,0.015,z],palette.stoneEdge,12);
    edge.scale.z=0.76;edge.rotation.y=stone.rotation.y;edge.castShadow=false;
  }

  function leaf(parent,start,end,width) {
    const A=v(start),B=v(end),axis=B.clone().sub(A);
    const across=new THREE.Vector3(axis.z,0,-axis.x).normalize().multiplyScalar(width);
    const middle=A.clone().lerp(B,0.55);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute([
      ...A.toArray(),...middle.clone().add(across).toArray(),...B.toArray(),
      ...A.toArray(),...B.toArray(),...middle.clone().sub(across).toArray()
    ],3));
    g.computeVertexNormals();
    const mat=palette.leaf;mat.side=THREE.DoubleSide;
    return mesh(parent,g,mat);
  }
  function bamboo(x,z,height,radius,index) {
    const stem=new THREE.Group();stem.position.set(x,0,z);stem.name='Bamboo '+index;world.add(stem);
    obstacles.push({type:'circle',x,z,radius:radius+0.04});
    const count=Math.ceil(height/1.18),segment=height/count;
    for(let i=0;i<count;i++) {
      const mat=i%3===0?palette.bambooLight:palette.bamboo;
      cylinder(stem,radius,segment-0.025,[0,segment*(i+0.5),0],mat,6);
      const node=cylinder(stem,radius*1.18,0.08,[0,segment*(i+1)-0.055,0],palette.nodes,6);
      node.rotation.y=Math.PI/6;
      if(i>1&&(i+index)%3===0) {
        const angle=rand()*Math.PI*2,reach=0.6+rand()*0.6;
        const end=[Math.cos(angle)*reach,segment*(i+0.85),Math.sin(angle)*reach];
        rod(stem,[0,segment*(i+0.62),0],end,0.032,palette.bambooDark,5);
        for(let j=0;j<3;j++) {
          const t=(j+1)/4;
          const start=[end[0]*t,segment*(i+0.62)+(end[1]-segment*(i+0.62))*t,end[2]*t];
          const wing=angle+(j%2?0.8:-0.7);
          leaf(stem,start,[start[0]+Math.cos(wing)*0.65,start[1]+0.13,start[2]+Math.sin(wing)*0.65],0.13);
        }
      }
    }
    return stem;
  }
  let bambooIndex=0;
  for(let row=0;row<4;row++) for(const side of [-1,1]) for(let col=0;col<4;col++) {
    const x=side*(3.8+col*2.1+(rand()-0.5)*0.6);
    const z=-3.0-row*2.3+(rand()-0.5)*0.55;
    bamboo(x,z,6.8+rand()*3.9,0.11+rand()*0.11,bambooIndex++);
  }
  bamboo(-11.1,0.6,8.3,0.20,bambooIndex++);
  bamboo(11.2,0.2,8.9,0.19,bambooIndex++);
  bamboo(10.8,6.5,5.4,0.12,bambooIndex++);
  bamboo(11.5,6.6,4.8,0.075,bambooIndex++);
  for(let i=0;i<31;i++) {
    const side=i%2?-1:1;
    const x=side*(4.1+rand()*7.5),z=-7+rand()*12;
    mesh(world,new THREE.ConeGeometry(0.13+rand()*0.13,0.4+rand()*0.45,4),palette.leaf,[x,0.2,z]).castShadow=false;
  }

  function scarf(panda,color) {
    const group=new THREE.Group();panda.bones.Torso.add(group);group.position.y=-1.4;
    const mat=matte(color);panda.materials.scarf=mat;
    const collar=mesh(group,new THREE.TorusGeometry(0.83,0.105,8,32),mat,[0,2.42,0.12]);
    collar.rotation.x=Math.PI/2;
    const tail=box(group,[0.18,0.45,0.055],[0.40,2.21,1.20],mat);
    tail.rotation.z=-0.08;
  }
  function strawHat(panda) {
    const hat=new THREE.Group();panda.bones.Head.add(hat);hat.position.set(0,1.53,0);hat.name='Bamboo garden hat';
    cylinder(hat,0.75,0.035,[0,0.015,0],palette.basketRim,24);
    mesh(hat,new THREE.ConeGeometry(0.68,0.29,24),palette.bambooBasket,[0,0.177,0]);
    const band=mesh(hat,new THREE.TorusGeometry(0.24,0.030,6,24),palette.green,[0,0.272,0]);band.rotation.x=Math.PI/2;
  }
  function book(panda) {
    const g=new THREE.Group();g.position.set(0,-0.10,0.33);panda.bones.Wrist_L.add(g);
    box(g,[0.38,0.52,0.09],[0,0,0],palette.book);
    box(g,[0.30,0.43,0.035],[0,0,0.060],palette.paper);
    box(g,[0.025,0.47,0.045],[-0.10,0,0.080],palette.wood);
    g.rotation.y=-0.13;
  }
  function drum(panda) {
    const g=new THREE.Group();g.position.set(0,-0.08,0.33);panda.bones.Wrist_R.add(g);
    const body=cylinder(g,0.27,0.34,[0,0,0],palette.wood,16);body.rotation.x=Math.PI/2;
    const face=cylinder(g,0.255,0.03,[0,0,0.18],palette.paper,16);face.rotation.x=Math.PI/2;
    const rim=mesh(g,new THREE.TorusGeometry(0.255,0.025,6,20),palette.book,[0,0,0.198]);
    rod(g,[0.26,-0.25,0.14],[0.31,0.29,0.24],0.027,palette.wood);
  }
  function addPanda(parent,position,scale,role='vendor',color='#216485') {
    const panda=createBao(THREE,{detail:'low'});panda.model.position.set(...position);panda.model.scale.setScalar(scale);
    parent.add(panda.model);pandas.push(panda);
    if(role!=='hero') scarf(panda,color);
    if(role==='gardener') strawHat(panda);
    if(role==='librarian') book(panda);
    if(role==='drummer') drum(panda);
    const mixer=new THREE.AnimationMixer(panda.model);
    mixer.clipAction(panda.animations.find(a=>a.name==='Breathe')).play();
    mixer.clipAction(panda.animations.find(a=>a.name==='Blink')).play();
    mixer.setTime(rand()*4);mixers.push(mixer);
    // Small facial details do not need separate shadow draws.
    panda.model.traverse(m=>{
      if(m.isSkinnedMesh) m.castShadow=/^(Body|HeadShape|Arm_|Hand_|Foot_|Ear_)/.test(m.name);
    });
    panda.mixer=mixer;
    return panda;
  }
  const hero=createBao(THREE);hero.model.name='Bao — host of Dim Sum Den';
  hero.model.position.set(0,0,-1.25);hero.model.scale.setScalar(1.75);world.add(hero.model);pandas.push(hero);
  const heroMixer=new THREE.AnimationMixer(hero.model);
  heroMixer.clipAction(hero.animations.find(a=>a.name==='Breathe')).play();
  heroMixer.clipAction(hero.animations.find(a=>a.name==='Blink')).play();mixers.push(heroMixer);
  // Bao is the orchestrator; the other Pass roles stand on their pads, never on him.
  const librarian=addPanda(world,[PADS.product.x,0.03,PADS.product.z],0.25,'librarian','#594681');
  const drummer=addPanda(world,[PADS.architect.x,0.03,PADS.architect.z],0.25,'drummer','#594681');

  function dumpling(parent,position,scale=1) {
    const g=new THREE.Group();g.position.set(...position);g.scale.setScalar(scale);parent.add(g);g.name='Bao bun';
    sphere(g,[0.18,0.14,0.18],[0,0.10,0],palette.bun,16);
    for(let i=0;i<6;i++) {
      const a=i/6*Math.PI*2;
      const fold=sphere(g,[0.031,0.069,0.025],[Math.cos(a)*0.053,0.215,Math.sin(a)*0.053],palette.paper,10);
      fold.rotation.z=-Math.cos(a)*0.33;fold.rotation.x=Math.sin(a)*0.33;
    }
    return g;
  }

  function steamer(parent,x,z,radius=0.29,withBuns=true) {
    const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);g.name='Bamboo steamer';
    const profile=[[0,0],[radius*0.87,0],[radius,0.045],[radius,0.25],[radius*0.90,0.25],[radius*0.88,0.06],[0,0.06]];
    const geometry=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),24);
    mesh(g,geometry,palette.bambooBasket);
    for(const y of [0.04,0.22]) {
      const ring=mesh(g,new THREE.TorusGeometry(radius,0.020,6,24),palette.basketRim,[0,y,0]);ring.rotation.x=Math.PI/2;
    }
    for(let i=0;i<12;i++) {
      const a=i/12*Math.PI*2;
      rod(g,[Math.cos(a)*radius,0.065,Math.sin(a)*radius],[Math.cos(a)*radius,0.205,Math.sin(a)*radius],0.008,palette.basketRim,4);
    }
    if(withBuns) dumpling(g,[0,0.085,0],Math.min(radius/0.26,1.2));
    return g;
  }

  function roofGeometry(width,depth) {
    const nx=16,nz=12,p=[],uv=[],ix=[];
    for(let iz=0;iz<=nz;iz++) for(let i=0;i<=nx;i++) {
      const x=(i/nx-0.5)*width,z=(iz/nz-0.5)*depth;
      const q=Math.abs(z)/(depth/2),tip=Math.pow(Math.abs(x)/(width/2),7);
      p.push(x,0.51*(1-q)+0.09*q*q*q+0.15*tip*q,z);uv.push(i/nx,iz/nz);
      if(i<nx&&iz<nz){const k=iz*(nx+1)+i;ix.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
  }
  palette.roof.side=THREE.DoubleSide;
  function stall(title,x,z,rotation,color,occupants) {
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;g.name=title;world.add(g);
    obstacles.push({type:'box',x,z,halfX:1.79,halfZ:1.07,rotation});
    const paint=color==='blue'?palette.blue:palette.green;
    box(g,[3.55,0.21,2.12],[0,0.10,0],palette.stoneEdge);
    box(g,[3.21,0.38,1.83],[0,0.35,0],palette.wood);
    box(g,[3.25,0.055,1.87],[0,0.565,0],palette.woodEdge);
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      box(g,[0.11,2.37,0.11],[sx*1.52,1.72,sz*0.84],paint);
      box(g,[0.19,0.075,0.19],[sx*1.52,2.88,sz*0.84],paint);
    }
    for(const zSide of [-0.84,0.84]) {
      box(g,[3.20,0.105,0.11],[0,0.66,zSide],paint);
      box(g,[3.18,0.08,0.10],[0,2.54,zSide],paint);
    }
    const bannerMat=new THREE.MeshStandardMaterial({map:signTexture(title,color==='blue'?'#165f78':'#245d3e'),roughness:1,side:THREE.DoubleSide});
    mesh(g,new THREE.PlaneGeometry(2.88,0.40),bannerMat,[0,2.32,0.851],'Hand-painted stall sign');
    mesh(g,roofGeometry(3.65,2.21),palette.roof,[0,2.69,0],'Curved pavilion roof');
    rod(g,[-1.86,3.20,0],[1.86,3.20,0],0.030,palette.roof);
    for(const sx of [-1,1]) {
      const bulbMat=new THREE.MeshStandardMaterial({color:'#f5e4a0',emissive:'#ffbb54',emissiveIntensity:0.12,roughness:0.8});
      const lantern=cylinder(g,0.10,0.23,[sx*1.58,2.51,0.91],bulbMat,12);
      cylinder(g,0.113,0.044,[sx*1.58,2.65,0.91],paint,12);
      lanterns.push(lantern);
    }
    occupants.forEach((role,i)=>{
      const xPos=occupants.length===1?0:(i-0.5)*1.13;
      const panda=addPanda(g,[xPos,0.595,0.08],0.25,role,color==='blue'?'#1b6685':'#205c40');
    });
    return g;
  }
  const stalls=[
    stall(options.live?'Steamers':'Steamed',-5.2,0.6,0.18,'blue',['vendor','vendor']),
    stall(options.live?'Front of House':'Tea House',5.2,0.6,-0.18,'blue',['vendor']),
    stall(options.live?'Tea':'Tea Garden',-7.15,5.3,0.12,'green',['gardener']),
    stall(options.live?'Pantry':'Dumplings',7.15,5.3,-0.12,'green',['vendor']),
  ];

  // Round central table, dark serving tray, and six tiny bamboo baskets.
  const table=new THREE.Group();table.position.set(0,0,3.25);table.name='Dim sum table';world.add(table);
  for(let i=0;i<4;i++) {
    const a=i/4*Math.PI*2+Math.PI/4;
    cylinder(table,0.105,0.99,[Math.sin(a)*1.84,0.50,Math.cos(a)*1.84],palette.woodEdge,8);
  }
  cylinder(table,2.53,0.15,[0,1.045,0],palette.wood,64);
  cylinder(table,2.50,0.040,[0,1.136,0],palette.wood,64);
  cylinder(table,1.67,0.025,[0,1.173,0],palette.tray,64);
  const serving=new THREE.Group();serving.position.y=1.19;table.add(serving);
  const basketPositions=[[-1.0,-0.38],[-0.65,-0.98],[-0.1,-1.17],[-1.12,0.45],[-0.38,1.03],[1.13,0.42]];
  if(!options.live) basketPositions.forEach(([x,z],i)=>{
    const basket=steamer(serving,x,z,0.26,true);
    if(i<3) {
      const g=new THREE.Group();g.position.set(x,0.36,z);serving.add(g);
      const sm=new THREE.MeshBasicMaterial({color:'#fff9dd',transparent:true,opacity:0.12,depthWrite:false});
      for(let j=0;j<2;j++) {
        const curve=new THREE.CatmullRomCurve3([v([j*0.09,0,0]),v([0.06+j*0.09,0.21,0.02]),v([-0.03+j*0.09,0.44,0]),v([0.07+j*0.09,0.63,0.04])]);
        const ribbon=mesh(g,new THREE.TubeGeometry(curve,16,0.012,5,false),sm);
        ribbon.castShadow=false;steam.push({node:g,material:sm,phase:i+j});
      }
    }
  });
  const frontBasket=steamer(world,-2.75,6.15,0.77,false);
  frontBasket.scale.y=1.5;
  cylinder(frontBasket,0.675,0.025,[0,0.07,0],palette.basketRim,32);
  for(let i=-3;i<=3;i++) {
    const x=i*0.16,span=Math.sqrt(Math.max(0,0.67*0.67-x*x));
    box(frontBasket,[0.028,0.012,span*2],[x,0.09,0],palette.wood);
  }

  // Small abacus / tally sign at the front of the clearing.
  const tally=new THREE.Group();tally.position.set(2.62,0,6.05);tally.rotation.x=-0.06;tally.name='Tally abacus';world.add(tally);
  box(tally,[1.50,1.64,0.11],[0,1.00,0],palette.book);
  box(tally,[1.32,1.45,0.025],[0,1.00,0.070],palette.paper);
  const titleMap=texture((ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#6e5339';ctx.font='48px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Tally',w/2,h/2);
  },256,80);
  mesh(tally,new THREE.PlaneGeometry(0.7,0.22),new THREE.MeshBasicMaterial({map:titleMap,transparent:true}),[0,1.58,0.092]);
  for(const x of [-0.52,0.52]) box(tally,[0.095,0.27,0.10],[x,0.14,0],palette.book);
  const teal=matte('#177d80');
  for(let row=0;row<5;row++) {
    const y=1.36-row*0.225;
    rod(tally,[-0.59,y,0.12],[0.59,y,0.12],0.016,palette.book,8);
    const beads=[];
    for(let j=0;j<10;j++) {
      const bead=sphere(tally,[0.042,0.063,0.041],[-0.49+j*0.107,y,0.14],palette.woodEdge.clone(),10);
      beads.push(bead);
    }
    tallyRows.push(beads);
  }

  for(const {x,label:title} of [PADS.product,PADS.architect]) {
    const pad=cylinder(world,1.08,0.03,[x,0.028,-6.8],matte('#c7cbb0'),32);
    const rim=mesh(world,new THREE.TorusGeometry(1.075,0.020,6,48),palette.basketRim,[x,0.055,-6.8]);
    rim.rotation.x=Math.PI/2;pad.castShadow=false;
    label(title,[x,0.25,-6.8]);
    obstacles.push({type:'circle',x,z:-6.8,radius:0.36});
  }
  obstacles.push({type:'ellipse',x:0,z:-1.25,rx:2.9,rz:2.7});
  obstacles.push({type:'circle',x:0,z:3.25,radius:2.55});
  obstacles.push({type:'circle',x:-2.75,z:6.15,radius:0.79});
  obstacles.push({type:'box',x:2.62,z:6.05,halfX:0.78,halfZ:0.22,rotation:0});

  // Three ground-level pandas follow clear loops, with occasional sniffing rests.
  const roamers=[];
  let roamingEnabled=true;
  if(createWalkingBao) {
    const routes=options.live ? [
      {cellType:'developer',x:-4.15,z:4.0,rx:0.65,rz:1.35,angle:0,scale:0.30,speed:0.31},
      {cellType:'scout',x:-4.15,z:4.0,rx:0.65,rz:1.35,angle:Math.PI,scale:0.30,speed:0.31},
      {cellType:'qa',x:4.15,z:4.0,rx:0.65,rz:1.35,angle:0,scale:0.30,speed:0.31},
      {cellType:'security',x:4.15,z:4.0,rx:0.65,rz:1.35,angle:Math.PI,scale:0.30,speed:0.31},
      {cellType:'designer',x:0.15,z:7.80,rx:1.10,rz:0.46,angle:Math.PI,scale:0.30,speed:0.28},
    ] : [
      {x:-4.15,z:4.0,rx:0.65,rz:1.35,angle:0,scale:0.32,speed:0.34},
      {x:4.15,z:4.0,rx:0.65,rz:1.35,angle:Math.PI,scale:0.32,speed:0.32},
      {x:0.15,z:7.80,rx:1.10,rz:0.46,angle:Math.PI,scale:0.30,speed:0.28},
    ];
    for(let i=0;i<routes.length;i++){
      const route=routes[i],panda=createWalkingBao(THREE,createBao,options.pandaSettings);
      route.speed*=options.pandaSettings?.speed ?? 0.85;
      panda.model.name='Roaming Bao '+(i+1);panda.model.scale.setScalar(route.scale);
      panda.model.position.set(route.x+Math.cos(route.angle)*route.rx,0,route.z+Math.sin(route.angle)*route.rz);
      panda.model.rotation.y=Math.atan2(-route.rx*Math.sin(route.angle),route.rz*Math.cos(route.angle));
      world.add(panda.model);pandas.push(panda);
      roamers.push({panda,route,cellType:route.cellType,phase:i/3,strength:0,pause:0,nextPause:5+i*6});
    }
  }
  // Residents have no ticket identity. Live figures are keyed by the board's refs.
  const residentRoles=['product','architect','developer','scout','designer','qa','security'];
  pandas.slice(1,8).forEach((p,i)=>{p.model.userData.cellType=residentRoles[i];crew.set(residentRoles[i],p);});
  if(options.live) for(const type of ['developer','scout','designer','qa','security'])crew.get(type).model.visible=false;
  const colors={orchestrator:'#594681',product:'#594681',architect:'#594681',developer:'#1b6685',scout:'#1b6685',designer:'#1b6685',qa:'#205c40',security:'#205c40'};
  function parentFor(placement){
    return placement.parent.startsWith('stall:')?stalls[Number(placement.parent.slice(6))]:world;
  }
  function createTicketPanda(cellType,placement){
    const look={product:'librarian',architect:'drummer',qa:'gardener'}[cellType]||'vendor';
    const p=addPanda(parentFor(placement),placement.position,placement.scale,look,colors[cellType]||'#594681');
    p.model.userData.cellType=cellType;
    return p;
  }
  function placeTicketPanda(p,placement){
    const parent=parentFor(placement);
    if(p.model.parent!==parent)parent.add(p.model);
    p.model.position.set(...placement.position);p.model.scale.setScalar(placement.scale);
  }
  function removeTicketPanda(p){
    p.mixer.stopAllAction();p.mixer.uncacheRoot(p.model);
    const geometries=new Set(),ownMaterials=new Set(Object.values(p.materials));
    p.model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)ownMaterials.add(m);});
    p.model.removeFromParent();
    for(const g of geometries)g.dispose();
    const textures=new Set();
    for(const m of ownMaterials){for(const t of Object.values(m))if(t?.isTexture)textures.add(t);m.dispose();}
    for(const t of textures)t.dispose();
    p.skeleton.dispose();
    pandas.splice(pandas.indexOf(p),1);mixers.splice(mixers.indexOf(p.mixer),1);
  }
  function setFrontier(refs){
    const wanted=new Set(refs.slice(0,8));
    for(const [ref,g] of frontier)if(!wanted.has(ref)){
      g.traverse(o=>o.geometry?.dispose());g.removeFromParent();frontier.delete(ref);
    }
    let index=0;
    for(const ref of wanted){
      let g=frontier.get(ref);
      if(!g){g=steamer(serving,0,0,0.26,true);g.userData.ticketRef=ref;frontier.set(ref,g);}
      const a=index++/wanted.size*Math.PI*2;
      g.position.set(Math.sin(a)*1.23,0,Math.cos(a)*1.23);
    }
  }
  function setTally(rods){
    const colors={'qi':'#177d80','alarm':'#bd3826','station-steamers':'#2759a2'};
    for(let row=0;row<tallyRows.length;row++)for(let j=0;j<10;j++){
      const rod=rods?.[row],count=Math.max(0,Math.min(10,rod?.counted||0)),on=j>=10-count;
      tallyRows[row][j].material.color.set(on?(colors[rod.color]||'#177d80'):'#835b33');
      tallyRows[row][j].position.x=on?0.49-(9-j)*0.075:-0.49+j*0.075;
    }
  }
  function setRoaming(enabled){roamingEnabled=enabled;}
  function updateRoamers(delta,time,player){
    for(let i=0;i<roamers.length;i++){
      const r=roamers[i],p=r.panda.model.position;
      if(!r.panda.model.visible)continue;
      const near=player&&Math.hypot(player.x-p.x,player.z-p.z)<1.0;
      r.pause=Math.max(0,r.pause-delta);
      if(time>=r.nextPause){r.pause=2.5+i*0.4;r.nextPause=time+16+i*3;}
      const moving=roamingEnabled&&r.pause<=0&&!near;
      r.strength=THREE.MathUtils.damp(r.strength,moving?1:0,4,delta);
      if(moving){
        const before=p.clone(),route=r.route;
        const arc=Math.hypot(route.rx*Math.sin(route.angle),route.rz*Math.cos(route.angle));
        const nextAngle=route.angle+route.speed*r.strength*delta/Math.max(arc,0.1);
        const nx=route.x+Math.cos(nextAngle)*route.rx,nz=route.z+Math.sin(nextAngle)*route.rz;
        const occupied=roamers.some(other=>other!==r&&other.panda.model.visible&&Math.hypot(nx-other.panda.model.position.x,nz-other.panda.model.position.z)<0.78);
        if(!occupied){route.angle=nextAngle;p.set(nx,0,nz);}else{r.strength=THREE.MathUtils.damp(r.strength,0,5,delta);}
        const yaw=Math.atan2(-route.rx*Math.sin(route.angle),route.rz*Math.cos(route.angle));
        const difference=Math.atan2(Math.sin(yaw-r.panda.model.rotation.y),Math.cos(yaw-r.panda.model.rotation.y));
        r.panda.model.rotation.y+=difference*(1-Math.exp(-7*delta));
        r.phase+=before.distanceTo(p)/(route.scale*r.panda.stride)*r.panda.duty;
      }
      r.panda.update(delta,time,r.phase,r.strength);
      if(near&&r.strength<0.15){
        const yaw=Math.atan2(player.x-p.x,player.z-p.z)-r.panda.model.rotation.y;
        const turn=THREE.MathUtils.clamp(Math.atan2(Math.sin(yaw),Math.cos(yaw)),-0.45,0.45);
        r.panda.bones.Head.quaternion.setFromEuler(new THREE.Euler(0.02,turn,0));
      }
    }
  }

  function update(delta,time,player = null) {
    for(const mixer of mixers) mixer.update(delta);
    updateRoamers(delta,time,player);
    for(const s of steam) {
      s.node.position.y=0.36+0.04*Math.sin(time*0.65+s.phase);
      s.material.opacity=0.09+0.045*Math.sin(time*0.6+s.phase);
    }
  }
  function setLabels(visible){for(const l of labels)l.visible=visible;}
  function setLanterns(warm){for(const l of lanterns)l.material.emissiveIntensity=warm?1.9:0.12;}
  function dispose(){
    for(let i=0;i<mixers.length;i++){mixers[i].stopAllAction();}
    for(const r of roamers){r.panda.mixer.stopAllAction();r.panda.mixer.uncacheRoot(r.panda.model);}
    const geometries=new Set(),materials=new Set(),textures=new Set();
    world.traverse(o=>{
      if(o.geometry)geometries.add(o.geometry);
      const list=Array.isArray(o.material)?o.material:[o.material];
      for(const m of list)if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}
    });
    for(const g of geometries)g.dispose();
    for(const m of materials)m.dispose();
    for(const t of textures)t.dispose();
    for(const p of pandas)p.skeleton.dispose();
  }
  world.updateMatrixWorld(true);
  return {world,hero,pandas,mixers,stalls,labels,roamers,obstacles,crew,frontier,tallyRows,createTicketPanda,placeTicketPanda,removeTicketPanda,setFrontier,setTally,update,setRoaming,setLabels,setLanterns,dispose};
}
