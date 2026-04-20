import io
import math
import textwrap
from PIL import Image, ImageDraw, ImageFont

# --- Config ---
W, H = 1200, 630
COMPASS_SIZE = 500
COMPASS_X = 50
COMPASS_Y = (H - COMPASS_SIZE) // 2

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

PALETTE = [
    (0x4e, 0x8f, 0xc7),
    (0x84, 0xb1, 0x9b),
    (0xc2, 0xb9, 0x7f),
    (0xd9, 0x8c, 0x45),
    (0xc9, 0x56, 0x3a),
    (0x8b, 0x20, 0x20),
]

GRID_SIZE = 15
BG = (250, 250, 248)
MUTED = (160, 160, 155)
BORDER = (220, 220, 215)
TEXT = (30, 30, 28)

QUADRANT_BG = [(240, 240, 240), (235, 235, 235), (235, 235, 235), (230, 230, 230)]

VERDICT_COLOR = {
    "q1": (90, 158, 122),
    "q2": (201, 86, 58),
    "q3": (78, 143, 199),
    "q4": (217, 140, 69),
}


# --- Helpers ---

def lerp_color(t: float) -> tuple[int, int, int]:
    if not PALETTE:
        return (128, 128, 128)
    scaled = t * (len(PALETTE) - 1)
    lo = int(scaled)
    hi = min(lo + 1, len(PALETTE) - 1)
    u = scaled - lo
    return tuple(round(PALETTE[lo][i] + (PALETTE[hi][i] - PALETTE[lo][i]) * u) for i in range(3))


def cluster_votes(votes: list) -> list[dict]:
    cells: dict[str, dict] = {}
    for v in votes:
        col = min(int(((v.x + 100) / 200) * GRID_SIZE), GRID_SIZE - 1)
        row = min(int(((v.y + 100) / 200) * GRID_SIZE), GRID_SIZE - 1)
        key = f"{col},{row}"
        c = cells.setdefault(key, {"sumX": 0, "sumY": 0, "count": 0})
        c["sumX"] += v.x
        c["sumY"] += v.y
        c["count"] += 1
    return [{"x": c["sumX"] / c["count"], "y": c["sumY"] / c["count"], "count": c["count"]} for c in cells.values()]


def vote_to_px(x: float, y: float) -> tuple[int, int]:
    px = COMPASS_X + int((x + 100) / 200 * COMPASS_SIZE)
    py = COMPASS_Y + int((100 - y) / 200 * COMPASS_SIZE)
    return px, py


def quadrant_key(x: float, y: float) -> str:
    if x < 0 and y >= 0: return "q1"
    if x >= 0 and y >= 0: return "q2"
    if x < 0 and y < 0: return "q3"
    return "q4"


def get_verdict_title(x: float, y: float) -> str:
    mag = max(abs(x), abs(y))
    intensity = "mild" if mag < 40 else ("strong" if mag < 70 else "extreme")
    verdicts = {
        "q1": {"mild": "Chaotic Good-ish", "strong": "Wholesome Chaos", "extreme": "Certified Feral Angel"},
        "q2": {"mild": "Morally Flexible", "strong": "Criminally Funny", "extreme": "A War Crime, But Make It Comedy"},
        "q3": {"mild": "Quietly Decent", "strong": "Pure but Dry", "extreme": "Corporate Retreat Energy"},
        "q4": {"mild": "Mildly Sus", "strong": "Pointless Villainy", "extreme": "Void Energy"},
    }
    return verdicts[quadrant_key(x, y)][intensity]


def draw_text_wrapped(draw, text, x, y, font, fill, max_width, line_height):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y


# --- Main ---

