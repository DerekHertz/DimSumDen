import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const ui=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({
  root:ui,
  publicDir:false,
  oxc:{jsx:{runtime:'automatic'}},
  plugins:[{name:'local-review-entry',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/'||req.url?.startsWith('/?'))req.url='/review/index.html';next();});}}],
  server:{port:5174,strictPort:true,fs:{allow:[fileURLToPath(new URL('../../',import.meta.url))]}},
  build:{outDir:fileURLToPath(new URL('./review-dist',import.meta.url)),emptyOutDir:true,rolldownOptions:{input:fileURLToPath(new URL('./review/index.html',import.meta.url)),output:{codeSplitting:false}}},
});
