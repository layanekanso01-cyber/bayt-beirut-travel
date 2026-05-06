import type { Express } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  adminTrips,
  itineraryStops,
  pointsOfInterest,
  regions,
  restaurant,
  restaurants,
  savedItineraries,
} from "@shared/schema.ts";

const seedRegions = [
  { regionId: 1, name: "Beirut", description: "The vibrant capital, a mix of modern nightlife and rich history.", averagePrice: "60.00" },
  { regionId: 2, name: "Bekaa Valley", description: "Home to ancient Roman temples and beautiful vineyards.", averagePrice: "75.00" },
  { regionId: 3, name: "Mount Lebanon", description: "Breathtaking mountains, ski resorts, and ancient cedar forests.", averagePrice: "85.00" },
  { regionId: 4, name: "Byblos (Jbeil)", description: "One of the oldest continuously inhabited cities in the world.", averagePrice: "70.00" },
  { regionId: 5, name: "Tripoli", description: "A historic city known for medieval architecture and souks.", averagePrice: "55.00" },
  { regionId: 6, name: "South Lebanon", description: "Coastal beauty with ancient ruins and Mediterranean charm.", averagePrice: "65.00" },
  { regionId: 7, name: "Chouf", description: "Mountain region with cedar reserves and scenic landscapes.", averagePrice: "70.00" },
];

const seedPois = [
  { poiId: "100", name: "Baalbek Roman Temples", description: "Massive Roman temple complex.", rating: "4.90", regionId: 2 },
  { poiId: "101", name: "Cedars of God", description: "Ancient cedar forests in the mountains.", rating: "4.90", regionId: 3 },
  { poiId: "103", name: "Raouche Rocks", description: "Iconic rock formations off the Beirut coast.", rating: "4.50", regionId: 1 },
  { poiId: "104", name: "Jeita Grotto", description: "Limestone caves and underground river.", rating: "4.90", regionId: 3 },
  { poiId: "105", name: "Byblos Castle", description: "Crusader castle overlooking the ancient harbor.", rating: "4.70", regionId: 4 },
  { poiId: "106", name: "Harissa", description: "Our Lady of Lebanon with panoramic views of Jounieh Bay.", rating: "4.60", regionId: 3 },
  { poiId: "107", name: "Citadel of Raymond de Saint-Gilles", description: "Historic Crusader fortress in Tripoli.", rating: "4.40", regionId: 5 },
  { poiId: "108", name: "Sidon Sea Castle", description: "Historic sea castle connected to the old city.", rating: "4.50", regionId: 6 },
  { poiId: "109", name: "Qadisha Valley", description: "UNESCO valley with cliffside monasteries and hiking routes.", rating: "4.80", regionId: 3 },
  { poiId: "110", name: "Mim Museum", description: "Private museum with a world-class mineral collection.", rating: "4.60", regionId: 1 },
  { poiId: "111", name: "Tyre Ancient City", description: "Roman and Phoenician ruins by the sea.", rating: "4.70", regionId: 6 },
  { poiId: "112", name: "Beaufort Castle", description: "Medieval fortress with sweeping southern views.", rating: "4.60", regionId: 6 },
  { poiId: "113", name: "Beiteddine Palace", description: "Elegant Ottoman-era palace with courtyards, mosaics, and Chouf mountain views.", rating: "4.70", regionId: 7 },
  { poiId: "114", name: "Anfeh Coast", description: "White-and-blue coastal village known for clear water, salt ponds, and relaxed seaside cafes.", rating: "4.60", regionId: 5 },
  { poiId: "115", name: "Chouf Cedar Reserve", description: "Large cedar reserve with trails and mountain scenery.", rating: "4.80", regionId: 7 },
  { poiId: "116", name: "Damour River", description: "Scenic river valley in Chouf with hiking trails.", rating: "4.50", regionId: 7 },
  { poiId: "117", name: "Gemmayze", description: "Lively Beirut neighborhood with cafes, bars, galleries, and heritage streets.", rating: "4.60", regionId: 1 },
  { poiId: "118", name: "Downtown Beirut", description: "Restored central district with landmarks, shopping, and restaurants.", rating: "4.50", regionId: 1 },
  { poiId: "119", name: "Faraya", description: "Mountain resort area with winter activities, cool summer escapes, and scenic viewpoints.", rating: "4.60", regionId: 3 },
  { poiId: "120", name: "Mar Mikhael", description: "Creative Beirut neighborhood with galleries, restaurants, pubs, and nightlife.", rating: "4.60", regionId: 1 },
  { poiId: "200", name: "Tacos El Primo", description: "Lebanese mezze and shawarma restaurant with a cozy atmosphere.", rating: "4.70", regionId: 1 },
  { poiId: "201", name: "Al Reef Bakery", description: "Fresh manakish bread and traditional Lebanese pastries.", rating: "4.80", regionId: 1 },
  { poiId: "202", name: "Zaituna Modern Lebanese", description: "Contemporary take on traditional Lebanese cuisine.", rating: "4.60", regionId: 1 },
  { poiId: "203", name: "Grillades Charbel", description: "Grilled meats and seafood with a panoramic view.", rating: "4.50", regionId: 1 },
  { poiId: "204", name: "Enab Beirut", description: "Wine bar and restaurant offering Lebanese cuisine.", rating: "4.40", regionId: 1 },
  { poiId: "205", name: "Abu Hassan", description: "Traditional restaurant famous for hummus and falafel.", rating: "4.60", regionId: 5 },
  { poiId: "206", name: "Restaurant Barbar", description: "Authentic Lebanese cuisine and seafood.", rating: "4.50", regionId: 6 },
  { poiId: "207", name: "Cedars Grill", description: "Mountain restaurant with grilled specialties.", rating: "4.50", regionId: 3 },
  { poiId: "300", name: "Souk El Ahed", description: "Traditional crafts, spices, and souvenirs.", rating: "4.30", regionId: 1 },
  { poiId: "301", name: "Ashrafieh Designers", description: "Lebanese fashion and local design boutique.", rating: "4.50", regionId: 1 },
  { poiId: "302", name: "Beirut Spice Bazaar", description: "Spices and ingredients from the region.", rating: "4.40", regionId: 1 },
  { poiId: "303", name: "Cedar Crafts Co.", description: "Crafts and souvenirs made by local artisans.", rating: "4.60", regionId: 3 },
  { poiId: "304", name: "Byblos Antique Market", description: "Antique shops and vintage treasures in Byblos.", rating: "4.40", regionId: 4 },
  { poiId: "305", name: "Tripoli Gold Souk", description: "Traditional gold and jewelry market.", rating: "4.50", regionId: 5 },
  { poiId: "306", name: "Sidon Purple Dye Workshop", description: "Workshop producing Tyrian purple dye and textiles.", rating: "4.70", regionId: 6 },
];

