import type { Express } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { chatMessages, chatSessions } from "@shared/schema.ts";

type Preference =
  | "culture"
  | "history"
  | "nature"
  | "hiking"
  | "beaches"
  | "nightlife"
  | "food"
  | "shopping";

type ChatMemory = {
  preferences: Preference[];
  lastSuggestions: string[];
  messages: Array<{ role: "user" | "bot"; text: string }>;
};

type LebanonPlace = {
  name: string;
  region: string;
  description: string;
  activities: Preference[];
  bestFor: string;
  estimatedTime: string;
};

const places: LebanonPlace[] = [
  {
    name: "Baalbek Roman Temples",
    region: "Bekaa Valley",
    description: "Huge Roman ruins and one of Lebanon's most impressive historical sites.",
    activities: ["culture", "history"],
    bestFor: "ancient ruins and photography",
    estimatedTime: "Half day",
  },
  {
    name: "Byblos",
    region: "Mount Lebanon coast",
    description: "Historic port city with a castle, old souks, seaside restaurants, and beach access.",
    activities: ["culture", "history", "beaches", "food"],
    bestFor: "history plus a relaxed coastal evening",
    estimatedTime: "Half day to full day",
  },
  {
    name: "Raouche Rocks",
    region: "Beirut",
    description: "Iconic seaside rock formations and an easy Beirut sunset stop.",
    activities: ["nature", "beaches"],
    bestFor: "quick views, photos, and sunset",
    estimatedTime: "1-2 hours",
  },
  {
    name: "Gemmayze",
    region: "Beirut",
    description: "Walkable neighborhood with cafes, bars, galleries, and heritage streets.",
    activities: ["nightlife", "food", "culture"],
    bestFor: "evening food, drinks, and city atmosphere",
    estimatedTime: "2-4 hours",
  },
  {
    name: "Downtown Beirut",
    region: "Beirut",
    description: "Central district with landmarks, restored streets, restaurants, and shopping.",
    activities: ["culture", "food", "shopping"],
    bestFor: "city walks and architecture",
    estimatedTime: "2-3 hours",
  },
  {
    name: "Jeita Grotto",
    region: "Keserwan",
    description: "A beautiful limestone cave system with an underground river.",
    activities: ["nature"],
    bestFor: "natural wonders and families",
    estimatedTime: "2-3 hours",
  },
  {
    name: "Cedars of God",
    region: "Bcharre",
    description: "Ancient cedar forest in the mountains, great for fresh air and views.",
    activities: ["nature", "hiking"],
    bestFor: "mountains, snow season, and nature walks",
    estimatedTime: "Half day",
  },
  {
    name: "Qadisha Valley",
    region: "North Lebanon",
    description: "UNESCO valley with cliffside monasteries and dramatic hiking routes.",
    activities: ["nature", "hiking", "history"],
    bestFor: "serious scenery and hiking",
    estimatedTime: "Full day",
  },
  {
    name: "Chouf Cedar Reserve",
    region: "Chouf",
    description: "Large mountain reserve with cedar trees, trails, and village stops nearby.",
    activities: ["nature", "hiking"],
    bestFor: "quiet hiking and mountain villages",
    estimatedTime: "Half day to full day",
  },
  {
    name: "Tyre Ancient City",
    region: "South Lebanon",
    description: "Coastal city with Roman ruins, Phoenician history, and beaches.",
    activities: ["culture", "history", "beaches"],
    bestFor: "ruins plus beach time",
    estimatedTime: "Full day",
  },
  {
    name: "Sidon Sea Castle",
    region: "South Lebanon",
    description: "Historic sea castle connected to old souks and coastal views.",
    activities: ["culture", "history", "food"],
    bestFor: "heritage walks and old markets",
    estimatedTime: "Half day",
  },
];

const memoryBySession = new Map<string, ChatMemory>();

function getMemory(sessionId: string): ChatMemory {
  if (!memoryBySession.has(sessionId)) {
    memoryBySession.set(sessionId, {
      preferences: [],
      lastSuggestions: [],
      messages: [],
    });
  }

  return memoryBySession.get(sessionId)!;
}

