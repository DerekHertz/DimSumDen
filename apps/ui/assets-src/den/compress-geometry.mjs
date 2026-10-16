#!/usr/bin/env node
// Offline, lossless Draco storage. The checked-in GLBs are build inputs.
// Every scalar and triangle index must round-trip exactly, in authored order.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const output=process.argv[2]||path.resolve(here,'../../public/den');
const require=createRequire(import.meta.url);
const threeRoot=path.resolve(path.dirname(require.resolve('three')),'..');
const codecRoot=path.join(threeRoot,'examples/jsm/libs/draco/gltf');
async function factory(name){
 const filename=path.join(codecRoot,name),module={exports:{}};
 vm.runInNewContext(await readFile(filename,'utf8'),{module,exports:module.exports,require,process,console,Buffer,setTimeout,clearTimeout,__dirname:codecRoot,__filename:filename,TextDecoder,TextEncoder},{filename});
 return module.exports;
}
function parse(raw){
 if(raw.readUInt32LE(0)!==0x46546c67||raw.readUInt32LE(4)!==2||raw.readUInt32LE(8)!==raw.length)throw Error('Invalid GLB header');
 const size=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+size));
 if(raw.readUInt32LE(16)!==0x4e4f534a||raw.readUInt32LE(24+size)!==0x004e4942)throw Error('Expected JSON/BIN GLB');
 return {doc,bin:raw.subarray(28+size)};
}
function viewBytes(doc,bin,index){const v=doc.bufferViews[index];return bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);}
function accessor(doc,bin,index){
 const a=doc.accessors[index],v=doc.bufferViews[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
 const bytes={5121:1,5123:2,5125:4,5126:4}[a.componentType],stride=components*bytes;
 if(!components||!bytes||a.sparse||v.byteStride&&v.byteStride!==stride)throw Error('Asset requires an explicit accessor adapter');
 const raw=viewBytes(doc,bin,a.bufferView).subarray(a.byteOffset||0,(a.byteOffset||0)+a.count*stride);
 const values= a.componentType===5126 ? new Float32Array(a.count*components) : new Uint32Array(a.count*components);
 for(let i=0;i<values.length;i++)values[i]=a.componentType===5126?raw.readFloatLE(i*bytes):bytes===2?raw.readUInt16LE(i*bytes):bytes===1?raw.readUInt8(i):raw.readUInt32LE(i*bytes);
 return {a,values,raw,components};
}
function glb(doc,views){
 const parts=[];let offset=0;
 doc.bufferViews=views.map(raw=>{const pad=(4-offset%4)%4;if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}const v={buffer:0,byteOffset:offset,byteLength:raw.length};parts.push(raw);offset+=raw.length;return v;});
 doc.buffers=[{byteLength:offset}];const pad=(4-offset%4)%4;if(pad)parts.push(Buffer.alloc(pad));const bin=Buffer.concat(parts);
 let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)]);
 const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length,0);binHeader.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([header,json,binHeader,bin]);
}
function encode(doc,bin,enc,dec){
 if(doc.meshes.length!==1||doc.meshes[0].primitives.length!==1||doc.skins?.length||doc.animations?.length)throw Error('Expected one static approved primitive');
 const primitive=doc.meshes[0].primitives[0],mesh=new enc.Mesh(),builder=new enc.MeshBuilder(),encoder=new enc.Encoder(),data=new enc.DracoInt8Array();
 const originals=[],attributes={};const types={POSITION:enc.POSITION,NORMAL:enc.NORMAL,TEXCOORD_0:enc.TEX_COORD};
 try{
  for(const [name,index] of Object.entries(primitive.attributes)){
   const original=accessor(doc,bin,index);if(original.a.componentType!==5126||types[name]===undefined)throw Error('Unexpected attribute type');
   attributes[name]=builder.AddFloatAttributeToMesh(mesh,types[name],original.a.count,original.components,original.values);
   originals.push({name,index,...original});
  }
  const indices=accessor(doc,bin,primitive.indices);builder.AddFacesToMesh(mesh,indices.values.length/3,indices.values);
  encoder.SetSpeedOptions(0,5);encoder.SetEncodingMethod(enc.MESH_SEQUENTIAL_ENCODING);
  for(const type of Object.values(types))encoder.SetAttributeQuantization(type,0);
  const length=encoder.EncodeMeshToDracoBuffer(mesh,data);if(!length)throw Error('Draco encoding failed');
  const bytes=new Int8Array(length);for(let i=0;i<length;i++)bytes[i]=data.GetValue(i);
  // Validate decoded values before removing any original buffer views.
  const decoder=new dec.Decoder(),buffer=new dec.DecoderBuffer(),decoded=new dec.Mesh(),face=new dec.DracoInt32Array();
  try{
   buffer.Init(bytes,bytes.length);const status=decoder.DecodeBufferToMesh(buffer,decoded);
   try{if(!status.ok()||decoded.num_points()!==originals[0].a.count||decoded.num_faces()*3!==indices.values.length)throw Error(`Draco topology/count mismatch: vertices ${decoded.num_points()}/${originals[0].a.count}, indices ${decoded.num_faces()*3}/${indices.values.length}`);}finally{dec.destroy(status);}
   for(const original of originals){
    const attribute=decoder.GetAttributeByUniqueId(decoded,attributes[original.name]),values=new dec.DracoFloat32Array();
    try{
     decoder.GetAttributeFloatForAllPoints(decoded,attribute,values);if(values.size()!==original.values.length)throw Error('Decoded attribute count mismatch');
     const raw=Buffer.alloc(original.raw.length);for(let i=0;i<values.size();i++)raw.writeFloatLE(values.GetValue(i),i*4);
     if(!raw.equals(original.raw))throw Error(`${original.name} failed exact byte round-trip`);
    }finally{dec.destroy(values);}
   }
   for(let i=0;i<decoded.num_faces();i++){decoder.GetFaceFromMesh(decoded,i,face);for(let k=0;k<3;k++)if(face.GetValue(k)!==indices.values[i*3+k])throw Error('Triangle index/order changed');}
  }finally{dec.destroy(face);dec.destroy(decoded);dec.destroy(buffer);dec.destroy(decoder);}
  const compressed=structuredClone(doc),p=compressed.meshes[0].primitives[0];
  const extension='KHR_draco_mesh_compression';p.extensions={...p.extensions,[extension]:{bufferView:0,attributes}};
  for(const key of ['extensionsUsed','extensionsRequired'])if(!compressed[key]?.includes(extension))compressed[key]=[...(compressed[key]||[]),extension];
  const geometryViews=new Set([...Object.values(primitive.attributes),primitive.indices].map(i=>doc.accessors[i].bufferView));
  for(const index of [...Object.values(p.attributes),p.indices]){delete compressed.accessors[index].bufferView;delete compressed.accessors[index].byteOffset;}
  const views=[Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength)],remap=new Map();
  for(let i=0;i<doc.bufferViews.length;i++)if(!geometryViews.has(i)){remap.set(i,views.length);views.push(viewBytes(doc,bin,i));}
  for(const image of compressed.images)image.bufferView=remap.get(image.bufferView);
  if(views.length!==compressed.images.length+1)throw Error('Unexpected non-image buffer view');
  return glb(compressed,views);
 }finally{enc.destroy(data);enc.destroy(encoder);enc.destroy(builder);enc.destroy(mesh);}
}
const enc=(await factory('draco_encoder.js'))(),dec=await (await factory('draco_decoder.js'))();
const manifestPath=path.join(output,'manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const receiptPath=path.join(here,'pack-audit.json'),receipt=JSON.parse(await readFile(receiptPath,'utf8'));
let saved=0;
for(const [key,asset] of Object.entries(manifest.assets)){
 const filename=path.join(output,asset.url.replace(/^\/den\//,'')),raw=await readFile(filename),{doc,bin}=parse(raw);
 if(doc.extensionsUsed?.includes('KHR_draco_mesh_compression'))throw Error('Rebuild the uncompressed package before compressing again');
 let compressed,reason;
 try{compressed=encode(doc,bin,enc,dec);}catch(error){reason=error.message;compressed=raw;}
 const use=compressed.length<raw.length;
 receipt.assets[key].geometryCompression={codec:use?'Draco sequential':'uncompressed',quantizationBits:0,exactVertexNormalUvBytes:use||undefined,exactTriangleIndicesAndOrder:use||undefined,uncompressedBytes:raw.length,compressedBytes:compressed.length,...(reason?{compressionSkipped:reason}:{})};
 if(use){await writeFile(filename,compressed);saved+=raw.length-compressed.length;asset.bytes=compressed.length;asset.sha256=createHash('sha256').update(compressed).digest('hex');asset.geometryCompression='KHR_draco_mesh_compression';}
 console.log(`${key}: ${(asset.bytes/1048576).toFixed(2)} MiB, ${use?'lossless Draco':'uncompressed is smaller'}`);
}
const decoderDirectory=path.join(output,'draco');await mkdir(decoderDirectory,{recursive:true});
for(const name of ['draco_decoder.js','draco_wasm_wrapper.js','draco_decoder.wasm'])await copyFile(path.join(codecRoot,name),path.join(decoderDirectory,name));
await copyFile('/usr/share/common-licenses/Apache-2.0',path.join(decoderDirectory,'LICENSE.txt'));
await writeFile(path.join(decoderDirectory,'NOTICE.txt'),'Draco 3D compression, Copyright The Draco Authors.\nBundled from the installed Three.js package (examples/jsm/libs/draco/gltf).\nLicensed under the Apache License, Version 2.0. See LICENSE.txt.\n');
manifest.bytes=Object.values(manifest.assets).reduce((n,a)=>n+a.bytes,0);
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
console.log(`Saved ${(saved/1048576).toFixed(2)} MiB; GLBs ${(manifest.bytes/1048576).toFixed(2)} MiB.`);
