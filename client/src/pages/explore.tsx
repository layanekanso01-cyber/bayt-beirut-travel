import { ActivityType, pois, regions } from "@/lib/data";
import { POICard } from "@/components/poi-card";
import { Button } from "@/components/ui/button";
import { Navbar, Footer } from "@/components/layout";
import { CalendarDays, MapPin, Search, Map as MapIcon, Grid, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LebanonMap } from "@/components/lebanon-map";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { poiFromDatabase } from "@/lib/db-poi";
import type { POI } from "@/lib/data";

type AdminExploreTrip = {
  id: string;
  title: string;
  destination: string;
  description?: string | null;
  price: string | number;
  availableDates?: string | null;
  image?: string | null;
  category?: string | null;
  regionId: number;
};

function activityFromCategory(category?: string | null): ActivityType | null {
  const text = (category || "").toLowerCase();
  if (text.includes("nature")) return "nature";
  if (text.includes("hiking")) return "hiking";
  if (text.includes("beach")) return "beaches";
  if (text.includes("food")) return "food";
  if (text.includes("night")) return "nightlife";
  if (text.includes("shop")) return "shopping";
  if (text.includes("culture") || text.includes("history")) return "culture";
  return null;
}

function regionName(regionId: number) {
  return regions.find((region) => region.id === regionId)?.name ?? "Lebanon";
}

function AdminTripCard({ trip }: { trip: AdminExploreTrip }) {
  const firstDate = trip.availableDates?.split(",")[0]?.trim();

  return (
    <Link href={`/poi/${trip.id}`} className="block h-full">
      <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 320, damping: 22 }} className="h-full">
        <Card className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border-none bg-card shadow-sm ring-1 ring-border/70 transition-all duration-300 hover:shadow-2xl hover:ring-primary/20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
            <img
              src={trip.image || "/lebanon-logo.png"}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute left-3 top-3">
              <Badge className="rounded-full shadow-sm">trip</Badge>
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow-md">
              ${Number(trip.price || 0).toFixed(0)}
            </div>
          </div>

          <CardContent className="flex-1 p-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                {trip.title}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                4.8
              </span>
            </div>
            <p className="mb-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {trip.description || `A curated trip to ${trip.destination}.`}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{regionName(trip.regionId)} · {trip.destination}</span>
              </p>
              {firstDate && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">First date: {firstDate}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 p-4 pt-3 text-sm">
            <span className="truncate font-bold text-foreground">{trip.category || "Lebanon trip"}</span>
            <span className="shrink-0 text-xs font-semibold text-primary">View details</span>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");
  const [plannedDate, setPlannedDate] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [adminTrips, setAdminTrips] = useState<AdminExploreTrip[]>([]);
  const [databasePois, setDatabasePois] = useState<typeof pois>([]);
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    if (params.get('view') === 'map') {
      setViewMode('map');
    }
    setSearchTerm(params.get("q") ?? "");
    const activity = params.get("activity") as ActivityType | null;
    setActivityFilter(activity ?? "all");
    setTypeFilter(params.get("type") ?? "all");
    setPlannedDate(params.get("date") ?? "");
  }, [location]);

  useEffect(() => {
    fetch("/api/explore/admin-trips")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load admin trips");
        return response.json();
      })
      .then((data: AdminExploreTrip[]) => {
        if (Array.isArray(data)) setAdminTrips(data);
      })
      .catch(() => setAdminTrips([]));
  }, []);

  useEffect(() => {
    fetch("/api/pois")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load database places");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) return;
        setDatabasePois(data.map(poiFromDatabase).filter((poi): poi is POI => Boolean(poi)));
      })
      .catch(() => setDatabasePois([]));
  }, []);

  const allPois = [
    ...pois,
    ...databasePois.filter((dbPoi) => !pois.some((localPoi) => localPoi.id === dbPoi.id)),
  ];

  const filteredPois = allPois.filter(poi => {
    const regionName = regions.find((region) => region.id === poi.regionId)?.name ?? "";
    const searchableText = `${poi.name} ${poi.description} ${regionName} ${(poi.activities ?? []).join(" ")}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || poi.type === typeFilter;
    const matchesRegion = regionFilter === "all" || poi.regionId.toString() === regionFilter;
    const matchesActivity = activityFilter === "all" || poi.activities?.includes(activityFilter);
    
    return matchesSearch && matchesType && matchesRegion && matchesActivity;
  });

  const filteredAdminTrips = adminTrips.filter((trip) => {
    const tripActivity = activityFromCategory(trip.category);
    const searchableText = `${trip.title} ${trip.destination} ${trip.description ?? ""} ${trip.category ?? ""} ${regionName(trip.regionId)}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || typeFilter === "trip";
    const matchesRegion = regionFilter === "all" || trip.regionId.toString() === regionFilter;
    const matchesActivity = activityFilter === "all" || tripActivity === activityFilter;

    return matchesSearch && matchesType && matchesRegion && matchesActivity;
  });

  const totalResults = filteredPois.length + filteredAdminTrips.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-muted/30 py-16 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Explore Lebanon</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Find the best spots, restaurants, and hidden gems across the country.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search for places..." 
                className="pl-10 bg-card"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-card">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="spot">Tourist Spots</SelectItem>
                  <SelectItem value="trip">Admin Trips</SelectItem>
                  <SelectItem value="restaurant">Restaurants</SelectItem>
                  <SelectItem value="shop">Shops</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityType | "all")}>
                <SelectTrigger className="w-[150px] bg-card">
                  <SelectValue placeholder="Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="hiking">Hiking</SelectItem>
                  <SelectItem value="nightlife">Nightlife</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="beaches">Beaches</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === "map" ? "default" : "ghost"} 
                  size="icon"
                  onClick={() => setViewMode("map")}
                  className="rounded-none"
                >
                  <MapIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-20">
          {(searchTerm || activityFilter !== "all" || plannedDate) && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <span className="text-sm font-semibold text-muted-foreground">Active search:</span>
              {searchTerm && <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{searchTerm}</span>}
              {activityFilter !== "all" && (
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold capitalize text-secondary-foreground">
                  {activityFilter === "culture" ? "history" : activityFilter}
                </span>
              )}
              {plannedDate && (
                <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                  {new Date(plannedDate).toLocaleDateString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setRegionFilter("all");
                  setActivityFilter("all");
                  setPlannedDate("");
                }}
              >
                Clear
              </Button>
            </div>
          )}

          {viewMode === "map" ? (
            <div className="space-y-6">
              <LebanonMap places={filteredPois} height="560px" showActivityFilters />
              <p className="text-sm text-muted-foreground text-center">
                Click a marker or activity chip to explore Lebanon by beaches, hiking, culture, food, and nightlife.
              </p>
            </div>
          ) : (
            <>
              {totalResults > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPois.map((poi) => (
                    <POICard key={poi.id} poi={poi} />
                  ))}
                  {filteredAdminTrips.map((trip) => (
                    <AdminTripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-medium text-muted-foreground">No places found matching your criteria.</h3>
                  <Button 
                    variant="link" 
                    className="mt-2 text-primary"
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("all");
                      setRegionFilter("all");
                      setActivityFilter("all");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
