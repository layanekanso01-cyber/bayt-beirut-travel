// Real photography from Wikimedia Commons. These replace the generated placeholder images.
const commonsImage = (fileName: string, width = 1200) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const heroImg = commonsImage('Pigeon Rocks at sunset, Beirut, Lebanon.jpg');
const ruinsImg = commonsImage('Lebanon, Baalbek, Temple of Bacchus in Baalbek.jpg');
const foodImg = commonsImage('Mezze platter.jpg');
const cedarsImg = commonsImage('Forest of The cedars of God.jpg');
const beirutImg = commonsImage('Pigeon Rocks of Beirut, Rock of Raouche, Beirut, Lebanon.jpg');
const byblosImg = commonsImage('Byblos Castle, Byblos, Lebanon.jpg');
const jeitaImg = commonsImage('Jeita Grotto ITH044.jpg');
const harissaImg = commonsImage('Our Lady Of Lebanon Harissa.jpg');
const tripoliImg = commonsImage('TripoliLebCitadel1.jpg');
const sidonImg = commonsImage('Sidon Sea Castle, Mediterranean Sea, Sidon, Lebanon.jpg');
const qadishaImg = commonsImage('View of Kadisha Valley, Lebanon.jpg');
const tyreImg = commonsImage('Tyre Ruins-Roman Tomb.jpg');
const corollaImg = commonsImage('Toyota Corolla Sedan (48935753002).jpg');
const rangeRoverImg = commonsImage('Range Rover Sport (14924793318).jpg');
const sClassImg = commonsImage('Mercedes S-Class W221 black (1).jpg');
const vClassImg = commonsImage('Mercedes-Benz V-class Black.jpg');

export type Region = {
  id: number;
  name: string;
  description: string;
  image: string;
  latitude?: number;
  longitude?: number;
};

export type POIType = 'spot' | 'restaurant' | 'shop';
export type ActivityType = 'hiking' | 'nightlife' | 'culture' | 'beaches' | 'nature' | 'food' | 'shopping';

export type POI = {
  id: number;
  name: string;
  description: string;
  rating: number;
  regionId: number;
  type: POIType;
  image: string;
  latitude?: number;
  longitude?: number;
  activities?: ActivityType[];
  entranceFee?: number;
  spotType?: string;
  cuisineType?: string;
  averagePrice?: number;
  category?: string;
  priceRange?: string;
};

export const regions: Region[] = [
  {
    id: 1,
    name: "Beirut",
    description: "The vibrant capital, a mix of modern nightlife and rich history.",
    image: beirutImg,
    latitude: 33.8736,
    longitude: 35.1264
  },
  {
    id: 2,
    name: "Bekaa Valley",
    description: "Home to ancient Roman temples and beautiful vineyards.",
    image: ruinsImg,
    latitude: 34.0052,
    longitude: 36.2116
  },
  {
    id: 3,
    name: "Mount Lebanon",
    description: "Breathtaking mountains, ski resorts, and ancient cedar forests.",
    image: cedarsImg,
    latitude: 34.2495,
    longitude: 36.0623
  },
  {
    id: 4,
    name: "Byblos (Jbeil)",
    description: "One of the oldest continuously inhabited cities in the world.",
    image: byblosImg,
    latitude: 34.1211,
    longitude: 35.6478
  },
  {
    id: 5,
    name: "Tripoli",
    description: "A historic city known for its medieval architecture and souks.",
    image: tripoliImg,
    latitude: 34.4356,
    longitude: 35.8400
  },
  {
    id: 6,
    name: "South Lebanon",
    description: "Coastal beauty with ancient ruins and Mediterranean charm.",
    image: sidonImg,
    latitude: 33.5636,
    longitude: 35.3706
  },
  {
    id: 7,
    name: "Chouf",
    description: "Mountain region with cedar reserves and scenic landscapes.",
    image: cedarsImg,
    latitude: 33.7731,
    longitude: 35.5769
  },
];

export type RegionWithCoords = Region & { latitude?: number; longitude?: number };

