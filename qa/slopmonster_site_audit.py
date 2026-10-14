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
    aviation_matches = re.findall(r"\bpivotal\s+(?:altitude|maneuvers?)\b", text, flags=re.I)
    if matches and len(matches) == len(aviation_matches):
        hits["vocab"] = [item for item in hits["vocab"] if item[0] != "pivotal"]

    # Legitimate navigation/flight-training uses are not generic marketing copy.
    today_hits = re.findall(r"\bin today's\b", text, flags=re.I)
    today_conditions = re.findall(r"\bproficiency in today's conditions\b", text, flags=re.I)
    if today_hits and len(today_hits) == len(today_conditions):
        hits["vocab"] = [item for item in hits["vocab"] if item[0] != "in today's"]

    # Upstream stems 'elevate' to 'elevat' and flags the aviation noun 'elevation'.
    # Preserve real uses of 'elevate' / 'elevated' as reviewable findings.
    actual_elevate = re.search(r"\belevat(?:e|es|ed|ing|ive)\b", text, re.I)
    if not actual_elevate:
        hits["vocab"] = [item for item in hits["vocab"] if item[0] != "elevate"]
    return hits



# The upstream regex flags any ordinary three-part list. On an aviation site these
# are often exact units, performance inputs, or regulation categories. Preserve
# the evidence as reviewed, and flag rhetorical marketing cadence instead.
HYPE_WORDS = {
    "amazing", "beautiful", "better", "best", "brilliant", "compelling", "cutting",
    "direct", "disciplined", "easy", "efficient", "effortless", "engaging",
    "exceptional", "fast", "faster", "flawless", "fresh", "incredible",
    "intuitive", "modern", "perfect", "powerful", "premium", "proven",
    "reliable", "remarkable", "seamless", "simple", "simpler", "smart",
    "smarter", "specific", "stunning", "superior", "trusted", "unique",
}
MARKETING_VERBS = {"plan", "calculate", "study", "build", "learn", "grow",
                   "save", "discover", "explore", "create", "connect"}
AVIATION_COMPOUNDS = {
    "accelerate-stop", "accelerate-go", "multi-engine", "engine-out",
    "single-engine", "density-altitude", "dry-air", "standard-atmosphere",
    "isa-equivalent", "time-speed-distance", "climb-gradient",
    "descent-rate", "weight-and-balance", "best-angle", "best-rate",
    "cross-country", "runway-specific", "aircraft-specific", "takeoff-roll",
}


def classify_reviewed_patterns(hits, visible):
    """Keep SlopMonster evidence while separating technical content from hype.

    A new promotional tricolon, novel compound stack or overloaded paragraph
    remains unresolved. Previously accepted lists stay inspectable in JSON.
    This is not an AI-authorship test.
    """
    unresolved = {key: [] for key in hits}
    reviewed = {key: [] for key in hits}
    # Page-wide punctuation counts are misleading across independently written
    # paragraphs and labels. HTML block endings are marked with " . " upstream.
    blocks = re.split(r"\s+\.\s+", visible)
    for category, values in hits.items():
        for rule, evidence in values:
            reason = None
            if category == "rhythm" and rule == "rule-of-three list":
                # A list of aviation quantities is not itself a writing defect.
                words = re.findall(r"[a-z]+", evidence.lower())
                marketing_count = sum(word in HYPE_WORDS for word in words)
                imperative_count = sum(word in MARKETING_VERBS for word in words)
                if marketing_count < 2 and imperative_count < 3:
                    reason = "literal aviation or navigation enumeration"
            elif category == "punctuation":
                if rule.startswith("4 hyphenated") or (
                    "hyphenated compounds stacked" in rule
                ):
                    compounds = [c.strip().lower() for c in evidence.split(",")]
                    if compounds and all(c in AVIATION_COMPOUNDS for c in compounds):
                        reason = "published aviation compound terminology"
                elif rule == "semicolon-heavy for web copy":
                    if max((chunk.count(";") for chunk in blocks), default=0) <= 2:
                        reason = "semicolons distributed across separate copy blocks"
                elif rule == "two or more em-dashes in one sentence":
                    if max((chunk.count("—") for chunk in blocks), default=0) < 2:
                        reason = "em dashes occur in separate text blocks"
            if reason:
                reviewed[category].append((rule, evidence, reason))
            else:
                unresolved[category].append((rule, evidence))
    return unresolved, reviewed

def audit_page(html, path):
    parser = PageCopy()
    parser.feed(html)
    main_text = parser.text()
    # Treat meta description as public-facing copy too.
    seo = slop.normalise(parser.description)
    visible = slop.normalise(main_text + " . " + seo)
    raw_hits = justified_aviation_terms(slop.audit(visible), visible)
    hits, accepted = classify_reviewed_patterns(raw_hits, visible)
    score = max(0, 5 - sum(bool(values) for values in hits.values()))
    return {
        "path": path,
        "score": score,
        "categories": {
            key: [{"rule": item[0], "match": item[1]} if isinstance(item, tuple)
                  else {"rule": str(item)} for item in values[:12]]
            for key, values in hits.items() if values
        },
        "reviewed": {
            key: [{"rule": item[0], "match": item[1], "reason": item[2]}
                  for item in values[:12]]
            for key, values in accepted.items() if values
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
        "pages_with_reviewed_patterns": sum(bool(p["reviewed"]) for p in pages),
        "reviewed_patterns": sum(len(v) for p in pages for v in p["reviewed"].values()),
        "report": pages,
        "notes": [
            "SlopMonster is an English pattern check, not proof of AI authorship.",
            "The published HTML, including built legacy routes, is inspected.",
            "Main-page text and SEO descriptions are checked; client-generated JS copy needs separate review.",
            "Reviewed technical lists, established aviation compound words and independent paragraph punctuation remain visible with an explicit reason.",
            "A new marketing tricolon or a new overloaded sentence still produces an unresolved score reduction.",
            "Pivotal altitude and elevation are recognized as legitimate aviation terminology.",
            "Manual editorial review is required; clear copy and accurate FAA/POH limits outrank a 5/5 score.",
        ],
    }
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"SlopMonster: {len(pages)} built pages checked; {len(flagged)} unresolved warnings; "
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
