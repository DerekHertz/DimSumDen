// Offline authoring: one cached headshot of the actual approved Bao model.
// The profile panel uses this PNG, never fourteen extra WebGL canvases.
import * as THREE from 'three';
import {loadModel,fit,disposeWorld} from '../../src/scene/meshy/assets.mjs';

export async function renderPortrait(){
 const canvas=document.createElement('canvas');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setSize(512,512);renderer.setPixelRatio(1);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene(),body=fit(await loadModel('/den/models/bao.glb.gz'),{height:3});
 scene.add(body,new THREE.HemisphereLight('#fff8ec','#8caa96',1.6));
 const light=new THREE.DirectionalLight('#fff5e6',2.5);light.position.set(-3,5,6);scene.add(light);
 const fill=new THREE.DirectionalLight('#e4f1ff',.8);fill.position.set(3,3,3);scene.add(fill);
 const camera=new THREE.OrthographicCamera(-.775,.775,.775,-.775,.1,20);
 camera.position.set(0,2.5,6);camera.lookAt(0,2.5,0);
 renderer.render(scene,camera);
 const result=canvas.toDataURL('image/png');
 disposeWorld(body);renderer.dispose();renderer.forceContextLoss();
 return result;
}
