#!/usr/bin/env python3
"""Regression checks for the PilotDesk SlopMonster site-wide wrapper."""
import unittest

from slopmonster_site_audit import audit_page


class SiteAuditTests(unittest.TestCase):
    def test_real_aviation_terms_are_not_rewritten_as_marketing(self):
        p = audit_page(
            "<html><body><main><h1>Pivotal altitude</h1>"
            "<p>Field elevation and pivotal altitude are aviation terms.</p>"
            "</main></body></html>", "test.html")
        self.assertEqual(p["score"], 5)
        self.assertFalse(p["categories"])

    def test_pivotal_maneuver_is_valid_aviation_vocabulary(self):
        p = audit_page(
            "<main><p>Pivotal maneuvers use groundspeed to find pivotal altitude.</p></main>",
            "test.html")
        self.assertNotIn("vocab", p["categories"])

    def test_today_conditions_is_a_flight_proficiency_statement(self):
        p = audit_page(
            "<main><p>Being current does not establish proficiency in today's conditions.</p></main>",
            "test.html")
        self.assertNotIn("vocab", p["categories"])

    def test_generic_today_marketing_is_still_flagged(self):
        p = audit_page(
            "<main><p>In today's fast-paced landscape, we streamline your journey.</p></main>",
            "test.html")
        self.assertIn("vocab", p["categories"])

    def test_report_preserves_real_match_evidence(self):
        p = audit_page(
            "<main><p>Our seamless planning platform is effortless.</p></main>",
            "test.html")
        self.assertTrue(all("rule" in x and "match" in x
                            for xs in p["categories"].values() for x in xs))

    def test_marketing_language_is_flagged(self):
        p = audit_page(
            "<main><p>Our seamless, game-changing platform unlocks your journey.</p></main>",
            "test.html")
        self.assertLess(p["score"], 5)
        self.assertIn("vocab", p["categories"])

    def test_navigation_is_not_mistaken_for_page_copy(self):
        p = audit_page(
            "<nav>Unlock the journey</nav><main><h1>Weather</h1>"
            "<p>Review METARs and TAFs.</p></main><footer>Game-changing</footer>",
            "test.html")
        self.assertEqual(p["score"], 5)
        self.assertTrue(p["has_main"])

    def test_meta_description_is_checked(self):
        p = audit_page(
            '<head><meta name="description" content="A seamless way to plan."></head>'
            "<main><h1>Route Planner</h1><p>Plot airports and fixes.</p></main>",
            "test.html")
        self.assertLess(p["score"], 5)

    def test_broad_claim_phrase_still_flags(self):
        p = audit_page(
            "<main><p>This can help you change your study habits.</p></main>",
            "test.html")
        self.assertIn("phrases", p["categories"])


if __name__ == "__main__":
    unittest.main()
