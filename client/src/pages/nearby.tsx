import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Compass, LocateFixed, MapPin, Navigation, Search, Star } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { LebanonMap } from "@/components/lebanon-map";
import { ActivityType, POI, pois, regions } from "@/lib/data";
import { calculateDistance } from "@/lib/distance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CityLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type NearbyResult = {
  poi: POI;
  distance: number;
};

const cityLocations: CityLocation[] = [
  { name: "Beirut", latitude: 33.8938, longitude: 35.5018 },
  { name: "Byblos", latitude: 34.123, longitude: 35.6519 },
  { name: "Baalbek", latitude: 34.0058, longitude: 36.2181 },
  { name: "Jounieh", latitude: 33.9808, longitude: 35.6178 },
  { name: "Tripoli", latitude: 34.4367, longitude: 35.8497 },
  { name: "Sidon", latitude: 33.5571, longitude: 35.3715 },
  { name: "Tyre", latitude: 33.2704, longitude: 35.2038 },
  { name: "Chouf", latitude: 33.695, longitude: 35.5808 },
];

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

function parseCoordinates(value: string): CityLocation | null {
  const match = value.trim().match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (!match) return null;

  return {
    name: "Custom location",
    latitude: Number(match[1]),
    longitude: Number(match[3]),
  };
}

function resolveLocation(input: string): CityLocation | null {
  const coordinates = parseCoordinates(input);
  if (coordinates) return coordinates;

  const normalizedInput = input.trim().toLowerCase();
  return cityLocations.find((city) => city.name.toLowerCase() === normalizedInput) ?? null;
}

export default function Nearby() {
  const [locationInput, setLocationInput] = useState("Beirut");
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");
  const userLocation = resolveLocation(locationInput);

  const nearbyResults = useMemo<NearbyResult[]>(() => {
    if (!userLocation) return [];

    return pois
      .filter((poi) => {
        const hasCoordinates = typeof poi.latitude === "number" && typeof poi.longitude === "number";
        const matchesActivity = activityFilter === "all" || poi.activities?.includes(activityFilter);
        return hasCoordinates && matchesActivity;
      })
      .map((poi) => ({
        poi,
        distance: calculateDistance(userLocation.latitude, userLocation.longitude, poi.latitude!, poi.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);
  }, [activityFilter, userLocation]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 gap-2">
              <LocateFixed className="h-3.5 w-3.5" />
              Nearby discovery
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Find places near you in Lebanon.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Enter a city or coordinates, then the app sorts attractions by distance.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-2xl font-serif font-bold">Your location</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try Beirut, Byblos, Baalbek, Jounieh, Tripoli, Sidon, Tyre, or coordinates like 33.8938, 35.5018.
              </p>

              <div className="mt-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={locationInput}
                    onChange={(event) => setLocationInput(event.target.value)}
                    placeholder="City or lat, lon"
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
                        {activity === "all" ? "All activities" : activity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userLocation ? (
                <div className="mt-5 rounded-lg bg-muted/60 p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <Navigation className="h-4 w-4 text-primary" />
                    {userLocation.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Location not found. Choose a listed city or enter coordinates.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-xl font-serif font-bold">Example</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                If the user enters Beirut, close results include Gemmayze, Downtown Beirut, Raouche Rocks, Mim Museum, and Beirut restaurants.
              </p>
              <Button className="mt-4 w-full" type="button" onClick={() => setLocationInput("Beirut")}>
                <Compass className="h-4 w-4" />
                Use Beirut
              </Button>
            </div>
          </aside>

          <div className="space-y-6">
            <LebanonMap places={nearbyResults.map((result) => result.poi)} height="420px" showActivityFilters />

            <div className="grid gap-4 md:grid-cols-2">
              {nearbyResults.map(({ poi, distance }, index) => (
                <article
                  key={poi.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex gap-4 p-4">
                    <img src={poi.image} alt={poi.name} className="h-28 w-28 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            #{index + 1} nearest
                          </Badge>
                          <h3 className="text-xl font-serif font-bold text-foreground">{poi.name}</h3>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {poi.rating}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {poi.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {distance} km
                        </Badge>
                        <Badge variant="outline">{getRegionName(poi)}</Badge>
                      </div>

                      <Button asChild size="sm" className="mt-4">
                        <Link href={`/poi/${poi.id}`}>View place</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
