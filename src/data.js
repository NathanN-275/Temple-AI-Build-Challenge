const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

const floor = (id, label, area, busyness, noise, groups, amenities, updatedMinutes, reports, detail = '') => ({
  id,
  label,
  area,
  busyness,
  noise,
  groups,
  amenities,
  outlets: amenities.includes('outlets'),
  updatedAt: updatedMinutes === null ? null : minutesAgo(updatedMinutes),
  reportCount: reports,
  detail,
});

const diningSpot = (id, name, area, coordinates, mapGroup = null) => ({
  id, name, building: area, category: 'food', type: 'Dining', description: `${name} is listed by Temple University as a campus dining option.`,
  area, coordinates, mapGroup,
  floors: [floor(`${id}-main`, 'Dining location', area, null, null, ['solo', 'small', 'large'], ['food'], null, 0, 'Temple dining listing · check Temple Dining for current hours.')],
});

const diningSpots = [
  diningSpot('esposito-dining', 'Louis J. Esposito Dining Center', 'Johnson & Hardwick Halls', [39.98347, -75.15554]),
  diningSpot('morgan-food-court', 'Morgan Hall Food Court', 'Morgan Hall', [39.97872, -75.15565]),
  diningSpot('aztecas', 'Aztecas Mexican Grill', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('eddies-pizza', 'Eddie’s Pizza', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('fames-pizza', 'Fame’s Pizza', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('hanks', 'Hank’s', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('richies-deli', 'Richie’s Deli', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('orient-express', 'Orient Express', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('tais-vietnamese', 'Tai’s Vietnamese', '12th Street Vendor Pad', [39.98102, -75.15718], '12th-street-vendors'),
  diningSpot('seven-eleven', '7-Eleven', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
  diningSpot('master-wok', 'Master Wok', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
  diningSpot('maxis', 'Maxi’s', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
  diningSpot('playa-bowls', 'Playa Bowls', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
  diningSpot('saxbys', 'Saxbys', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
  diningSpot('subway', 'Subway', 'Liacouras Walk', [39.98072, -75.15567], 'liacouras-walk-vendors'),
];

// Counts, noise and timestamps are sample data for the prototype.
export const spots = [
  {
    id: 'charles-library', name: 'Charles Library', building: 'Charles Library', category: 'study', type: 'Library',
    description: 'A mix of open study areas, group rooms, and quieter corners.', area: 'Polett Walk', position: { x: 53, y: 38 }, coordinates: [39.98104, -75.15593],
    floors: [
      floor('charles-1', '1st floor', '24/7 Study Area', 3, 2, ['solo', 'small'], ['outlets', 'computers', 'food'], 13, 18, 'Open study area near the library entrance.'),
      floor('charles-2', '2nd floor', 'Open study tables', 4, 3, ['solo', 'small', 'large'], ['outlets', 'computers', 'whiteboards'], 22, 9, 'Good for a quick study session between classes.'),
      floor('charles-3', '3rd floor', 'Open Reading Area', 2, 2, ['solo', 'small'], ['outlets', 'books'], 8, 12, 'A quieter place to settle in with a book.'),
      floor('charles-4', '4th floor', 'Quiet Reading Room', 1, 1, ['solo'], ['outlets', 'books'], 6, 21, 'Temple Libraries identifies the fourth-floor reading room as a quiet study space.'),
    ],
  },
  {
    id: 'tech-center', name: 'TECH Center', building: 'TECH Center', category: 'study', type: 'Study + technology',
    description: 'Study, collaborate, or find a computer workstation.', area: 'North Broad Street', position: { x: 69, y: 55 }, coordinates: [39.98162, -75.15476],
    floors: [floor('tech-main', 'Main level', 'Open study area', 4, 3, ['small', 'large'], ['outlets', 'computers', 'whiteboards'], 18, 14, 'Temple ITS lists computer labs and breakout rooms at the TECH Center.')],
  },
  {
    id: 'student-center', name: 'Student Center North', building: 'Student Center North', category: 'study', type: 'Sit-down area',
    description: 'Drop in for a short break or meet up with classmates.', area: 'Liacouras Walk', position: { x: 33, y: 59 }, coordinates: [39.98042, -75.15545],
    floors: [floor('student-north-lounge', 'Main level', 'Lounge seating', 3, 3, ['small', 'large'], ['outlets', 'food'], 36, 6, 'A flexible sit-down space near campus dining.')],
  },
  {
    id: 'wachman-hall', name: 'Wachman Hall', building: 'Wachman Hall', category: 'study', type: 'Quiet corner',
    description: 'A tucked-away place for independent work.', area: 'Polett Walk', position: { x: 41, y: 28 }, coordinates: [39.98234, -75.15583],
    floors: [floor('wachman-3', '3rd floor', 'Window-side tables', 1, 1, ['solo', 'small'], ['outlets'], 43, 5, 'Sample entry to show how an off-the-main-path spot might appear.')],
  },
  {
    id: 'student-center-food', name: 'Walker Food Court', building: 'Howard Gittis Student Center', category: 'food', type: 'Dining',
    description: 'A convenient place to grab a bite and sit down.', area: 'Student Center', position: { x: 33, y: 68 }, coordinates: [39.97982, -75.15545],
    floors: [floor('food-court', 'Main level', 'Food Court', 4, 4, ['small', 'large'], ['outlets', 'food'], 31, 4, 'Food Court is listed by Temple among its dining options.')],
  },
  {
    id: 'ibc-rec', name: 'IBC Student Recreation Center', building: 'Independence Blue Cross Student Recreation Center', category: 'recreation', type: 'Recreation',
    description: 'Move, play, or take a break from studying.', area: 'Main Campus', position: { x: 72, y: 75 }, coordinates: [39.97906, -75.15361],
    floors: [floor('ibc-main', 'Main level', 'Recreation space', 3, 3, ['small', 'large'], ['outlets'], 54, 7, 'Listed as a Campus Recreation facility by Temple University.')],
  },
  ...diningSpots,
];

export const initialSuggestions = [
  {
    id: 'suggestion-anderson', name: 'Anderson Hall window seats', building: 'Anderson Hall', category: 'study', type: 'Student suggestion', community: true,
    description: 'A sunny place to read or work between classes.', area: 'Polett Walk', position: { x: 43, y: 45 }, coordinates: [39.98096, -75.15700],
    floors: [floor('anderson-window', '2nd floor', 'Window-side seats', null, null, ['solo'], ['outlets'], null, 0, 'Demo community suggestion; details have not been verified.')],
  },
  {
    id: 'suggestion-garden', name: 'Garden-side table', building: 'Student Center North', category: 'study', type: 'Student suggestion', community: true,
    description: 'A calm spot to sit outside when the weather is nice.', area: 'Student Center North', position: { x: 26, y: 53 }, coordinates: [39.98064, -75.15553],
    floors: [floor('garden-table', 'Outdoor area', 'Garden-side table', null, null, ['solo', 'small'], [], null, 0, 'Demo community suggestion; details have not been verified.')],
  },
];

export const amenityLabels = {
  outlets: 'Outlets', computers: 'Computers', whiteboards: 'Whiteboards',
  books: 'Books', games: 'Games', food: 'Food nearby',
};
