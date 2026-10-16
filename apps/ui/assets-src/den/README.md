# Approved forest Den asset pack

Current checkpoint: **packaging is not release-ready**. The coherent uncompressed
geometry package is about 99.75 MiB before frontend JavaScript/CSS, so the complete
UI will exceed the unchanged 100 MiB release limit. Source geometry checks pass;
full browser loading and final release size verification remain pending.

The 36 GLBs under `apps/ui/public/den/models/` are regular self-contained files.
The frontend loads them through `/den/manifest.json`; it does not depend on the
original prototype server, mounted Windows folders, credentials, or generation
receipts. The manifest lists public URLs, canonical role IDs, source basenames,
triangle counts, embedded texture sizes, byte counts, and SHA-256 hashes.

The pack contains the approved Balanced Bao, ten original/generated garden
structures, three new workspace assets, bamboo, the ancient grove and forest
gate, all 14 original role-tool sets, and five wardrobe assets. Security reuses
the fitted Developer vest with the approved jade recolor and frog closure in
scene code. The rejected whole-panda Security generation and old hats are not
included. The older plum grove and procedural entrance are replaced by the
approved forest assets.

`sources.json` is an offline provenance catalog relative to the original
artifact folder. `pack-audit.json` records source hashes, image resizing and
per-file validation. Neither file is included in the public output.

Rebuild only when the original artifact folder is available:

```sh
python3 apps/ui/assets-src/den/pack-assets.py /path/to/original-artifact-folder
python3 -m unittest discover -s apps/ui/assets-src/den -p 'test_*.py'
```

The original folder contains `bao-customizer/` and `frontend-layout-mockup/`.
Python 3 and Pillow are needed only for this offline authoring step. Normal UI
builds use the checked-in files and require no Python dependency.

The packager preserves every vertex, normal, UV, node transform, material map,
and triangle index value. Where indices fit in 16 bits, it narrows their storage
without changing their values. Images are resized to the existing preview's
upload limits: 1,024 pixels for Bao/scenery/wardrobe and 512 for role tools.
Opaque color maps use high-quality WebP where smaller; transparency, normal and
packed PBR maps use PNG or lossless WebP. Existing JPEG maps remain JPEG when
that is the smallest encoding. WebP uses `EXT_texture_webp`, supported by the
application's bundled GLTFLoader and current browsers. Every output is reopened, image-decoded, bounds-checked, and
compared against its source geometry before the manifest is written.

Generated through the user's existing Meshy workflow and supplied source
assets; packaging itself makes no network or paid API calls.

`compress-geometry.mjs` is a saved, experimental lossless Draco authoring step;
it is **not active in the checked-in GLBs**. Sequential encoding preserved exact
sample bytes and triangle indices for initial assets, but some source meshes
contain duplicate vertices that Draco merges even with quantization disabled.
The helper now skips an asset when any count/sample/index comparison fails.
No final full-pack compressed size has been verified. The normal DRACOLoader
creates blob workers that the current bridge CSP refuses; resolve that without
changing bridge security policy before enabling compressed geometry. Broader
metalness/roughness-map removal was explicitly declined; preserve active maps.
