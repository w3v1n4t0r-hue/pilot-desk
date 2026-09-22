const sectionDefinitions = [
  {
    label: 'Tools',
    paths: ['/tools.html', '/calculators/', '/weight-balance.html', '/e6b-flight-computer.html', '/flight-planning-workspace.html', '/history.html'],
    items: [
      ['/tools.html', 'All calculators', 'Browse every PilotDesk calculator by subject'],
      ['/e6b-flight-computer.html', 'E6B flight computer', 'Flight math in one place'],
      ['/weight-balance.html', 'Weight & balance', 'Build and save a loading scenario'],
      ['/flight-planning-workspace.html', 'Flight math', 'Wind, time, fuel, and descent calculations'],
      ['/history.html', 'Calculation history', 'Return to recent calculator results']
    ]
  },
  {
    label: 'Plan',
    paths: ['/planner.html', '/route-planner.html', '/airport.html', '/procedures.html', '/flights.html', '/flight-brief.html', '/aircraft.html', '/poh-chart-studio.html'],
    items: [
      ['/route-planner.html', 'Route planner', 'Build a route and navlog'],
      ['/airport.html', 'Airport search', 'Runways, weather, and FAA procedures'],
      ['/procedures.html', 'Procedures', 'Find instrument procedures'],
      ['/aircraft.html', 'Aircraft', 'Your aircraft profiles and planning numbers'],
      ['/flights.html', 'Saved flights', 'Return to flights you saved'],
      ['/flight-brief.html', 'Flight brief', 'Review your current flight'],
      ['/poh-chart-studio.html', 'Aircraft performance', 'Work with your approved chart data']
    ]
  },
  {
    label: 'Weather',
    paths: ['/weather.html', '/metar-decoder.html'],
    items: [
      ['/weather.html', 'METAR & TAF', 'Current airport weather'],
      ['/metar-decoder.html', 'METAR decoder', 'Break down an aviation weather report'],
      ['/airport.html', 'Airport weather', 'Weather in airport context']
    ]
  },
  {
    label: 'Learn',
    paths: ['/written-prep.html', '/skill-gap.html', '/flight-training.html', '/guides.html', '/guides/', '/training/', '/daily/', '/checklist-trainer.html'],
    items: [
      ['/written-prep.html', 'Written Prep', 'PPL through ATP written-test study'],
      ['/skill-gap.html', 'Weak subjects', 'Find subjects that need more work'],
      ['/flight-training.html', 'Flight training', 'Study material organized by certificate'],
      ['/guides.html', 'Pilot guides', 'Checkride, systems, weather, and flight-planning guides'],
      ['/daily/', 'Daily challenge', 'Three questions to keep learning'],
      ['/checklist-trainer.html', 'Checklist practice', 'Practice flows between lessons'],
      ['/training/acs-far-reference.html', 'ACS & FAR reference', 'Official FAA study sources by rating'],
      ['/training/certificates-ratings.html', 'Certificates & ratings', 'See the FAA certificate path and ratings'],
      ['/learn/oral-exam/', 'Oral exam guide', 'Practice checkride subjects by rating']
    ]
  }
];

const featuredSearch = [
  ['All calculators', '/tools.html', 'calculator tools directory'],
  ['Crosswind calculator', '/calculators/crosswind/', 'calculator wind component runway'],
  ['Density altitude', '/calculators/density-altitude/', 'calculator performance weather'],
  ['Glide distance', '/calculators/glide-range/', 'calculator emergency performance'],
  ['Fuel required', '/calculators/fuel-required/', 'calculator fuel planning'],
  ['Top of descent', '/calculators/top-of-descent/', 'calculator descent planning'],
  ['Weight & balance', '/weight-balance.html', 'loading cg aircraft'],
  ['E6B flight computer', '/e6b-flight-computer.html', 'flight math'],
  ['Route planner', '/route-planner.html', 'plan navlog flight'],
  ['Airport search', '/airport.html', 'runway airport weather procedures'],
  ['Procedures', '/procedures.html', 'approach departure instrument'],
  ['Aircraft', '/aircraft.html', 'hangar profile poh'],
  ['Weather', '/weather.html', 'metar taf'],
  ['METAR decoder', '/metar-decoder.html', 'weather decode'],
  ['Written Prep', '/written-prep.html', 'faa written ppl instrument commercial cfi atp'],
  ['Weak subjects', '/skill-gap.html', 'study weak subjects'],
  ['Flight training', '/flight-training.html', 'training checkride study'],
  ['Pilot guides', '/guides.html', 'guides checkride aviation'],
  ['PilotDesk Daily', '/daily/', 'daily questions challenge'],
  ['Account', '/account.html', 'sign in profile progress'],
  ['PilotDesk plans', '/pricing.html', 'free pro flight school pricing sync training']
];

