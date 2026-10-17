// Offline authoring only: the runtime panel displays these cached WebP files.
import * as T from 'three';
import {loadManifest,loadModel,fit,disposeWorld} from '../../src/scene/meshy/assets.mjs';
import {fitRoleAsset} from '../../src/scene/meshy/role-wardrobe.mjs';
import {ROLE_OUTFITS,createRoleOutfit} from '../../src/scene/meshy/role-outfits.mjs';

function placeTool(object,at){
  object.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3());
  object.position.set(-center.x,-bounds.min.y,-center.z);
  const anchor=new T.Group();anchor.position.fromArray(at);anchor.add(object);return anchor;
}

export async function renderRolePortraits(onImage){
  const assets=await loadManifest();
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(512,512);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff8ec','#b1c8b6',1.8));
  const light=new T.DirectionalLight('#fff5e6',2.3);light.position.set(-3,5,6);scene.add(light);
  const fill=new T.DirectionalLight('#e4f1ff',.8);fill.position.set(3,3,3);scene.add(fill);
  const camera=new T.OrthographicCamera(-1.39,1.39,1.39,-1.39,.1,20);camera.position.set(0,2.04,6);camera.lookAt(0,2.04,0);
  const originals=[];
  try{
    const body=fit(await loadModel(assets.bao.url),{height:3});originals.push(body);
    body.traverse(node=>{if(node.isMesh)node.receiveShadow=false;});
    const vestSource=await loadModel(assets['wardrobe.developer-vest'].url);
    const scarfSource=await loadModel(assets['wardrobe.qa-scarf'].url);
    const phoneSource=await loadModel(assets['wardrobe.developer-headphones'].url);
    const templates={vest:fitRoleAsset(vestSource,'developer-vest'),scarf:fitRoleAsset(scarfSource,'qa-scarf'),
      securityVest:fitRoleAsset(vestSource,'security-vest'),headphones:fitRoleAsset(phoneSource,'developer-headphones')};
    originals.push(vestSource,scarfSource,phoneSource,...Object.values(templates));
    const sharedGeometry=new Set(),sharedMaterials=new Set();
    for(const template of Object.values(templates))template.traverse(node=>{if(node.isMesh){sharedGeometry.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])sharedMaterials.add(material);}});
    for(const spec of ROLE_OUTFITS){
      const actor=new T.Group(),outfit=createRoleOutfit(spec.id,templates),tools=new T.Group();
      actor.add(body,outfit,tools);scene.add(actor);
      if(spec.id==='developer'){
        const boba=fit(await loadModel(assets['wardrobe.developer-boba'].url),{height:.64});tools.add(placeTool(boba,[-.89,1.03,1.55]));
        const tablet=fit(await loadModel(assets['wardrobe.developer-tablet'].url),{width:.68,height:.78});tablet.rotation.x=.15;tools.add(placeTool(tablet,[.86,1.05,1.55]));
      }else{
        const item=fit(await loadModel(assets['props.'+spec.id].url),{width:.8,height:.65,depth:.55});item.rotation.y=-.12;
        item.rotation.x=({qa:.8,designer:.8,architect:.55,'docs-writer':.35,scout:.35,'knowledge-keeper':.25}[spec.id]||0);
        tools.add(placeTool(item,[.72,1.03,1.55]));
      }
      scene.updateMatrixWorld(true);renderer.render(scene,camera);
      await onImage(spec.id,renderer.domElement.toDataURL('image/webp',.92));
      body.removeFromParent();disposeWorld(tools);
      outfit.traverse(node=>{
        if(!node.isMesh)return;
        if(!sharedGeometry.has(node.geometry))node.geometry.dispose();
        for(const material of Array.isArray(node.material)?node.material:[node.material])if(!sharedMaterials.has(material))material.dispose();
      });
      actor.removeFromParent();
    }
    return {count:ROLE_OUTFITS.length,format:'512px cached WebP',newPaidAssets:0};
  }finally{
    const resources=new T.Group();for(const original of originals)resources.add(original);
    disposeWorld(resources);renderer.dispose();renderer.forceContextLoss();
  }
}
