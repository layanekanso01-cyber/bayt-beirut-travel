import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Landmark, Moon, Mountain, Star, Waves } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityType, POI, pois, regions } from "@/lib/data";
import { cn } from "@/lib/utils";

type Mood = {
  id: "nature" | "history" | "beach" | "food" | "nightlife";
  label: string;
  description: string;
  activities: ActivityType[];
  icon: typeof Mountain;
};

const moods: Mood[] = [
  {
    id: "nature",
    label: "Nature",
    description: "Mountains, valleys, caves, and cedar trails.",
    activities: ["nature", "hiking"],
    icon: Mountain,
  },
  {
    id: "history",
    label: "History",
    description: "Ruins, castles, museums, and old souks.",
    activities: ["culture"],
    icon: Landmark,
  },
  {
    id: "beach",
    label: "Beach",
    description: "Coastal views, sea castles, and Mediterranean sunsets.",
    activities: ["beaches"],
    icon: Waves,
  },
  {
    id: "food",
    label: "Food",
    description: "Lebanese meals, bakeries, mezze, and local favorites.",
    activities: ["food"],
    icon: Coffee,
  },
  {
    id: "nightlife",
    label: "Nightlife",
    description: "Gemmayze, Beirut evenings, restaurants, and social streets.",
    activities: ["nightlife"],
    icon: Moon,
  },
];

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

function scoreMoodMatch(poi: POI, mood: Mood) {
  const activityMatches = mood.activities.filter((activity) => poi.activities?.includes(activity)).length;
  const typeBoost = mood.id === "food" && poi.type === "restaurant" ? 2 : 0;
  const ratingBoost = poi.rating >= 4.7 ? 1 : 0;
  return activityMatches * 10 + typeBoost + ratingBoost + poi.rating;
}

function explainMatch(poi: POI, mood: Mood) {
  if (mood.id === "food" && poi.type === "restaurant") return "Great for Lebanese flavors and local dining.";
  if (mood.id === "nature") return "Picked for scenery, fresh air, and outdoor exploring.";
  if (mood.id === "history") return "Picked for heritage, ruins, and cultural depth.";
  if (mood.id === "beach") return "Picked for coastal energy and sea views.";
  return "Picked for lively evenings and social atmosphere.";
}

export function TravelMoodPicker() {
  const [selectedMood, setSelectedMood] = useState<Mood>(moods[0]);

  const recommendations = useMemo(() => {
    return [...pois]
      .filter((poi) => {
        if (selectedMood.id === "food") return poi.type === "restaurant" || poi.activities?.includes("food");
        return selectedMood.activities.some((activity) => poi.activities?.includes(activity));
      })
      .sort((a, b) => scoreMoodMatch(b, selectedMood) - scoreMoodMatch(a, selectedMood))
      .slice(0, 3);
  }, [selectedMood]);

  return (
    <section className="border-y border-border bg-muted/25 py-18">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-4 gap-2">
              <Star className="h-4 w-4" />
              Choose Your Travel Mood
            </Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
              Tell us your vibe. We will suggest the trip.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Select a mood and get instant Lebanon recommendations based on what you feel like doing today.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {moods.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood.id === mood.id;

            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={cn(
                  "group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg",
                  isSelected
                    ? "border-primary bg-card shadow-lg ring-2 ring-primary/15"
                    : "border-border bg-card/70"
                )}
              >
                <span
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-secondary"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="block font-serif text-xl font-bold text-foreground">{mood.label}</span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{mood.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {recommendations.map((poi, index) => (
            <motion.article
              key={`${selectedMood.id}-${poi.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={poi.image}
                  alt={poi.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <Badge className="absolute left-4 top-4 bg-white text-foreground hover:bg-white">
                  {getRegionName(poi)}
                </Badge>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary">
                    {poi.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold">
                    {poi.rating}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-secondary">{explainMatch(poi, selectedMood)}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{poi.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(poi.activities ?? []).slice(0, 2).map((activity) => (
                      <Badge key={activity} variant="outline" className="capitalize">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/poi/${poi.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
