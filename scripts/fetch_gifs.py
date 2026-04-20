#!/usr/bin/env python3
"""
Run this script manually every ~15 days to refresh the GIF cache.
Usage: python3 scripts/fetch_gifs.py
Requires: GIPHY_API_KEY environment variable or edit the API_KEY line below.
"""

import json
import os
import time
import urllib.parse
import urllib.request

API_KEY = os.environ.get("GIPHY_API_KEY", "")
GIF_COUNT = 8
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "data", "gifs.json")

VERDICTS = {
    "Chaotic Good-ish":              "mischievous smile funny",
    "Wholesome Chaos":               "chaotic fun wholesome",
    "Certified Feral Angel":         "unhinged but cute",
    "Morally Flexible":              "suspicious laughing",
    "Criminally Funny":              "evil laugh funny",
    "A War Crime, But Make It Comedy": "chaotic evil funny",
    "Quietly Decent":                "boring okay fine",
    "Pure but Dry":                  "awkward silence dry",
    "Corporate Retreat Energy":      "corporate boring office",
    "Mildly Sus":                    "suspicious side eye",
    "Pointless Villainy":            "evil villain sad",
    "Void Energy":                   "dark empty stare",
}

if not API_KEY:
    print("Set GIPHY_API_KEY env var before running.")
    exit(1)

result = {}
for verdict, search_query in VERDICTS.items():
    query = urllib.parse.quote(search_query)
    url = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY}&q={query}&limit={GIF_COUNT}&rating=g&lang=en"
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
    urls = [gif["images"]["fixed_height"]["url"] for gif in data["data"]]
    result[verdict] = urls
    print(f"{verdict}: {len(urls)} gifs")
    time.sleep(0.3)

with open(OUTPUT, "w") as f:
    json.dump(result, f, indent=2)

print(f"\nSaved to {OUTPUT} — rebuild the frontend to apply.")
