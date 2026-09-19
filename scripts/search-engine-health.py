#!/usr/bin/env python3
import sys
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

BASE = "https://www.pilot-desk.com"
HOST = "www.pilot-desk.com"
INDEX = BASE + "/sitemap-index.xml"
KEY_URL = BASE + "/c731d63e44f2d52fcd122041601cfb22.txt"
KEY = "c731d63e44f2d52fcd122041601cfb22"
NS = {"sm":"http://www.sitemaps.org/schemas/sitemap/0.9"}

errors = []

def fetch(url, user_agent="PilotDesk-Search-Health/1.0"):
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=25) as r:
        body = r.read()
        return r.status, dict(r.headers), body

def must_200(url, ua="PilotDesk-Search-Health/1.0"):
    try:
        status, headers, body = fetch(url, ua)
    except Exception as exc:
        errors.append(f"{url}: fetch failed: {exc}")
        return None, {}, b""
    if status != 200:
        errors.append(f"{url}: HTTP {status}")
    xrobots = headers.get("X-Robots-Tag", "")
    if "noindex" in xrobots.lower():
        errors.append(f"{url}: X-Robots-Tag contains noindex")
    return status, headers, body

# Homepage must be available to ordinary crawlers.
for ua in ["Mozilla/5.0", "Googlebot", "bingbot", "DuckDuckBot"]:
    must_200(BASE + "/", ua)

# Key verification for IndexNow.
_, _, key_body = must_200(KEY_URL)
if key_body.decode("utf-8", errors="replace").strip() != KEY:
    errors.append("IndexNow key file content does not match configured key")

# robots.txt must permit the site and advertise the sitemap index.
_, _, robots_body = must_200(BASE + "/robots.txt")
robots = robots_body.decode("utf-8", errors="replace")
if "Disallow: /" in robots.replace("Disallow: /api/", ""):
    errors.append("robots.txt appears to block the site")
if INDEX not in robots:
    errors.append("robots.txt does not advertise sitemap-index.xml")

# Sitemap index and every child sitemap must parse and contain only canonical HTTPS URLs.
_, _, index_body = must_200(INDEX)
child_sitemaps = []
try:
    root = ET.fromstring(index_body)
    child_sitemaps = [
        n.text.strip() for n in root.findall("sm:sitemap/sm:loc", NS)
        if n.text and n.text.strip()
    ]
except Exception as exc:
    errors.append(f"sitemap index parse failed: {exc}")

if not child_sitemaps:
    errors.append("sitemap index contains no child sitemaps")

all_urls = []
for sitemap in child_sitemaps:
    parsed = urlparse(sitemap)
    if parsed.scheme != "https" or parsed.hostname != HOST:
        errors.append(f"non-canonical child sitemap: {sitemap}")
        continue
    _, _, body = must_200(sitemap)
    try:
        root = ET.fromstring(body)
        urls = [
            n.text.strip() for n in root.findall("sm:url/sm:loc", NS)
            if n.text and n.text.strip()
        ]
    except Exception as exc:
        errors.append(f"{sitemap}: parse failed: {exc}")
        continue
    for url in urls:
        p = urlparse(url)
        if p.scheme != "https" or p.hostname != HOST:
            errors.append(f"{sitemap}: non-canonical URL: {url}")
    all_urls.extend(urls)

unique = set(all_urls)
if len(unique) < 50:
    errors.append(f"unexpectedly low sitemap URL count: {len(unique)}")
if len(all_urls) != len(unique):
    print(f"NOTE: {len(all_urls)-len(unique)} duplicate sitemap URL entries across sitemap files")

print(f"Search-engine health: {len(unique)} unique canonical URLs across {len(child_sitemaps)} child sitemaps")

if errors:
    print("\nFAILURES:")
    for err in errors:
        print("- " + err)
    sys.exit(1)

print("OK: crawler access, robots.txt, IndexNow key, sitemap index, and child sitemaps all passed.")
