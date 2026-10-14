# Map view and layer controls

The route planner accepts `#map=longitude/latitude/zoom/chart` links, for example:

`/route-planner.html#map=-97.19218/47.95269/13/sectional`

Chart is optional; supported values are `sectional`, `terminal`, `low`, and `high`. Latitude is limited to ±85°, longitude to ±180°, and zoom to 3–14. Invalid links are ignored. A valid linked view takes precedence over the last view stored on the device and is not replaced by the first automatic route fit. Fit route remains available explicitly.

Map movement stores only position, zoom, and chart in `pd-map-view-v1`. Section anchors such as `#rpPerformance` are preserved. Back/forward fragment changes restore valid map views. Copy map link includes the map view only, without saved-flight query parameters, route content, accounts, or live weather. Clipboard failure exposes a selectable link.

The existing Layers panel now supports text search, enabled-overlay filtering, and an enabled count. The count describes selection, not data availability. Existing per-layer source, loading, outage and freshness information remains visible. Pro weather controls keep their existing entitlement checks. Stored layer settings accept only known boolean keys; opacity settings are bounded to their control ranges.

The implementation uses PilotDesk's existing Leaflet, FAA and weather integrations. It does not embed ForeFlight bundles, credentials, imagery, service endpoints, or account data. REA observation informed the behavior requirements; no claim is made that PilotDesk reproduces ForeFlight's backend or native apps.

Validation:

- `node qa/map-view-tests.mjs`
- `node qa/map-density-tests.mjs`
- `node qa/map-view-browser.mjs` with Playwright installed. Optional `PILOTDESK_BROWSER_PATH` selects a browser executable. `PILOTDESK_LEAFLET_JS` and `PILOTDESK_LEAFLET_CSS` select the same Leaflet 1.9.4 resources used by the application. `PILOTDESK_TEST_ROOT=dist` tests built output.

Browser tests deliberately return unavailable aviation API responses and block external map tiles. They verify UI/state handling, not live data accuracy or source availability. They cover shared and restored views, chart switching, section anchors, layer search/count/filter, entitlement preservation, clipboard success/failure, and nine viewport widths. Live-service and physical-device verification remain separate release checks.
