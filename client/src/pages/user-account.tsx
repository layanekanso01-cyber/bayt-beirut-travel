import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CalendarDays,
  Compass,
  Heart,
  Mail,
  MapPinned,
  Pencil,
  Plane,
  Receipt,
  Sparkles,
  TicketCheck,
  User,
  Wallet,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { pois } from "@/lib/data";
import { bookingBelongsToUser, readUserBookingIds } from "@/lib/user-scope";

type BookingLike = {
  id?: string;
  customerName?: string;
  customer_name?: string;
  poiName?: string;
  poi_name?: string;
  carName?: string;
  car_name?: string;
  destination?: string;
  totalPrice?: string | number;
  total_price?: string | number;
  status?: string;
  createdAt?: string;
  created_at?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  icon: typeof TicketCheck;
};

function moneyValue(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bookingTitle(booking: BookingLike) {
  return booking.poiName || booking.poi_name || booking.carName || booking.car_name || booking.destination || "Lebanon trip";
}

function dateLabel(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString();
}

export default function UserAccount() {
  const { user, favorites, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingLike[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      if (!user) {
        setBookings([]);
        return;
      }

      try {
        const [transportResponse, poiResponse] = await Promise.all([
          fetch("/api/transport/bookings"),
          fetch("/api/poi/bookings"),
        ]);

        const transportBookings = transportResponse.ok ? await transportResponse.json() : [];
        const poiBookings = poiResponse.ok ? await poiResponse.json() : [];
        const userBookingIds = readUserBookingIds(user);

        if (isMounted) {
          setBookings(
            [
              ...(Array.isArray(transportBookings) ? transportBookings : []),
              ...(Array.isArray(poiBookings) ? poiBookings : []),
            ].filter((booking) => bookingBelongsToUser(booking, user, userBookingIds))
          );
        }
      } catch {
        if (isMounted) setBookings([]);
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const favoritePois = useMemo(() => pois.filter((poi) => favorites.includes(poi.id)), [favorites]);

  const favoriteCategory = useMemo(() => {
    const counts = new Map<string, number>();
    favoritePois.forEach((poi) => {
      (poi.activities ?? []).forEach((activity) => counts.set(activity, (counts.get(activity) ?? 0) + 1));
    });

    const [top] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return top?.[0] ?? "exploring";
  }, [favoritePois]);

  const estimatedSpending = useMemo(() => {
    return bookings
      .filter((booking) => !["cancelled", "failed"].includes(String(booking.status ?? "").toLowerCase()))
      .reduce((sum, booking) => sum + moneyValue(booking.totalPrice ?? booking.total_price), 0);
  }, [bookings]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const bookingActivities = bookings.slice(0, 3).map((booking) => ({
      id: `booking-${booking.id ?? bookingTitle(booking)}`,
      title: `Booked ${bookingTitle(booking)}`,
      description: `Status: ${booking.status ?? "pending"}`,
      dateLabel: dateLabel(booking.createdAt ?? booking.created_at),
      icon: TicketCheck,
    }));

    const savedActivities = favoritePois.slice(0, 3).map((poi) => ({
      id: `favorite-${poi.id}`,
      title: `Saved ${poi.name}`,
      description: "Added to your favorite places",
      dateLabel: "Saved place",
      icon: Heart,
    }));

    return [...bookingActivities, ...savedActivities].slice(0, 5);
  }, [bookings, favoritePois]);

  function saveProfileLocally() {
    if (!user) return;
    updateUserProfile({
      name: profileName.trim() || user.name || user.username,
      email: profileEmail.trim() || null,
    });
    toast({
      title: "Profile updated locally",
      description: "Your dashboard now shows the updated details.",
    });
    setIsEditing(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/25">
        <section className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-10">
            <Badge variant="secondary" className="mb-4 gap-2">
              <Sparkles className="h-4 w-4" />
              Traveler dashboard
            </Badge>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-primary bg-background text-secondary shadow-lg">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="font-serif text-4xl font-bold text-foreground">
                    Welcome, {profileName || user?.username || "Traveler"}
                  </h1>
                  <p className="mt-2 text-muted-foreground">Your Lebanon travel profile, bookings, and preferences.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full">
                  <Link href="/bookings">
                    <TicketCheck className="h-4 w-4" />
                    View Trips
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href="/smart-itinerary">
                    <Compass className="h-4 w-4" />
                    Plan Trip
                  </Link>
                </Button>
                <Button type="button" variant="outline" className="rounded-full bg-card" onClick={() => setIsEditing((value) => !value)}>
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="overflow-hidden p-6">
              <div className="lebanon-flag-ribbon -mx-6 -mt-6 mb-6 h-3" />
              <h2 className="font-serif text-2xl font-bold">Profile</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Username</p>
                  <p className="mt-1 text-lg font-semibold">{user?.username ?? "Guest"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="mt-1 break-all font-semibold">{profileEmail || "No email saved"}</p>
                </div>
                <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                  <p className="text-sm font-semibold text-secondary">Travel preference</p>
                  <p className="mt-1 text-2xl font-bold capitalize">You love {favoriteCategory}</p>
                </div>
              </div>
            </Card>

            {isEditing && (
              <Card className="p-6">
                <h2 className="font-serif text-2xl font-bold">Edit Profile</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Display name</label>
                    <Input value={profileName} onChange={(event) => setProfileName(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Email</label>
                    <Input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} />
                  </div>
                  <Button className="w-full rounded-full" onClick={saveProfileLocally}>
                    Save changes
                  </Button>
                </div>
              </Card>
            )}
          </aside>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Plane className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">Trips</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">Trips booked</p>
                <p className="mt-1 text-4xl font-black">{bookings.length}</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-secondary/10 p-3 text-secondary">
                    <Heart className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">Saved</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">Favorites count</p>
                <p className="mt-1 text-4xl font-black">{favorites.length}</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted p-3 text-foreground">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">Spend</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">Estimated spending</p>
                <p className="mt-1 text-4xl font-black">${estimatedSpending.toFixed(0)}</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Recent Activity</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Bookings and saved places from your travel profile.</p>
                </div>
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>

              <div className="mt-6 space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{activity.title}</p>
                          <p className="truncate text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{activity.dateLabel}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                    <MapPinned className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-semibold">No activity yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Book a trip or save a favorite place to start your travel timeline.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-serif text-2xl font-bold">Next best action</h2>
                <p className="mt-2 text-muted-foreground">
                  {favorites.length > 0
                    ? "Turn your saved places into a personalized Lebanon itinerary."
                    : "Start saving places you love, then build your custom Lebanon plan."}
                </p>
              </div>
              <Button asChild className="rounded-full">
                <Link href="/trip-planner">
                  <Receipt className="h-4 w-4" />
                  Build itinerary
                </Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
