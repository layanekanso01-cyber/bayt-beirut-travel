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

export function poiFromDatabase(dbPoi: DbPoi): POI | null {
  const id = Number(dbPoi.poiId);
  if (!Number.isFinite(id)) return null;

  const text = `${dbPoi.name} ${dbPoi.description ?? ""}`;
  const type = inferType(id, text);
  const rating = Number(dbPoi.rating ?? 4.7);

  return {
    id,
    name: dbPoi.name,
    description: dbPoi.description || "A recommended place to explore in Lebanon.",
    rating: Number.isFinite(rating) ? rating : 4.7,
    regionId: Number(dbPoi.regionId || 1),
    type,
    image: imageForPlace(text),
    activities: inferActivities(type, text),
    entranceFee: type === "spot" ? 10 : undefined,
    averagePrice: type === "restaurant" ? 20 : undefined,
    priceRange: type === "shop" ? "$$" : undefined,
  };
}
