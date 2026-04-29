import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Gauge,
  MapPin,
  Plus,
  Route,
  Search,
  Trash2,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { LebanonMap } from "@/components/lebanon-map";
import { ActivityType, POI, pois, regions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { calculateDistance } from "@/lib/distance";
import { useAuth } from "@/contexts/auth-context";
import { scopedStorageKey } from "@/lib/user-scope";

type TripStop = {
  poiId: number;
  day: number;
};

const baseStorageKey = "lebanon-tourism-trip-plan";

const activityFilters: Array<ActivityType | "all"> = [
  "all",
  "culture",
  "hiking",
  "beaches",
  "nightlife",
  "nature",
  "food",
  "shopping",
];

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

function getSuggestedDuration(poi: POI) {
  if (poi.activities?.includes("hiking")) return "Half day";
  if (poi.activities?.includes("beaches")) return "3-4 hours";
  if (poi.type === "restaurant") return "1-2 hours";
  if (poi.type === "shop") return "45 min";
  return "2-3 hours";
}

function getDistanceBetweenPlaces(origin: POI, destination: POI) {
  if (
    typeof origin.latitude !== "number" ||
    typeof origin.longitude !== "number" ||
    typeof destination.latitude !== "number" ||
    typeof destination.longitude !== "number"
  ) {
    return 0;
  }

  return calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
}

function optimizeRoute(selectedPois: POI[]) {
  if (selectedPois.length <= 2) return selectedPois;

  const remaining = [...selectedPois];
  const route = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const distance = getDistanceBetweenPlaces(current, candidate);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    route.push(remaining.splice(closestIndex, 1)[0]);
  }

  return route;
}

function getRouteStats(route: POI[]) {
  const directDistance = route.reduce((total, poi, index) => {
    if (index === 0) return total;
    return total + getDistanceBetweenPlaces(route[index - 1], poi);
  }, 0);
  const estimatedRoadDistance = directDistance * 1.28;
  const estimatedMinutes = Math.round((estimatedRoadDistance / 45) * 60);

  return {
    distance: Math.round(estimatedRoadDistance * 10) / 10,
    minutes: estimatedMinutes,
  };
}

function formatTravelTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function readStoredStops(storageKey: string) {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return [];

    const parsed = JSON.parse(value) as TripStop[];
    return parsed.filter((stop) => pois.some((poi) => poi.id === stop.poiId));
  } catch {
    return [];
  }
}