const seedRestaurants = [
  { poiId: "200", cuisineType: "Lebanese", averagePrice: "15.00", priceRange: "Budget" },
  { poiId: "201", cuisineType: "Lebanese Bakery", averagePrice: "8.00", priceRange: "Budget" },
  { poiId: "202", cuisineType: "Modern Lebanese", averagePrice: "25.00", priceRange: "Mid-range" },
  { poiId: "203", cuisineType: "Mediterranean", averagePrice: "30.00", priceRange: "Mid-range" },
  { poiId: "204", cuisineType: "Lebanese", averagePrice: "28.00", priceRange: "Mid-range" },
  { poiId: "205", cuisineType: "Lebanese", averagePrice: "12.00", priceRange: "Budget" },
  { poiId: "206", cuisineType: "Lebanese Seafood", averagePrice: "20.00", priceRange: "Mid-range" },
  { poiId: "207", cuisineType: "Lebanese Mountain Grill", averagePrice: "18.00", priceRange: "Mid-range" },
];

const commonsImage = (fileName: string, width = 900) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const defaultAdminTrips = [
  {
    id: "trip-beirut",
    title: "Beirut City Highlights",
    destination: "Beirut",
    description: "Downtown Beirut, Raouche Rocks, Gemmayze cafes, and evening city atmosphere.",
    price: "65.00",
    availableDates: "2026-05-05, 2026-05-12, 2026-05-19",
    image: commonsImage("Pigeon Rocks of Beirut, Rock of Raouche, Beirut, Lebanon.jpg"),
    category: "Culture",
    status: "active",
  },
  {
    id: "trip-byblos",
    title: "Byblos Heritage and Coast",
    destination: "Byblos",
    description: "Ancient castle, old souks, seaside lunch, and coastal sunset.",
    price: "85.00",
    availableDates: "2026-05-08, 2026-05-15, 2026-05-22",
    image: commonsImage("Byblos Castle, Byblos, Lebanon.jpg"),
    category: "Culture",
    status: "active",
  },
  {
    id: "trip-cedars",
    title: "Cedars Mountain Escape",
    destination: "Cedars",
    description: "Mountain drive, Cedars of God, scenic viewpoints, and local lunch.",
    price: "110.00",
    availableDates: "2026-05-10, 2026-05-17, 2026-05-24",
    image: commonsImage("Forest of The cedars of God.jpg"),
    category: "Nature",
    status: "active",
  },
];

