"""Verify BRD-06 WebP files. Requires Pillow."""
import hashlib
import json
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parents[2] / "prototype/games/co-ty-phu/assets"
manifest = json.loads((assets / "asset-manifest.json").read_text(encoding="utf-8"))
entries = {entry["file"]: entry for entry in manifest["files"]}

for name, size, limit in (
    ("board-co-ty-phu.webp", (1024, 1024), 200_000),
    ("poster-co-ty-phu.webp", (960, 640), 120_000),
):
    path = assets / name
    data = path.read_bytes()
    with Image.open(path) as webp:
        assert webp.size == size and webp.mode == "RGB", name
        assert data[12:16] == b"VP8L", f"{name}: expected lossless WebP"
        width, height = size
        pixels = webp.load()
        matched = sum(
            pixels[x, y] == pixels[x+1, y] == pixels[x, y+1] == pixels[x+1, y+1]
            for y in range(0, height, 2) for x in range(0, width, 2)
        )
        grid = 100 * matched / ((width // 2) * (height // 2))
        colors = len(webp.getcolors(maxcolors=width * height))
    assert grid >= 99 and colors <= 96 and len(data) <= limit, name
    assert entries[name]["bytes"] == len(data), name
    assert entries[name]["sha256"] == hashlib.sha256(data).hexdigest(), name
    print(f"{name}: {width}x{height} | {len(data):,} bytes | {colors} colors | {grid:.2f}% 2x grid")

tiles = manifest["board"]["tiles"]
assert len(tiles) == 40
assert {(tile["row"], tile["column"]) for tile in tiles} == {
    (row, col) for row in range(11) for col in range(11)
    if row in (0, 10) or col in (0, 10)
}
print("40 board tiles with unique perimeter positions")
