# FAA airport records

These JSON files are derived from the FAA NASR APT and FRQ CSV groups. The manifest records the publication's effective and expiry dates. This release covers the October 1–29, 2026 cycle. Source: https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/

The importer joins airports, runways, runway ends, contacts, and attendance by FAA site number/type. Frequency assignments join by serviced airport identifier, retaining service, sector, hours, and remarks. Source runway headings are true degrees; runway dimensions, elevations, and declared distances are feet. Missing values remain null. Frequency strings remain verbatim, including suffixes.

To update: download and extract the **current** FAA APT and FRQ CSV groups into sibling `apt` and `frq` directories. Confirm the effective and next-cycle dates on the FAA publication page, then run:

```
node scripts/import-airport-data.mjs SOURCE_DIRECTORY data/airports YYYY-MM-DD NEXT-CYCLE-DATE
node qa/airport-data-tests.mjs
```

All source tables must have the specified effective date; mixed cycles are rejected. Review the generated records and dates before publishing. The panel displays cycle dates and marks expired records. Weather and procedures use separate live endpoints. No automatic NOTAM coverage is supplied by this dataset.

The browser loads the manifest and relevant two-character identifier bucket on demand, sharing in-flight downloads and retaining up to twelve buckets. The index is used for airport selection from a chart click at zoom 8 or greater; map movement does not request airport details. Static files are served by the site's CDN, with no server function database download on a map click.