function inferRegionId(destination: string) {
  const text = destination.toLowerCase();
  if (text.includes("beirut") || text.includes("raouche") || text.includes("gemmayze")) return 1;
  if (text.includes("baalbek") || text.includes("bekaa")) return 2;
  if (text.includes("cedar") || text.includes("jeita") || text.includes("harissa") || text.includes("mount")) return 3;
  if (text.includes("byblos") || text.includes("jbeil")) return 4;
  if (text.includes("tripoli")) return 5;
  if (text.includes("tyre") || text.includes("sidon") || text.includes("south")) return 6;
  if (text.includes("chouf")) return 7;
  return 1;
}

async function upsertTripAsPointOfInterest(trip: {
  id: string;
  title: string;
  destination: string;
  description: string | null;
}) {
  if (!db) return;

  const existing = await db.select().from(pointsOfInterest).where(eq(pointsOfInterest.poiId, trip.id));
  const poi = {
    poiId: trip.id,
    name: trip.title,
    description: trip.description || `Admin-created trip to ${trip.destination}`,
    rating: "4.80",
    regionId: inferRegionId(trip.destination),
  };

  if (existing[0]) {
    await db.update(pointsOfInterest).set(poi).where(eq(pointsOfInterest.poiId, trip.id));
  } else {
    await db.insert(pointsOfInterest).values(poi);
  }
}

async function ensureDefaultAdminTrips() {
  if (!db) return;

  const existing = await db.select().from(adminTrips);
  if (existing.length > 0) return;

  const now = new Date();
  const trips = defaultAdminTrips.map((trip) => ({
    ...trip,
    createdAt: now,
    updatedAt: now,
  }));

  await db.insert(adminTrips).values(trips);
  await Promise.all(trips.map((trip) => upsertTripAsPointOfInterest(trip)));
}

async function insertMissingByKey<T extends Record<string, any>>(
  table: any,
  keyColumn: any,
  keyName: keyof T,
  rows: T[]
) {
  if (!db) return { inserted: 0, existing: 0 };

  let inserted = 0;
  let existing = 0;

  for (const row of rows) {
    const found = await db.select().from(table).where(eq(keyColumn, row[keyName]));
    if (found[0]) {
      existing += 1;
    } else {
      await db.insert(table).values(row);
      inserted += 1;
    }
  }

  return { inserted, existing };
}

