#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path
from PIL import Image


def remove_edge_white(input_path, output_path, tolerance=28):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    px = img.load()

    def is_bg(r, g, b):
        return r >= 255 - tolerance and g >= 255 - tolerance and b >= 255 - tolerance

    visited = set()
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in visited or x < 0 or x >= w or y < 0 or y >= h:
            continue
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b):
            continue
        visited.add((x, y))
        px[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    max_size = 1024
    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

    img.save(output_path, 'PNG', optimize=True)
    print(f'Saved {output_path} ({img.size[0]}x{img.size[1]})')


if __name__ == '__main__':
    source = sys.argv[1]
    logo_out = sys.argv[2]
    remove_edge_white(source, logo_out)
    public_dir = Path(logo_out).parent
    script_dir = Path(__file__).parent
    subprocess.run(
        ['python3', str(script_dir / 'generate-favicons.py'), logo_out, str(public_dir)],
        check=True,
    )
