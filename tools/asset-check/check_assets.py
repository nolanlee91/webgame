#!/usr/bin/env python3
"""Kiểm asset game theo hợp đồng docs/<game>/asset-spec.json. Codex chạy TRƯỚC khi giao asset.

  python -I tools/asset-check/check_assets.py docs/tiem-tra-sua/asset-spec.json [--preview <thư mục>]

Kiểm: file tồn tại và khớp manifest · lưới điểm vẽ (2× / 1×) · alpha cứng · đủ frame bắt buộc, đúng cỡ ô và anchor ·
chân nhân vật chạm anchor · chiều cao nhân vật đồng đều trong cùng vai / cùng nhóm · clip trỏ tới frame có thật ·
toạ độ đặt đồ (placements) nằm trong cảnh. --preview: ảnh xếp hàng nhân vật trên nền cảnh để soi bằng mắt
(tỉ lệ so với cảnh, cùng một người giữa các sheet).
Thoát mã 1 nếu có LỖI. Chỉ cần Pillow.
"""
import json, re, sys, statistics
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
errors, warns = [], []
def err(m): errors.append(m)
def warn(m): warns.append(m)

def expand(pat):
    """'{vip,reviewer}-walk-{1..4}' → 8 tên."""
    m = re.search(r"\{([^{}]+)\}", pat)
    if not m: return [pat]
    body = m.group(1)
    r = re.fullmatch(r"(\d+)\.\.(\d+)", body)
    opts = [str(i) for i in range(int(r.group(1)), int(r.group(2)) + 1)] if r else body.split(",")
    out = []
    for o in opts: out += expand(pat[:m.start()] + o + pat[m.end():])
    return out

