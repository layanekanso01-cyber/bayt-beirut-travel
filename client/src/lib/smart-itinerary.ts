import { calculateDistance } from "@/lib/distance";

export type ItineraryInterest = "nature" | "nightlife" | "culture" | "beaches" | "food";
export type BudgetLevel = "budget" | "mid-range" | "premium";
export type DayPeriod = "morning" | "afternoon" | "evening";

export type ItineraryLocation = {
  id: string;
  name: string;
  region: string;
  description: string;
  latitude: number;
  longitude: number;
  interests: ItineraryInterest[];
  estimatedCost: number;
  bestPeriods: DayPeriod[];
  visitDuration: string;
};

export type ItineraryStop = {
  period: DayPeriod;
  location: ItineraryLocation;
  travelFromPrevious: string;
  estimatedCost: number;
};

export type ItineraryDay = {
  day: number;
  theme: string;
  stops: ItineraryStop[];
  totalCost: number;
};

export type ItineraryPlan = {
  days: ItineraryDay[];
  totalCost: number;
  summary: string;
};

export const itineraryLocations: ItineraryLocation[] = [
  {
    id: "beirut-downtown",
    name: "Downtown Beirut",
    region: "Beirut",
    description: "Historic streets, landmarks, restaurants, and restored city architecture.",
    latitude: 33.8943,
    longitude: 35.5063,
    interests: ["culture", "nightlife", "food"],
    estimatedCost: 20,
    bestPeriods: ["morning", "afternoon"],
    visitDuration: "2-3 hours",
  },
  {
    id: "gemmayze",
    name: "Gemmayze",
    region: "Beirut",
    description: "Cafes, bars, galleries, and lively heritage streets.",
    latitude: 33.8955,
    longitude: 35.5147,
    interests: ["nightlife", "culture", "food"],
    estimatedCost: 35,
    bestPeriods: ["evening"],
    visitDuration: "2-4 hours",
  },
  {
    id: "raouche",
    name: "Raouche Rocks",
    region: "Beirut",
    description: "Iconic seaside rocks and one of Beirut's best sunset views.",
    latitude: 33.8951,
    longitude: 35.4692,
    interests: ["nature", "beaches"],
    estimatedCost: 5,
    bestPeriods: ["afternoon", "evening"],
    visitDuration: "1-2 hours",
  },
  {
    id: "byblos",
    name: "Byblos",
    region: "Byblos",
    description: "Ancient port city with castle, souks, seafood, and beach access.",
    latitude: 34.1211,
    longitude: 35.6478,
    interests: ["culture", "beaches", "nightlife", "food"],
    estimatedCost: 35,
    bestPeriods: ["morning", "afternoon", "evening"],
    visitDuration: "Half day",
  },
  {
    id: "baalbek",
    name: "Baalbek Roman Temples",
    region: "Bekaa Valley",
    description: "Massive Roman temples and one of Lebanon's greatest historical sites.",
    latitude: 34.0052,
    longitude: 36.2116,
    interests: ["culture"],
    estimatedCost: 25,
    bestPeriods: ["morning", "afternoon"],
    visitDuration: "Half day",
  },
  {
    id: "jeita",
    name: "Jeita Grotto",
    region: "Keserwan",
    description: "Limestone caves, underground river, and family-friendly nature.",
    latitude: 33.9475,
    longitude: 35.6386,
    interests: ["nature"],
    estimatedCost: 25,
    bestPeriods: ["morning", "afternoon"],
    visitDuration: "2-3 hours",
  },
  {
    id: "cedars",
    name: "Cedars of God",
    region: "Bcharre",
    description: "Ancient cedar forest, mountain air, and dramatic scenery.",
    latitude: 34.2495,
    longitude: 36.0623,
    interests: ["nature"],
    estimatedCost: 20,
    bestPeriods: ["morning", "afternoon"],
    visitDuration: "Half day",
  },
  {
    id: "batroun",
    name: "Batroun",
    region: "North Coast",
    description: "Clear water, beach clubs, old town streets, seafood, and sunset spots.",
    latitude: 34.2553,
    longitude: 35.6581,
    interests: ["beaches", "nightlife", "culture", "food"],
    estimatedCost: 45,
    bestPeriods: ["afternoon", "evening"],
    visitDuration: "Half day",
  },
  {
    id: "tyre",
    name: "Tyre",
    region: "South Lebanon",
    description: "Roman ruins, Phoenician history, sandy beaches, and coastal food.",
    latitude: 33.2746,
    longitude: 35.1945,
    interests: ["culture", "beaches", "food"],
    estimatedCost: 30,
    bestPeriods: ["morning", "afternoon"],
    visitDuration: "Half day to full day",
  },
];