export function registerAdminDataRoutes(app: Express) {
  app.get("/api/explore/admin-trips", async (_req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      await ensureDefaultAdminTrips();
      const trips = await db.select().from(adminTrips).where(eq(adminTrips.status, "active"));
      res.json(
        trips.map((trip: any) => ({
          ...trip,
          regionId: inferRegionId(trip.destination || ""),
        }))
      );
    } catch (error) {
      console.error("Explore admin trips load error:", error);
      res.status(500).json({ message: "Could not load explore trips" });
    }
  });

  app.get("/api/admin/trips", async (_req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      await ensureDefaultAdminTrips();
      res.json(await db.select().from(adminTrips));
    } catch (error) {
      console.error("Admin trips load error:", error);
      res.status(500).json({ message: "Could not load trips" });
    }
  });

  app.post("/api/admin/trips", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      const { title, destination, description, price, availableDates, image, category } = req.body;

      if (!title?.trim() || !destination?.trim()) {
        return res.status(400).json({ message: "Title and destination are required" });
      }

      const trip = {
        id: randomUUID(),
        title: title.trim(),
        destination: destination.trim(),
        description: description || null,
        price: String(price || 0),
        availableDates: availableDates || null,
        image: image || null,
        category: category || null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(adminTrips).values(trip);
      await upsertTripAsPointOfInterest(trip);
      res.status(201).json(trip);
    } catch (error) {
      console.error("Admin trip create error:", error);
      res.status(500).json({ message: "Could not create trip" });
    }
  });

  app.patch("/api/admin/trips/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      const { title, destination, description, price, availableDates, image, category } = req.body;

      await db
        .update(adminTrips)
        .set({
          title,
          destination,
          description,
          price: String(price || 0),
          availableDates,
          image,
          category,
          updatedAt: new Date(),
        })
        .where(eq(adminTrips.id, req.params.id));

      const [trip] = await db.select().from(adminTrips).where(eq(adminTrips.id, req.params.id));
      if (trip) await upsertTripAsPointOfInterest(trip);
      res.json(trip);
    } catch (error) {
      console.error("Admin trip update error:", error);
      res.status(500).json({ message: "Could not update trip" });
    }
  });

  app.delete("/api/admin/trips/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      await db.delete(adminTrips).where(eq(adminTrips.id, req.params.id));
      await db.delete(pointsOfInterest).where(eq(pointsOfInterest.poiId, req.params.id));
      res.json({ message: "Trip deleted" });
    } catch (error) {
      console.error("Admin trip delete error:", error);
      res.status(500).json({ message: "Could not delete trip" });
    }
  });

  app.post("/api/itineraries/save", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      const { userId, title, days, budget, interests, totalCost, summary, planDays } = req.body;

      if (!userId || !title || !Array.isArray(planDays)) {
        return res.status(400).json({ message: "User, title, and itinerary days are required" });
      }

      const itineraryId = randomUUID();
      await db.insert(savedItineraries).values({
        id: itineraryId,
        userId,
        title,
        days,
        budget,
        interests: JSON.stringify(interests || []),
        totalCost: String(totalCost || 0),
        summary,
        createdAt: new Date(),
      });

      const stops = planDays.flatMap((day: any) =>
        (day.stops || []).map((stop: any) => ({
          id: randomUUID(),
          itineraryId,
          dayNumber: day.day,
          timeOfDay: stop.period,
          placeName: stop.location?.name || "Lebanon stop",
          region: stop.location?.region || null,
          description: stop.location?.description || null,
          travelTimeMinutes: null,
          estimatedCost: String(stop.estimatedCost || 0),
        }))
      );

      if (stops.length > 0) {
        await db.insert(itineraryStops).values(stops);
      }

      res.status(201).json({ id: itineraryId, stops: stops.length });
    } catch (error) {
      console.error("Save itinerary error:", error);
      res.status(500).json({ message: "Could not save itinerary" });
    }
  });

  app.post("/api/admin/seed-reference-data", async (_req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const results: Record<string, string> = {};

      try {
        const existingRegions = await db.select().from(regions);
        if (existingRegions.length === 0) {
          await db.insert(regions).values(seedRegions);
          results.regions = `Inserted ${seedRegions.length}`;
        } else {
          results.regions = `Skipped, already has ${existingRegions.length}`;
        }
      } catch (error) {
        results.regions = error instanceof Error ? error.message : "Failed";
      }

      try {
        const result = await insertMissingByKey(pointsOfInterest, pointsOfInterest.poiId, "poiId", seedPois);
        results.pointOfInterest = `Inserted ${result.inserted}, already had ${result.existing}`;
      } catch (error) {
        results.pointOfInterest = error instanceof Error ? error.message : "Failed";
      }

      try {
        const result = await insertMissingByKey(
          restaurants,
          restaurants.poiId,
          "poiId",
          seedRestaurants.map((item) => ({
            poiId: item.poiId,
            cuisineType: item.cuisineType,
          }))
        );
        results.restaurants = `Inserted ${result.inserted}, already had ${result.existing}`;
      } catch (error) {
        results.restaurants = error instanceof Error ? error.message : "Failed";
      }

      try {
        const result = await insertMissingByKey(restaurant, restaurant.poiId, "poiId", seedRestaurants);
        results.restaurant = `Inserted ${result.inserted}, already had ${result.existing}`;
      } catch (error) {
        results.restaurant = error instanceof Error ? error.message : "Failed";
      }

      try {
        await ensureDefaultAdminTrips();
        const trips = await db.select().from(adminTrips);
        await Promise.all(trips.map((trip: any) => upsertTripAsPointOfInterest(trip)));
        results.adminTrips = `Mirrored ${trips.length} trip(s) into point_of_interest`;
      } catch (error) {
        results.adminTrips = error instanceof Error ? error.message : "Failed";
      }

      res.json({
        message: "Reference data seeded",
        results,
      });
    } catch (error) {
      console.error("Seed reference data error:", error);
      res.status(500).json({
        message: "Could not seed reference data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