def grid_mismatch(im, g):
    if g <= 1: return 0.0
    w, h = im.size
    if w % g or h % g: return 100.0
    rt = im.resize((w // g, h // g), Image.NEAREST).resize((w, h), Image.NEAREST)
    a, b = im.tobytes(), rt.tobytes()
    px = len(a) // 4
    bad = sum(1 for i in range(0, len(a), 4) if a[i:i + 4] != b[i:i + 4] and (a[i + 3] or b[i + 3]))
    return 100.0 * bad / px

def main():
    try: sys.stdout.reconfigure(encoding="utf-8")  # Windows console cp1252
    except Exception: pass
    args = sys.argv[1:]
    if not args: print(__doc__); sys.exit(2)
    spec_path = Path(args[0]); preview = Path(args[args.index("--preview") + 1]) if "--preview" in args else None
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    root = ROOT / spec["root"]
    man_path = root / spec.get("manifest", "data/asset-manifest.json")
    manifest = json.loads(man_path.read_text(encoding="utf-8"))
    items = {it["filename"]: it for it in manifest.get("items", [])}
    # Định dạng Nông Trại (assets/v3/manifest.json): {"sheets": {alias: {file, frames:[{id,x,y,width,height,anchor}], animations}}}
    base_dir = spec.get("sheetDir", "")
    for alias, sh in (manifest.get("sheets") or {}).items():
        fn = base_dir + sh["file"]
        try: dims = list(Image.open(root / fn).size)
        except Exception: dims = []
        anims = {}
        for k, a in (sh.get("animations") or {}).items():  # chỉ kiểm clip dạng danh sách tên frame; dạng khác (chỉ số khung) bỏ qua
            fr = a.get("frames") if isinstance(a, dict) else a
            if isinstance(fr, list) and all(isinstance(f, str) for f in fr):
                anims[k] = {"frames": fr, "fps": (a.get("fps") if isinstance(a, dict) else None) or sh.get("fps") or 1}
        items[fn] = {"filename": fn, "dimensions": dims, "frames": {f["id"]: {"rect": [f["x"], f["y"], f["width"], f["height"]], "anchor": f.get("anchor", [0, 0])} for f in sh.get("frames", [])}, "animations": anims}
    dflt = spec.get("defaults", {})
    scene_w, scene_h = spec.get("scene", [1280, 720])
    heights = {}   # (group, role) -> [(sheet, frame, h)]
    lineup = []    # (sheet, frame, img crop, anchor)

    for sh in spec["sheets"]:
        f = sh["file"]; tag = f"[{f}]"
        g = sh.get("grid", dflt.get("grid", 2))
        p = root / f
        if not p.exists():
            (warn if sh.get("optional") else err)(f"{tag} thiếu file" + (" (tuỳ chọn)" if sh.get("optional") else ""))
            continue
        im = Image.open(p).convert("RGBA")
        it = items.get(f)
        if not it: err(f"{tag} chưa khai báo trong manifest {man_path.name}"); continue
        if list(it.get("dimensions", [])) != list(im.size): err(f"{tag} manifest ghi {it.get('dimensions')} nhưng file là {list(im.size)}")
        mm = grid_mismatch(im, g)
        if mm > 0.2: err(f"{tag} không đúng lưới {g}× ({mm:.1f}% điểm lệch). Mỗi điểm vẽ phải là ô {g}×{g} px, không phóng to mượt.")
        if sh.get("hardAlpha", dflt.get("hardAlpha", True)):
            hist = im.getchannel("A").histogram(); semi = sum(hist[1:255]); tot = im.size[0] * im.size[1]
            if semi > tot * 0.001: err(f"{tag} alpha không cứng: {semi} px bán trong suốt (cần 0 hoặc 255)")
        frames = it.get("frames", {})
        want = [n for pat in sh.get("frames", []) for n in expand(pat)]
        cell, anchor = sh.get("cell"), sh.get("anchor")
        for name in want:
            fr = frames.get(name)
            if not fr:
                (warn if sh.get("framesOptional") else err)(f"{tag} thiếu frame '{name}'"); continue
            x, y, w, h = fr["rect"]; ax, ay = fr["anchor"]
            if cell and [w, h] != list(cell): err(f"{tag} '{name}' ô {w}×{h}, cần {cell[0]}×{cell[1]}")
            if anchor and [ax, ay] != list(anchor): err(f"{tag} '{name}' anchor {[ax, ay]}, cần {anchor}")
            if x < 0 or y < 0 or x + w > im.size[0] or y + h > im.size[1]: err(f"{tag} '{name}' rect ra ngoài ảnh"); continue
            if g > 1 and any(v % g for v in (x, y, w, h)): err(f"{tag} '{name}' rect {fr['rect']} không chia hết cho {g} (lệch lưới)")
            crop = im.crop((x, y, x + w, y + h)); bb = crop.getchannel("A").getbbox()
            if not bb: err(f"{tag} '{name}' trống"); continue
            if sh.get("role") == "character":
                fig_h = bb[3] - bb[1]
                if abs(bb[3] - ay) > sh.get("footTolerance", 6): err(f"{tag} '{name}' chân ở y={bb[3]} nhưng anchor y={ay} (lệch {bb[3] - ay} px)")
                mn, mx = sh.get("figureHeight", [0, 10 ** 6])
                if not (mn <= fig_h <= mx): err(f"{tag} '{name}' nhân vật cao {fig_h} px, cần {mn}–{mx} px")
                role = name.split("-")[0] if "-" in name else name
                role = sh.get("roleMap", {}).get(role, role)
                heights.setdefault(role, []).append((f, name, fig_h))
                lineup.append((f, name, crop, (ax, ay)))
        for an, a in it.get("animations", {}).items():
            miss = [n for n in a.get("frames", []) if n not in frames]
            if miss: err(f"{tag} clip '{an}' trỏ tới frame không có: {miss}")
            if not a.get("fps"): err(f"{tag} clip '{an}' thiếu fps")
        for an in sh.get("animations", []):
            if an not in it.get("animations", {}): err(f"{tag} thiếu clip '{an}'")

    tol = spec.get("figureHeightTolerance", 0.08)
    for role, lst in heights.items():
        if len(lst) < 2: continue
        med = statistics.median(h for _, _, h in lst)
        for f, n, h in lst:
            if abs(h - med) > med * tol: err(f"[{f}] '{n}' cao {h} px, lệch {100 * (h - med) / med:+.0f}% so với các frame khác của vai '{role}' ({med:.0f} px) — vẽ sai tỉ lệ")

    pl = manifest.get("placements", {})
    for key in spec.get("placements", []):
        v = pl.get(key)
        if not v or "at" not in v: err(f"[placements] thiếu toạ độ đặt '{key}' (manifest.placements.{key}.at)"); continue
        x, y = v["at"]
        if not (0 <= x <= scene_w and 0 <= y <= scene_h): err(f"[placements] '{key}' at {v['at']} ra ngoài cảnh")
    for key in spec.get("paths", []):
        if key not in pl: err(f"[placements] thiếu '{key}' (đường đi khách: door / queueSpots / exitPath)")

    if preview and lineup:
        preview.mkdir(parents=True, exist_ok=True)
        bg_file = spec.get("previewBackground")
        cw = max(c.size[0] for _, _, c, _ in lineup); ch = max(c.size[1] for _, _, c, _ in lineup)
        per = max(1, min(len(lineup), 1280 // cw)); rows = (len(lineup) + per - 1) // per
        W, H = per * cw, rows * (ch + 18)
        canvas = Image.new("RGBA", (W, H), (40, 34, 30, 255))
        if bg_file and (root / bg_file).exists():
            bg = Image.open(root / bg_file).convert("RGBA")
            for r in range(rows): canvas.paste(bg.crop((0, bg.size[1] - ch - 40, W, bg.size[1] - 40)).resize((W, ch)), (0, r * (ch + 18)))
        for i, (f, n, c, _) in enumerate(lineup):
            canvas.alpha_composite(c, ((i % per) * cw, (i // per) * (ch + 18)))
        canvas.save(preview / "nhan-vat-xep-hang.png")
        canvas.resize((W * 2, H * 2), Image.NEAREST).save(preview / "nhan-vat-xep-hang-x2.png")

    for m in errors: print("LỖI     ", m)
    for m in warns: print("CẢNH BÁO", m)
    print(f"\n{len(errors)} lỗi, {len(warns)} cảnh báo — " + ("ĐẠT, giao được." if not errors else "CHƯA ĐẠT, sửa rồi chạy lại."))
    if preview and lineup: print(f"Ảnh soi nhân vật: {preview / 'nhan-vat-xep-hang-x2.png'}")
    sys.exit(1 if errors else 0)

if __name__ == "__main__":
    main()
