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

const diningSpot = (id, name, area, coordinates, menu, mapGroup = null) => ({
  id, name, building: area, category: 'food', type: 'Dining', description: `${name} is listed by Temple University as a campus dining option.`,
  menu, menuUrl: 'https://www.temple.edu/life-temple/housing-dining/dining-options',
  area, coordinates, mapGroup, mapCategories: ['dining'],
  floors: [floor(`${id}-main`, 'Dining location', area, null, null, ['solo', 'small', 'large'], ['food'], null, 0, 'Check the vendor for current menu and hours.')],
});

const foodTruck = (name, coordinates, menu) => {
  const id = `truck-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  return {
    id, name, building: name, category: 'food', type: 'Food truck',
    description: menu, menu,
    area: 'Main Campus', coordinates, mapCategories: ['food-trucks'],
    floors: [floor(`${id}-main`, 'Food truck', 'Main Campus', null, null, ['solo', 'small'], ['food'], null, 0, 'Temple-listed food truck.')],
  };
};

const foodTruckSpots = [
  foodTruck('Vegan Tree', [39.9830373, -75.155345], 'Plant-based Asian dishes, including hot pot, noodles, and vegan burgers.'),
  foodTruck('Korea House', [39.9830034, -75.1550661], 'Korean dishes such as beef stir-fries and rice cakes.'),
  foodTruck('El Guaco Loco', [39.9831226, -75.1546584], 'Build-your-own tacos, quesadillas, and burritos.'),
  foodTruck('Burger Tank', [39.9829294, -75.154523], 'Specialty burgers, grilled cheese, tots, and fries.'),
  foodTruck('The Creperie Truck', [39.982916, -75.1544036], 'Sweet and savory crepes.'),
  foodTruck('Ray’s Truck', [39.9829006, -75.1542869], 'Classic breakfast options.'),
  foodTruck('Top Bap', [39.9828883, -75.1541863], 'Korean dishes including bibimbap, bulgogi, and spicy chicken.'),
  foodTruck('Samosa Deb', [39.9828245, -75.1537169], 'Indian dishes including saag paneer and rice pilaf.'),
  foodTruck('Cloud', [39.9828081, -75.1535842], 'Freshly brewed coffee and bagels.'),
  foodTruck('Richie’s Lunch Box', [39.9827916, -75.15345], 'Breakfast bagels, hoagies, and coffee.'),
  foodTruck('Honey', [39.9825327, -75.1532449], 'Korean-inspired lunch, including burgers.'),
  foodTruck('Foot Long', [39.982279, -75.1532945], 'Six-inch and foot-long sandwiches, including grilled chicken and cheesesteak options.'),
  foodTruck('Temple Teppanyaki', [39.9821494, -75.1533267], 'Japanese-Korean fusion, including teppanyaki, kalbi, and fried chicken wings.'),
  foodTruck('Brother’s Pizza', [39.9820179, -75.1533508], 'Pizza, wraps, and pizza rolls.'),
  foodTruck('Philly Fellas Gyro Halal', [39.9818843, -75.1533777], 'Gyros, falafel, lamb over rice, hummus, and American-style platters.'),
  foodTruck('Jamaican D’s', [39.9801435, -75.1570912], 'Jamaican favorites such as jerk chicken, curry goat, and beef patties.'),
  foodTruck('Kobawoo Express', [39.9801106, -75.1568471], 'Korean plates including kalbi beef and kimchi jjim.'),
  foodTruck('Fruit Salad', [39.9800942, -75.1567143], 'Fruit salads and fruit smoothies.'),
  foodTruck('Chop Chop', [39.9800366, -75.156194], 'Vietnamese food, including banh mi and pork platters.'),
  foodTruck('Chicken Heaven', [39.9800161, -75.1560652], 'Chicken dishes, plus breakfast sandwiches, falafel, and cheeseburgers.'),
  foodTruck('E&E Gourmet Express', [39.9799997, -75.1559418], 'Breakfast wraps, omelets, pancakes, cheesesteaks, and club sandwiches.'),
  foodTruck('The Fruit Salad & Smoothie Truck', [39.9799852, -75.1558211], 'Fruit salads and made-to-order smoothies.'),
  foodTruck('Ernie’s', [39.9799688, -75.1557031], 'Cheesesteaks, hoagies, salads, and gyros.'),
  foodTruck('Eppy’s Truck', [39.9799051, -75.1552016], 'Hot and cold sandwiches, fried bites, pasta, and salads.'),
  foodTruck('Cha Cha', [39.9798866, -75.1550647], 'Korean barbecue and bibimbap, plus Japanese-inspired rice and noodle dishes.'),
  foodTruck('Sexy Green Truck', [39.979866, -75.1549038], 'Pita sandwiches, salads, and vegetarian dishes.'),
  foodTruck('Eddie’s', [39.9798414, -75.1547402], 'Pizza, including plain slices and parmesan chicken-topped slices.'),
  foodTruck('Sunny Halal Food', [39.9798311, -75.1554416], 'Lamb, chicken, or falafel served over rice, in salads, or in pita.'),
  foodTruck('Ebi’s Lunch Truck (Halal)', [39.9797654, -75.1554564], 'Grilled chicken seasoned with Indian spices.'),
  foodTruck('Caribbean Feast', [39.9796445, -75.1554865], 'Jamaican favorites such as jerk chicken and plantains, plus curries and vegetarian options.'),
  foodTruck('Famous NY Gyro (Halal)', [39.9797016, -75.1554745], 'Gyros and grilled lamb over rice.'),
  foodTruck('Halal Gyro Express', [39.9795865, -75.1554966], 'Gyros, meat over rice, and falafel over rice.'),
  foodTruck('Mexican Grill Stand', [39.979529, -75.1555087], 'Fish tacos and burritos, including chorizo, rice, and beans.'),
  foodTruck('Philly Halal Gyro', [39.9831976, -75.1547067], 'Mediterranean and Middle Eastern fare.'),
  foodTruck('Mountain Pizza', [39.9793306, -75.1508678], 'Pizza, wraps, meatball subs, cheesesteaks, and salads.'),
  foodTruck('New York Gyro', [39.9831077, -75.1547268], 'Gyros, meat over rice, and salads.'),
  foodTruck('Royal Tea', [39.980161, -75.1572816], 'Boba tea with pearls, popping boba, or jelly, plus Asian-inspired food.'),
  foodTruck('4 Brothers', [39.9822157, -75.1533026], 'Puerto Rican breakfast, sandwiches, and entrees.'),
  foodTruck('Tasty Eats', [39.9831935, -75.1546369], 'Comfort food, breakfast and lunch, soft-serve ice cream, and water ice.'),
  foodTruck('Little Lulu', [39.9830188, -75.1552136], 'Taiwanese savory snacks and boba tea.'),
  foodTruck('Tommy’s Lunch Truck', [39.9801209, -75.1569678], 'American dishes, including cheesesteaks and breakfast sandwiches.'),
];

const diningSpots = [
  diningSpot('esposito-dining', 'Louis J. Esposito Dining Center', 'Johnson & Hardwick Halls', [39.98347, -75.15554], 'All-you-care-to-eat dining hall with rotating meals; check the current menu online.'),
  diningSpot('morgan-food-court', 'Morgan Hall Food Court', 'Morgan Hall', [39.97872, -75.15565], 'Food-court choices from multiple vendors; menus vary by counter.'),
  diningSpot('aztecas', 'Aztecas Mexican Grill', '12th Street Vendor Pad', [39.98102, -75.15718], 'Mexican-style food.', '12th-street-vendors'),
  diningSpot('eddies-pizza', 'Eddie’s Pizza', '12th Street Vendor Pad', [39.98102, -75.15718], 'Pizza, slices, and pizza-shop favorites.', '12th-street-vendors'),
  diningSpot('fames-pizza', 'Fame’s Pizza', '12th Street Vendor Pad', [39.98102, -75.15718], 'Pizza and pizza-shop favorites.', '12th-street-vendors'),
  diningSpot('hanks', 'Hank’s', '12th Street Vendor Pad', [39.98102, -75.15718], 'Temple does not publish this vendor’s menu details; check with the vendor for current offerings.', '12th-street-vendors'),
  diningSpot('richies-deli', 'Richie’s Deli', '12th Street Vendor Pad', [39.98102, -75.15718], 'Deli sandwiches and quick bites.', '12th-street-vendors'),
  diningSpot('orient-express', 'Orient Express', '12th Street Vendor Pad', [39.98102, -75.15718], 'Asian-inspired quick-service food.', '12th-street-vendors'),
  diningSpot('tais-vietnamese', 'Tai’s Vietnamese', '12th Street Vendor Pad', [39.98102, -75.15718], 'Vietnamese food.', '12th-street-vendors'),
  diningSpot('seven-eleven', '7-Eleven', 'Liacouras Walk', [39.98072, -75.15567], 'Convenience-store snacks, drinks, and grab-and-go items.', 'liacouras-walk-vendors'),
  diningSpot('master-wok', 'Master Wok', 'Liacouras Walk', [39.98072, -75.15567], 'Chinese-style wok dishes.', 'liacouras-walk-vendors'),
  diningSpot('maxis', 'Maxi’s', 'Liacouras Walk', [39.98072, -75.15567], 'Temple does not publish this vendor’s menu details; check with the vendor for current offerings.', 'liacouras-walk-vendors'),
  diningSpot('playa-bowls', 'Playa Bowls', 'Liacouras Walk', [39.98072, -75.15567], 'Fruit and açai bowls, smoothies, and other fresh options.', 'liacouras-walk-vendors'),
  diningSpot('saxbys', 'Saxbys', 'Liacouras Walk', [39.98072, -75.15567], 'Coffee, tea, and café food.', 'liacouras-walk-vendors'),
  diningSpot('subway', 'Subway', 'Liacouras Walk', [39.98072, -75.15567], 'Made-to-order sandwiches, wraps, and salads.', 'liacouras-walk-vendors'),
];

// Counts, noise and timestamps are sample data for the prototype.
export const spots = [
  {
    id: 'charles-library', name: 'Charles Library', building: 'Charles Library', category: 'study', type: 'Library',
    description: 'A mix of open study areas, group rooms, and quieter corners.', area: 'Polett Walk', position: { x: 53, y: 38 }, coordinates: [39.98104, -75.15593], mapCategories: ['study', 'academic'],
    floors: [
      floor('charles-1', '1st floor', '24/7 Study Area', 3, 2, ['solo', 'small'], ['outlets', 'computers', 'food'], 13, 18, 'Open study area near the library entrance.'),
      floor('charles-2', '2nd floor', 'Open study tables', 4, 3, ['solo', 'small', 'large'], ['outlets', 'computers', 'whiteboards'], 22, 9, 'Good for a quick study session between classes.'),
      floor('charles-3', '3rd floor', 'Open Reading Area', 2, 2, ['solo', 'small'], ['outlets', 'books'], 8, 12, 'A quieter place to settle in with a book.'),
      floor('charles-4', '4th floor', 'Quiet Reading Room', 1, 1, ['solo'], ['outlets', 'books'], 6, 21, 'Temple Libraries identifies the fourth-floor reading room as a quiet study space.'),
    ],
  },
  {
    id: 'tech-center', name: 'TECH Center', building: 'TECH Center', category: 'study', type: 'Study + technology', mapCategories: ['study', 'academic'],
    description: 'Study, collaborate, or find a computer workstation.', area: 'North Broad Street', position: { x: 69, y: 55 }, coordinates: [39.98162, -75.15476],
    floors: [floor('tech-main', 'Main level', 'Open study area', 4, 3, ['small', 'large'], ['outlets', 'computers', 'whiteboards'], 18, 14, 'Temple ITS lists computer labs and breakout rooms at the TECH Center.')],
  },
  {
    id: 'student-center', name: 'Student Center North', building: 'Student Center North', category: 'study', type: 'Sit-down area',
    description: 'Drop in for a short break or meet up with classmates.', area: 'Liacouras Walk', position: { x: 33, y: 59 }, coordinates: [39.98042, -75.15545],
    floors: [floor('student-north-lounge', 'Main level', 'Lounge seating', 3, 3, ['small', 'large'], ['outlets', 'food'], 36, 6, 'A flexible sit-down space near campus dining.')],
  },
  {
    id: 'wachman-hall', name: 'Wachman Hall', building: 'Wachman Hall', category: 'study', type: 'Quiet corner', mapCategories: ['study', 'academic'],
    description: 'A tucked-away place for independent work.', area: 'Polett Walk', position: { x: 41, y: 28 }, coordinates: [39.98234, -75.15583],
    floors: [floor('wachman-3', '3rd floor', 'Window-side tables', 1, 1, ['solo', 'small'], ['outlets'], 43, 5, 'Sample entry to show how an off-the-main-path spot might appear.')],
  },
  {
    id: 'student-center-food', name: 'Walker Food Court', building: 'Howard Gittis Student Center', category: 'food', type: 'Dining',
    description: 'A convenient place to grab a bite and sit down.', menu: 'Food-court choices from multiple vendors; menus vary by counter.', menuUrl: 'https://www.temple.edu/life-temple/housing-dining/dining-options', area: 'Student Center', position: { x: 33, y: 68 }, coordinates: [39.97982, -75.15545],
    floors: [floor('food-court', 'Main level', 'Food Court', 4, 4, ['small', 'large'], ['outlets', 'food'], 31, 4, 'Food Court is listed by Temple among its dining options.')],
  },
  {
    id: 'ibc-rec', name: 'IBC Student Recreation Center', building: 'Independence Blue Cross Student Recreation Center', category: 'recreation', type: 'Recreation',
    description: 'Move, play, or take a break from studying.', area: 'Main Campus', position: { x: 72, y: 75 }, coordinates: [39.97906, -75.15361],
    floors: [floor('ibc-main', 'Main level', 'Recreation space', 3, 3, ['small', 'large'], ['outlets'], 54, 7, 'Listed as a Campus Recreation facility by Temple University.')],
  },
  {
    id: 'aramark-star-weight-room', name: 'Aramark STAR Complex Weight Room', building: 'Aramark STAR Complex', category: 'recreation', type: 'Fitness',
    description: 'Temple Campus Recreation’s weightlifting facility, with strength equipment and barbell training stations.', area: '15th & Montgomery', coordinates: [39.9811, -75.1596],
    floors: [floor('aramark-star-main', 'Weight room', 'Aramark STAR Complex', null, null, ['solo', 'small', 'large'], [], null, 0, 'At 1800 N. 15th St., enter at 15th & Montgomery. Temple lists 50+ pieces of strength equipment; check Campus Recreation for current hours.')],
  },
  {
    id: 'pearson-mcg-rec-courts', name: 'Pearson/McGonigle 3rd Floor Rec Courts', building: 'Pearson and McGonigle Halls', category: 'recreation', type: 'Recreation',
    description: 'Indoor courts for basketball, volleyball, badminton, table tennis, and an indoor golf driving range.', area: '3rd floor · 1800 N. Broad St.', coordinates: [39.98103, -75.15803],
    floors: [floor('pearson-mcg-courts', '3rd floor', 'Recreation courts', null, null, ['solo', 'small', 'large'], [], null, 0, 'Temple Campus Recreation lists the courts at 1800 N. Broad St. Check Campus Recreation for current hours and access details.')],
  },
  ...diningSpots,
  ...foodTruckSpots,
];

export const initialSuggestions = [
  {
    id: 'suggestion-anderson', name: 'Anderson Hall window seats', building: 'Anderson Hall', category: 'study', type: 'Student suggestion', community: true, mapCategories: ['study', 'academic', 'community'],
    description: 'A sunny place to read or work between classes.', area: 'Polett Walk', position: { x: 43, y: 45 }, coordinates: [39.98096, -75.15700],
    floors: [floor('anderson-window', '2nd floor', 'Window-side seats', null, null, ['solo'], ['outlets'], null, 0, 'Demo community suggestion; details have not been verified.')],
  },
  {
    id: 'suggestion-garden', name: 'Garden-side table', building: 'Student Center North', category: 'study', type: 'Student suggestion', community: true, mapCategories: ['study', 'community'],
    description: 'A calm spot to sit outside when the weather is nice.', area: 'Student Center North', position: { x: 26, y: 53 }, coordinates: [39.98064, -75.15553],
    floors: [floor('garden-table', 'Outdoor area', 'Garden-side table', null, null, ['solo', 'small'], [], null, 0, 'Demo community suggestion; details have not been verified.')],
  },
];

export const amenityLabels = {
  outlets: 'Outlets', computers: 'Computers', whiteboards: 'Whiteboards',
  books: 'Books', games: 'Games', food: 'Food nearby',
};