export const pois: POI[] = [
  {
    id: 100,
    name: "Baalbek Roman Temples",
    description: "Massive Roman temple complex, among the largest temples ever built in the Roman Empire.",
    rating: 4.9,
    regionId: 2,
    type: 'spot',
    image: ruinsImg,
    latitude: 34.0052,
    longitude: 36.2116,
    activities: ['culture'],
    entranceFee: 12,
    spotType: 'Historical'
  },
  {
    id: 101,
    name: "Cedars of God",
    description: "Ancient cedar forests in the heart of the mountains, a UNESCO World Heritage Site.",
    rating: 4.9,
    regionId: 3,
    type: 'spot',
    image: cedarsImg,
    latitude: 34.2495,
    longitude: 36.0623,
    activities: ['nature', 'hiking'],
    entranceFee: 5,
    spotType: 'Nature'
  },
  {
    id: 103,
    name: "Raouche Rocks",
    description: "Iconic rock formations off the coast of Raouche, a must-see natural landmark.",
    rating: 4.5,
    regionId: 1,
    type: 'spot',
    image: heroImg,
    latitude: 33.8951,
    longitude: 35.4692,
    activities: ['nature', 'beaches'],
    entranceFee: 0,
    spotType: 'Nature'
  },
  {
    id: 104,
    name: "Jeita Grotto",
    description: "A stunning system of interconnected limestone caves and underground river.",
    rating: 4.9,
    regionId: 3,
    type: 'spot',
    image: jeitaImg,
    latitude: 33.9475,
    longitude: 35.6386,
    activities: ['nature'],
    entranceFee: 20,
    spotType: 'Nature'
  },
  {
    id: 105,
    name: "Byblos Castle",
    description: "A 12th-century Crusader castle built by the Genoese, overlooking the ancient harbor.",
    rating: 4.7,
    regionId: 4,
    type: 'spot',
    image: byblosImg,
    latitude: 34.1211,
    longitude: 35.6478,
    activities: ['culture', 'beaches'],
    entranceFee: 8,
    spotType: 'Historical'
  },
  {
    id: 106,
    name: "Harissa",
    description: "Home to the Our Lady of Lebanon statue with panoramic views of Jounieh Bay.",
    rating: 4.6,
    regionId: 3,
    type: 'spot',
    image: harissaImg,
    latitude: 33.9792,
    longitude: 35.6375,
    activities: ['culture', 'nature'],
    entranceFee: 0,
    spotType: 'Religious'
  },
  {
    id: 107,
    name: "Citadel of Raymond de Saint-Gilles",
    description: "A historic Crusader fortress in Tripoli offering views of the old city.",
    rating: 4.4,
    regionId: 5,
    type: 'spot',
    image: tripoliImg,
    latitude: 34.4356,
    longitude: 35.8400,
    activities: ['culture'],
    entranceFee: 5,
    spotType: 'Historical'
  },
  {
    id: 108,
    name: "Sidon Sea Castle",
    description: "A 13th-century castle built on a small island connected to the mainland.",
    rating: 4.5,
    regionId: 6,
    type: 'spot',
    image: sidonImg,
    latitude: 33.5636,
    longitude: 35.3706,
    activities: ['culture', 'beaches'],
    entranceFee: 6,
    spotType: 'Historical'
  },
  {
    id: 109,
    name: "Qadisha Valley",
    description: "A UNESCO World Heritage site with ancient monasteries carved into cliffs.",
    rating: 4.8,
    regionId: 3,
    type: 'spot',
    image: qadishaImg,
    latitude: 34.2564,
    longitude: 35.9389,
    activities: ['nature', 'hiking', 'culture'],
    entranceFee: 0,
    spotType: 'Nature'
  },
  {
    id: 110,
    name: "Mim Museum",
    description: "A private museum showcasing the world's finest mineral collection.",
    rating: 4.6,
    regionId: 1,
    type: 'spot',
    image: beirutImg,
    latitude: 33.8896,
    longitude: 35.5086,
    activities: ['culture'],
    entranceFee: 12,
    spotType: 'Museum'
  },
  {
    id: 115,
    name: "Chouf Cedar Reserve",
    description: "A stunning nature reserve in the Chouf Mountains featuring rare cedar trees and diverse wildlife.",
    rating: 4.8,
    regionId: 7,
    type: 'spot',
    image: cedarsImg,
    latitude: 33.6914,
    longitude: 35.7289,
    activities: ['nature', 'hiking'],
    entranceFee: 8,
    spotType: 'Nature'
  },
  {
    id: 116,
    name: "Damour River",
    description: "A scenic river valley in Chouf offering hiking trails and picturesque waterfall views.",
    rating: 4.5,
    regionId: 7,
    type: 'spot',
    image: qadishaImg,
    latitude: 33.6450,
    longitude: 35.6800,
    activities: ['nature', 'hiking'],
    entranceFee: 0,
    spotType: 'Nature'
  },
  {
    id: 117,
    name: "Gemmayze",
    description: "A lively Beirut neighborhood known for heritage buildings, cafes, bars, galleries, and walkable nightlife.",
    rating: 4.6,
    regionId: 1,
    type: 'spot',
    image: beirutImg,
    latitude: 33.8955,
    longitude: 35.5147,
    activities: ['nightlife', 'food', 'culture'],
    entranceFee: 0,
    spotType: 'Neighborhood'
  },
  {
    id: 118,
    name: "Downtown Beirut",
    description: "Central Beirut district with restored streets, landmarks, shopping, restaurants, and historical architecture.",
    rating: 4.5,
    regionId: 1,
    type: 'spot',
    image: beirutImg,
    latitude: 33.8943,
    longitude: 35.5063,
    activities: ['culture', 'food', 'shopping'],
    entranceFee: 0,
    spotType: 'City Walk'
  },
  {
    id: 111,
    name: "Tyre Ancient City",
    description: "One of the oldest cities in the world with Roman and Phoenician ruins.",
    rating: 4.7,
    regionId: 6,
    type: 'spot',
    image: tyreImg,
    latitude: 33.2746,
    longitude: 35.1945,
    activities: ['culture', 'beaches'],
    entranceFee: 8,
    spotType: 'Historical'
  },
  {
    id: 112,
    name: "Beaufort Castle",
    description: "A medieval fortress perched on a hilltop with views of the Mediterranean.",
    rating: 4.6,
    regionId: 6,
    type: 'spot',
    image: ruinsImg,
    latitude: 33.3672,
    longitude: 35.2850,
    activities: ['culture', 'nature'],
    entranceFee: 5,
    spotType: 'Historical'
  },
  {
    id: 200,
    name: "Tacos El Primo",
    description: "Authentic Lebanese mezze and shawarma restaurant with a cozy atmosphere.",
    rating: 4.7,
    regionId: 1,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.8758,
    longitude: 35.5019,
    activities: ['food', 'nightlife'],
    cuisineType: 'Lebanese',
    averagePrice: 15
  },
  {
    id: 201,
    name: "Al Reef Bakery",
    description: "Famous for its fresh manakish bread and traditional Lebanese pastries.",
    rating: 4.8,
    regionId: 1,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.8687,
    longitude: 35.5134,
    activities: ['food'],
    cuisineType: 'Lebanese',
    averagePrice: 8
  },
  {
    id: 202,
    name: "Zaituna Modern Lebanese",
    description: "Contemporary take on traditional Lebanese cuisine in a stylish setting.",
    rating: 4.6,
    regionId: 1,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.8834,
    longitude: 35.5001,
    activities: ['food', 'nightlife'],
    cuisineType: 'Lebanese',
    averagePrice: 25
  },
  {
    id: 203,
    name: "Grillades Charbel",
    description: "Known for grilled meats and seafood with a panoramic view of the city.",
    rating: 4.5,
    regionId: 1,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.8800,
    longitude: 35.4850,
    activities: ['food', 'nightlife'],
    cuisineType: 'Mediterranean',
    averagePrice: 30
  },
  {
    id: 204,
    name: "Enab Beirut",
    description: "Wine bar and restaurant offering Lebanese cuisine and fine wines.",
    rating: 4.4,
    regionId: 1,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.8900,
    longitude: 35.5050,
    activities: ['food', 'nightlife'],
    cuisineType: 'Lebanese',
    averagePrice: 28
  },
  {
    id: 205,
    name: "Abu Hassan",
    description: "Traditional Lebanese restaurant famous for hummus and falafel.",
    rating: 4.6,
    regionId: 5,
    type: 'restaurant',
    image: foodImg,
    latitude: 34.4341,
    longitude: 35.8356,
    activities: ['food'],
    cuisineType: 'Lebanese',
    averagePrice: 12
  },
  {
    id: 206,
    name: "Restaurant Barbar",
    description: "Established restaurant offering authentic Lebanese cuisine and seafood.",
    rating: 4.5,
    regionId: 6,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.5664,
    longitude: 35.3722,
    activities: ['food', 'beaches'],
    cuisineType: 'Lebanese',
    averagePrice: 20
  },
  {
    id: 207,
    name: "Cedars Grill",
    description: "Mountain restaurant offering grilled specialties and traditional Lebanese dishes.",
    rating: 4.5,
    regionId: 3,
    type: 'restaurant',
    image: foodImg,
    latitude: 33.9700,
    longitude: 35.6300,
    activities: ['food', 'nature'],
    cuisineType: 'Lebanese',
    averagePrice: 18
  },
  {
    id: 300,
    name: "Souk El Ahed",
    description: "Historic souk with traditional crafts, spices, and souvenirs from Lebanon.",
    rating: 4.3,
    regionId: 1,
    type: 'shop',
    image: beirutImg,
    latitude: 33.8858,
    longitude: 35.4998,
    activities: ['shopping', 'culture'],
    category: 'Traditional Market',
    priceRange: 'Budget-Friendly'
  },
  {
    id: 301,
    name: "Ashrafieh Designers",
    description: "Contemporary Lebanese fashion and design boutique with local designers.",
    rating: 4.5,
    regionId: 1,
    type: 'shop',
    image: beirutImg,
    latitude: 33.8768,
    longitude: 35.5231,
    activities: ['shopping'],
    category: 'Fashion',
    priceRange: 'Moderate'
  },
  {
    id: 302,
    name: "Beirut Spice Bazaar",
    description: "Exotic spices and ingredients from across the Middle East and Mediterranean.",
    rating: 4.4,
    regionId: 1,
    type: 'shop',
    image: beirutImg,
    latitude: 33.8902,
    longitude: 35.5045,
    activities: ['shopping', 'food'],
    category: 'Market',
    priceRange: 'Budget-Friendly'
  },
  {
    id: 303,
    name: "Cedar Crafts Co.",
    description: "Artisan crafts and souvenirs made by local Lebanese artisans.",
    rating: 4.6,
    regionId: 3,
    type: 'shop',
    image: beirutImg,
    latitude: 33.9800,
    longitude: 35.6350,
    activities: ['shopping', 'culture'],
    category: 'Crafts',
    priceRange: 'Moderate'
  },
  {
    id: 304,
    name: "Byblos Antique Market",
    description: "Antique shops and vintage treasures in the heart of ancient Byblos.",
    rating: 4.4,
    regionId: 4,
    type: 'shop',
    image: beirutImg,
    latitude: 34.1234,
    longitude: 35.6456,
    activities: ['shopping', 'culture'],
    category: 'Antiques',
    priceRange: 'Expensive'
  },
  {
    id: 305,
    name: "Tripoli Gold Souk",
    description: "Traditional gold and jewelry market with intricate Lebanese designs.",
    rating: 4.5,
    regionId: 5,
    type: 'shop',
    image: beirutImg,
    latitude: 34.4367,
    longitude: 35.8378,
    activities: ['shopping'],
    category: 'Jewelry',
    priceRange: 'Expensive'
  },
  {
    id: 306,
    name: "Sidon Purple Dye Workshop",
    description: "Traditional workshop producing famous Tyrian purple dye and textiles.",
    rating: 4.7,
    regionId: 6,
    type: 'shop',
    image: beirutImg,
    latitude: 33.5645,
    longitude: 35.3698,
    activities: ['shopping', 'culture'],
    category: 'Textiles',
    priceRange: 'Moderate'
  }
];

