# PilotDesk calculator animation objects

Nine transparent SVG objects derived from the verified Higgsfield scene linked in manifest.json. Shapes have named data-part groups for Motion transforms. This adds assets only; it does not alter calculator formulas, layouts, charts or runtime behaviour.

Use the SVG markup inline to animate individual parts. Standalone img elements animate as a whole. The common viewBox is -5 -5 10 10. Coordinates use SVG orientation: positive y points down; positive rotation is clockwise. Aircraft plan and wind arrow point up; aircraft profile points right. The wind arrow points in the direction of flow: a meteorological wind-from bearing needs a 180-degree reversal.

manifest.json contains pivots and part names. Fuel segment sizes are design placeholders; calculator code must set them from validated data. Aircraft and runway geometry are generic symbols, not aircraft-specific measurements or official chart symbology.

The editable 3D source remains in Higgsfield at revision 1. No additional 3D runtime is needed to display these SVGs.
