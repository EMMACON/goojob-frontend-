"""Draw the Goojob favicon set from the black / lime wordmark."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
FONT = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
CREAM = (250, 250, 248)
INK = (17, 17, 17)
LIME = (193, 255, 78)


def icon(size: int) -> Image.Image:
    image = Image.new("RGB", (size, size), INK)
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(FONT, int(size * 0.72))
    text = "g"
    box = draw.textbbox((0, 0), text, font=font)
    x = (size - (box[2] - box[0])) / 2 - box[0]
    y = (size - (box[3] - box[1])) / 2 - box[1] - size * 0.04
    draw.text((x, y), text, font=font, fill=LIME)
    return image


def apple(size: int = 180) -> Image.Image:
    image = Image.new("RGB", (size, size), CREAM)
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(FONT, int(size * 0.16))
    goo = "goo"
    job = "job"
    goo_box = draw.textbbox((0, 0), goo, font=font)
    job_box = draw.textbbox((0, 0), job, font=font)
    goo_w = goo_box[2] - goo_box[0]
    job_w = job_box[2] - job_box[0]
    gap = int(size * 0.012)
    total = goo_w + gap + job_w
    x = (size - total) / 2 - goo_box[0]
    y = (size - (goo_box[3] - goo_box[1])) / 2 - goo_box[1]
    draw.text((x, y), goo, font=font, fill=INK)
    job_x = x + goo_w + gap
    stroke = max(1, size // 90)
    for dx in range(-stroke, stroke + 1):
        for dy in range(-stroke, stroke + 1):
            if dx or dy:
                draw.text((job_x + dx, y + dy), job, font=font, fill=INK)
    draw.text((job_x, y), job, font=font, fill=LIME)
    return image


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    image_32 = icon(32)
    image_32.save(PUBLIC / "favicon-32.png", optimize=True)
    apple(180).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    icon(48).save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
