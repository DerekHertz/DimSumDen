// Gzip changes storage only: the browser restores the exact audited GLB before
// Three parses it. No worker, codec download, eval or CSP exception is required.
export async function decodeModelBytes(bytes) {
 const header=new Uint8Array(bytes,0,Math.min(bytes.byteLength,2));
 if(header[0]!==0x1f||header[1]!==0x8b)return bytes;
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).arrayBuffer();
}
export async function readModelBytes(url) {
 const response=await fetch(url);
 if(!response.ok)throw Error(`A garden model could not load (${response.status}).`);
 return decodeModelBytes(await response.arrayBuffer());
}
