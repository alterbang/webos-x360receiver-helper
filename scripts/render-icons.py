from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent / "app"
image = Image.new("RGB", (640, 640), "#101713")
draw = ImageDraw.Draw(image)
outline = [(184, 180), (456, 180), (504, 188), (528, 248), (584, 424),
           (584, 476), (540, 504), (504, 496), (440, 420), (200, 420),
           (136, 496), (100, 504), (56, 476), (56, 424), (112, 248), (136, 188)]
draw.polygon(outline, fill="#243c2b")
draw.line(outline + [outline[0]], fill="#a0f2a8", width=16, joint="curve")
draw.line([(168, 260), (168, 356)], fill="#f3fff5", width=28)
draw.line([(120, 308), (216, 308)], fill="#f3fff5", width=28)
for x, y in ((472, 272), (512, 312), (432, 312), (472, 352)):
    draw.ellipse((x - 20, y - 20, x + 20, y + 20), fill="#a0f2a8")
draw.ellipse((272, 224, 368, 320), fill="#101713", outline="#a0f2a8", width=12)
draw.arc((272, 224, 368, 320), 180, 270, fill="#74ff85", width=24)
for name, size in (("icon.png", 80), ("largeIcon.png", 130)):
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / name)
