import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "wouter";
import { ActivityType, POI, pois, regions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Camera,
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Star,
  Sun,
  Utensils,
  Waves,
} from "lucide-react";

type LebanonMapProps = {
  selectedPOI?: POI;
  places?: POI[];
  routePlaces?: POI[];
  showAllPOIs?: boolean;
  height?: string;
  interactive?: boolean;
  showActivityFilters?: boolean;
  onSelectPOI?: (poi: POI) => void;
};

const activityOptions: Array<{
  value: ActivityType | "all";
  label: string;
  icon: typeof Compass;
}> = [
  { value: "all", label: "All", icon: Compass },
  { value: "hiking", label: "Hiking", icon: Mountain },
  { value: "beaches", label: "Beaches", icon: Waves },
  { value: "culture", label: "Culture", icon: Landmark },
  { value: "nightlife", label: "Nightlife", icon: Sun },
  { value: "food", label: "Food", icon: Utensils },
  { value: "nature", label: "Nature", icon: Camera },
];

const mapCenter: [number, number] = [33.8547, 35.8623];

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

function getMarkerColor(poi: POI) {
  if (poi.activities?.includes("beaches")) return "#0284c7";
  if (poi.activities?.includes("hiking") || poi.activities?.includes("nature")) return "#4d7c0f";
  if (poi.activities?.includes("culture")) return "#c2410c";
  if (poi.activities?.includes("nightlife")) return "#7c3aed";
  if (poi.type === "restaurant") return "#be123c";
  return "#334155";
}

function createMarkerIcon(poi: POI, isSelected: boolean) {
  const color = getMarkerColor(poi);

  return L.divIcon({
    className: "lebanon-map-marker",
    html: `
      <div class="lebanon-map-marker__pin ${isSelected ? "is-selected" : ""}" style="--marker-color: ${color}">
        <span>${poi.rating.toFixed(1)}</span>
      </div>
    `,
    iconSize: isSelected ? [52, 52] : [42, 42],
    iconAnchor: isSelected ? [26, 48] : [21, 40],
    popupAnchor: [0, -36],
  });
}

function createPopupContent(poi: POI) {
  const regionName = getRegionName(poi);
  const tags = (poi.activities ?? [poi.type === "restaurant" ? "food" : "culture"])
    .slice(0, 3)
    .map((activity) => `<span>${activity}</span>`)
    .join("");

  return `
    <article class="lebanon-map-popup">
      <img src="${poi.image}" alt="${poi.name}" />
      <div>
        <h3>${poi.name}</h3>
        <p>${poi.description}</p>
        <div class="lebanon-map-popup__meta">
          <span>Star ${poi.rating}</span>
          <span>Map pin ${regionName}</span>
        </div>
        <div class="lebanon-map-popup__tags">${tags}</div>
        <a href="/poi/${poi.id}">View details</a>
      </div>
    </article>
  `;
}

