# Public map layer approval test

Open `/layer-test.html` on the preview deployment. The noindex page exposes 51 supported controls and their connected selector options, search, local saved selections, reset, and JSON export. Unconnected controls and options have been removed, including traffic and commercial/international charts. Stored selections for removed items are ignored. Production is unchanged until this draft is approved and merged.

## Connected public adapters

- FAA GIS: public/private airports, heliports, seaplane bases, other fields, class airspace, Class E, Mode C, SUA/MOA, ADIZ, ARTCC/FIR boundaries, boundary records with sector attributes, navaids, fixes, airways, and IFR/VFR military training route segments. Altitude and navigation-level filters act on source fields. Source update dates come from service metadata, not the browser fetch time. These are reference geometries; check current chart editions and activation information separately.
- AWC observations: flight category, surface wind, temperature, dewpoint spread, visibility, ceiling, and sky coverage. Missing measurements are omitted rather than rendered as zero. GeoJSON ceiling values in hundreds of feet are converted to feet AGL.
- AWC/NWS winds: CONUS station forecasts from the current valid bulletin, sampled at 3,000–39,000 ft MSL. These are station forecasts, not a continuous global wind grid. Missing/bracketing levels remain unavailable.
- AWC advisories: SIGMET, G-AIRMET, and CWA packages with hazard filters. Turbulence band filters exclude reports without known altitude bounds. Source packages may have different validity windows. All three package statuses remain visible; a failed package cannot be hidden by another successful one.
- AWC reported turbulence: turbulence PIREP locations. This is not an automated fleet turbulence feed.
- NOAA WMS: CONUS composite and base-reflectivity radar mosaics; global visible and grayscale longwave IR imagery; lightning strike density. Frame times are read from provider capabilities and pinned in tile requests. Visible satellite is a daylight alternative to enhanced imagery; grayscale IR is not color-enhanced. Lightning density is not individual strike locations. Old frames and tile failures are identified.
- USGS aerial imagery: U.S. coverage through The National Map. Imagery acquisition dates vary; it is not live imagery.
- OpenStreetMap: street tiles with visible attribution; Overpass roads, railroads, mapped urban areas, forest/park ways, selected POIs, power lines, place names, peaks/saddles, and aerialway geometry. Cultural requests require a close-up view (maximum 0.35° bounds), return at most 500 elements, and run sequentially. Ways/nodes alone do not constitute complete national-park or terrain/obstacle databases.

Public adapters cover 45 catalogue controls, including local filters and selectors with at least one supported option. Existing U.S. chart, MRMS radar, TFR, NOTAM, obstacle and gated PIREP integrations remain available. A configured adapter is not a guarantee that the upstream service will respond for the selected location/time.

## Product differences and remaining sources

MTR labels show route identifiers because the FAA segment feed does not supply waypoint names. Boundary sector attributes do not constitute complete ATC sector coverage. Slow routes, aerial refueling, organized tracks, GAFOR, FISA/TRSA/parachute areas, MORA/LSALT, fuel prices, aircraft traffic, commercial/international charts, gridded icing/turbulence/cloud products and surface analysis are excluded from the preview until a suitable connection exists. No credentials or paid feeds were provisioned.

## Reliability

Requests use fixed provider allowlists, bounded queries, timeouts, source-aware caches, and cancellation. A stale response cannot restore deselected layers. Weather refreshes every five minutes while selections are active. Source updates, forecast validity, retrieval times, partial results, and outages are distinguished. Cultural geometries and street tiles preserve OpenStreetMap attribution; street tiles are not prefetched or downloaded for offline use.

Validation: `node qa/public-layer-tests.mjs` and `node qa/layer-test-browser.mjs`. Browser tests use explicitly identified fixtures, not invented production data. Set `PILOTDESK_TEST_ROOT=dist` for built output and configure installed browser/Leaflet assets with `PILOTDESK_BROWSER_PATH`, `PILOTDESK_LEAFLET_JS`, and `PILOTDESK_LEAFLET_CSS`. Live adapter checks verified FAA geometry, all five NOAA frame metadata products, an Overpass response, and a valid AWC winds station forecast.

Primary references: [AWC API](https://aviationweather.gov/data/api/), [FAA data dictionary](https://aeronav.faa.gov/Open_Data_Supp/Data_Dictionary.pdf), [NOAA GIS](https://www.weather.gov/gis/cloudgiswebservices), [NOAA imagery capabilities](https://nowcoast.noaa.gov/geoserver/observations/satellite/ows?service=WMS&request=GetCapabilities), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/), [Overpass](https://overpass-api.de/).
