"""Writes the built-in hero photo, the share preview image, and the icons into app/public.

Usage: python3 scripts/make-share-assets.py <photo> <logo>
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

PUBLIC = Path(__file__).resolve().parents[1] / "app" / "public"
HERO_WIDTH = 2000
SHARE_SIZE = (1200, 628)


def hero_photo(photo: Image.Image) -> None:
    width = min(photo.width, HERO_WIDTH)
    height = round(photo.height * width / photo.width)
    photo.resize((width, height), Image.LANCZOS).save(
        PUBLIC / "church-hero.jpg", quality=82, optimize=True, progressive=True
    )


def share_image(photo: Image.Image) -> None:
    height = round(photo.width * SHARE_SIZE[1] / SHARE_SIZE[0])
    photo.crop((0, 0, photo.width, height)).resize(SHARE_SIZE, Image.LANCZOS).save(
        PUBLIC / "og-image.jpg", quality=85, optimize=True, progressive=True
    )


def icons(logo: Image.Image) -> None:
    background = logo.getpixel((0, 0))
    difference = ImageChops.difference(logo, Image.new("RGB", logo.size, background))
    # JPEG noise in the logo background would otherwise stretch the crop to the edges.
    bounds = ImageChops.add(difference, difference, 2.0, -20).getbbox()
    mark = logo.crop(bounds) if bounds else logo
    side = round(max(mark.size) * 1.2)
    square = Image.new("RGB", (side, side), background)
    square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    square.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    square.resize((256, 256), Image.LANCZOS).save(
        PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python3 scripts/make-share-assets.py <photo> <logo>")
    photo = Image.open(sys.argv[1]).convert("RGB")
    logo = Image.open(sys.argv[2]).convert("RGB")
    hero_photo(photo)
    share_image(photo)
    icons(logo)
    print("Wrote church-hero.jpg, og-image.jpg, apple-touch-icon.png, favicon.ico")
