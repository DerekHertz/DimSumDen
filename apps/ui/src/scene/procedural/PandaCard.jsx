import { useEffect, useRef } from 'react';
import { Detail } from '../../panel/Panel.jsx';

export function PandaCard({snapshot,selected,onClose}) {
  const card=useRef(null),heading=useRef(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    heading.current?.focus({preventScroll:true});
    const el=card.current;
    const keys=e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close.current();}};
    el?.addEventListener('keydown',keys);
    return ()=>el?.removeEventListener('keydown',keys);
  },[selected]);
  if(!selected)return null;
  return <section ref={card} className="panda-detail card" role="dialog" aria-modal="false" aria-labelledby="panda-detail-title">
    <header className="panda-detail-head">
      <h2 id="panda-detail-title" ref={heading} tabIndex={-1}>Ticket details</h2>
      <button type="button" className="btn btn-outline" onClick={onClose} aria-label="Close ticket details">Close</button>
    </header>
    <div className="panda-detail-body"><Detail snapshot={snapshot} selected={selected} /></div>
  </section>;
}
