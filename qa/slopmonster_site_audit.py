#!/usr/bin/env python3
"""Audit visible copy on every built PilotDesk HTML page with SlopMonster.

Run after npm run build:
    python3 qa/slopmonster_site_audit.py --root dist --output slopmonster-report.json

This is an editorial report, not an AI authorship detector or a link/crawl test.
Existing site-integrity, SEO, calculator, and browser QA remain authoritative.
"""
import argparse
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
CHECKER_PATH = ROOT / "tools" / "vendor" / "slopmonster" / "deslop.py"
spec = importlib.util.spec_from_file_location("pilotdesk_deslop", CHECKER_PATH)
slop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(slop)

BLOCKS = {
    "p", "li", "h1", "h2", "h3", "h4", "h5", "h6",
    "section", "article", "div", "tr", "dt", "dd",
}
SKIPPED = {"script", "style", "svg", "template", "noscript"}


class PageCopy(HTMLParser):
    """Extract main content instead of treating repeated nav/footer as page copy."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.main_depth = 0
        self.suppressed = []
        self.body = []
        self.fallback = []
        self.description = ""
        self.has_main = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.description = attrs.get("content", "")
        if tag == "main":
            self.main_depth += 1
            self.has_main = True
        if tag in SKIPPED:
            self.suppressed.append(tag)

    def handle_endtag(self, tag):
        if self.suppressed and tag == self.suppressed[-1]:
            self.suppressed.pop()
        if tag in BLOCKS and not self.suppressed:
            (self.body if self.main_depth else self.fallback).append(" . ")
        if tag == "main":
            self.main_depth = max(0, self.main_depth - 1)

    def handle_data(self, data):
        if self.suppressed or not data.strip():
            return
        (self.body if self.main_depth else self.fallback).append(data + " ")

    def text(self):
        visible = self.body if self.has_main else self.fallback
        return slop.normalise(" ".join(visible))


def justified_aviation_terms(hits, text):
    """Reject two known false positives without hiding other SlopMonster findings."""
    matches = re.findall(r"\bpivotal\b", text, flags=re.I)
    aviation_matches = re.findall(r"\bpivotal\s+altitude\b", text, flags=re.I)
    if matches and len(matches) == len(aviation_matches):
        hits["vocab"] = [item for item in hits["vocab"] if item[0] != "pivotal"]

    # Upstream stems 'elevate' to 'elevat' and flags the aviation noun 'elevation'.
    # Preserve real uses of 'elevate' / 'elevated' as reviewable findings.
    actual_elevate = re.search(r"\belevat(?:e|es|ed|ing|ive|ions?)\b", text, re.I)
    if not actual_elevate:
        hits["vocab"] = [item for item in hits["vocab"] if item[0] != "elevate"]
    return hits


def audit_page(html, path):
    parser = PageCopy()
    parser.feed(html)
    main_text = parser.text()
    # Treat meta description as public-facing copy too.
    seo = slop.normalise(parser.description)
    visible = slop.normalise(main_text + " . " + seo)
    hits = justified_aviation_terms(slop.audit(visible), visible)
    score = max(0, 5 - sum(bool(values) for values in hits.values()))
    return {
        "path": path,
        "score": score,
        "categories": {
            key: [item[0] if isinstance(item, tuple) else item for item in values[:8]]
            for key, values in hits.items() if values
        },
        "has_main": parser.has_main,
        "characters": len(visible),
    }


def scan(root):
    return [audit_page(p.read_text(encoding="utf-8", errors="replace"),
                       p.relative_to(root).as_posix())
            for p in sorted(root.rglob("*.html"))]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default="dist", help="Built HTML directory")
    parser.add_argument("--output", help="Optional JSON report destination")
    parser.add_argument("--strict", action="store_true",
                        help="Fail when a page has scored findings; use after manual triage")
    args = parser.parse_args()
    root = Path(args.root)
    if not root.is_dir():
        parser.error("built HTML directory is missing; run npm run build first")
    pages = scan(root)
    if not pages:
        parser.error("no HTML files found; a successful empty audit is not valid")
    flagged = sorted((p for p in pages if p["score"] < 5),
                     key=lambda p: (p["score"], p["path"]))
    stats = {
        "pages_scanned": len(pages),
        "pages_flagged": len(flagged),
        "pages_clean": len(pages) - len(flagged),
        "report": pages,
        "notes": [
            "SlopMonster is an English pattern check, not proof of AI authorship.",
            "The published HTML, including built legacy routes, is inspected.",
            "Main-page text and SEO descriptions are checked; client-generated JS copy needs separate review.",
            "Pivotal altitude and elevation are recognized as legitimate aviation terminology.",
            "Manual editorial review is required; clear copy and accurate FAA/POH limits outrank a 5/5 score.",
        ],
    }
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"SlopMonster: {len(pages)} built pages checked; {len(flagged)} need review; "
          f"{len(pages) - len(flagged)} score 5/5.")
    for p in flagged[:30]:
        details = ", ".join(p["categories"].keys())
        print(f"  {p['score']}/5 {p['path']}: {details}")
    if len(flagged) > 30:
        print(f"  ... plus {len(flagged) - 30} additional pages in the JSON report")
    if args.strict and flagged:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
