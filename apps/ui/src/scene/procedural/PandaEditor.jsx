import { useState } from 'react';
import { DEFAULT_PANDA_SETTINGS, PANDA_CONTROLS, savePandaSettings } from './panda-settings.mjs';

export function PandaEditor({settings,onApply}) {
  const [draft,setDraft]=useState(settings),[message,setMessage]=useState('');
  const apply=value=>{onApply(value);setMessage(savePandaSettings(value)?'Applied to all walking pandas. Saved on this device.':'Applied for this visit. Device storage is unavailable.');};
  return <div className="panda-editor">
    <p>Shape their silhouette and soften the walk. Changes apply to every four-legged resident.</p>
    {PANDA_CONTROLS.map(([key,label,min,max,step])=><label key={key} className="panda-slider"><span>{label}<output>{draft[key].toFixed(2)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={draft[key]} onChange={e=>setDraft({...draft,[key]:Number(e.target.value)})}/></label>)}
    <div className="panda-editor-actions"><button type="button" onClick={()=>apply(draft)}>Apply to pandas</button><button type="button" onClick={()=>{setDraft({...DEFAULT_PANDA_SETTINGS});apply({...DEFAULT_PANDA_SETTINGS});}}>Reset</button></div>
    <p role="status">{message}</p>
  </div>;
}
