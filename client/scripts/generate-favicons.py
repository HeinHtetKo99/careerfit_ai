#!/usr/bin/env python3
"""Generate favicons from logo.png on a white background so colors match the header."""
import sys
from pathlib import Path

from PIL import Image

# Match the app's light UI background
FAVICON_BG = (255, 255, 255, 255)


def make_favicon(logo_path, size, fill=0.88, background=FAVICON_BG):
    logo = Image.open(logo_path).convert('RGBA')
    w, h = logo.size
    scale = min(size * fill / w, size * fill / h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (size, size), background)
    ox = (size - new_w) // 2
    oy = (size - new_h) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def generate_all(logo_path, public_dir):
    logo_path = Path(logo_path)
    public_dir = Path(public_dir)

    sizes = {
        'favicon-16.png': 16,
        'favicon-32.png': 32,
        'favicon-48.png': 48,
        'favicon-64.png': 64,
        'favicon-192.png': 192,
        'apple-touch-icon.png': 180,
    }

    for name, size in sizes.items():
        icon = make_favicon(logo_path, size)
        out = public_dir / name
        icon.save(out, 'PNG', compress_level=6)
        print(f'Saved {out}')

    # Primary favicon — same rendering as header (logo on white)
    primary = make_favicon(logo_path, 512, fill=0.9)
    primary.save(public_dir / 'favicon.png', 'PNG', compress_level=6)
    print(f'Saved {public_dir / "favicon.png"}')


if __name__ == '__main__':
    logo = sys.argv[1] if len(sys.argv) > 1 else 'public/logo.png'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else 'public'
    generate_all(logo, out_dir)
