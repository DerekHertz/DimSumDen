// Shared by the procedural den tests: a stub canvas document and a helper that builds the live den and tears it down.
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from './walking-bao.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { createLiveDenController } from './controller.mjs';

export function canvasDocument() {
  return {createElement:()=>({width:0,height:0,getContext:()=>new Proxy({
    createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    measureText:t=>({width:t.length*20}),
  },{get:(target,key)=>key in target?target[key]:(()=>{})})})};
}
export function withDen(run) {
  const previous=globalThis.document;globalThis.document=canvasDocument();
  let den,controller;
  try {
    den=createDenScene(THREE,createBao,createWalkingBao,{live:true});
    for(const p of den.pandas)compactPanda(THREE,p);
    compactEnvironment(THREE,den);
    controller=createLiveDenController(den,{onCreate:p=>compactPanda(THREE,p)});
    run(den,controller);
  }finally{controller?.dispose();den?.dispose();globalThis.document=previous;}
}
