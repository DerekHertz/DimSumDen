import {ZONES,INTERACTIONS,LIVE_ROLES} from './zone-contract.mjs';
const list=v=>Array.isArray(v)?v:[];
const ended=new Set(['done','failed','terminated']);
const priority={'needs-you':5,blocked:4,working:3,complete:2,idle:1};
const firstByState=rows=>rows.reduce((a,b)=>(priority[b.state]??0)>(priority[a?.state]??0)?b:a,null);
/** Supply actors from the repository's liveActorsFromSnapshot(snapshot), not a parallel SSE reducer. */
export function viewFromBridge({snapshot=null,actors=[],library=null,connection={phase:'connecting'},selectedRef=null,selectedDeliveryId=null,now=Date.now()}={}){
 const available=connection.phase==='live'&&!!snapshot;
 const tickets=list(snapshot?.tickets),agents=list(snapshot?.agents),approvals=list(snapshot?.approvals),deliveries=list(snapshot?.deliveries);
 const repairActors=list(actors).filter(a=>['developer','qa'].includes(a.role));
 const pending=approvals.filter(a=>(a.status??a.state??'pending')==='pending'&&!(Date.parse(a.expiresAt??'')<=now)&&agents.some(agent=>agent.id===a.agentId&&!ended.has(agent.state)&&agent.capabilities?.approve===true));
 const repairWait=pending.filter(a=>agents.some(g=>g.id===a.agentId&&['developer','qa'].includes(g.role)));
 const best=firstByState(repairActors),ref=selectedRef&&tickets.some(t=>t.ref===selectedRef)?selectedRef:best?.ref??null;
 const active=deliveries.filter(d=>['running','paused'].includes(d.state));
 const delivery=deliveries.find(d=>d.id===selectedDeliveryId)??active.find(d=>d.state==='paused'&&d.pause?.kind!=='no-room')??active.at(-1)??deliveries.at(-1)??null;
 const deliveryState=delivery?.state==='merged'?'complete':delivery?.state==='paused'?(delivery.pause?.kind==='no-room'?'blocked':'needs-you'):delivery?.state==='running'?'working':'idle';
 const connectionRows=list(library?.connections),skills=list(library?.skills);
 const badConnection=connectionRows.some(c=>['failed','needs-sign-in','unavailable'].includes(c.status?.state));
 const libraryState=library==null?'unavailable':badConnection?'blocked':connectionRows.some(c=>c.status?.state==='starting')?'working':'idle';
 const repairState=repairWait.length?'needs-you':best?.state??'idle';
 const zones={
  repair:{state:repairState,label:repairState==='needs-you'?'YOUR ANSWER IS NEEDED':repairState==='blocked'?'REPAIR IS BLOCKED':best?'REPAIR IN PROGRESS':'NO REPAIR RUNNING',count:repairActors.length,ref,role:best?.role??'developer',pendingApprovalIds:repairWait.map(a=>a.id)},
  archive:{state:libraryState,label:library?`${skills.length} RECIPES · ${connectionRows.length} LINKS`:'LIBRARY NOT LOADED',count:skills.length,connections:connectionRows,skills},
  release:{state:deliveryState,label:delivery?.state==='merged'?'MERGED · READY TO SERVE':delivery?.state==='paused'?(delivery.pause?.kind==='no-room'?'WAITING FOR CAPACITY':'DELIVERY NEEDS YOU'):delivery?.state==='running'?`DELIVERY · ${String(delivery.step??'starting').toUpperCase()}`:'NO DELIVERY RUNNING',deliveryId:delivery?.id??null,ref:delivery?.ref??null,delivery},
  pond:{state:'idle',label:'A MOMENT BY THE WATER'},balance:{state:'idle',label:'TRY THE BALANCE YARD'},festival:{state:'idle',label:'PICNIC OR FESTIVAL'}
 };
 if(!available)for(const id of ['repair','archive','release']){zones[id]={...zones[id],state:'unavailable',label:connection.phase==='reconnecting'?'RECONNECTING · LAST KNOWN DATA':connection.phase==='offline'?'BRIDGE OFFLINE':'CONNECTING TO BRIDGE'};}
 return {version:1,seq:snapshot?.seq??null,available,connection:connection.phase,zones,pendingApprovals:pending,context:{ref,deliveryId:delivery?.id??null},leisureIsLocal:true};
}
/** A click opens an existing UI panel or a local activity; never starts a run or delivery. */
export function interactionIntent(id,view){
 const action=INTERACTIONS.find(a=>a.id===id);if(!action)return null;
 const z=view.zones[action.zone];const intent={...action,ref:z?.ref??null,deliveryId:z?.deliveryId??null};
 if(action.intent==='open-ticket'&&!intent.ref){intent.intent='open-role';intent.role='developer';}
 intent.available=['discover','leisure'].includes(intent.intent)||view.available;
 intent.reason=intent.available?null:'The bridge is not live yet.';
 return intent;
}
export function routeInteraction(id,view,handlers={}){
 const intent=interactionIntent(id,view);if(!intent)return null;if(!intent.available){handlers.onUnavailable?.(intent);return intent;}
 const handler={'open-ticket':'onOpenTicket','open-role':'onOpenRole','open-library':'onOpenLibrary','open-delivery':'onOpenDelivery',discover:'onDiscover',leisure:'onLeisure'}[intent.intent];handlers[handler]?.(intent);return intent;
}
/** Explicit button actions only. Reuse createBridgeClient({fetch: session.fetch}); no automatic retries. */
export function createZoneCommands({client,getContext}){
 let disposed=false;const inflight=new Set();
 async function call(key,run){if(disposed)throw Error('Zone commands are disposed.');const ctx=getContext();if(ctx.demo||!ctx.signedIn||ctx.connection!=='live')throw Error(ctx.demo?'Demo actions are off.':'A live steering session is required.');if(inflight.has(key))throw Error('This action is already pending.');inflight.add(key);try{return await run(ctx);}finally{inflight.delete(key);}}
 const role=r=>{if(!LIVE_ROLES.includes(r))throw Error('This role is a visual concept, not a live bridge role.');return r;};
 return {
  startTask:(r,text)=>call('task:'+role(r),()=>client.startTask(r,{text})),
  converse:(r,text,runId)=>call('talk:'+role(r),()=>client.converse(r,{text,runId})),
  deliver:ref=>call('deliver:'+ref,ctx=>{if(!ref||!list(ctx.snapshot?.tickets).some(t=>t.ref===ref))throw Error('Choose an existing ticket.');return client.deliver({ref});}),
  decide:(id,decision,note)=>call('approval:'+id,ctx=>{if(!['allow','deny'].includes(decision))throw Error('Decision must be allow or deny.');const a=list(ctx.snapshot?.approvals).find(a=>a.id===id);const agent=list(ctx.snapshot?.agents).find(g=>g.id===a?.agentId);if(!a||(a.status??a.state??'pending')!=='pending'||Date.parse(a.expiresAt??'')<=Date.now()||!agent||ended.has(agent.state)||agent.capabilities?.approve!==true)throw Error('This permission request cannot be answered.');return client.decide(id,{decision,note});}),
  steerDelivery:(id,action,verdict)=>call('delivery:'+id,ctx=>{const d=list(ctx.snapshot?.deliveries).find(d=>d.id===id);if(!d)throw Error('Choose an existing delivery.');if(!['resume','stop','close'].includes(action))throw Error('Unknown delivery action.');if(action==='resume'&&d.state!=='paused'||action==='stop'&&d.state!=='running'||action==='close'&&d.state!=='paused')throw Error('This delivery changed; refresh before acting.');if(d.pause?.kind==='visual-verdict'&&action==='resume'&&verdict!=='approve')throw Error('The visual verdict must be explicitly approved.');return client.steerDelivery(id,action,{verdict});}),
  isPending:key=>inflight.has(key),dispose(){disposed=true;}
 };
}
export {ZONES,INTERACTIONS};