export const discountCodes: { [key: string]: { percentage: number; description: string } } = {
  "SUMMER20": { percentage: 20, description: "Summer discount - 20% off" },
  "GROUP15": { percentage: 15, description: "Group booking - 15% off" },
  "WELCOME10": { percentage: 10, description: "First-time visitor - 10% off" },
  "LOYALTY25": { percentage: 25, description: "Loyalty reward - 25% off" },
  "ADVENTURE30": { percentage: 30, description: "Adventure package - 30% off" },
};

export const mockBookings = [
  {
    id: 'demo-1',
    customerName: 'John Doe',
    carType: 'economy',
    carName: 'Toyota Corolla',
    distance: 45,
    pricePerKm: '1.50',
    totalPrice: '67.50',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];

export const cars = [
  {
    id: 1,
    name: "Toyota Corolla",
    type: "Economy",
    pricePerKm: 1.50,
    image: corollaImg,
    seats: 4,
    description: "Reliable and fuel-efficient, perfect for city driving."
  },
  {
    id: 2,
    name: "Range Rover Sport",
    type: "SUV",
    pricePerKm: 3.00,
    image: rangeRoverImg,
    seats: 5,
    description: "Comfort and style for exploring Lebanon's terrain."
  },
  {
    id: 3,
    name: "Mercedes S-Class",
    type: "Luxury",
    pricePerKm: 5.00,
    image: sClassImg,
    seats: 5,
    description: "Premium luxury sedan for a sophisticated journey."
  },
  {
    id: 4,
    name: "Mercedes V-Class",
    type: "Van",
    pricePerKm: 2.50,
    image: vClassImg,
    seats: 7,
    description: "Spacious van ideal for families and small groups."
  },
  {
    id: 5,
    name: "Standard Coach Bus",
    type: "Bus",
    pricePerKm: 0.8,
    image: vClassImg,
    seats: 45,
    description: "Comfortable coach bus for large groups, intercity travel with air conditioning."
  },
  {
    id: 6,
    name: "Deluxe Tour Bus",
    type: "Bus",
    pricePerKm: 1.2,
    image: vClassImg,
    seats: 50,
    description: "Premium tour bus with reclining seats, perfect for sightseeing tours across Lebanon."
  },
  {
    id: 7,
    name: "Minibus",
    type: "Bus",
    pricePerKm: 2.0,
    image: vClassImg,
    seats: 20,
    description: "Smaller bus for mid-sized groups, ideal for flexible travel plans."
  }
];
