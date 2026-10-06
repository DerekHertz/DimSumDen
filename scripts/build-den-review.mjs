import {build} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const output=resolve('apps/ui/review-dist/review/index.html');
await build({configFile:resolve('apps/ui/review.vite.config.mjs')});
let html=await readFile(output,'utf8');
for(const match of [...html.matchAll(/<script\b([^>]*?)src="([^"]+)"([^>]*)><\/script>/g)]){
  const path=resolve('apps/ui/review-dist',match[2].replace(/^\//,''));
  const js=(await readFile(path,'utf8')).replace(/<\/script/gi,'<\\/script');
  html=html.replace(match[0],()=>'<script type="module">'+js+'</script>');
}
for(const match of [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]){
  const css=await readFile(resolve('apps/ui/review-dist',match[1].replace(/^\//,'')),'utf8');
  html=html.replace(match[0],()=>'<style>'+css+'</style>');
}
html=html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g,'');
const artifact=resolve('apps/ui/review-dist/DimSumDen-review.html');
await mkdir(dirname(artifact),{recursive:true});await writeFile(artifact,html);
console.log('Offline review artifact: apps/ui/review-dist/DimSumDen-review.html');
