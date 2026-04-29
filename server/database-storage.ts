import {
  type User,
  type InsertUser,
  type TransportBooking,
  type InsertTransportBooking,
  type POIBooking,
  type InsertPOIBooking,
} from "@shared/schema.ts";
import { users, transportBookings, poiBookings } from "@shared/schema.ts";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

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
    return this.getTransportBooking(id);
  }

  async createPOIBooking(booking: InsertPOIBooking): Promise<POIBooking> {
    if (!db) throw new Error("Database not connected");
    const newBooking = { id: randomUUID(), ...booking, bookingDate: new Date() };
    await db.insert(poiBookings).values(newBooking);
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
    return this.getPOIBooking(id);
  }
}
