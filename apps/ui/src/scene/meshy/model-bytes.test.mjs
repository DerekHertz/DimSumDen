import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { decodeModelBytes } from './model-bytes.mjs';

test('browser decompression restores every GLB byte and accepts already decoded HTTP data',async()=>{
 const original=Buffer.from('glTF\0\u0001\u0002 exact vertices, UVs and texture bytes');
 const compressed=gzipSync(original);
 const bytes=compressed.buffer.slice(compressed.byteOffset,compressed.byteOffset+compressed.byteLength);
 const decoded=await decodeModelBytes(bytes);
 assert.deepEqual(Buffer.from(decoded),original);
 assert.equal(await decodeModelBytes(decoded),decoded);
});
test('the actual Bao model decodes as a complete GLB without a worker codec',async()=>{
 const compressed=await readFile(new URL('../../../public/den/models/bao.glb.gz',import.meta.url));
 const bytes=compressed.buffer.slice(compressed.byteOffset,compressed.byteOffset+compressed.byteLength);
 const decoded=Buffer.from(await decodeModelBytes(bytes));
 assert.equal(decoded.readUInt32LE(0),0x46546c67);
 assert.equal(decoded.readUInt32LE(8),decoded.length);
});