export function LebanonMap({
  selectedPOI,
  places,
  routePlaces,
  showAllPOIs = true,
  height = "400px",
  interactive = true,
  showActivityFilters = false,
  onSelectPOI,
}: LebanonMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const [activeActivity, setActiveActivity] = useState<ActivityType | "all">("all");
  const [activePOI, setActivePOI] = useState<POI | undefined>(selectedPOI);

  const basePlaces = useMemo(() => {
    if (places) return places;
    if (showAllPOIs) return pois;
    return selectedPOI ? [selectedPOI] : [];
  }, [places, selectedPOI, showAllPOIs]);

  const visiblePlaces = useMemo(() => {
    return basePlaces.filter((poi) => {
      const hasCoordinates = typeof poi.latitude === "number" && typeof poi.longitude === "number";
      const matchesActivity = activeActivity === "all" || poi.activities?.includes(activeActivity);
      return hasCoordinates && matchesActivity;
    });
  }, [activeActivity, basePlaces]);

  useEffect(() => {
    setActivePOI(selectedPOI);
  }, [selectedPOI]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter: [number, number] =
      selectedPOI?.latitude && selectedPOI?.longitude
        ? [selectedPOI.latitude, selectedPOI.longitude]
        : mapCenter;

    map.current = L.map(mapContainer.current, {
      zoomControl: interactive,
      scrollWheelZoom: interactive,
      dragging: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    }).setView(initialCenter, selectedPOI ? 13 : 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    markersLayer.current = L.layerGroup().addTo(map.current);
    routeLayer.current = L.layerGroup().addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
      markersLayer.current = null;
      routeLayer.current = null;
    };
  }, [interactive, selectedPOI]);

  useEffect(() => {
    if (!map.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    const bounds = L.latLngBounds([]);

    visiblePlaces.forEach((poi) => {
      if (typeof poi.latitude !== "number" || typeof poi.longitude !== "number") return;

      const latLng: [number, number] = [poi.latitude, poi.longitude];
      const marker = L.marker(latLng, {
        icon: createMarkerIcon(poi, activePOI?.id === poi.id),
        title: poi.name,
      });

      marker.bindPopup(createPopupContent(poi), {
        closeButton: false,
        minWidth: 260,
        maxWidth: 320,
      });

      marker.on("click", () => {
        setActivePOI(poi);
        onSelectPOI?.(poi);
      });

      marker.addTo(markersLayer.current!);
      bounds.extend(latLng);
    });

    if (activePOI?.latitude && activePOI?.longitude) {
      map.current.flyTo([activePOI.latitude, activePOI.longitude], Math.max(map.current.getZoom(), 11), {
        animate: true,
        duration: 0.8,
      });
      return;
    }

    if (bounds.isValid()) {
      map.current.fitBounds(bounds, { padding: [42, 42], maxZoom: 10 });
    } else {
      map.current.setView(mapCenter, 8);
    }
  }, [activePOI, onSelectPOI, visiblePlaces]);

  useEffect(() => {
    if (!map.current || !routeLayer.current) return;

    routeLayer.current.clearLayers();

    const coordinates = (routePlaces ?? [])
      .filter((poi) => typeof poi.latitude === "number" && typeof poi.longitude === "number")
      .map((poi) => [poi.latitude!, poi.longitude!] as [number, number]);

    if (coordinates.length < 2) return;

    L.polyline(coordinates, {
      color: "#0f766e",
      dashArray: "8 10",
      lineCap: "round",
      opacity: 0.9,
      weight: 4,
    }).addTo(routeLayer.current);
  }, [routePlaces]);

  const featuredPlaces = visiblePlaces.slice(0, 5);

  return (
    <section className="space-y-4">
      {showActivityFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activityOptions.map((activity) => {
            const Icon = activity.icon;
            const isActive = activeActivity === activity.value;

            return (
              <Button
                key={activity.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveActivity(activity.value);
                  setActivePOI(undefined);
                }}
                className="shrink-0 capitalize"
              >
                <Icon className="w-4 h-4" />
                {activity.label}
              </Button>
            );
          })}
        </div>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-w-0 overflow-hidden rounded-xl border border-border shadow-lg">
          <div ref={mapContainer} style={{ height }} className="z-0" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-background/90 px-3 py-2 text-sm font-medium shadow-md backdrop-blur">
            {visiblePlaces.length} places on the map
          </div>
        </div>

        {showActivityFilters && (
          <aside className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-md">
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground">Selected place</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">
                {activePOI?.name ?? "Choose a marker"}
              </h3>
            </div>

            {activePOI ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <img
                  src={activePOI.image}
                  alt={activePOI.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {(activePOI.activities ?? []).map((activity) => (
                    <Badge key={activity} variant="secondary" className="capitalize">
                      {activity}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{activePOI.description}</p>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 p-3 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {activePOI.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {getRegionName(activePOI)}
                  </span>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/poi/${activePOI.id}`}>Open details</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {featuredPlaces.map((poi) => (
                  <button
                    key={poi.id}
                    type="button"
                    onClick={() => setActivePOI(poi)}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <span className="block font-semibold">{poi.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {getRegionName(poi)} - {poi.rating} rating
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
