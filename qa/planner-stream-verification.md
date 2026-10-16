# Planner data stream verification — 2026-10-15

Scope: current route planner and compact Charts & Layers preview. Read-only live requests used public airport/route coordinates. No flight was saved, filed or sent.

| Input group | Live result | Evidence |
| --- | --- | --- |
| METAR / TAF | Passed | KGFK station response contains both products; regional map response contains 26 observations. |
| PIREPs / advisories / obstacles | Passed | Regional PIREPs 8; SIGMET 1; G-AIRMET 7; CWA 0 (valid empty); obstacles 401 (marked potentially truncated). |
| TFRs | Passed | CONUS response contains 72 features. |
| FAA navigation geometry | Passed | Airports 182, class airspace 70, boundaries 11, SUA 12, MTR 12, airways 103, navaids 13, fixes 96 in the sampled bounds. FAA global statistics also confirm MODE-C and ADIZ types exist in their respective services. |
| Airport / route resolution | Passed | Airport search 1 match, nearby stations 6; KGFK point resolves; V181 returns 16 legs; KGFK procedures 22. |
| Route winds | Passed | KGFK–KFAR sample flight window returns 350° / 28 kt at 6,000 ft from GFK. |
| Map winds | Passed | All nine selectable altitudes from 3,000 through 39,000 ft returned 9 close-up vectors each; renderer and altitude changes covered by browser checks. |
| Radar | Passed | Latest and 60-minute historical exports return different valid PNGs; composite and lowest-tilt WMS PNGs also return successfully. |
| Satellite / lightning | Passed | Current visible, infrared and lightning metadata and WMS images return successfully. A transparent lightning image may represent no strikes in a region. |
| FAA chart images | Passed | Sectional, IFR low and IFR high return JPEG chart tiles. Minneapolis terminal coverage returns a 46,024-byte JPEG; a blank tile outside TAC coverage is not a source outage. |
| Street / aerial basemaps | Passed | OSM PNG and USGS JPEG tiles return successfully. |
| Automatic NOTAMs | Unavailable by configuration | Server returns 503 with configured:false. User chose to leave this feed unavailable. New capability check disables the automatic input and provides the official FAA lookup. No credentials are exposed. |
| Standalone ground detail | Provider unavailable | All ten server queries fail with timeout/502; direct source returns 406 or times out. Normal browser query also fails. Direct browser path respects source denials and uses a 60-second backoff; related controls clear and disable after a provider failure. Street and aerial basemaps remain available. |

Regression checks cover geometry normalization, bounding limits, source-denial handling, METAR/wind independence, changing altitude, disabled NOTAM capability, chart/view persistence, radar slider and responsive layout. Live source checks establish availability at the sampled time and location, not perpetual coverage.

Ground-detail source resource policy: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html . No alternate identity, authentication bypass, or substitute provider is used.