export const homeActions = [
  ['/route-planner.html', 'Plan a Flight', 'Route, weather, procedures, and aircraft.', 'M5 18h22M16 4v24M9 18l3-8h8l3 8M11 24h10'],
  ['/tools.html', 'Use a Calculator', 'Flight math, performance, fuel, W&B, and E6B.', 'M7 4h18v24H7zM10 9h12M11 15h2m3 0h2m3 0h1M11 20h2m3 0h2m3 0h1M11 24h2m3 0h6'],
  ['/written-prep.html', 'Study for a Written', 'Written prep, weak areas, FAA standards, and review.', 'M5 7c4-2 8-1 11 2v18c-3-3-7-4-11-2V7Zm22 0c-4-2-8-1-11 2v18c3-3 7-4 11-2V7Z'],
  ['/daily/', 'Play Daily', 'Three aviation questions. New challenge every day.', 'M7 25V17h4v8M14 25V11h4v14M21 25V6h4v19']
];

export const popularTools = [
  ['/weight-balance.html', 'Weight & Balance', 'M16 5v22M7 9h18M10 9 5 19h10L10 9Zm12 0-5 10h10L22 9ZM11 27h10'],
  ['/calculators/fuel-required/', 'Fuel Planning', 'M6 5h14v22H6zM9 9h8v6H9zM20 9h3l3 4v10a3 3 0 0 1-6 0V11'],
  ['/calculators/density-altitude/', 'Density Altitude', 'M16 7a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 10 6-6M10 24h12'],
  ['/calculators/crosswind/', 'Crosswind', 'M6 8h15c4 0 4 6 0 6h-5M6 15h9c4 0 4 6 0 6h-3M6 22h5'],
  ['/e6b-flight-computer.html', 'E6B', 'M16 5a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'],
  ['/weather.html', 'METAR / TAF', 'M9 23h14a5 5 0 0 0 1-10 8 8 0 0 0-15-1 5.5 5.5 0 0 0 0 11Z'],
  ['/airport.html', 'Airport Info', 'M16 4v24M10 8h12M9 28h14M12 13h8M11 18h10M13 23h6'],
  ['/route-planner.html', 'Flight Plan', 'M7 5h18v22H7zM11 10h10M11 15h10M11 20h6']
];

export const homeCategories = [
  ['/tools.html', 'Tools', 'Calculators, E6B, W&B, conversions, and flight math.', 'M8 25 24 9M10 10l5-5 7 7-5 5M6 26l5-1-4-4-1 5Z'],
  ['/route-planner.html', 'Plan', 'Routes, airports, procedures, aircraft, and saved flights.', 'M5 21 27 9M13 17l-2 9 5-5 7 3-2-9M5 21l5 1'],
  ['/weather.html', 'Weather', 'METARs, TAFs, airport weather, and weather tools.', 'M8 23h15a5 5 0 0 0 0-10 8 8 0 0 0-15-1 5.5 5.5 0 0 0 0 11Z'],
  ['/flight-training.html', 'Learn', 'Written prep, weak subjects, flight training, and pilot guides.', 'M5 7c4-2 8-1 11 2v18c-3-3-7-4-11-2V7Zm22 0c-4-2-8-1-11 2v18c3-3 7-4 11-2V7Z']
];

export const footerLinks = [
  ['/about.html', 'About'],
  ['/feedback.html', 'Contact'],
  ['/legal/terms.html', 'Terms'],
  ['/legal/privacy.html', 'Privacy']
];

import inventory from './inventory.json' with { type: 'json' };
export const searchable = [...new Map([...featuredSearch, ...inventory.map(x => [x.title, x.href, `${x.type} ${x.group} ${x.title}`.toLowerCase()])].map(x => [x[1], x])).values()];

export const navSections = ['Tools','Plan','Weather','Learn'].map(label => sectionDefinitions.find(s => s.label === label));
