import type { Express } from "express";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { favoriteCollections, favoritePlaces, userActivities } from "@shared/schema.ts";

type FavoriteCollectionResponse = {
  id: string;
  name: string;
  poiIds: number[];
  createdAt: string;
};

function getUserKey(userId?: string) {
  return userId?.trim() || "guest";
}

async function ensureDefaultCollection(userId: string) {
  if (!db) throw new Error("Database not connected");

  const existing = await db
    .select()
    .from(favoriteCollections)
    .where(and(eq(favoriteCollections.userId, userId), eq(favoriteCollections.name, "Saved Places")));

  if (existing[0]) return existing[0];

  const collection = {
    id: randomUUID(),
    userId,
    name: "Saved Places",
    createdAt: new Date(),
  };

  await db.insert(favoriteCollections).values(collection);
  return collection;
}

async function getCollections(userId?: string): Promise<FavoriteCollectionResponse[]> {
  if (!db) throw new Error("Database not connected");

  const userKey = getUserKey(userId);
  await ensureDefaultCollection(userKey);

  const collections = await db
    .select()
    .from(favoriteCollections)
    .where(eq(favoriteCollections.userId, userKey));

  const places = await db.select().from(favoritePlaces).where(eq(favoritePlaces.userId, userKey));

  return collections.map((collection: any) => ({
    id: collection.id,
    name: collection.name,
    poiIds: places.filter((place: any) => place.collectionId === collection.id).map((place: any) => place.poiId),
    createdAt: new Date(collection.createdAt).toISOString(),
  }));
}

export function registerFavoritesRoutes(app: Express) {
  app.get("/api/favorites/collections", async (req, res) => {
    try {
      res.json(await getCollections(req.query.userId as string | undefined));
    } catch (error) {
      console.error("Favorites load error:", error);
      res.status(500).json({ message: "Could not load favorite collections" });
    }
  });

  app.post("/api/favorites/default/toggle", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const { poiId, userId, poiName } = req.body as { poiId?: number; userId?: string; poiName?: string };
      const userKey = getUserKey(userId);

      if (typeof poiId !== "number") return res.status(400).json({ message: "poiId is required" });

      const collection = await ensureDefaultCollection(userKey);
      const existing = await db
        .select()
        .from(favoritePlaces)
        .where(
          and(
            eq(favoritePlaces.collectionId, collection.id),
            eq(favoritePlaces.userId, userKey),
            eq(favoritePlaces.poiId, poiId)
          )
        );

      if (existing[0]) {
        await db.delete(favoritePlaces).where(eq(favoritePlaces.id, existing[0].id));
      } else {
        await db.insert(favoritePlaces).values({
          id: randomUUID(),
          collectionId: collection.id,
          userId: userKey,
          poiId,
          createdAt: new Date(),
        });

        await db.insert(userActivities).values({
          id: randomUUID(),
          userId: userKey,
          activityType: "saved",
          title: poiName ? `Saved ${poiName}` : "Saved a place",
          description: `Added to ${collection.name}`,
          relatedId: String(poiId),
          createdAt: new Date(),
        });
      }

      res.json({
        isSaved: !existing[0],
        collections: await getCollections(userKey),
      });
    } catch (error) {
      console.error("Favorite default toggle error:", error);
      res.status(500).json({ message: "Could not update favorite" });
    }
  });

  app.post("/api/favorites/collections", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const { name, userId } = req.body as { name?: string; userId?: string };
      const userKey = getUserKey(userId);
      const trimmedName = name?.trim();

      if (!trimmedName) {
        return res.status(400).json({ message: "Collection name is required" });
      }

      const collection = {
        id: randomUUID(),
        userId: userKey,
        name: trimmedName,
        createdAt: new Date(),
      };

      await db.insert(favoriteCollections).values(collection);
      res.status(201).json({
        id: collection.id,
        name: collection.name,
        poiIds: [],
        createdAt: collection.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Favorite collection create error:", error);
      res.status(500).json({ message: "Could not create collection" });
    }
  });

  app.post("/api/favorites/collections/:collectionId/places", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const { poiId, userId, poiName } = req.body as { poiId?: number; userId?: string; poiName?: string };
      const userKey = getUserKey(userId);

      if (typeof poiId !== "number") return res.status(400).json({ message: "poiId is required" });

      const collection = await db
        .select()
        .from(favoriteCollections)
        .where(and(eq(favoriteCollections.id, req.params.collectionId), eq(favoriteCollections.userId, userKey)));

      if (!collection[0]) return res.status(404).json({ message: "Collection not found" });

      const existing = await db
        .select()
        .from(favoritePlaces)
        .where(
          and(
            eq(favoritePlaces.collectionId, req.params.collectionId),
            eq(favoritePlaces.userId, userKey),
            eq(favoritePlaces.poiId, poiId)
          )
        );

      if (!existing[0]) {
        await db.insert(favoritePlaces).values({
          id: randomUUID(),
          collectionId: req.params.collectionId,
          userId: userKey,
          poiId,
          createdAt: new Date(),
        });

        await db.insert(userActivities).values({
          id: randomUUID(),
          userId: userKey,
          activityType: "saved",
          title: poiName ? `Saved ${poiName}` : "Saved a place",
          description: `Added to ${collection[0].name}`,
          relatedId: String(poiId),
          createdAt: new Date(),
        });
      }

      const collections = await getCollections(userKey);
      res.json(collections.find((item) => item.id === req.params.collectionId));
    } catch (error) {
      console.error("Favorite place add error:", error);
      res.status(500).json({ message: "Could not save place" });
    }
  });

  app.delete("/api/favorites/collections/:collectionId/places/:poiId", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const userKey = getUserKey(req.query.userId as string | undefined);
      await db
        .delete(favoritePlaces)
        .where(
          and(
            eq(favoritePlaces.collectionId, req.params.collectionId),
            eq(favoritePlaces.userId, userKey),
            eq(favoritePlaces.poiId, Number(req.params.poiId))
          )
        );

      const collections = await getCollections(userKey);
      res.json(collections.find((item) => item.id === req.params.collectionId));
    } catch (error) {
      console.error("Favorite place remove error:", error);
      res.status(500).json({ message: "Could not remove place" });
    }
  });

  app.delete("/api/favorites/collections/:collectionId", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const userKey = getUserKey(req.query.userId as string | undefined);
      await db
        .delete(favoritePlaces)
        .where(and(eq(favoritePlaces.collectionId, req.params.collectionId), eq(favoritePlaces.userId, userKey)));
      await db
        .delete(favoriteCollections)
        .where(and(eq(favoriteCollections.id, req.params.collectionId), eq(favoriteCollections.userId, userKey)));

      await ensureDefaultCollection(userKey);
      res.json({ message: "Collection deleted" });
    } catch (error) {
      console.error("Favorite collection delete error:", error);
      res.status(500).json({ message: "Could not delete collection" });
    }
  });
}