function extractPreferences(message: string): Preference[] {
  const text = message.toLowerCase();
  const preferences: Preference[] = [];

  const checks: Array<[Preference, RegExp]> = [
    ["culture", /\b(culture|cultural|museum|architecture|city walk)\b/],
    ["history", /\b(history|historical|ruins|roman|castle|temple|old|heritage)\b/],
    ["nature", /\b(nature|mountain|cedar|forest|views|valley|cave)\b/],
    ["hiking", /\b(hike|hiking|trail|walk|adventure)\b/],
    ["beaches", /\b(beach|beaches|sea|coast|coastal|swim|summer)\b/],
    ["nightlife", /\b(nightlife|bar|club|drinks|evening|party)\b/],
    ["food", /\b(food|restaurant|eat|dining|mezze|seafood|cafe)\b/],
    ["shopping", /\b(shopping|shop|souq|souk|market|souvenir)\b/],
  ];

  checks.forEach(([preference, pattern]) => {
    if (pattern.test(text)) preferences.push(preference);
  });

  return preferences;
}

function mergePreferences(current: Preference[], incoming: Preference[]) {
  return Array.from(new Set([...current, ...incoming]));
}

function scorePlace(place: LebanonPlace, preferences: Preference[]) {
  if (preferences.length === 0) return place.activities.includes("culture") ? 2 : 1;
  return preferences.reduce((score, preference) => {
    return score + (place.activities.includes(preference) ? 3 : 0);
  }, 0);
}

function getSuggestions(preferences: Preference[], limit = 4) {
  return [...places]
    .map((place) => ({ place, score: scorePlace(place, preferences) }))
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map(({ place }) => place);
}

function getRegionSuggestions(message: string, limit = 4) {
  const text = message.toLowerCase();
  const regionMatchers: Array<{ label: string; pattern: RegExp; terms: string[] }> = [
    { label: "Beirut", pattern: /\b(beirut|gemmayze|raouche|downtown)\b/, terms: ["beirut", "gemmayze", "raouche"] },
    { label: "Byblos", pattern: /\b(byblos|jbeil)\b/, terms: ["byblos"] },
    { label: "Baalbek", pattern: /\b(baalbek|bekaa)\b/, terms: ["baalbek", "bekaa"] },
    { label: "Cedars and Bcharre", pattern: /\b(cedars|bcharre|qadisha)\b/, terms: ["cedars", "bcharre", "qadisha"] },
    { label: "South Lebanon", pattern: /\b(tyre|sidon|south)\b/, terms: ["tyre", "sidon", "south"] },
    { label: "Chouf", pattern: /\b(chouf)\b/, terms: ["chouf"] },
  ];

  const match = regionMatchers.find((region) => region.pattern.test(text));
  if (!match) return null;

  const suggestions = places
    .filter((place) => {
      const haystack = `${place.name} ${place.region} ${place.description}`.toLowerCase();
      return match.terms.some((term) => haystack.includes(term));
    })
    .slice(0, limit);

  return {
    label: match.label,
    suggestions,
  };
}

function formatSuggestions(suggestions: LebanonPlace[], preferences: Preference[]) {
  const preferenceText =
    preferences.length > 0 ? ` based on your interest in ${preferences.join(", ")}` : "";

  return [
    `Here are strong Lebanon picks${preferenceText}:`,
    "",
    ...suggestions.map(
      (place, index) =>
        `${index + 1}. ${place.name} (${place.region})\n` +
        `   ${place.description}\n` +
        `   Best for: ${place.bestFor}. Suggested time: ${place.estimatedTime}.`
    ),
    "",
    "Tell me your vibe, for example: beaches, hiking, history, nightlife, food, or family-friendly.",
  ].join("\n");
}

function formatRegionSuggestions(region: string, suggestions: LebanonPlace[]) {
  if (suggestions.length === 0) {
    return `I know ${region}, but I need a little more detail. Are you looking for food, history, nightlife, beaches, or nature?`;
  }

  return [
    `For ${region}, I recommend:`,
    "",
    ...suggestions.map(
      (place, index) =>
        `${index + 1}. ${place.name}\n` +
        `   ${place.description}\n` +
        `   Best for: ${place.bestFor}. Suggested time: ${place.estimatedTime}.`
    ),
    "",
    "You can also ask: 'Beirut nightlife', 'Beirut food', or 'near Beirut nature'.",
  ].join("\n");
}

