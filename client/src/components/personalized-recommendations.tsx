import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Coffee,
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Sparkles,
  Star,
  Sun,
  Waves,
} from "lucide-react";
import { ActivityType, POI, pois, regions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Preference = {
  value: ActivityType;
  label: string;
  icon: typeof Compass;
};

type TripPace = "relaxed" | "balanced" | "packed";

const preferences: Preference[] = [
  { value: "culture", label: "Culture", icon: Landmark },
  { value: "hiking", label: "Hiking", icon: Mountain },
  { value: "beaches", label: "Beaches", icon: Waves },
  { value: "nightlife", label: "Nightlife", icon: Sun },
  { value: "food", label: "Food", icon: Coffee },
  { value: "nature", label: "Nature", icon: Compass },
];

const paceLabels: Record<TripPace, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  packed: "Packed",
};

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

function scorePOI(poi: POI, selectedPreferences: ActivityType[], pace: TripPace) {
  const activities = poi.activities ?? [];
  const preferenceMatches = selectedPreferences.filter((preference) => activities.includes(preference)).length;
  const baseScore = poi.rating * 12;
  const preferenceScore = preferenceMatches * 18;
  const freeOrLowCostBonus = pace === "relaxed" && (poi.entranceFee ?? poi.averagePrice ?? 0) <= 12 ? 8 : 0;
  const packedBonus = pace === "packed" && activities.length >= 2 ? 7 : 0;
  const balancedBonus = pace === "balanced" && poi.rating >= 4.6 ? 5 : 0;

  return Math.round(Math.min(99, baseScore + preferenceScore + freeOrLowCostBonus + packedBonus + balancedBonus));
}

export function PersonalizedRecommendations() {
  const [selectedPreferences, setSelectedPreferences] = useState<ActivityType[]>(["culture", "nature"]);
  const [pace, setPace] = useState<TripPace>("balanced");

  const recommendedPois = useMemo(() => {
    return [...pois]
      .map((poi) => ({
        poi,
        score: scorePOI(poi, selectedPreferences, pace),
      }))
      .sort((a, b) => b.score - a.score || b.poi.rating - a.poi.rating)
      .slice(0, 3);
  }, [pace, selectedPreferences]);

  function togglePreference(preference: ActivityType) {
    setSelectedPreferences((current) => {
      if (current.includes(preference)) {
        return current.length === 1 ? current : current.filter((item) => item !== preference);
      }

      return [...current, preference];
    });
  }

  return (
    <section className="py-20 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <div>
            <Badge variant="secondary" className="mb-4 gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Smart recommendations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Build a Lebanon shortlist around your mood.
            </h2>
            <p className="mt-4 text-muted-foreground leading-7">
              Pick what you care about and the app instantly ranks places for your trip style.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.map((preference) => {
                    const Icon = preference.icon;
                    const isSelected = selectedPreferences.includes(preference.value);

                    return (
                      <Button
                        key={preference.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePreference(preference.value)}
                        className="rounded-full"
                      >
                        <Icon className="h-4 w-4" />
                        {preference.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Trip pace</p>
                <div className="grid grid-cols-3 rounded-lg border border-border bg-muted/40 p-1">
                  {(Object.keys(paceLabels) as TripPace[]).map((paceOption) => (
                    <button
                      key={paceOption}
                      type="button"
                      onClick={() => setPace(paceOption)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-semibold transition-all",
                        pace === paceOption
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {paceLabels[paceOption]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {recommendedPois.map(({ poi, score }, index) => (
              <motion.article
                key={`${poi.id}-${score}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group overflow-hidden rounded-xl border border-border bg-background shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={poi.image}
                    alt={poi.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur">
                    {score}% match
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary">
                      {poi.name}
                    </h3>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {poi.rating}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {poi.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(poi.activities ?? []).slice(0, 3).map((activity) => (
                      <Badge key={activity} variant="outline" className="capitalize">
                        {activity}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {getRegionName(poi)}
                    </span>
                    <Button asChild size="sm">
                      <Link href={`/poi/${poi.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
