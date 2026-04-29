import {
  type User,
  type InsertUser,
  type TransportBooking,
  type InsertTransportBooking,
  type POIBooking,
  type InsertPOIBooking,
} from "@shared/schema.ts";
import { users, transportBookings, poiBookings, payments, userActivities } from "@shared/schema.ts";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createTransportBooking(booking: InsertTransportBooking): Promise<TransportBooking>;
  getTransportBooking(id: string): Promise<TransportBooking | undefined>;
  getAllTransportBookings(): Promise<TransportBooking[]>;
  updateTransportBookingStatus(id: string, status: string): Promise<TransportBooking | undefined>;
  createPOIBooking(booking: InsertPOIBooking): Promise<POIBooking>;
  getPOIBooking(id: string): Promise<POIBooking | undefined>;
  getAllPOIBookings(): Promise<POIBooking[]>;
  updatePOIBookingStatus(id: string, status: string): Promise<POIBooking | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not connected");

    const newUser = {
      id: randomUUID(),
      username: user.username,
      password: user.password,
      email: user.email ?? null,
      name: user.name ?? null,
      nationality: user.nationality ?? null,
      phone: user.phone ?? null,
      createdAt: new Date(),
    };

    await db.insert(users).values(newUser);
    return newUser;
  }

  async createTransportBooking(booking: InsertTransportBooking): Promise<TransportBooking> {
    if (!db) throw new Error("Database not connected");
    const newBooking = { id: randomUUID(), ...booking, createdAt: new Date() };
    await db.insert(transportBookings).values(newBooking);
    await db.insert(payments).values({
      id: randomUUID(),
      bookingId: newBooking.id,
      bookingType: "transport",
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
      title: `Booked transport to ${newBooking.destination || newBooking.carName}`,
      description: `Status: ${newBooking.status}`,
      relatedId: newBooking.id,
      createdAt: new Date(),
    });
    return newBooking as TransportBooking;
  }

  async getTransportBooking(id: string): Promise<TransportBooking | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(transportBookings).where(eq(transportBookings.id, id));
    return result[0] || undefined;
  }

  async getAllTransportBookings(): Promise<TransportBooking[]> {
    if (!db) return [];
    return await db.select().from(transportBookings);
  }

  async updateTransportBookingStatus(id: string, status: string): Promise<TransportBooking | undefined> {
    if (!db) return undefined;
    await db.update(transportBookings).set({ status }).where(eq(transportBookings.id, id));
    await db
      .update(payments)
      .set({ status: status === "accepted" || status === "used" ? "completed" : status })
      .where(eq(payments.bookingId, id));
    return this.getTransportBooking(id);
  }

  async createPOIBooking(booking: InsertPOIBooking): Promise<POIBooking> {
    if (!db) throw new Error("Database not connected");
    const newBooking = { id: randomUUID(), ...booking, bookingDate: new Date() };
    await db.insert(poiBookings).values(newBooking);
    await db.insert(payments).values({
      id: randomUUID(),
      bookingId: newBooking.id,
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
      relatedId: newBooking.id,
      createdAt: new Date(),
    });
    return newBooking as POIBooking;
  }

  async getPOIBooking(id: string): Promise<POIBooking | undefined> {
    if (!db) return undefined;
    const result = await db.select().from(poiBookings).where(eq(poiBookings.id, id));
    return result[0] || undefined;
  }

  async getAllPOIBookings(): Promise<POIBooking[]> {
    if (!db) return [];
    return await db.select().from(poiBookings);
  }

  async updatePOIBookingStatus(id: string, status: string): Promise<POIBooking | undefined> {
    if (!db) return undefined;
    await db.update(poiBookings).set({ status }).where(eq(poiBookings.id, id));
    await db
      .update(payments)
      .set({ status: status === "accepted" || status === "used" ? "completed" : status })
      .where(eq(payments.bookingId, id));
    return this.getPOIBooking(id);
  }
}

export const storage = new DatabaseStorage();
