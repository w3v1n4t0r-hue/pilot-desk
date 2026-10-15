# Planner workspace layout verification

final result: passed

A passive screenshot of the selected planning reference was compared with desktop and phone implementation captures in a single contact sheet. No route was entered in the reference application. The adaptation retains PilotDesk's established black styling, navigation and no-page-scroll chart canvas; the visual target is the arrangement of controls, not copied branding, assets or application code.

The Flight plan view now groups saved aircraft selection, TAS, fuel burn, cruise altitude and UTC departure above route entry on desktop. Undo, redo, reverse and clear are together under the route field. Additional controls remain in More route tools. Distance, fuel, ETE, UTC ETA and wind basis occupy a pinned bottom strip. On phones, route entry is first and settings scroll horizontally within the dropdown. The chart stays below the dropdown and returns to full height when it closes.

Existing controls are moved rather than cloned, preserving listeners and saved values. The late-loaded aircraft selector is integrated after initialization; its reload controls, notes, draft notice and flight storage tools remain available in More route tools. UTC ETA uses the same departure interpretation and route duration as the existing planner.

Browser checks cover aircraft selection applying TAS/burn, grouping without duplicate controls, two-point route calculation, UTC ETA consistency, all planning views, public/native layers, link restoration, print, Escape/focus/outside dismissal, no outer page scrolling, chart/dropdown separation, widths 320–1920 and short portrait/landscape screens. The selected design comparison has no unresolved P0/P1/P2 layout findings.

Intentional differences: PilotDesk retains its centered top dropdown instead of covering the chart, existing branding and fonts, manual TAS/fuel inputs and the existing Build navlog action. No route recommendation service or new map data provider is introduced by this layout change.

Fixtures deliberately return unavailable live feeds. Their screenshots verify layout and existing fallback imagery, not current aviation data coverage. Production remains unchanged pending approval of the preview.
