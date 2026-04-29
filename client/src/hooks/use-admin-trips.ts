import { useEffect, useState } from "react";

export type AdminTrip = {
  id: string;
  title: string;
  destination: string;
  description: string;
  price: number;
  availableDates: string;
  image: string;
  category: string;
  status?: string;
};

export type AdminTripInput = Omit<AdminTrip, "id">;

const storageKey = "lebanon-tourism-admin-trips";
const commonsImage = (fileName: string, width = 900) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;

const defaultTrips: AdminTrip[] = [
  {
    id: "trip-beirut",
    title: "Beirut City Highlights",
    destination: "Beirut",
    description: "Downtown Beirut, Raouche Rocks, Gemmayze cafes, and evening city atmosphere.",
    price: 65,
    availableDates: "2026-05-05, 2026-05-12, 2026-05-19",
    image: commonsImage("Pigeon Rocks of Beirut, Rock of Raouche, Beirut, Lebanon.jpg"),
    category: "Culture",
  },
  {
    id: "trip-byblos",
    title: "Byblos Heritage and Coast",
    destination: "Byblos",
    description: "Ancient castle, old souks, seaside lunch, and coastal sunset.",
    price: 85,
    availableDates: "2026-05-08, 2026-05-15, 2026-05-22",
    image: commonsImage("Byblos Castle, Byblos, Lebanon.jpg"),
    category: "Culture",
  },
  {
    id: "trip-cedars",
    title: "Cedars Mountain Escape",
    destination: "Cedars",
    description: "Mountain drive, Cedars of God, scenic viewpoints, and local lunch.",
    price: 110,
    availableDates: "2026-05-10, 2026-05-17, 2026-05-24",
    image: commonsImage("Forest of The cedars of God.jpg"),
    category: "Nature",
  },
];

function readTrips() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultTrips;
    const parsed = JSON.parse(saved) as AdminTrip[];
    return parsed.length > 0 ? parsed : defaultTrips;
  } catch {
    return defaultTrips;
  }
}

export function useAdminTrips() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);

  useEffect(() => {
    setTrips(readTrips());
    fetch("/api/admin/trips")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load admin trips");
        return response.json();
      })
      .then((data: AdminTrip[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTrips(data.map((trip) => ({ ...trip, price: Number(trip.price) })));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(trips));
    }
  }, [trips]);

  function addTrip(input: AdminTripInput) {
    const fallbackTrip = { id: `trip-${Date.now()}`, ...input };
    setTrips((current) => [fallbackTrip, ...current]);

    fetch("/api/admin/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not create trip");
        return response.json();
      })
      .then((trip: AdminTrip) => {
        setTrips((current) => [trip, ...current.filter((item) => item.id !== fallbackTrip.id)]);
      })
      .catch(() => undefined);
  }

  function updateTrip(id: string, input: AdminTripInput) {
    setTrips((current) => current.map((trip) => (trip.id === id ? { id, ...input } : trip)));
    fetch(`/api/admin/trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => undefined);
  }

  function deleteTrip(id: string) {
    setTrips((current) => current.filter((trip) => trip.id !== id));
    fetch(`/api/admin/trips/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  return { trips, addTrip, updateTrip, deleteTrip };
}
