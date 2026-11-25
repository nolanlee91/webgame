"""Sinh thumbnail nửa cỡ cho trang chủ (HOME-03 / PERF-08): prototype/homepage/assets/thumbs/<x>.webp -> thumbs/half/<x>.webp.

Thu đúng 1/2 mỗi chiều bằng trung bình khối 2x2 (Image.reduce(2)). Giữ kiểu nén của ảnh gốc:
- gốc WebP lossless (VP8L — ảnh pixel lưới 2x: Ô Ăn Quan, 5 game Tập Làm Chủ/Thám Tử 480x360) => bản 1/2 lossless;
- gốc WebP lossy (VP8 — tranh vẽ mịn 720x540, đa số game) => bản 1/2 lossy q=85 (lưu lossless từ nguồn đã lossy chỉ phình
  file: thử thấy 90 KB -> 157 KB).
- Ảnh vẽ trên lưới 2x (mỗi điểm vẽ = khối 2x2 cùng màu): trung bình khối = đúng màu khối đó => kết quả TRÙNG từng pixel với
  nearest-neighbour 1/2 (script tự kiểm và báo "lưới 2x: khớp nearest").
- Ảnh không nằm trên lưới 2x (phần lớn thumbnail 720x540 hiện tại là tranh vẽ mịn): nearest 1/2 sẽ bỏ mất nửa số điểm ảnh
  => răng cưa / nhiễu hạt; trung bình 2x2 giữ đúng màu trung bình, không làm mờ thêm như phóng mượt tỉ lệ lẻ.
Không phóng to, không đổi tỉ lệ lẻ. Chạy lại an toàn (ghi đè). Dùng: python -I tools/thumbs/make-half-thumbs.py [--check]
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / "prototype" / "homepage"
SRC = ROOT / "assets" / "thumbs"
DST = SRC / "half"
LOSSY_Q = 85


def is_lossless_webp(data):
    """WebP gốc nén lossless (khối VP8L) hay lossy (khối "VP8 ")."""
    vp8l, vp8 = data.find(b"VP8L", 12), data.find(b"VP8 ", 12)
    return vp8l != -1 and (vp8 == -1 or vp8l < vp8)


def used_thumbs():
    names = set()
    for js in ("games.js", "daily.js"):
        names |= set(re.findall(r"assets/thumbs/([\w.-]+\.webp)", (ROOT / js).read_text(encoding="utf-8")))
    return sorted(names)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    check_only = "--check" in sys.argv
    DST.mkdir(exist_ok=True)
    total_src = total_dst = 0
    for name in used_thumbs():
        src = Image.open(SRC / name)
        src.load()
        w, h = src.size
        if w % 2 or h % 2:
            raise SystemExit(f"{name}: cỡ lẻ {w}x{h}, không thu 1/2 chính xác được")
        mode = "RGBA" if "A" in src.getbands() else "RGB"
        im = src.convert(mode)
        half = im.reduce(2)
        a = np.asarray(im).astype(int)
        blocks = a.reshape(h // 2, 2, w // 2, 2, a.shape[-1])
        grid = float(((blocks.max(axis=(1, 3)) - blocks.min(axis=(1, 3))).max(axis=-1) == 0).mean())
        nearest = im.resize((w // 2, h // 2), Image.NEAREST)
        same = np.array_equal(np.asarray(half), np.asarray(nearest))
        out = DST / name
        raw = (SRC / name).read_bytes()
        lossless = is_lossless_webp(raw)
        if not check_only:
            if lossless:
                half.save(out, "WEBP", lossless=True, quality=100, method=6, exact=True)
            else:
                half.save(out, "WEBP", quality=LOSSY_Q, method=6)
        s, d = (SRC / name).stat().st_size, out.stat().st_size if out.exists() else 0
        total_src += s
        total_dst += d
        note = ("lossless" if lossless else f"lossy q{LOSSY_Q}") + ", " + (
            "lưới 2x: khớp nearest từng pixel" if same else f"không phải lưới 2x ({grid:.0%} khối 2x2 đồng màu) => trung bình 2x2")
        print(f"{name:24} {w}x{h} -> {w // 2}x{h // 2}  {s / 1024:6.1f} KB -> {d / 1024:6.1f} KB  {note}")
    print(f"Tổng: {total_src / 1024:.0f} KB -> {total_dst / 1024:.0f} KB")


if __name__ == "__main__":
    main()
