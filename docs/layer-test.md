# Map layer approval test

Open `/layer-test.html` on the preview deployment. This noindex page exposes 75 layer and display-control definitions with their complete selector options, searchable names, saved local selections, reset, and JSON export.

The embedded planner connects U.S. VFR/IFR charts, radar, flight category METARs, TFRs, NOTAMs, navaids, fixes, airways, obstacles, and PIREPs through existing PilotDesk integrations. Existing entitlement restrictions and live feed availability still apply. Opacity changes update the existing radar and hazard controls.

Other controls retain selections for review and show `Data connection pending`. They do not render synthetic weather, traffic, charts, airspace, fuel prices, or military data. The test does not constitute a completed data pipeline for these layers. Chart names are preserved for inventory review; the page does not bundle commercial chart products.

The page is isolated from the normal planner entry point and excluded from search indexing. The branch is enabled for preview builds; production requires a separate approval and merge.

Browser validation: `node qa/layer-test-browser.mjs`. Set `PILOTDESK_BROWSER_PATH` to an installed browser and `PILOTDESK_LEAFLET_JS` / `PILOTDESK_LEAFLET_CSS` to Leaflet 1.9.4 assets. Set `PILOTDESK_TEST_ROOT=dist` to verify built output. Tests return unavailable API fixtures to verify selection and failure behavior without claiming live data accuracy.
