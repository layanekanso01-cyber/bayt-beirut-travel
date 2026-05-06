// Backend route registration file
// Responsible for connecting frontend API requests
// to business logic and database operations
import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertTransportBookingSchema, InsertPOIBooking, type UserActivity } from "@shared/schema.ts";
import { registerAuthRoutes } from "./auth-routes";
import { registerChatbotRoutes } from "./chatbot-routes";
import { registerPOIRoutes } from "./poi-routes";
import { registerFavoritesRoutes } from "./favorites-routes";
import { registerNewsletterRoutes } from "./newsletter-routes";
import { registerAdminDataRoutes } from "./admin-data-routes";
import { registerRestaurantRoutes } from "./restaurant-routes";
import { registerEmailRoutes } from "./email-routes";
import { eq } from "drizzle-orm";
import { transportBookings, userActivities } from "@shared/schema.ts";
import { db } from "./db";

type TicketBooking = {
  id: string;
  customerName: string;
  type: "Transport" | "POI";
  destination: string;
  dateTime: Date;
  status: string;
  paymentStatus: "Paid" | "Pending";
  ticketStatus: "Valid" | "Used" | "Expired";
};

function normalizeTicketStatus(status: string, dateTime: Date, type: TicketBooking["type"]) {
  const normalized = status.toLowerCase();
  if (normalized === "used") return "Used";
  if (normalized === "cancelled" || normalized === "failed") return "Expired";
  if (type === "POI" && dateTime.getTime() < Date.now()) return "Expired";
  return "Valid";
}

function normalizePaymentStatus(status: string) {
  return ["paid", "completed", "used"].includes(status.toLowerCase()) ? "Paid" : "Pending";
}

async function findTicketBooking(id: string): Promise<TicketBooking | undefined> {
  const transportBooking = await storage.getTransportBooking(id);
  if (transportBooking) {
    const dateTime = new Date(transportBooking.createdAt);
    return {
      id: transportBooking.id,
      customerName: transportBooking.customerName,
      type: "Transport",
      destination: transportBooking.destination || transportBooking.carName,
      dateTime,
      status: transportBooking.status,
      paymentStatus: normalizePaymentStatus(transportBooking.status),
      ticketStatus: normalizeTicketStatus(transportBooking.status, dateTime, "Transport"),
    };
  }

  const poiBooking = await storage.getPOIBooking(id);
  if (poiBooking) {
    const dateTime = new Date(poiBooking.visitDate);
    return {
      id: poiBooking.id,
      customerName: poiBooking.customerName,
      type: "POI",
      destination: poiBooking.poiName,
      dateTime,
      status: poiBooking.status,
      paymentStatus: normalizePaymentStatus(poiBooking.status),
      ticketStatus: normalizeTicketStatus(poiBooking.status, dateTime, "POI"),
    };
  }

  return undefined;
}

async function syncBookingActivityStatus(bookingId: string, status: string) {
  const database = db;
  if (!database) return;

  const activities = await database
    .select()
    .from(userActivities)
    .where(eq(userActivities.relatedId, bookingId));

  await Promise.all(
    activities.map((activity: UserActivity) => {
      const description = activity.description || "";
      const nextDescription = description.match(/status:\s*[^,]+/i)
        ? description.replace(/status:\s*[^,]+/i, `status: ${status}`)
        : description
          ? `${description}, status: ${status}`
          : `Status: ${status}`;

      return database
        .update(userActivities)
        .set({ description: nextDescription })
        .where(eq(userActivities.id, activity.id));
    }),
  );
}

// Register authentication and chatbot routes
// These handle user login, signup, and chatbot interactions
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth and chatbot routes
  registerAuthRoutes(app);
  registerChatbotRoutes(app);
  registerFavoritesRoutes(app);
  registerNewsletterRoutes(app);
  registerAdminDataRoutes(app);
  registerRestaurantRoutes(app);
  registerEmailRoutes(app);

  // POI routes
  registerPOIRoutes(app);

  // Transport booking routes
  
  app.post("/api/transport/book", async (req, res) => {
    try {
      const result = insertTransportBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid booking data",
          errors: result.error.errors
        });
      }

      const booking = await storage.createTransportBooking(result.data);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating transport booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/transport/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllTransportBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/transport/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getTransportBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.patch("/api/transport/bookings/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: "Status is required" });

      const booking = await storage.updateTransportBookingStatus(req.params.id, status);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      await syncBookingActivityStatus(req.params.id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.patch("/api/poi/bookings/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: "Status is required" });

      const booking = await storage.updatePOIBookingStatus(req.params.id, status);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      await syncBookingActivityStatus(req.params.id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating POI booking status:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/transport/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!db) return res.status(500).json({ message: "Database not connected" });

      await db.delete(transportBookings).where(eq(transportBookings.id, id));
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await findTicketBooking(req.params.id);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      res.json(ticket);
    } catch (error) {
      console.error("Ticket lookup error:", error);
      res.status(500).json({ message: "Could not load ticket" });
    }
  });

  app.patch("/api/tickets/:id/check-in", async (req, res) => {
    try {
      const ticket = await findTicketBooking(req.params.id);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      if (ticket.ticketStatus === "Used") {
        return res.status(409).json({ message: "Ticket was already checked in" });
      }
      if (ticket.ticketStatus === "Expired") {
        return res.status(409).json({ message: "Ticket is expired or cancelled" });
      }

      const updated =
        ticket.type === "Transport"
          ? await storage.updateTransportBookingStatus(req.params.id, "used")
          : await storage.updatePOIBookingStatus(req.params.id, "used");

      if (!updated) return res.status(404).json({ message: "Ticket not found" });
      await syncBookingActivityStatus(req.params.id, "used");
      const updatedTicket = await findTicketBooking(req.params.id);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Ticket check-in error:", error);
      res.status(500).json({ message: "Could not check in ticket" });
    }
  });

  // POI booking endpoint (in case registerPOIRoutes isn't used)
  app.post("/api/poi/bookings", async (req, res) => {
    try {
      const { customerName, poiName, visitDate, numGuests, totalPrice } = req.body as InsertPOIBooking;

      if (!poiName || !visitDate || !numGuests || !totalPrice) {
        return res.status(400).json({ message: "All fields except customerName are required" });
      }

      const booking = await storage.createPOIBooking({
        customerName: customerName || "Guest",
        poiName,
        visitDate: new Date(visitDate),
        numGuests,
        totalPrice,
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("POI booking error:", error);
      res.status(500).json({ message: "Booking failed" });
    }
  });

  return httpServer;
}
