import {createRoot} from 'react-dom/client';
import {SceneLab} from '../scene/procedural/SceneLab.jsx';
const seed=document.getElementById('review-seed');
if(seed){try{globalThis.__DIM_SUM_REVIEW__=JSON.parse(seed.textContent);}catch{}}
globalThis.__REVIEW_DOCUMENT__='<!doctype html>'+document.documentElement.outerHTML;
globalThis.__REVIEW_IS_STANDALONE__=!Array.from(document.scripts).some(script=>script.src);
createRoot(document.getElementById('root')).render(<SceneLab/>);
