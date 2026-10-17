"""Integrity tests for the offline GLB packager; run with python3 -m unittest."""

import copy
import importlib.util
import io
import json
import struct
import tempfile
import unittest
from pathlib import Path

from PIL import Image

SPEC = importlib.util.spec_from_file_location("pack_assets", Path(__file__).with_name("pack-assets.py"))
PACK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACK)


def fixture(path, rgba=False):
    image = Image.new("RGBA" if rgba else "RGB", (8, 4), (40, 140, 100, 110) if rgba else (40, 140, 100))
    encoded = io.BytesIO()
    image.save(encoded, "PNG")
    views = [struct.pack("<9f", 0, 0, 0, 1, 0, 0, 0, 1, 0),
             struct.pack("<9f", 0, 0, 1, 0, 0, 1, 0, 0, 1),
             struct.pack("<6f", 0, 0, 1, 0, 0, 1), struct.pack("<3I", 0, 1, 2), encoded.getvalue()]
    doc = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": 0}],
           "bufferViews": [{"buffer": 0, "byteLength": len(raw)} for raw in views],
           "accessors": [{"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3", "min": [0, 0, 0], "max": [1, 1, 0]},
                         {"bufferView": 1, "componentType": 5126, "count": 3, "type": "VEC3"},
                         {"bufferView": 2, "componentType": 5126, "count": 3, "type": "VEC2"},
                         {"bufferView": 3, "componentType": 5125, "count": 3, "type": "SCALAR"}],
           "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 3, "material": 0}]}],
           "nodes": [{"mesh": 0, "translation": [2, 0, -1]}], "scenes": [{"nodes": [0]}], "scene": 0,
           "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
           "textures": [{"source": 0}], "images": [{"bufferView": 4, "mimeType": "image/png"}]}
    PACK.write_glb(path, doc, views)


class PackAssetsTests(unittest.TestCase):
    def test_pack_preserves_geometry_and_self_containment(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixture(root / "source.glb")
            record, receipt = PACK.pack_asset({"key": "props.qa", "source": "source.glb", "kind": "prop", "roleId": "qa", "maxTextureSize": 4}, root, root / "out")
            self.assertEqual(record["url"], "/den/models/props/qa.glb.gz")
            self.assertEqual(record["triangles"], 1)
            self.assertEqual((record["textures"][0]["width"], record["textures"][0]["height"]), (4, 2))
            self.assertIn(record["textures"][0]["mimeType"], {"image/png", "image/jpeg", "image/webp"})
            self.assertEqual(receipt["narrowedIndexAccessors"], [3])
            doc, binary, _ = PACK.read_glb(root / "out/models/props/qa.glb.gz")
            self.assertEqual(doc["accessors"][3]["componentType"], 5123)
            self.assertEqual(PACK.index_values(doc, binary, 3), (0, 1, 2))
            self.assertEqual(doc["nodes"][0]["translation"], [2, 0, -1])
            self.assertTrue(all(view["byteOffset"] % 4 == 0 for view in doc["bufferViews"]))
            self.assertNotIn(str(root), json.dumps(record))

    def test_transparent_color_map_retains_lossless_alpha(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixture(root / "source.glb", rgba=True)
            record, _ = PACK.pack_asset({"key": "vegetation.bamboo", "source": "source.glb", "kind": "vegetation", "maxTextureSize": 4}, root, root / "out")
            self.assertIn(record["textures"][0]["mimeType"], {"image/png", "image/webp"})
            doc, binary, _ = PACK.read_glb(root / "out/models/vegetation/bamboo.glb.gz")
            image = Image.open(io.BytesIO(PACK.view_bytes(doc, binary, doc["images"][0]["bufferView"])))
            self.assertEqual(image.mode, "RGBA")
            self.assertEqual(image.getextrema()[3], (110, 110))
            if record["textures"][0]["mimeType"] == "image/webp":
                self.assertIn("EXT_texture_webp", doc["extensionsRequired"])
                self.assertEqual(doc["textures"][0]["extensions"]["EXT_texture_webp"]["source"], 0)
                self.assertNotIn("source", doc["textures"][0])

    def test_audit_rejects_modified_uv_samples(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.glb"
            fixture(path)
            doc, binary, _ = PACK.read_glb(path)
            changed = bytearray(binary)
            offset = doc["bufferViews"][2]["byteOffset"]
            struct.pack_into("<f", changed, offset, 0.25)
            with self.assertRaisesRegex(ValueError, "UV"):
                PACK.audit_pair(doc, binary, copy.deepcopy(doc), changed)

    def test_catalog_contains_approved_unique_assets_and_all_role_tools(self):
        catalog = json.loads(Path(__file__).with_name("sources.json").read_text())["assets"]
        self.assertEqual(len(catalog), 36)
        self.assertEqual(len({a["key"] for a in catalog}), 36)
        active = [a for a in catalog if a.get("runtime") is not False]
        self.assertEqual(len(active), 22)
        self.assertFalse(any(a["key"].startswith("scenery.") for a in active))
        roles = {a["roleId"] for a in catalog if a["kind"] == "prop"}
        self.assertEqual(roles, {"orchestrator", "product", "architect", "developer", "scout", "debugger", "qa", "security", "designer", "herald", "release-manager", "knowledge-keeper", "docs-writer", "stem-cub"})
        self.assertFalse(any("security-vest-preview" in a["source"] or "/hat-" in a["source"] for a in catalog))


if __name__ == "__main__":
    unittest.main()
