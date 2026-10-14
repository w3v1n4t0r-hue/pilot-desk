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

    def test_technical_enumeration_is_reviewed_not_rewritten(self):
        p = audit_page(
            "<main><p>Convert Celsius, Fahrenheit, and Kelvin.</p></main>",
            "weather.html")
        self.assertEqual(p["score"], 5)
        self.assertIn("rhythm", p["reviewed"])
        self.assertNotIn("rhythm", p["categories"])

    def test_promotional_adjective_rhythm_still_flags(self):
        p = audit_page(
            "<main><p>Faster, smarter, and better than before.</p></main>",
            "test.html")
        self.assertIn("rhythm", p["categories"])
        self.assertLess(p["score"], 5)

    def test_three_verb_marketing_slogan_still_flags(self):
        p = audit_page("<main><h1>Plan, calculate, and study</h1></main>", "index.html")
        self.assertIn("rhythm", p["categories"])

    def test_aviation_compound_terms_stay_documented(self):
        p = audit_page(
            "<main><p>Accelerate-stop, accelerate-go, multi-engine, "
            "and engine-out are published training terms.</p></main>", "twin.html")
        self.assertNotIn("punctuation", p["categories"])
        self.assertIn("punctuation", p["reviewed"])

    def test_marketing_compound_stack_is_not_accepted(self):
        p = audit_page(
            "<main><p>Our industry-leading, customer-focused, "
            "trend-setting, game-changing tools win.</p></main>", "test.html")
        self.assertIn("punctuation", p["categories"])

    def test_semicolons_on_separate_paragraphs_are_accepted(self):
        p = audit_page(
            "<main><p>Vx is climb angle; Vy is climb rate.</p>"
            "<p>Confirm the limits; check the POH.</p>"
            "<p>Weather changes; review the chart.</p>"
            "<p>Fuel matters; account for reserves.</p></main>", "test.html")
        self.assertNotIn("punctuation", p["categories"])

    def test_semicolon_run_on_remains_unresolved(self):
        p = audit_page(
            "<main><p>First check fuel; then look at weather; "
            "then inspect terrain; then choose a route; finally review data.</p>"
            "</main>", "test.html")
        self.assertIn("punctuation", p["categories"])

    def test_unverified_proof_still_reaches_report(self):
        p = audit_page("<main><p>10000 happy customers trust our tool.</p></main>",
                       "test.html")
        self.assertIn("proof", p["categories"])

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