const periods: DayPeriod[] = ["morning", "afternoon", "evening"];

function budgetLimit(level: BudgetLevel) {
  if (level === "budget") return 55;
  if (level === "mid-range") return 95;
  return 150;
}

function estimateTravelMinutes(from?: ItineraryLocation, to?: ItineraryLocation) {
  if (!from || !to) return 0;
  const distance = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  const roadDistance = distance * 1.28;
  return Math.max(10, Math.round((roadDistance / 45) * 60));
}

export function formatTravelTime(minutes: number) {
  if (minutes === 0) return "Start here";
  if (minutes < 60) return `${minutes} min drive`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m drive` : `${hours}h drive`;
}

function scoreLocation(
  location: ItineraryLocation,
  interests: ItineraryInterest[],
  period: DayPeriod,
  budget: BudgetLevel
) {
  const interestScore = interests.reduce(
    (score, interest) => score + (location.interests.includes(interest) ? 8 : 0),
    0
  );
  const periodScore = location.bestPeriods.includes(period) ? 5 : 0;
  const budgetScore = location.estimatedCost <= budgetLimit(budget) / 3 ? 4 : budget === "premium" ? 2 : -2;
  return interestScore + periodScore + budgetScore;
}

function pickLocation(
  usedIds: Set<string>,
  interests: ItineraryInterest[],
  budget: BudgetLevel,
  period: DayPeriod,
  previous?: ItineraryLocation
) {
  const candidates = itineraryLocations.filter((location) => !usedIds.has(location.id));
  const [best] = candidates
    .map((location) => {
      const travelPenalty = previous ? estimateTravelMinutes(previous, location) / 25 : 0;
      return {
        location,
        score: scoreLocation(location, interests, period, budget) - travelPenalty,
      };
    })
    .sort((a, b) => b.score - a.score);

  return best?.location;
}

function getDayTheme(stops: ItineraryStop[]) {
  const interests = stops.flatMap((stop) => stop.location.interests);
  if (interests.includes("beaches") && interests.includes("nightlife")) return "Coast and Evening Energy";
  if (interests.includes("food")) return "Local Flavors and City Life";
  if (interests.includes("nature")) return "Nature and Scenic Lebanon";
  if (interests.includes("culture")) return "Heritage and Local Culture";
  return "Lebanon Highlights";
}

export function generateSmartItinerary(params: {
  days: number;
  budget: BudgetLevel;
  interests: ItineraryInterest[];
}): ItineraryPlan {
  const safeDays = Math.min(Math.max(params.days, 1), 7);
  const interests: ItineraryInterest[] = params.interests.length > 0 ? params.interests : ["culture"];
  const usedIds = new Set<string>();
  const days: ItineraryDay[] = [];

  for (let dayNumber = 1; dayNumber <= safeDays; dayNumber += 1) {
    const stops: ItineraryStop[] = [];
    let previous: ItineraryLocation | undefined;

    periods.forEach((period) => {
      const location = pickLocation(usedIds, interests, params.budget, period, previous);
      if (!location) return;

      const travelMinutes = estimateTravelMinutes(previous, location);
      usedIds.add(location.id);
      stops.push({
        period,
        location,
        travelFromPrevious: formatTravelTime(travelMinutes),
        estimatedCost: location.estimatedCost,
      });
      previous = location;
    });

    days.push({
      day: dayNumber,
      theme: getDayTheme(stops),
      stops,
      totalCost: stops.reduce((sum, stop) => sum + stop.estimatedCost, 0),
    });
  }

  const totalCost = days.reduce((sum, day) => sum + day.totalCost, 0);

  return {
    days,
    totalCost,
    summary: `${safeDays}-day ${params.budget} itinerary focused on ${interests.join(", ")}.`,
  };
}
