// server/poi-routes.ts
import type { Express } from "express";
import { db } from "./db";
import { pointsOfInterest, reviews, poiBookings, payments, userActivities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export function registerPOIRoutes(app: Express) {
  // Get all POIs
  app.get("/api/pois", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const allPois = await db.select().from(pointsOfInterest);
      res.json(allPois);
    } catch (error) {
      console.error("Error fetching POIs:", error);
      res.status(500).json({ message: "Failed to fetch POIs" });
    }
  });

  // Get single POI by ID
  app.get("/api/pois/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const poi = await db
        .select()
        .from(pointsOfInterest)
        .where(eq(pointsOfInterest.poiId, req.params.id));
      
      if (!poi.length) {
        return res.status(404).json({ message: "POI not found" });
      }
      
      res.json(poi[0]);
    } catch (error) {
      console.error("Error fetching POI:", error);
      res.status(500).json({ message: "Failed to fetch POI" });
    }
  });

  // Submit a review
  app.post("/api/reviews", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const { rating, comment, reviewType, touristId, poiId, bookingId } = req.body;

      // Validation
      if (!rating || !reviewType || !touristId) {
        return res.status(400).json({ 
          message: "Rating, review type, and tourist ID are required" 
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          message: "Rating must be between 1 and 5" 
        });
      }

      if (reviewType === 'poi' && !poiId) {
        return res.status(400).json({ 
          message: "POI ID is required for POI reviews" 
        });
      }

      if (reviewType === 'booking' && !bookingId) {
        return res.status(400).json({ 
          message: "Booking ID is required for booking reviews" 
        });
      }

      const reviewId = randomUUID();
      const newReview = {
        reviewId,
        rating,
        comment: comment || null,
        reviewDate: new Date(),
        reviewType,
        touristId,
        poiId: poiId || null,
        bookingId: bookingId || null,
      };

      await db.insert(reviews).values(newReview);

      // Update POI rating if it's a POI review
      if (reviewType === 'poi' && poiId) {
        // Calculate new average rating
        const allPoiReviews = await db
          .select()
          .from(reviews)
          .where(eq(reviews.poiId, poiId));
        
        const avgRating = allPoiReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allPoiReviews.length;
        
        await db
          .update(pointsOfInterest)
          .set({ rating: avgRating.toFixed(2) })
          .where(eq(pointsOfInterest.poiId, poiId));
      }

      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a POI
  app.get("/api/reviews/poi/:poiId", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const poiReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.poiId, req.params.poiId));
      
      res.json(poiReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get reviews for a booking
  app.get("/api/reviews/booking/:bookingId", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const bookingReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.bookingId, req.params.bookingId));
      
      res.json(bookingReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // POI Bookings
  app.post("/api/poi/bookings", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const { customerName, poiName, visitDate, numGuests, totalPrice } = req.body;

      if (!poiName || !visitDate || !numGuests || totalPrice === undefined) {
        return res.status(400).json({ 
          message: "All fields are required" 
        });
      }

      const bookingId = randomUUID();
      const newBooking = {
        id: bookingId,
        customerName: customerName || "Guest",
        poiName,
        visitDate: new Date(visitDate),
        numGuests,
        totalPrice: totalPrice.toString(),
        status: "pending",
        bookingDate: new Date(),
      };

      await db.insert(poiBookings).values(newBooking);
      await db.insert(payments).values({
        id: randomUUID(),
        bookingId,
        bookingType: "poi",
        userId: null,
        amount: newBooking.totalPrice,
        currency: "USD",
        status: "pending",
        paymentMethod: "demo checkout",
        createdAt: new Date(),
      });
      await db.insert(userActivities).values({
        id: randomUUID(),
        userId: newBooking.customerName,
        activityType: "booked",
        title: `Booked ${newBooking.poiName}`,
        description: `${newBooking.numGuests} guest(s), status: ${newBooking.status}`,
        relatedId: bookingId,
        createdAt: new Date(),
      });
      res.status(201).json(newBooking);
    } catch (error) {
      console.error("Error creating POI booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get all POI bookings
  app.get("/api/poi/bookings", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ message: "Database not connected" });
      
      const allBookings = await db.select().from(poiBookings);
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
}