def generate_og_image(title: str, votes: list) -> bytes:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    cx = COMPASS_X
    cy = COMPASS_Y
    cs = COMPASS_SIZE
    mid_x = cx + cs // 2
    mid_y = cy + cs // 2

    # Quadrant backgrounds
    draw.rectangle([cx, cy, mid_x, mid_y], fill=QUADRANT_BG[0])           # Q1 top-left
    draw.rectangle([mid_x, cy, cx + cs, mid_y], fill=QUADRANT_BG[1])      # Q2 top-right
    draw.rectangle([cx, mid_y, mid_x, cy + cs], fill=QUADRANT_BG[2])      # Q3 bottom-left
    draw.rectangle([mid_x, mid_y, cx + cs, cy + cs], fill=QUADRANT_BG[3]) # Q4 bottom-right

    # Grid lines (6 subdivisions per axis)
    for i in range(1, 6):
        t = i / 6
        gx = cx + int(t * cs)
        gy = cy + int(t * cs)
        draw.line([(gx, cy), (gx, cy + cs)], fill=(0, 0, 0, 20), width=1)
        draw.line([(cx, gy), (cx + cs, gy)], fill=(0, 0, 0, 20), width=1)

    # Axes
    draw.line([(mid_x, cy), (mid_x, cy + cs)], fill=BORDER, width=2)
    draw.line([(cx, mid_y), (cx + cs, mid_y)], fill=BORDER, width=2)

    # Compass border
    draw.rectangle([cx, cy, cx + cs, cy + cs], outline=BORDER, width=2)

    # Axis labels
    try:
        label_font = ImageFont.truetype(FONT_BOLD, 18)
    except Exception:
        label_font = ImageFont.load_default()

    def draw_centered(text, x, y):
        w = draw.textlength(text, font=label_font)
        draw.text((x - w / 2, y), text, font=label_font, fill=(100, 100, 95))

    draw_centered("FUNNY",        mid_x, cy + 8)
    draw_centered("DRY",          mid_x, cy + cs - 28)
    draw.text((cx + 8, mid_y - 26),        "WHOLESOME",   font=label_font, fill=(100, 100, 95))
    draw.text((cx + cs - 8 - int(draw.textlength("QUESTIONABLE", font=label_font)), mid_y - 26),
              "QUESTIONABLE", font=label_font, fill=(100, 100, 95))

    # Vote clusters
    clusters = cluster_votes(votes)
    max_count = max((c["count"] for c in clusters), default=1)

    for cluster in clusters:
        px, py = vote_to_px(cluster["x"], cluster["y"])
        size = min(8 + math.sqrt(cluster["count"] - 1) * 6, 32)
        t = 0 if max_count <= 1 else (cluster["count"] - 1) / (max_count - 1)
        color = lerp_color(t)
        r = int(size / 2)
        draw.ellipse([px - r, py - r, px + r, py + r], fill=color)

    # --- Right panel ---
    rx = COMPASS_X + COMPASS_SIZE + 60
    rw = W - rx - 40
    ry = 60

    try:
        brand_font   = ImageFont.truetype(FONT_BOLD, 18)
        title_font   = ImageFont.truetype(FONT_BOLD, 42)
        verdict_font = ImageFont.truetype(FONT_BOLD, 32)
        small_font   = ImageFont.truetype(FONT_REG, 20)
    except Exception:
        brand_font = verdict_font = title_font = small_font = ImageFont.load_default()

    # Branding
    draw.text((rx, ry), "ChaoticMeter", font=brand_font, fill=MUTED)
    ry += 44

    # Divider
    draw.line([(rx, ry), (rx + rw, ry)], fill=BORDER, width=1)
    ry += 20

    # Post title
    ry = draw_text_wrapped(draw, title, rx, ry, title_font, TEXT, rw, 52)
    ry += 32

    # Verdict
    if votes:
        avg_x = sum(v.x for v in votes) / len(votes)
        avg_y = sum(v.y for v in votes) / len(votes)
        verdict = get_verdict_title(avg_x, avg_y)
        qkey = quadrant_key(avg_x, avg_y)
        color = VERDICT_COLOR[qkey]
        draw.text((rx, ry), verdict, font=verdict_font, fill=color)
        ry += 44

        # Vote count
        count_text = f"{len(votes)} vote{'s' if len(votes) != 1 else ''}"
        draw.text((rx, ry), count_text, font=small_font, fill=MUTED)
    else:
        draw.text((rx, ry), "No votes yet", font=small_font, fill=MUTED)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
