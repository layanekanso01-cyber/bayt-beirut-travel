import type { Express } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { pointsOfInterest, regions, restaurant, type POI, type Region, type Restaurant } from "@shared/schema.ts";

function normalizeMoney(value: unknown) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

export function registerRestaurantRoutes(app: Express) {
  app.get("/api/restaurants", async (_req, res) => {
    try {
      const [restaurantRows, poiRows, regionRows]: [Restaurant[], POI[], Region[]] = await Promise.all([
        db.select().from(restaurant),
        db.select().from(pointsOfInterest),
        db.select().from(regions),
      ]);

      const poiById = new Map(poiRows.map((poi) => [String(poi.poiId), poi]));
      const regionById = new Map(regionRows.map((region) => [Number(region.regionId), region]));

      const restaurants = restaurantRows.map((item) => {
        const poi = poiById.get(String(item.poiId));
        const region = poi?.regionId ? regionById.get(Number(poi.regionId)) : undefined;

        return {
          poiId: item.poiId,
          name: poi?.name ?? "Restaurant",
          description: poi?.description ?? "",
          rating: poi?.rating ?? null,
          regionId: poi?.regionId ?? null,
          regionName: region?.name ?? null,
          cuisineType: item.cuisineType,
          averagePrice: normalizeMoney(item.averagePrice),
          priceRange: item.priceRange,
        };
      });

      res.json(restaurants);
    } catch (error) {
      console.error("Error loading restaurants:", error);
      res.status(500).json({ message: "Failed to load restaurants" });
    }
  });

  app.get("/api/restaurants/:poiId", async (req, res) => {
    try {
      const [restaurantRow] = await db
        .select()
        .from(restaurant)
        .where(eq(restaurant.poiId, req.params.poiId));

      if (!restaurantRow) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const [poi] = await db
        .select()
        .from(pointsOfInterest)
        .where(eq(pointsOfInterest.poiId, req.params.poiId));

      let region: Region | undefined;
      if (poi?.regionId) {
        const [matchingRegion] = await db.select().from(regions).where(eq(regions.regionId, poi.regionId));
        region = matchingRegion;
      }

      res.json({
        poiId: restaurantRow.poiId,
        name: poi?.name ?? "Restaurant",
        description: poi?.description ?? "",
        rating: poi?.rating ?? null,
        regionId: poi?.regionId ?? null,
        regionName: region?.name ?? null,
        cuisineType: restaurantRow.cuisineType,
        averagePrice: normalizeMoney(restaurantRow.averagePrice),
        priceRange: restaurantRow.priceRange,
      });
    } catch (error) {
      console.error("Error loading restaurant:", error);
      res.status(500).json({ message: "Failed to load restaurant" });
    }
  });
}
