import type { Express } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { newsletterSubscribers } from "@shared/schema.ts";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function registerNewsletterRoutes(app: Express) {
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const { email, userId } = req.body as { email?: string; userId?: string };
      const normalizedEmail = email ? normalizeEmail(email) : "";

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, normalizedEmail));

      if (existing[0]) {
        if (existing[0].status !== "active") {
          await db
            .update(newsletterSubscribers)
            .set({ status: "active", userId: userId || existing[0].userId })
            .where(eq(newsletterSubscribers.id, existing[0].id));
        }

        return res.json({
          message: "Already subscribed",
          subscriber: { ...existing[0], status: "active" },
        });
      }

      const subscriber = {
        id: randomUUID(),
        email: normalizedEmail,
        userId: userId || null,
        status: "active",
        createdAt: new Date(),
      };

      await db.insert(newsletterSubscribers).values(subscriber);

      res.status(201).json({
        message: "Subscribed successfully",
        subscriber,
      });
    } catch (error) {
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ message: "Could not subscribe" });
    }
  });

  app.get("/api/newsletter/subscribers", async (_req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });

      const subscribers = await db.select().from(newsletterSubscribers);
      res.json(subscribers);
    } catch (error) {
      console.error("Newsletter subscribers error:", error);
      res.status(500).json({ message: "Could not load subscribers" });
    }
  });
}