function buildReply(message: string, memory: ChatMemory) {
  const text = message.toLowerCase();
  const incomingPreferences = extractPreferences(message);
  memory.preferences = mergePreferences(memory.preferences, incomingPreferences);

  if (/\b(hi|hello|hey)\b/.test(text)) {
    return "Hi! I can help you choose places in Lebanon. Tell me what you like: history, beaches, hiking, nightlife, food, or nature.";
  }

  if (/\b(clear|reset|forget)\b/.test(text)) {
    memory.preferences = [];
    memory.lastSuggestions = [];
    return "Done. I reset your travel preferences. What kind of Lebanon trip do you want now?";
  }

  const regionMatch = getRegionSuggestions(message);
  if (regionMatch) {
    memory.lastSuggestions = regionMatch.suggestions.map((place) => place.name);
    return formatRegionSuggestions(regionMatch.label, regionMatch.suggestions);
  }

  if (/\b(more|another|else|similar)\b/.test(text) && memory.preferences.length > 0) {
    const previous = new Set(memory.lastSuggestions);
    const suggestions = getSuggestions(memory.preferences, 8).filter((place) => !previous.has(place.name)).slice(0, 4);
    const fallback = suggestions.length > 0 ? suggestions : getSuggestions(memory.preferences, 4);
    memory.lastSuggestions = fallback.map((place) => place.name);
    return formatSuggestions(fallback, memory.preferences);
  }

  if (/\b(where should i go|recommend|suggest|places|visit|itinerary|trip|go in lebanon)\b/.test(text) || incomingPreferences.length > 0) {
    const suggestions = getSuggestions(memory.preferences, 4);
    memory.lastSuggestions = suggestions.map((place) => place.name);
    return formatSuggestions(suggestions, memory.preferences);
  }

  if (/\b(thanks|thank you|thx)\b/.test(text)) {
    return "You're welcome. I can also help narrow it down by region, travel style, or number of days.";
  }

  return "I can suggest Lebanese places from my local travel data. Try: 'Where should I go in Lebanon?', 'I like beaches and food', or 'Suggest hiking places'.";
}

async function saveChatTurn(sessionId: string, userId: string | null, memory: ChatMemory, userMessage: string, botReply: string) {
  if (!db) return;

  const existingSession = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
  const sessionData = {
    id: sessionId,
    userId,
    preferences: JSON.stringify(memory.preferences),
    lastSuggestions: JSON.stringify(memory.lastSuggestions),
    updatedAt: new Date(),
  };

  if (existingSession[0]) {
    await db
      .update(chatSessions)
      .set({
        userId: userId || existingSession[0].userId,
        preferences: sessionData.preferences,
        lastSuggestions: sessionData.lastSuggestions,
        updatedAt: sessionData.updatedAt,
      })
      .where(eq(chatSessions.id, sessionId));
  } else {
    await db.insert(chatSessions).values({
      ...sessionData,
      createdAt: new Date(),
    });
  }

  await db.insert(chatMessages).values([
    {
      id: randomUUID(),
      sessionId,
      role: "user",
      message: userMessage,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      sessionId,
      role: "bot",
      message: botReply,
      createdAt: new Date(),
    },
  ]);
}

export function registerChatbotRoutes(app: Express) {
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId = "guest", userId = null } = req.body as {
        message?: string;
        sessionId?: string;
        userId?: string | null;
      };

      if (!message || typeof message !== "string") {
        return res.status(400).json({ reply: "Please type a message so I can help you." });
      }

      const memory = getMemory(sessionId);
      memory.messages.push({ role: "user", text: message });

      const reply = buildReply(message, memory);
      memory.messages.push({ role: "bot", text: reply });
      await saveChatTurn(sessionId, userId, memory, message, reply);

      res.json({
        reply,
        memory: {
          preferences: memory.preferences,
          lastSuggestions: memory.lastSuggestions,
          messageCount: memory.messages.length,
        },
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({ reply: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/chat/memory/:sessionId", async (req, res) => {
    try {
      const memory = getMemory(req.params.sessionId);

      if (db) {
        const session = await db.select().from(chatSessions).where(eq(chatSessions.id, req.params.sessionId));
        const messages = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, req.params.sessionId));

        if (session[0]) {
          memory.preferences = session[0].preferences ? JSON.parse(session[0].preferences) : [];
          memory.lastSuggestions = session[0].lastSuggestions ? JSON.parse(session[0].lastSuggestions) : [];
          memory.messages = messages.map((message: any) => ({
            role: message.role === "user" ? "user" : "bot",
            text: message.message,
          }));
        }
      }

      res.json({
        preferences: memory.preferences,
        lastSuggestions: memory.lastSuggestions,
        messages: memory.messages,
      });
    } catch (error) {
      console.error("Chat memory error:", error);
      res.status(500).json({ message: "Could not load chat memory" });
    }
  });
}
