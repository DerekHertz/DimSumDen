import { useState } from 'react';
import { DEFAULT_PANDA_SETTINGS, PANDA_CONTROLS, savePandaSettings } from './panda-settings.mjs';

export function PandaEditor({settings,onApply}) {
  const [message,setMessage]=useState('');
  const change=value=>{onApply(value);setMessage('Preview updated. Save to keep these settings.');};
  const save=()=>setMessage(savePandaSettings(settings)?'Saved to this local review only.':'Storage is unavailable; export a review to keep your settings.');
  return <div className="panda-editor">
    <p>Drag a slider to change the model immediately. Shape controls work while paused; gait controls work while walking.</p>
    {PANDA_CONTROLS.map(([key,label,min,max,step])=><label key={key} className="panda-slider"><span>{label}<output>{settings[key].toFixed(2)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={settings[key]} onChange={e=>change({...settings,[key]:Number(e.target.value)})}/></label>)}
    <div className="panda-editor-actions"><button type="button" onClick={save}>Save settings</button><button type="button" onClick={()=>change({...DEFAULT_PANDA_SETTINGS})}>Reset shape</button></div>
    <p role="status">{message}</p>
  </div>;
}
