import { mysqlTable, text, varchar, int, decimal, timestamp, float } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
// Users table - KEEP ONLY THIS ONE
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  name: text("name"),
  nationality: text("nationality"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Regions table
export const regions = mysqlTable("regions", {
  id: int("id").primaryKey().autoincrement(),
  regionId: int("region_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
});

// Points of Interest table
export const pointsOfInterest = mysqlTable("point_of_interest", {
  poiId: varchar("poi_id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  regionId: int("region_id").notNull(),
});

// Restaurant table (singular)
export const restaurant = mysqlTable("restaurant", {
  poiId: varchar("poi_id", { length: 36 }).primaryKey(),
  cuisineType: text("cuisine_type").notNull(),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
  priceRange: text("price_range"),
});

// Restaurants table (plural)
export const restaurants = mysqlTable("restaurants", {
  id: int("id").primaryKey().autoincrement(),
  poiId: varchar("poi_id", { length: 36 }).notNull(),
  cuisineType: text("cuisine_type").notNull(),
});

// Tourist table
export const tourists = mysqlTable("tourist", {
  touristId: varchar("tourist_id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  nationality: text("nationality"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Review table
export const reviews = mysqlTable("review", {
  reviewId: varchar("review_id", { length: 36 }).primaryKey(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  reviewDate: timestamp("review_date").notNull().defaultNow(),
  reviewType: text("review_type").notNull(), // 'poi' or 'booking'
  touristId: varchar("tourist_id", { length: 36 }).notNull(),
  poiId: varchar("poi_id", { length: 36 }),
  bookingId: varchar("booking_id", { length: 36 }),
});

// Transport bookings table
export const transportBookings = mysqlTable("transport_bookings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerName: text("customer_name").notNull(),
  carType: text("car_type").notNull(),
  carName: text("car_name").notNull(),
  destination: text("destination"),  // ← ADD THIS LINE
  distance: int("distance").notNull(),
  pricePerKm: decimal("price_per_km", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// POI bookings table
export const poiBookings = mysqlTable("poi_bookings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerName: text("customer_name").notNull(),
  poiName: text("poi_name").notNull(),
  visitDate: timestamp("visit_date").notNull(),
  numGuests: int("num_guests").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  bookingDate: timestamp("booking_date").notNull().defaultNow(),
});

// Payments table
// Stores payment/revenue records for admin dashboard reporting.
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull(),
  bookingType: text("booking_type").notNull(), // 'transport' or 'poi'
  userId: varchar("user_id", { length: 36 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Favorite collections table
// Example: "My Summer Trip", "Beach Weekend", "History List".
export const favoriteCollections = mysqlTable("favorite_collections", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Saved places inside favorite collections
export const favoritePlaces = mysqlTable("favorite_places", {
  id: varchar("id", { length: 36 }).primaryKey(),
  collectionId: varchar("collection_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  poiId: int("poi_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Newsletter subscribers table
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull(),
  userId: varchar("user_id", { length: 36 }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chatbot sessions and memory
export const chatSessions = mysqlTable("chat_sessions", {
  id: varchar("id", { length: 80 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  preferences: text("preferences"), // JSON text: ["beaches","food"]
  lastSuggestions: text("last_suggestions"), // JSON text
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chatbot message history
export const chatMessages = mysqlTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("session_id", { length: 80 }).notNull(),
  role: text("role").notNull(), // user or bot
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Saved itineraries generated by the smart itinerary / planner
export const savedItineraries = mysqlTable("saved_itineraries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: text("title").notNull(),
  days: int("days").notNull(),
  budget: text("budget").notNull(),
  interests: text("interests").notNull(), // JSON text
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stops/activities inside a saved itinerary
export const itineraryStops = mysqlTable("itinerary_stops", {
  id: varchar("id", { length: 36 }).primaryKey(),
  itineraryId: varchar("itinerary_id", { length: 36 }).notNull(),
  dayNumber: int("day_number").notNull(),
  timeOfDay: text("time_of_day").notNull(), // morning, afternoon, evening
  placeName: text("place_name").notNull(),
  region: text("region"),
  description: text("description"),
  travelTimeMinutes: int("travel_time_minutes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
});

// Admin-created trips shown on the website
export const adminTrips = mysqlTable("admin_trips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  availableDates: text("available_dates"),
  image: text("image"),
  category: text("category"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Lightweight user activity for account dashboard recent activity
export const userActivities = mysqlTable("user_activities", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  activityType: text("activity_type").notNull(), // viewed, booked, saved, planned
  title: text("title").notNull(),
  description: text("description"),
  relatedId: varchar("related_id", { length: 80 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== ZOD SCHEMAS ====================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  nationality: true,
  phone: true,
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export const insertPOISchema = createInsertSchema(pointsOfInterest);

export const insertRestaurantSchema = createInsertSchema(restaurant);

export const insertTouristSchema = createInsertSchema(tourists).omit({
  touristId: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  reviewId: true,
  reviewDate: true,
});

export const insertTransportBookingSchema = createInsertSchema(transportBookings).omit({
  id: true,
  createdAt: true,
});

export const insertPOIBookingSchema = createInsertSchema(poiBookings).omit({
  id: true,
  bookingDate: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteCollectionSchema = createInsertSchema(favoriteCollections).omit({
  id: true,
  createdAt: true,
});

export const insertFavoritePlaceSchema = createInsertSchema(favoritePlaces).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSavedItinerarySchema = createInsertSchema(savedItineraries).omit({
  id: true,
  createdAt: true,
});

export const insertItineraryStopSchema = createInsertSchema(itineraryStops).omit({
  id: true,
});

export const insertAdminTripSchema = createInsertSchema(adminTrips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

// ==================== TYPE EXPORTS ====================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;

export type POI = typeof pointsOfInterest.$inferSelect;
export type InsertPOI = z.infer<typeof insertPOISchema>;

export type Restaurant = typeof restaurant.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type Tourist = typeof tourists.$inferSelect;
export type InsertTourist = z.infer<typeof insertTouristSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type TransportBooking = typeof transportBookings.$inferSelect;
export type InsertTransportBooking = z.infer<typeof insertTransportBookingSchema>;

export type POIBooking = typeof poiBookings.$inferSelect;
export type InsertPOIBooking = z.infer<typeof insertPOIBookingSchema> & {
  customerName?: string;
};

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type FavoriteCollection = typeof favoriteCollections.$inferSelect;
export type InsertFavoriteCollection = z.infer<typeof insertFavoriteCollectionSchema>;

export type FavoritePlace = typeof favoritePlaces.$inferSelect;
export type InsertFavoritePlace = z.infer<typeof insertFavoritePlaceSchema>;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type SavedItinerary = typeof savedItineraries.$inferSelect;
export type InsertSavedItinerary = z.infer<typeof insertSavedItinerarySchema>;

export type ItineraryStop = typeof itineraryStops.$inferSelect;
export type InsertItineraryStop = z.infer<typeof insertItineraryStopSchema>;

export type AdminTrip = typeof adminTrips.$inferSelect;
export type InsertAdminTrip = z.infer<typeof insertAdminTripSchema>;

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
