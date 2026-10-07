import {pandaSettings} from '../scene/procedural/panda-settings.mjs';
import {normalizeFit} from './traditional-props.mjs';
export const REVIEW_KEY='dimsum-local-review-v2';
export function normalizeReview(raw){
  if(!raw||raw.format!=='dim-sum-den-review'||raw.version!==2)throw new Error('Choose a Dim Sum Den review JSON exported from this artifact.');
  const notes=(Array.isArray(raw.notes)?raw.notes:[]).slice(0,200).map((n,i)=>({
    id:String(n.id||i).slice(0,80),label:String(n.label||'Comment').slice(0,100),text:String(n.text||'').slice(0,4000),
    view:['scene','characters','walking'].includes(n.view)?n.view:'characters',role:String(n.role||'orchestrator').slice(0,60),sample:String(n.sample||'morning').slice(0,30),direction:['teahouse','scholar','traveler'].includes(n.direction)?n.direction:'traveler',
    point:Array.isArray(n.point)&&n.point.length===3&&n.point.every(Number.isFinite)?n.point:[0,2,0],part:String(n.part||'Character').slice(0,100),
    settings:pandaSettings(n.settings),fit:normalizeFit(n.fit),camera:validCamera(n.camera),
  }));
  const placements=Object.create(null);for(const [key,value]of Object.entries(raw.placements||{}).slice(0,100))placements[key.slice(0,100)]=normalizeFit(value);
  return {format:'dim-sum-den-review',version:2,notes,placements,settings:pandaSettings(raw.settings),view:['scene','characters','walking'].includes(raw.view)?raw.view:'characters',role:String(raw.role||'orchestrator'),sample:String(raw.sample||'morning'),direction:['teahouse','scholar','traveler'].includes(raw.direction)?raw.direction:'traveler'};
}
export function validCamera(raw){return raw&&['position','target'].every(k=>Array.isArray(raw[k])&&raw[k].length===3&&raw[k].every(n=>Number.isFinite(n)&&Math.abs(n)<1000))?{position:[...raw.position],target:[...raw.target]}:null;}
export function loadReview(){try{const seed=globalThis.__DIM_SUM_REVIEW__;if(seed)return normalizeReview(seed);const stored=localStorage.getItem(REVIEW_KEY);return stored?normalizeReview(JSON.parse(stored)):null;}catch{return null;}}
export function saveReview(value){try{localStorage.setItem(REVIEW_KEY,JSON.stringify(value));return true;}catch{return false;}}
export function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function reviewHtml(source,review){
  // Escape '<' so user comments cannot terminate the JSON script element.
  const json=JSON.stringify(review).replace(/</g,'\\u003c');
  // Split at the real document head first, so literals inside the inline bundle can never match.
  const at=source.indexOf('<head>');if(at<0)throw new Error('The original artifact is unavailable.');
  const prefix=source.slice(0,at+6);
  const rest=source.slice(at+6).replace(/^\s*<script id="review-seed"[^>]*>[\s\S]*?<\/script>/,'');
  return prefix+'<script id="review-seed" type="application/json">'+json+'</script>'+rest;
}
