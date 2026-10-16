// Internal visual check of the built UI under the real preview CSP. The data is
// a quiet test fixture; no session, steering handler or live transcript is used.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPreview } from '../../../bridge/build/preview.mjs';
import { buildLaunchOptions } from '../../../ci-cd/launch-options.mjs';

const root=fileURLToPath(new URL('../../../../',import.meta.url));
const output=process.argv[2];if(!output)throw Error('Pass an output folder for screenshots.');
await mkdir(output,{recursive:true});
const snapshot={schema:1,seq:0,tickets:[],frontier:[],agents:[],cells:[],approvals:[],transcripts:{},requests:[],meetings:[],deliveries:[],sessions:[],usage:null};
const json=value=>(req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
const preview=await openPreview({id:'forest-visual-fixture',dir:root,reads:{
 '/state':json(snapshot),'/library':json({connections:[],skills:[]}),
 '/events':(req,res)=>{res.writeHead(200,{'Content-Type':'text/event-stream'});res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);},
}});
const browser=await chromium.launch(buildLaunchOptions());
try{
 const results=[];
 for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',colorScheme:'light'});
 await context.addInitScript(()=>{
  HTMLCanvasElement.prototype.requestPointerLock=undefined;
  window.__renderFixture=false;window.__freezeFixture=false;window.__actualDraws=0;
  for(const name of ['WebGLRenderingContext','WebGL2RenderingContext']){
   const proto=window[name]?.prototype;if(!proto)continue;
   for(const call of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced','drawRangeElements']){
    const original=proto[call];if(!original)continue;
    proto[call]=function(...args){if(window.__renderFixture){window.__actualDraws++;return original.apply(this,args);}};
   }
  }
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>{
   const tick=()=>{
    if(window.__freezeFixture)return setTimeout(tick,100);
    raf(time=>{const before=window.__actualDraws;callback(time);if(window.__renderFixture&&window.__actualDraws>before)window.__freezeFixture=true;});
   };
   return setTimeout(tick,250);
  };
  window.cancelAnimationFrame=handle=>clearTimeout(handle);
 });
 const page=await context.newPage(),errors=[],violations=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)failed.push({url:new URL(response.url()).pathname,status:response.status()});});
 page.on('console',message=>{if(message.type()==='error'&&!message.text().startsWith('Failed to load resource:'))errors.push(message.text().slice(0,300));});
 await page.exposeFunction('reportViolation',message=>violations.push(message));
 await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>window.reportViolation(event.violatedDirective+': '+event.blockedURI)));
 await page.goto(preview.url);
 await page.waitForFunction(()=>document.querySelector('.den-entry button')&&!document.querySelector('.den-entry button').hasAttribute('aria-disabled'),null,{timeout:30000}).catch(async error=>{console.log(JSON.stringify({errors,violations,failed,page:await page.locator('body').innerText()}));throw error;});
  await page.evaluate(()=>{window.__renderFixture=true;window.__freezeFixture=false;});
  // The fixture deliberately pauses RAF after its first complete GL frame;
  // poll from a timer so the assertion does not pause with that frame.
  await page.waitForFunction(()=>window.__freezeFixture,null,{timeout:30000,polling:100});
  await page.screenshot({path:path.join(output,`forest-${name}-fixture.png`),fullPage:true,timeout:30000});
  await page.getByRole('navigation',{name:'Workspace'}).getByRole('button',{name:'Pandas',exact:true}).click();
  await page.locator('.forest-profile').waitFor({state:'visible'});
  await page.screenshot({path:path.join(output,`forest-${name}-profiles.png`),fullPage:true,timeout:30000});
  if(name==='desktop'){
   await page.locator('.den-entry button[aria-pressed]').click();
   await page.evaluate(()=>{window.__freezeFixture=false;});
   await page.waitForFunction(()=>window.__freezeFixture,null,{timeout:30000,polling:100});
   await page.screenshot({path:path.join(output,'forest-walking-entry.png'),fullPage:true,timeout:30000});
  }
 const draws=await page.evaluate(()=>window.__actualDraws);
 const unexpected=failed.filter(row=>!['/metrics','/favicon.ico'].includes(row.url));
 if(errors.length||violations.length||unexpected.length||!draws)throw Error(JSON.stringify({errors,violations,unexpected,draws}));
 results.push({name,errors,violations,actualDrawCalls:draws});
 await context.close();
 }
 console.log(JSON.stringify({results,output}));
}finally{await browser.close();await preview.close();}
