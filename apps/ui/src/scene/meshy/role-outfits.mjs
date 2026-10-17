import * as T from 'three';
import {createRoleHeadwear} from './role-headwear.mjs';
import {box,cyl,orb,line} from './garden.mjs';

// Shared fits and fixed role IDs keep the resident, visitor and cached portrait in agreement.
export const ROLE_OUTFITS = Object.freeze([
  ['orchestrator','vest','#d9d3bd','bao-cap'], ['product','scarf','#668f83',null],
  ['architect','vest','#59656b','scholar-cap'], ['developer','vest','#456b9a',null],
  ['scout','vest','#b89c60','goggles'], ['debugger','scarf','#637c8d',null],
  ['qa','scarf','#92a483',null], ['security','vest','#35564f',null],
  ['designer','scarf','#94758b','lotus-beret'], ['herald','scarf','#b5594b',null],
  ['release-manager','vest','#b97a53','festival-band'], ['knowledge-keeper','vest','#487a80','archive-hat'],
  ['docs-writer','scarf','#59678b',null], ['stem-cub','vest','#9aafc6','nightcap'],
].map(([id,clothing,color,headwear])=>Object.freeze({id,clothing,color,headwear})));

function recolor(clone,color,flat=false) {
  clone.traverse(node=>{
    if(!node.isMesh)return;
    if(node.parent?.name==='Security · local frog closure')return;
    const recolorMaterial=source=>{
      const copy=source.clone();
      if(flat){copy.map=null;copy.color.set(color);}
      else{
        const tint=new T.Color(color);copy.color.set('#ffffff');
        copy.onBeforeCompile=shader=>{
          shader.uniforms.wardrobeTint={value:tint};
          shader.fragmentShader=shader.fragmentShader
            .replace('#include <common>','#include <common>\nuniform vec3 wardrobeTint;')
            .replace('#include <map_fragment>','#include <map_fragment>\nfloat wardrobeLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));\ndiffuseColor.rgb=wardrobeTint*mix(.65,1.25,wardrobeLuma);');
        };
        copy.customProgramCacheKey=()=> 'role-outfit-fabric';
      }
      return copy;
    };
    node.material=Array.isArray(node.material)?node.material.map(recolorMaterial):recolorMaterial(node.material);
  });
}

function roleAccessories(group,id) {
  const material=color=>new T.MeshStandardMaterial({color,roughness:.82});
  const gold=material('#c3a367'),ink=material('#39494b');
  if(['product','knowledge-keeper'].includes(id)){
    for(const x of[-.255,.255]){const frame=new T.Mesh(new T.TorusGeometry(.165,.014,6,32),gold);frame.position.set(x,2.555,.588);group.add(frame);}
    line(group,[[-.085,2.56,.60],[0,2.575,.62],[.085,2.56,.60]],.012,gold);
  }
  if(id==='architect')cyl(group,.018,.32,gold,[.60,2.72,.13],8).rotation.z=-.24;
  if(id==='orchestrator')orb(group,.06,ink,[.64,2.6,.05],[.5,1,1]);
  if(id==='herald'){line(group,[[.63,2.57,.1],[.62,2.36,.44],[.38,2.28,.62]],.018,ink);orb(group,.045,ink,[.38,2.28,.62]);}
  if(id==='debugger'){box(group,[.12,.17,.06],ink,[.52,2.04,.66]);box(group,[.075,.07,.015],gold,[.52,2.06,.70]);}
  if(id==='stem-cub')orb(group,.05,gold,[.35,1.95,.73],[1,.75,.2]);
  const used=new Set();group.traverse(node=>{if(node.isMesh)used.add(node.material);});
  if(!used.has(gold))gold.dispose();if(!used.has(ink))ink.dispose();
}

/** Clone the fitted template, sharing geometry and textures; only tint materials differ. */
export function createRoleOutfit(roleId,{vest,scarf,securityVest,headphones}={}) {
  const spec=ROLE_OUTFITS.find(row=>row.id===roleId);
  if(!spec)throw Error('Unknown role outfit: '+roleId);
  const template=spec.clothing==='scarf'?scarf:roleId==='security'&&securityVest?securityVest:vest;
  if(!template)throw Error('Missing fitted '+spec.clothing+' template for '+roleId);
  const group=new T.Group();group.name='Role outfit · '+roleId;
  const garment=template.clone(true);recolor(garment,spec.color,spec.clothing==='scarf');
  group.add(garment);
  const headwear=createRoleHeadwear(roleId);if(headwear)group.add(headwear);
  roleAccessories(group,roleId);
  if(roleId==='developer'){
    if(!headphones)throw Error('Missing fitted Developer headphones');
    group.add(headphones.clone(true));
  }
  group.userData={outfitRole:roleId,clothing:spec.clothing,headwear:spec.headwear};
  return group;
}

/** Existing Meshy wardrobe loading creates just these four fitted templates once. */
export function completeRoleOutfits(den) {
  const resident=id=>den.residents.children.find(person=>person.userData.roleId===id);
  const templates={vest:resident('developer')?.getObjectByName('Wardrobe · developer-vest'),
    scarf:resident('qa')?.getObjectByName('Wardrobe · qa-scarf'),
    securityVest:resident('security')?.getObjectByName('Wardrobe · security-vest'),
    headphones:resident('developer')?.getObjectByName('Wardrobe · developer-headphones')};
  const staged=ROLE_OUTFITS.map(spec=>{
    const person=resident(spec.id);if(!person)throw Error('Missing role resident: '+spec.id);
    return {person,outfit:createRoleOutfit(spec.id,templates)};
  });
  for(const template of Object.values(templates))template?.removeFromParent();
  for(const{person,outfit}of staged)person.add(outfit);
  den.roleOutfits={loaded:ROLE_OUTFITS.map(spec=>spec.id),headwear:ROLE_OUTFITS.filter(spec=>spec.headwear).map(spec=>spec.id)};
  return den.roleOutfits;
}
