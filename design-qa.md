# Route planner dropdown and chart detail verification

final result: passed

The route planner opens as a centered dropdown below its top button. The chart moves below the dropdown rather than being covered by a side panel. Closing it restores the full chart height. The dropdown is at most 320px tall, scrolls internally and leaves usable chart space on short landscape screens. Route entry and Build navlog are grouped at the top; all nine planning views remain available. Escape, Arrow Down and outside-click dismissal are verified.

Compared desktop and phone open/closed captures. No outer page scroll, chart clipping or panel/chart overlap remained at widths 320–1920, including 390x640 and 844x390. Existing colors, navigation, logo and type remain in use. No new illustration assets are needed.

Chart requests now use 2x density independently of screen width and 4x on displays above 2x pixel density. Requests remain bounded by the FAA cache: sectional 8–12, terminal 10–12, low 7–12 and high 5–9. Service metadata was verified directly. Fresh chart opacity defaults to 100%; existing user settings remain respected. The dated CONUS overview was regenerated at 5632x3456 using 128 pixels per source tile instead of 48, with higher WebP quality. This increases its download from about 0.38MB to 6.29MB; detailed tiles still have the published source resolution ceiling.

Source and built-output checks pass for route building, navlog, all planning views, chart density/source limits, 3x display initialization, public layers, native layers, map links/restoration, print output, keyboard focus and outside dismissal. External tile failures are intentional browser fixtures; fixture captures demonstrate geometry and fallback detail, not live coverage. A deployed preview is checked separately before delivery.

No unresolved P0/P1/P2 layout findings. Production remains unchanged pending approval of these changes.
