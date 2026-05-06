import type { ActivityType, POI, POIType } from "@/lib/data";

type DbPoi = {
  poiId: string | number;
  name: string;
  description?: string | null;
  rating?: string | number | null;
  regionId?: string | number | null;
};

const commonsImage = (fileName: string, width = 1200) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const imageByKeyword: Array<[string, string]> = [
  ["baalbek", commonsImage("Lebanon, Baalbek, Temple of Bacchus in Baalbek.jpg")],
  ["cedar", commonsImage("Forest of The cedars of God.jpg")],
  ["raouche", commonsImage("Pigeon Rocks of Beirut, Rock of Raouche, Beirut, Lebanon.jpg")],
  ["jeita", commonsImage("Jeita Grotto ITH044.jpg")],
  ["byblos", commonsImage("Byblos Castle, Byblos, Lebanon.jpg")],
  ["harissa", commonsImage("Our Lady Of Lebanon Harissa.jpg")],
  ["tripoli", commonsImage("TripoliLebCitadel1.jpg")],
  ["sidon", commonsImage("Sidon Sea Castle, Mediterranean Sea, Sidon, Lebanon.jpg")],
  ["qadisha", commonsImage("View of Kadisha Valley, Lebanon.jpg")],
  ["beiteddine", commonsImage("Courtyard at Beiteddine Palace - 2009.jpg")],
  ["anfeh", commonsImage("Enfeh Liban-Nord.JPG")],
  ["enfeh", commonsImage("Enfeh Liban-Nord.JPG")],
  ["faraya", commonsImage("Mzaar Ski Resort.jpg")],
  ["mar mikhael", commonsImage("Steps Of Mar Mikhael (154437631).jpeg")],
  ["tyre", commonsImage("Tyre Ruins-Roman Tomb.jpg")],
  ["beirut", commonsImage("Pigeon Rocks at sunset, Beirut, Lebanon.jpg")],
  ["restaurant", commonsImage("Mezze platter.jpg")],
  ["bakery", commonsImage("Manakish.jpg")],
  ["souk", commonsImage("Souk el Tayeb Beirut.jpg")],
  ["shop", commonsImage("Souks of Byblos.jpg")],
];

function inferType(id: number, text: string): POIType {
  if (id >= 200 && id < 300) return "restaurant";
  if (id >= 300 && id < 400) return "shop";
  if (/\b(restaurant|bakery|grill|cafe|food|barbar|enab|tacos|zaituna)\b/i.test(text)) return "restaurant";
  if (/\b(shop|souk|market|bazaar|craft|boutique)\b/i.test(text)) return "shop";
  return "spot";
}

function inferActivities(type: POIType, text: string): ActivityType[] {
  const activities = new Set<ActivityType>();
  if (type === "restaurant") activities.add("food");
  if (type === "shop") activities.add("shopping");
  if (/\b(beach|sea|coast|tyre|sidon|raouche)\b/i.test(text)) activities.add("beaches");
  if (/\b(castle|temple|museum|roman|historic|heritage|ruins|byblos|baalbek)\b/i.test(text)) activities.add("culture");
  if (/\b(cedar|valley|river|mountain|reserve|hiking|forest)\b/i.test(text)) {
    activities.add("nature");
    activities.add("hiking");
  }
  if (/\b(gemmayze|night|bar|wine)\b/i.test(text)) activities.add("nightlife");
  return Array.from(activities);
}

function imageForPlace(text: string) {
  const lowerText = text.toLowerCase();
  return imageByKeyword.find(([keyword]) => lowerText.includes(keyword))?.[1] || "/lebanon-logo.png";
}

const coordinatesByKeyword: Array<[string, { latitude: number; longitude: number }]> = [
  ["baalbek", { latitude: 34.0052, longitude: 36.2116 }],
  ["cedar", { latitude: 34.2495, longitude: 36.0623 }],
  ["raouche", { latitude: 33.8951, longitude: 35.4692 }],
  ["jeita", { latitude: 33.9475, longitude: 35.6386 }],
  ["byblos", { latitude: 34.1211, longitude: 35.6478 }],
  ["harissa", { latitude: 33.9792, longitude: 35.6375 }],
  ["tripoli", { latitude: 34.4356, longitude: 35.84 }],
  ["sidon", { latitude: 33.5636, longitude: 35.3706 }],
  ["qadisha", { latitude: 34.2564, longitude: 35.9389 }],
  ["beiteddine", { latitude: 33.6946, longitude: 35.5808 }],
  ["anfeh", { latitude: 34.3561, longitude: 35.7314 }],
  ["faraya", { latitude: 33.9842, longitude: 35.8284 }],
  ["mar mikhael", { latitude: 33.8967, longitude: 35.5265 }],
  ["tyre", { latitude: 33.2746, longitude: 35.1945 }],
  ["beirut", { latitude: 33.8938, longitude: 35.5018 }],
];

function coordinatesForPlace(text: string) {
  const lowerText = text.toLowerCase();
  return coordinatesByKeyword.find(([keyword]) => lowerText.includes(keyword))?.[1];
}

export function poiFromDatabase(dbPoi: DbPoi): POI | null {
  const id = Number(dbPoi.poiId);
  if (!Number.isFinite(id)) return null;

  const text = `${dbPoi.name} ${dbPoi.description ?? ""}`;
  const type = inferType(id, text);
  const rating = Number(dbPoi.rating ?? 4.7);
  const coordinates = coordinatesForPlace(text);

  return {
    id,
    name: dbPoi.name,
    description: dbPoi.description || "A recommended place to explore in Lebanon.",
    rating: Number.isFinite(rating) ? rating : 4.7,
    regionId: Number(dbPoi.regionId || 1),
    type,
    image: imageForPlace(text),
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    activities: inferActivities(type, text),
    entranceFee: type === "spot" ? 10 : undefined,
    averagePrice: type === "restaurant" ? 20 : undefined,
    priceRange: type === "shop" ? "$$" : undefined,
  };
}