export default function TripPlanner() {
  const { user } = useAuth();
  const [stops, setStops] = useState<TripStop[]>([]);
  const [selectedDay, setSelectedDay] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    setStops(user ? readStoredStops(scopedStorageKey(user, baseStorageKey)) : []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(scopedStorageKey(user, baseStorageKey), JSON.stringify(stops));
  }, [stops, user]);

  const tripPois = useMemo(() => {
    return stops
      .map((stop) => {
        const poi = pois.find((item) => item.id === stop.poiId);
        return poi ? { ...stop, poi } : undefined;
      })
      .filter((stop): stop is TripStop & { poi: POI } => Boolean(stop));
  }, [stops]);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      const matchesSearch =
        poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poi.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActivity = activityFilter === "all" || poi.activities?.includes(activityFilter);

      return matchesSearch && matchesActivity;
    });
  }, [activityFilter, searchTerm]);

  const days = useMemo(() => {
    const maxDay = Math.max(3, ...stops.map((stop) => stop.day));
    return Array.from({ length: maxDay }, (_, index) => index + 1);
  }, [stops]);

  const selectedPlaces = tripPois.map((stop) => stop.poi);
  const optimizedRoute = useMemo(() => optimizeRoute(selectedPlaces), [selectedPlaces]);
  const routeStats = useMemo(() => getRouteStats(optimizedRoute), [optimizedRoute]);
  const totalStops = stops.length;
  const uniqueRegions = new Set(tripPois.map((stop) => stop.poi.regionId)).size;
  const averageRating =
    tripPois.length > 0
      ? (tripPois.reduce((sum, stop) => sum + stop.poi.rating, 0) / tripPois.length).toFixed(1)
      : "0.0";

  function addStop(poiId: number) {
    const day = Number(selectedDay);
    setStops((current) => {
      if (current.some((stop) => stop.poiId === poiId && stop.day === day)) return current;
      return [...current, { poiId, day }];
    });
  }

  function removeStop(poiId: number, day: number) {
    setStops((current) => current.filter((stop) => !(stop.poiId === poiId && stop.day === day)));
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 gap-2">
              <Route className="h-3.5 w-3.5" />
              Interactive itinerary
            </Badge>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                  Plan your Lebanon trip day by day.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Add beaches, ruins, hikes, restaurants, and city stops into a simple itinerary that stays saved in your browser.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-2xl font-bold text-foreground">{totalStops}</p>
                  <p className="text-xs text-muted-foreground">Stops</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-2xl font-bold text-foreground">{uniqueRegions}</p>
                  <p className="text-xs text-muted-foreground">Regions</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-2xl font-bold text-foreground">{averageRating}</p>
                  <p className="text-xs text-muted-foreground">Avg rating</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 2xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-5 2xl:sticky 2xl:top-24 2xl:self-start">
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Add places</h2>
                  <p className="text-sm text-muted-foreground">Choose a day, then add stops.</p>
                </div>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search places"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={activityFilter}
                  onValueChange={(value) => setActivityFilter(value as ActivityType | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityFilters.map((activity) => (
                      <SelectItem key={activity} value={activity} className="capitalize">
                        {activity === "all" ? "All" : activity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {filteredPois.slice(0, 12).map((poi) => {
                  const isAdded = stops.some(
                    (stop) => stop.poiId === poi.id && stop.day === Number(selectedDay)
                  );

                  return (
                    <motion.div
                      key={poi.id}
                      layout
                      className={cn(
                        "rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/50 hover:shadow-md",
                        isAdded && "border-primary/60 bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <img
                          src={poi.image}
                          alt={poi.name}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold leading-tight">{poi.name}</h3>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {getRegionName(poi)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant={isAdded ? "secondary" : "outline"}
                              onClick={() => addStop(poi.id)}
                              aria-label={`Add ${poi.name} to trip`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(poi.activities ?? []).slice(0, 3).map((activity) => (
                              <Badge key={activity} variant="outline" className="capitalize">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Your itinerary</h2>
                  <p className="text-sm text-muted-foreground">Stops are saved on this browser.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStops([])}
                  disabled={stops.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {days.map((day) => {
                  const dayStops = tripPois.filter((stop) => stop.day === day);

                  return (
                    <section key={day} className="rounded-lg border border-border bg-background p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-serif text-xl font-bold">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          Day {day}
                        </h3>
                        <Badge variant="secondary">{dayStops.length} stops</Badge>
                      </div>

                      {dayStops.length > 0 ? (
                        <div className="space-y-3">
                          {dayStops.map(({ poi }, index) => (
                            <article key={`${day}-${poi.id}`} className="rounded-md border border-border p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Link href={`/poi/${poi.id}`} className="font-semibold hover:text-primary">
                                    {poi.name}
                                  </Link>
                                  <p className="mt-1 text-xs text-muted-foreground">{getRegionName(poi)}</p>
                                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {getSuggestedDuration(poi)}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeStop(poi.id, day)}
                                  aria-label={`Remove ${poi.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                          Add places to Day {day}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <LebanonMap
                  places={selectedPlaces}
                  routePlaces={optimizedRoute}
                  height="460px"
                  showActivityFilters
                />
              </div>

              <aside className="rounded-xl border border-border bg-card p-4 shadow-md">
                <div className="mb-4">
                  <Badge variant="secondary" className="mb-3 gap-2">
                    <Gauge className="h-3.5 w-3.5" />
                    Best route
                  </Badge>
                  <h2 className="text-2xl font-serif font-bold">Suggested driving order</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Uses a simple nearest-destination calculation with estimated road distance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xl font-bold">{routeStats.distance} km</p>
                    <p className="text-xs text-muted-foreground">Estimated distance</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xl font-bold">{formatTravelTime(routeStats.minutes)}</p>
                    <p className="text-xs text-muted-foreground">Travel time</p>
                  </div>
                </div>

                {optimizedRoute.length > 1 ? (
                  <div className="mt-5 space-y-3">
                    {optimizedRoute.map((poi, index) => {
                      const previousPoi = optimizedRoute[index - 1];
                      const legDistance = previousPoi
                        ? Math.round(getDistanceBetweenPlaces(previousPoi, poi) * 1.28 * 10) / 10
                        : 0;

                      return (
                        <div key={`${poi.id}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold">{poi.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{getRegionName(poi)}</p>
                              {previousPoi && (
                                <p className="mt-2 text-xs font-medium text-primary">
                                  +{legDistance} km from previous stop
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    Add at least two destinations to calculate a route.
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
